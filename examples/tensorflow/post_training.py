"""Small, inspectable objective kernels; not a complete RL training framework."""

import tensorflow as tf


def masked_token_losses(logits, labels, response_mask):
    """logits [B,T,V]; labels and boolean response_mask [B,T], already shifted.

    All labels must be valid vocabulary IDs, including ignored positions.
    A loss mask does not replace a causal/padding attention mask in the model.
    """
    tf.debugging.assert_rank(logits, 3)
    tf.debugging.assert_rank(labels, 2)
    tf.debugging.assert_type(response_mask, tf.bool)
    tf.debugging.assert_equal(tf.shape(logits)[:2], tf.shape(labels))
    tf.debugging.assert_equal(tf.shape(labels), tf.shape(response_mask))
    token_loss = tf.nn.sparse_softmax_cross_entropy_with_logits(
        labels=labels, logits=tf.cast(logits, tf.float32)
    )
    mask = tf.cast(response_mask, tf.float32)
    counts = tf.reduce_sum(mask, axis=-1)
    tf.debugging.assert_positive(counts, message="Each example needs a response target.")
    return tf.where(response_mask, token_loss, 0.0), counts


def sft_loss(logits, labels, response_mask):
    """Mean across all response tokens, not mean of per-example means."""
    losses, counts = masked_token_losses(logits, labels, response_mask)
    return tf.reduce_sum(losses) / tf.reduce_sum(counts)


def sequence_log_probs(logits, labels, response_mask):
    """Return response-summed conditional log likelihoods, shape [B]."""
    losses, _ = masked_token_losses(logits, labels, response_mask)
    return -tf.reduce_sum(losses, axis=-1)


def dpo_loss(policy_chosen, policy_rejected,
             reference_chosen, reference_rejected, beta=0.1):
    """Inputs are [B] response-summed log likelihoods, using identical masking."""
    policy_chosen, policy_rejected, reference_chosen, reference_rejected = (
        tf.cast(value, tf.float32) for value in
        (policy_chosen, policy_rejected, reference_chosen, reference_rejected)
    )
    tf.debugging.assert_shapes([
        (policy_chosen, ("B",)), (policy_rejected, ("B",)),
        (reference_chosen, ("B",)), (reference_rejected, ("B",)),
    ])
    tf.debugging.assert_positive(beta)
    reference_gap = tf.stop_gradient(reference_chosen - reference_rejected)
    margin = beta * (policy_chosen - policy_rejected - reference_gap)
    return tf.reduce_mean(tf.nn.softplus(-margin))


class LoRALinear(tf.keras.layers.Layer):
    """Frozen row-convention W with a trainable rank-r update (alpha/r) A B.

    This demonstration uses a newly initialized base matrix. To adapt a trained
    model, assign its compatible projection weights to base_kernel first.
    """

    def __init__(self, output_width, rank=8, alpha=16.0, **kwargs):
        super().__init__(**kwargs)
        if output_width < 1 or rank < 1 or alpha <= 0:
            raise ValueError("output_width, rank and alpha must be positive")
        self.output_width = output_width
        self.rank = rank
        self.scale = alpha / rank

    def build(self, input_shape):
        width = int(input_shape[-1])
        self.base_kernel = self.add_weight(
            name="base_kernel", shape=(width, self.output_width),
            initializer="glorot_uniform", trainable=False,
        )
        self.adapter_a = self.add_weight(
            name="adapter_a", shape=(width, self.rank),
            initializer=tf.keras.initializers.RandomNormal(stddev=0.02),
        )
        self.adapter_b = self.add_weight(
            name="adapter_b", shape=(self.rank, self.output_width),
            initializer="zeros",
        )

    def call(self, x):
        return x @ self.base_kernel + self.scale * (x @ self.adapter_a @ self.adapter_b)
