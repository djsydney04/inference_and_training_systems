import unittest

import numpy as np
import tensorflow as tf

from token_objective import local_contribution, token_statistics


class TokenObjectiveTests(unittest.TestCase):
    def setUp(self):
        self.x = tf.reshape(tf.range(36, dtype=tf.float32), [2, 6, 3]) / 20
        self.labels = tf.constant([[0, 1, 2, 3, 0, 1], [1, 2, 3, 0, 1, 2]])
        self.mask = tf.constant([[True, True, False, False, False, False],
                                 [True, True, True, True, True, True]])
        self.weight = tf.Variable(tf.reshape(tf.range(12, dtype=tf.float32), [3, 4]) / 10)

    def test_partitioned_gradients_match_global_batch_for_both_reducers(self):
        with tf.GradientTape() as tape:
            total, count = token_statistics(self.x @ self.weight, self.labels, self.mask)
            expected_loss = total / count
        expected_gradient = tape.gradient(expected_loss, self.weight)
        for reducer in ("sum", "mean"):
            contributions, gradients = [], []
            # Two CPU-evaluated logical replicas, each with two microbatches.
            for worker in range(2):
                for start in (0, 3):
                    with tf.GradientTape() as tape:
                        part = (slice(worker, worker + 1), slice(start, start + 3))
                        local_sum, _ = token_statistics(
                            self.x[part] @ self.weight, self.labels[part], self.mask[part]
                        )
                        contribution = local_contribution(local_sum, count, 2, reducer)
                    contributions.append(contribution)
                    gradients.append(tape.gradient(contribution, self.weight))
            # Accumulation sums; only the worker reducer optionally averages.
            divisor = 2 if reducer == "mean" else 1
            np.testing.assert_allclose(tf.add_n(contributions) / divisor, expected_loss, rtol=1e-6)
            np.testing.assert_allclose(tf.add_n(gradients) / divisor, expected_gradient, atol=2e-7)

    def test_unweighted_worker_means_change_the_objective(self):
        sums, counts = tf.constant([2., 12.]), tf.constant([2., 6.])
        self.assertEqual(float(tf.reduce_mean(sums / counts)), 1.5)
        self.assertEqual(float(tf.reduce_sum(sums) / tf.reduce_sum(counts)), 1.75)

    def test_empty_local_shard_is_zero_but_empty_global_update_is_rejected(self):
        with tf.GradientTape() as tape:
            total, count = token_statistics(
                self.x @ self.weight, self.labels, tf.zeros_like(self.mask)
            )
            contribution = local_contribution(total, 8)
        self.assertEqual(float(count), 0)
        np.testing.assert_array_equal(tape.gradient(contribution, self.weight), 0)
        with self.assertRaises(tf.errors.InvalidArgumentError):
            local_contribution(total, 0)
        with self.assertRaises(ValueError):
            local_contribution(total, 8, reducer="unknown")


if __name__ == "__main__":
    unittest.main()
