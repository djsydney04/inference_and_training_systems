import math
import unittest

import numpy as np
import tensorflow as tf

from post_training import LoRALinear, dpo_loss, sequence_log_probs, sft_loss


class PostTrainingTests(unittest.TestCase):
    def test_response_only_loss_and_sequence_sums(self):
        logits = tf.Variable(tf.zeros([2, 3, 4]))
        labels = tf.constant([[0, 1, 2], [2, 3, 0]])
        mask = tf.constant([[False, True, True], [False, False, True]])
        with tf.GradientTape() as tape:
            loss = sft_loss(logits, labels, mask)
        gradients = tape.gradient(loss, logits).numpy()
        self.assertAlmostEqual(float(loss), math.log(4), places=6)
        np.testing.assert_allclose(
            sequence_log_probs(logits, labels, mask),
            [-2 * math.log(4), -math.log(4)], rtol=1e-6,
        )
        np.testing.assert_array_equal(gradients[~mask.numpy()], 0.0)
        self.assertTrue(np.any(gradients[mask.numpy()] != 0))
        with self.assertRaises(tf.errors.InvalidArgumentError):
            sft_loss(logits, labels, tf.zeros([2, 3], dtype=tf.bool))

    def test_dpo_known_values_and_gradient_direction(self):
        chosen, rejected = tf.Variable([-4.0]), tf.Variable([-6.0])
        reference_c, reference_r = tf.Variable([-5.0]), tf.Variable([-5.0])
        with tf.GradientTape() as tape:
            loss = dpo_loss(chosen, rejected, reference_c, reference_r)
        gc, gr, grefc, grefr = tape.gradient(loss, [chosen, rejected, reference_c, reference_r])
        self.assertAlmostEqual(float(loss), math.log1p(math.exp(-0.2)), places=6)
        self.assertLess(float(gc[0]), 0)
        self.assertGreater(float(gr[0]), 0)
        self.assertIsNone(grefc)
        self.assertIsNone(grefr)
        self.assertAlmostEqual(float(dpo_loss(chosen, rejected, chosen, rejected)), math.log(2), places=6)
        self.assertTrue(bool(tf.math.is_finite(dpo_loss([-1e4], [-1.0], [-2.0], [-2.0]))))

    def test_zero_initialized_adapter_preserves_base_then_learns(self):
        tf.keras.utils.set_random_seed(19)
        layer = LoRALinear(6, rank=2, alpha=4)
        x = tf.ones([2, 4])
        output = layer(x)
        np.testing.assert_allclose(output, x @ layer.base_kernel, atol=1e-7)
        self.assertEqual(sum(int(tf.size(v)) for v in layer.trainable_variables), 2 * (4 + 6))
        with tf.GradientTape() as tape:
            loss = tf.reduce_sum(layer(x))
        grads = tape.gradient(loss, layer.trainable_variables)
        np.testing.assert_array_equal(grads[0], 0.0)
        self.assertTrue(np.any(grads[1].numpy() != 0.0))


if __name__ == "__main__":
    unittest.main()
