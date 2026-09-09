"""Executable optimizer-adjacent contracts, verified on CPU; no speed claims."""
import json
import numpy as np
import tensorflow as tf


def clipping_comparison():
    a, b = tf.constant([8., 0.]), tf.constant([-6., 2.])
    global_result = tf.clip_by_global_norm([a + b], 1.)[0][0]
    local_result = tf.clip_by_global_norm([a], 1.)[0][0] + tf.clip_by_global_norm([b], 1.)[0][0]
    return global_result.numpy(), local_result.numpy()


def loss_scale_check():
    """Exercise Keras 3 scale_loss/apply_gradients, including a skipped update."""
    weight = tf.Variable([1., -2.])
    inner = tf.keras.optimizers.SGD(learning_rate=.1, momentum=.9)
    optimizer = tf.keras.mixed_precision.LossScaleOptimizer(
        inner, initial_scale=128., dynamic_growth_steps=1000)
    optimizer.build([weight])
    with tf.GradientTape() as tape:
        loss = tf.reduce_sum(weight ** 2) / 2
        scaled = optimizer.scale_loss(loss)
    scaled_gradient = tape.gradient(scaled, weight)
    optimizer.apply_gradients([(scaled_gradient, weight)])
    np.testing.assert_allclose(weight, [.9, -1.8], atol=1e-7)
    before = [variable.numpy().copy() for variable in inner.variables]
    before_weight = weight.numpy().copy()
    optimizer.apply_gradients([(tf.constant([float("inf"), 0.]), weight)])
    np.testing.assert_array_equal(weight, before_weight)
    for actual, expected in zip(inner.variables, before):
        np.testing.assert_array_equal(actual, expected)
    return {"weight": weight.numpy().tolist(), "applied_updates": int(inner.iterations),
            "nonfinite_update_skipped": True}


def recomputation_check():
    """Same stateless mask in forward/recompute; compare all input/weight gradients."""
    x = tf.constant(np.arange(24, dtype=np.float32).reshape(4, 6) / 30 - .3)
    weight = tf.Variable(np.arange(30, dtype=np.float32).reshape(6, 5) / 50 - .2)

    def block(features, parameter):
        value = tf.nn.gelu(features @ parameter)
        keep = tf.random.stateless_uniform(tf.shape(value), seed=[17, 23]) >= .25
        return tf.where(keep, value / .75, 0.)

    def evaluate(function):
        with tf.GradientTape() as tape:
            tape.watch(x)
            result = function(x, weight)
            loss = tf.reduce_sum(result ** 2)
        return result, tape.gradient(loss, [x, weight])

    reference, expected = evaluate(block)
    recomputed, actual = evaluate(tf.recompute_grad(block))
    np.testing.assert_allclose(recomputed, reference, atol=1e-7)
    errors = []
    for observed, target in zip(actual, expected):
        np.testing.assert_allclose(observed, target, rtol=1e-6, atol=1e-7)
        errors.append(float(tf.reduce_max(tf.abs(observed - target))))
    return {"output_shape": list(reference.shape), "gradient_max_errors": errors,
            "randomness": "stateless mask with a fixed seed; no GPU memory measurement"}


def format_check():
    values = tf.constant([1.001, 1.e-8, 100000.], tf.float32)
    return {kind: tf.cast(tf.cast(values, dtype), tf.float32).numpy().tolist()
            for kind, dtype in [("fp16", tf.float16), ("bf16", tf.bfloat16)]}


if __name__ == "__main__":
    global_clip, local_clip = clipping_comparison()
    print(json.dumps({"tensorflow": tf.__version__, "global_clip": global_clip.tolist(),
                     "local_clip_then_sum": local_clip.tolist(),
                     "loss_scaling": loss_scale_check(), "recomputation": recomputation_check()}, indent=2))
