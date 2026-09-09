import random
import unittest
from speculative_sampling import speculative_round, empirical_check, draw


class SpeculativeSamplingTests(unittest.TestCase):
    def test_identical_models_accept_every_draft_and_emit_bonus(self):
        distribution = lambda prefix: [.25, .75]
        result, accepted = speculative_round(distribution, distribution, [], 4, random.Random(7))
        self.assertEqual(accepted, 4)
        self.assertEqual(len(result), 5)

    def test_disjoint_models_reject_first_and_repair(self):
        result, accepted = speculative_round(lambda _: [0., 1.], lambda _: [1., 0.], [], 3, random.Random(2))
        self.assertEqual(result, [1])
        self.assertEqual(accepted, 0)

    def test_conditional_two_token_distribution(self):
        result = empirical_check()
        self.assertLess(result["max_absolute_frequency_error"], .01)

    def test_invalid_inputs(self):
        with self.assertRaises(ValueError):
            draw([.2, .3], random.Random(2))
        with self.assertRaises(ValueError):
            speculative_round(lambda _: [1.], lambda _: [.5, .5], [], 2, random.Random(2))
