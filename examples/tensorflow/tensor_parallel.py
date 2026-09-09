"""Verify a column/row-partitioned MLP algebraically on one CPU.

Logical shards are not processes: no transport or NCCL is exercised.
Float64 and deterministic inputs make the numerical contract easy to inspect.
"""
import json
import tensorflow as tf


def fixture():
    shapes = [(3, 4), (4, 8), (8,), (8, 4), (4,)]
    return [tf.random.stateless_normal(s, [17, i], dtype=tf.float64) * 0.3
            for i, s in enumerate(shapes)]


def dense_mlp(x, up, up_bias, down, down_bias):
    return tf.nn.gelu(x @ up + up_bias) @ down + down_bias


def sharded_mlp(x, up, up_bias, down, down_bias, shards=2):
    """Column-split up projection, local GELU, row-split down, SUM then bias."""
    if not isinstance(shards, int) or shards < 1 or 8 % shards:
        raise ValueError("This eight-channel fixture needs 1, 2, 4 or 8 shards")
    pieces = zip(tf.split(up, shards, axis=1),
                 tf.split(up_bias, shards, axis=0),
                 tf.split(down, shards, axis=0))
    partials = [tf.nn.gelu(x @ u + b) @ d for u, b, d in pieces]
    return tf.add_n(partials) + down_bias


def verify(shards=2):
    tensors = fixture()
    with tf.GradientTape() as tape:
        tape.watch(tensors)
        reference = dense_mlp(*tensors)
        loss = tf.reduce_mean(tf.square(reference))
    gradients = tape.gradient(loss, tensors)
    with tf.GradientTape() as tape:
        tape.watch(tensors)
        actual = sharded_mlp(*tensors, shards=shards)
        sharded_loss = tf.reduce_mean(tf.square(actual))
    actual_gradients = tape.gradient(sharded_loss, tensors)

    # Backpropagate the same upstream dY through every local branch.
    # dX contributions must be summed; parameter shards remain distinct.
    x, up, up_bias, down, down_bias = tensors
    dy = 2 * reference / tf.cast(tf.size(reference), tf.float64)
    dx_parts = []
    for u, b, d in zip(tf.split(up, shards, axis=1),
                       tf.split(up_bias, shards, axis=0),
                       tf.split(down, shards, axis=0)):
        with tf.GradientTape() as tape:
            tape.watch(x)
            local = tf.nn.gelu(x @ u + b) @ d
        dx_parts.append(tape.gradient(local, x, output_gradients=dy))
    error = lambda a, b: float(tf.reduce_max(tf.abs(a - b)))
    result = {
        "shards": shards,
        "output_error": error(reference, actual),
        "gradient_errors": [error(a, b) for a, b in zip(gradients, actual_gradients)],
        "input_gradient_sum_error": error(gradients[0], tf.add_n(dx_parts)),
        "input_gradient_parts": [value.numpy().tolist() for value in dx_parts],
        "duplicated_output_bias_error": error(reference, actual + (shards - 1) * down_bias),
    }
    return result


if __name__ == "__main__":
    print(json.dumps(verify(), indent=2))
