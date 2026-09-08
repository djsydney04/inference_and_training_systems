"""Verify a real MirroredStrategy update on two logical CPU devices.

Run in a fresh process: logical devices must be configured before TF initializes.
This exercises replica execution, collectives, optimizer aggregation and slots.
It is NOT a multi-host/GPU/NCCL test, or a performance benchmark.
"""

import json
import numpy as np
import tensorflow as tf

from token_objective import token_statistics, local_contribution


def verify_updates(updates=4):
    if not isinstance(updates, int) or updates < 1:
        raise ValueError("updates must be a positive integer")
    physical = tf.config.list_physical_devices("CPU")
    if not physical:
        raise RuntimeError("A CPU device is required")
    tf.config.set_logical_device_configuration(
        physical[0], [tf.config.LogicalDeviceConfiguration() for _ in range(2)]
    )
    devices = [device.name for device in tf.config.list_logical_devices("CPU")[:2]]
    strategy = tf.distribute.MirroredStrategy(devices=devices)
    if strategy.num_replicas_in_sync != 2:
        raise RuntimeError("This exercise requires exactly two replicas")

    # [replica, accumulation, local batch, time, feature]. Distinct data per replica.
    x = np.arange(72, dtype=np.float32).reshape(2, 2, 1, 6, 3) / 40 - .7
    labels = (np.arange(24).reshape(2, 2, 1, 6) % 4).astype(np.int32)
    masks = np.zeros((2, 2, 1, 6), dtype=bool)
    masks[0, 0, 0, :2] = True
    # Replica 0's second microbatch is all padding: it still joins collectives.
    masks[1, 0, 0, :6] = True
    masks[1, 1, 0, :3] = True
    initial = np.arange(12, dtype=np.float32).reshape(3, 4) / 20 - .2
    with strategy.scope():
        weight = tf.Variable(initial, name="replica_projection")
        optimizer = tf.keras.optimizers.SGD(learning_rate=.05, momentum=.9)
        optimizer.build([weight])

    reference = tf.Variable(initial, name="reference_projection")
    reference_optimizer = tf.keras.optimizers.SGD(learning_rate=.05, momentum=.9)
    reference_optimizer.build([reference])
    batch = strategy.experimental_distribute_values_from_function(
        lambda context: tuple(tf.constant(value[context.replica_id_in_sync_group])
                              for value in (x, labels, masks))
    )

    def replica_step(features, targets, valid):
        context = tf.distribute.get_replica_context()
        local_count = tf.reduce_sum(tf.cast(valid, tf.float32))
        global_count = context.all_reduce(tf.distribute.ReduceOp.SUM, local_count)
        tf.debugging.assert_positive(global_count)
        accumulated = tf.zeros_like(weight)
        contribution = tf.constant(0., tf.float32)
        for microbatch in range(2):
            with tf.GradientTape() as tape:
                loss_sum, _ = token_statistics(
                    features[microbatch] @ weight, targets[microbatch], valid[microbatch]
                )
                loss = local_contribution(loss_sum, global_count)
            accumulated += tape.gradient(loss, weight)
            contribution += loss
        # MirroredStrategy + this Keras optimizer SUMS replica gradients here.
        # Do not manually all-reduce accumulated and then apply it a second time.
        optimizer.apply_gradients([(accumulated, weight)])
        return contribution, accumulated, global_count

    @tf.function
    def distributed_step(distributed_batch):
        losses, gradients, counts = strategy.run(replica_step, args=distributed_batch)
        return (strategy.reduce(tf.distribute.ReduceOp.SUM, losses, axis=None),
                strategy.reduce(tf.distribute.ReduceOp.SUM, gradients, axis=None), counts)

    full_x = tf.constant(x.reshape(4, 6, 3))
    full_labels = tf.constant(labels.reshape(4, 6))
    full_mask = tf.constant(masks.reshape(4, 6))
    max_gradient_error, max_weight_error, max_optimizer_error = 0., 0., 0.
    losses = []
    for _ in range(updates):
        with tf.GradientTape() as tape:
            total, count = token_statistics(full_x @ reference, full_labels, full_mask)
            full_loss = total / count
        expected_gradient = tape.gradient(full_loss, reference)
        reference_optimizer.apply_gradients([(expected_gradient, reference)])
        loss, gradient, counts = distributed_step(batch)
        np.testing.assert_allclose(loss, full_loss, rtol=1e-6, atol=1e-7)
        np.testing.assert_allclose(gradient, expected_gradient, rtol=1e-5, atol=2e-7)
        max_gradient_error = max(max_gradient_error, float(tf.reduce_max(tf.abs(gradient - expected_gradient))))
        for local_weight in strategy.experimental_local_results(weight):
            np.testing.assert_allclose(local_weight, reference, rtol=1e-6, atol=2e-7)
            max_weight_error = max(max_weight_error, float(tf.reduce_max(tf.abs(local_weight - reference))))
        for local_count in strategy.experimental_local_results(counts):
            np.testing.assert_equal(float(local_count), 11.)
        if len(optimizer.variables) != len(reference_optimizer.variables):
            raise AssertionError("Optimizer state layouts disagree")
        for actual, expected in zip(optimizer.variables, reference_optimizer.variables):
            # Keras variables wrap the strategy's underlying mirrored variable.
            for local_state in strategy.experimental_local_results(actual.value):
                np.testing.assert_allclose(local_state, expected, rtol=1e-6, atol=2e-7)
                error = float(np.max(np.abs(local_state.numpy() - expected.numpy())))
                max_optimizer_error = max(max_optimizer_error, error)
        losses.append(float(loss))

    return {
        "tensorflow": tf.__version__, "devices": devices,
        "replicas": strategy.num_replicas_in_sync, "updates": updates,
        "valid_targets_per_replica": [2, 9], "global_valid_targets": 11,
        "accumulation_microbatches": 2,
        "max_gradient_error": max_gradient_error, "max_weight_error": max_weight_error,
        "max_optimizer_error": max_optimizer_error, "losses": losses,
        "scope": "one process, two logical CPUs; no GPU or network benchmark",
    }


if __name__ == "__main__":
    print(json.dumps(verify_updates(), indent=2))
