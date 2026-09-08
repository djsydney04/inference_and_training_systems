"""Token weighting algebra for workers and accumulation microbatches.

This module does not launch workers or collectives. The caller must obtain the
valid-target count across every worker and microbatch in the optimizer update.
"""

import tensorflow as tf


def token_statistics(logits, labels, valid_targets):
    """Return differentiable loss SUM and target count for [B,T,V] logits.

    labels and boolean valid_targets have shape [B,T], already next-token
    shifted. Ignored labels must still be valid vocabulary IDs. A local shard
    may contain zero valid targets. This mask does not set attention boundaries.
    """
    tf.debugging.assert_rank(logits, 3)
    tf.debugging.assert_rank(labels, 2)
    tf.debugging.assert_type(valid_targets, tf.bool)
    tf.debugging.assert_equal(tf.shape(logits)[:2], tf.shape(labels))
    tf.debugging.assert_equal(tf.shape(labels), tf.shape(valid_targets))
    losses = tf.nn.sparse_softmax_cross_entropy_with_logits(
        labels=labels, logits=tf.cast(logits, tf.float32)
    )
    return (tf.reduce_sum(tf.where(valid_targets, losses, 0.0)),
            tf.reduce_sum(tf.cast(valid_targets, tf.float32)))


def local_contribution(loss_sum, global_target_count, replicas=1, reducer="sum"):
    """Scale a local sum so the chosen gradient reducer yields the global mean.

    For accumulation, sum these gradients without another microbatch division.
    If your runtime averages microbatches too, that is a separate scaling factor.
    Do not apply this on top of a framework helper that already scales the loss.
    """
    if reducer not in {"sum", "mean"}:
        raise ValueError("reducer must be 'sum' or 'mean'")
    if not isinstance(replicas, int) or isinstance(replicas, bool) or replicas < 1:
        raise ValueError("replicas must be a positive integer")
    count = tf.stop_gradient(tf.cast(global_target_count, tf.float32))
    tf.debugging.assert_rank(count, 0)
    tf.debugging.assert_positive(count, message="The global update needs targets.")
    tf.debugging.assert_all_finite(count, "The target count must be finite.")
    scale = replicas if reducer == "mean" else 1
    return tf.cast(loss_sum, tf.float32) * scale / count


if __name__ == "__main__":
    sums, counts = tf.constant([2.0, 12.0]), tf.constant([2.0, 6.0])
    print(f"Mean of worker means (wrong): {float(tf.reduce_mean(sums / counts)):.2f}")
    print(f"Global token mean: {float(tf.reduce_sum(sums) / tf.reduce_sum(counts)):.2f}")
