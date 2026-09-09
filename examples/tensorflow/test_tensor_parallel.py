import unittest
import tensorflow as tf
from tensor_parallel import fixture, sharded_mlp, verify


class TensorParallelTests(unittest.TestCase):
    def test_output_all_parameter_gradients_and_input_reduction(self):
        for shards in [1, 2, 4, 8]:
            result = verify(shards)
            self.assertLess(result["output_error"], 1e-12)
            self.assertLess(max(result["gradient_errors"]), 1e-12)
            self.assertLess(result["input_gradient_sum_error"], 1e-12)

    def test_replicated_output_bias_must_not_be_added_per_partial(self):
        self.assertGreater(verify(2)["duplicated_output_bias_error"], 0.1)

    def test_nonlinearity_does_not_commute_with_reduction(self):
        a, b = tf.constant([-2., 3.]), tf.constant([3., -2.])
        self.assertEqual(tf.reduce_max(tf.abs(tf.nn.relu(a+b) -
                          (tf.nn.relu(a)+tf.nn.relu(b)))).numpy(), 2.)

    def test_unsupported_shard_count(self):
        with self.assertRaises(ValueError):
            sharded_mlp(*fixture(), shards=3)


if __name__ == "__main__":
    unittest.main()
