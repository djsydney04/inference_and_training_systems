import unittest
import numpy as np
from numerical_contracts import clipping_comparison, loss_scale_check, recomputation_check, format_check


class NumericalContractTests(unittest.TestCase):
    def test_clipping_order(self):
        global_clip, local_clip = clipping_comparison()
        np.testing.assert_allclose(global_clip, [2**-.5, 2**-.5], atol=1e-7)
        self.assertGreater(np.linalg.norm(global_clip - local_clip), .5)

    def test_scaled_update_and_nonfinite_skip(self):
        self.assertEqual(loss_scale_check()["applied_updates"], 1)

    def test_stateless_recomputation_gradients(self):
        self.assertLessEqual(max(recomputation_check()["gradient_max_errors"]), 1e-7)

    def test_format_range_and_precision_are_distinct(self):
        values = format_check()
        self.assertEqual(values["fp16"][1], 0.)
        self.assertTrue(np.isinf(values["fp16"][2]))
        self.assertEqual(values["bf16"][0], 1.)
        self.assertGreater(values["bf16"][1], 0.)
        self.assertTrue(np.isfinite(values["bf16"][2]))
