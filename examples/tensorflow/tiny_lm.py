"""A small, readable decoder-only Transformer in TensorFlow.

This module favors explicit shapes over framework magic. It is suitable for a
laptop-scale systems lab, not a performance comparison with fused LLM stacks.
"""

from dataclasses import dataclass

import tensorflow as tf


@dataclass(frozen=True)
class TinyConfig:
    vocab_size: int = 128
    context_length: int = 64
    width: int = 128
    heads: int = 4
    layers: int = 2
    mlp_ratio: int = 4

    def __post_init__(self) -> None:
        if self.width % self.heads != 0:
            raise ValueError("width must be divisible by heads")
        if (self.width // self.heads) % 2 != 0:
            raise ValueError("head dimension must be even for this RoPE example")


class RMSNorm(tf.keras.layers.Layer):
    def __init__(self, epsilon: float = 1e-6, **kwargs: object) -> None:
        super().__init__(**kwargs)
        self.epsilon = epsilon

    def build(self, input_shape: tf.TensorShape) -> None:
        self.scale = self.add_weight(
            name="scale",
            shape=(input_shape[-1],),
            initializer="ones",
            trainable=True,
        )

    def call(self, x: tf.Tensor) -> tf.Tensor:
        x_float = tf.cast(x, tf.float32)
        inverse_rms = tf.math.rsqrt(
            tf.reduce_mean(tf.square(x_float), axis=-1, keepdims=True)
            + self.epsilon
        )
        return x * tf.cast(inverse_rms, x.dtype) * tf.cast(self.scale, x.dtype)


def apply_rope(q: tf.Tensor, k: tf.Tensor) -> tuple[tf.Tensor, tf.Tensor]:
    """Apply rotary position embeddings to [B, H, T, Dh] tensors."""
    sequence = tf.shape(q)[2]
    half_dim = tf.shape(q)[-1] // 2
    frequency_index = tf.cast(tf.range(half_dim), tf.float32)
    inverse_frequency = tf.pow(
        10_000.0, -frequency_index / tf.cast(half_dim, tf.float32)
    )
    angles = tf.einsum(
        "t,d->td", tf.cast(tf.range(sequence), tf.float32), inverse_frequency
    )
    cosine = tf.cos(angles)[None, None, :, :]
    sine = tf.sin(angles)[None, None, :, :]

    def rotate(x: tf.Tensor) -> tf.Tensor:
        first, second = tf.split(tf.cast(x, tf.float32), 2, axis=-1)
        rotated = tf.concat(
            [first * cosine - second * sine, first * sine + second * cosine],
            axis=-1,
        )
        return tf.cast(rotated, x.dtype)

    return rotate(q), rotate(k)


class CausalSelfAttention(tf.keras.layers.Layer):
    def __init__(self, config: TinyConfig, **kwargs: object) -> None:
        super().__init__(**kwargs)
        self.heads = config.heads
        self.head_dim = config.width // config.heads
        self.qkv = tf.keras.layers.Dense(3 * config.width, use_bias=False)
        self.output_projection = tf.keras.layers.Dense(config.width, use_bias=False)

    def call(self, x: tf.Tensor) -> tf.Tensor:
        batch = tf.shape(x)[0]
        sequence = tf.shape(x)[1]
        q, k, v = tf.split(self.qkv(x), 3, axis=-1)

        def expose_heads(tensor: tf.Tensor) -> tf.Tensor:
            tensor = tf.reshape(
                tensor, [batch, sequence, self.heads, self.head_dim]
            )
            return tf.transpose(tensor, [0, 2, 1, 3])

        q, k, v = map(expose_heads, (q, k, v))
        q, k = apply_rope(q, k)

        scale = tf.cast(self.head_dim**-0.5, q.dtype)
        scores = tf.matmul(q, k, transpose_b=True) * scale
        causal = tf.linalg.band_part(
            tf.ones([sequence, sequence], dtype=tf.bool), -1, 0
        )
        scores = tf.where(causal[None, None, :, :], tf.cast(scores, tf.float32), -1e9)
        probabilities = tf.nn.softmax(tf.cast(scores, tf.float32), axis=-1)
        mixed = tf.matmul(tf.cast(probabilities, v.dtype), v)
        mixed = tf.transpose(mixed, [0, 2, 1, 3])
        mixed = tf.reshape(mixed, [batch, sequence, self.heads * self.head_dim])
        return self.output_projection(mixed)


class SwiGLU(tf.keras.layers.Layer):
    def __init__(self, config: TinyConfig, **kwargs: object) -> None:
        super().__init__(**kwargs)
        hidden = config.width * config.mlp_ratio
        self.up_and_gate = tf.keras.layers.Dense(2 * hidden, use_bias=False)
        self.down = tf.keras.layers.Dense(config.width, use_bias=False)

    def call(self, x: tf.Tensor) -> tf.Tensor:
        value, gate = tf.split(self.up_and_gate(x), 2, axis=-1)
        return self.down(value * tf.nn.silu(gate))


class DecoderBlock(tf.keras.layers.Layer):
    def __init__(self, config: TinyConfig, **kwargs: object) -> None:
        super().__init__(**kwargs)
        self.attention_norm = RMSNorm()
        self.attention = CausalSelfAttention(config)
        self.mlp_norm = RMSNorm()
        self.mlp = SwiGLU(config)

    def call(self, x: tf.Tensor) -> tf.Tensor:
        x = x + self.attention(self.attention_norm(x))
        return x + self.mlp(self.mlp_norm(x))


class TinyDecoderLM(tf.keras.Model):
    def __init__(self, config: TinyConfig) -> None:
        super().__init__()
        self.config = config
        self.token_embedding = tf.keras.layers.Embedding(
            config.vocab_size, config.width
        )
        self.blocks = [DecoderBlock(config) for _ in range(config.layers)]
        self.final_norm = RMSNorm()

    def call(self, tokens: tf.Tensor) -> tf.Tensor:
        tf.debugging.assert_less_equal(tf.shape(tokens)[1], self.config.context_length)
        hidden = self.token_embedding(tokens)
        for block in self.blocks:
            hidden = block(hidden)
        hidden = self.final_norm(hidden)
        # Weight tying: the embedding matrix is also the vocabulary projection.
        return tf.einsum("btd,vd->btv", hidden, self.token_embedding.embeddings)

    def next_token_loss(self, tokens: tf.Tensor) -> tf.Tensor:
        inputs = tokens[:, :-1]
        labels = tokens[:, 1:]
        logits = self(inputs)
        per_token = tf.keras.losses.sparse_categorical_crossentropy(
            labels, logits, from_logits=True
        )
        return tf.reduce_mean(per_token)
