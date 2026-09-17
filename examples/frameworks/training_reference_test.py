import copy
import json
import math
import unittest
from training_reference import (IDS, ATTENTION, ASSISTANT, IGNORE, aligned_labels,
    causal_loss, example_logits, matvec, merge_lora, separate_lora, adapter_bundle,
    load_adapter, partitioned_gradient)


class FrameworkTrainingTests(unittest.TestCase):
    def test_model_owned_shift_and_eos_padding(self):
        labels = aligned_labels(IDS, ATTENTION, ASSISTANT)
        self.assertEqual(labels, [IGNORE] * 4 + [4, 5, IGNORE, IGNORE])
        total, count = causal_loss(example_logits(), labels)
        self.assertEqual(count, 2)
        self.assertAlmostEqual(total / count, .6)
        labels = [IGNORE if token == 5 else y for token, y in zip(IDS, labels)]
        total, count = causal_loss(example_logits(), labels)
        self.assertEqual(count, 1)
        self.assertAlmostEqual(total / count, .4)

    def test_double_shift_and_truncated_response(self):
        labels = aligned_labels(IDS, ATTENTION, ASSISTANT)
        total, count = causal_loss(example_logits(), labels[1:] + [IGNORE])
        self.assertGreater(total / count, 2.)
        with self.assertRaises(ValueError):
            causal_loss(example_logits()[:4], labels[:4])

    def test_gradient_partitions_match_independent_objective_finite_differences(self):
        xs, ys = [1., 2., -1., .5, 3., -2.], [0., 1., 2., -1., 0., 1.]
        partitions = [[[0], [1, 2]], [[], [3, 4, 5]]]
        def objective(w):
            return sum((w * x - y) ** 2 for x, y in zip(xs, ys)) / (2 * len(xs))
        epsilon = 1e-5
        for w in [-1., .5, 2.]:
            numerical = (objective(w + epsilon) - objective(w - epsilon)) / (2 * epsilon)
            for reducer in ["sum", "mean"]:
                for divisor in [1, 2, 4]:
                    self.assertAlmostEqual(partitioned_gradient(xs, ys, partitions, w, reducer, divisor), numerical, places=8)

    def test_partitioned_updates_match_single_objective(self):
        xs, ys, weights = [1., 2., 3.], [2., -1., .5], [0.7, 0.7]
        for step in range(5):
            derivative = sum((weights[0] * x - y) * x for x, y in zip(xs, ys)) / 3
            partitioned = partitioned_gradient(xs, ys, [[[0], []], [[1], [2]]], weights[1])
            weights[0] -= .03 * derivative
            weights[1] -= .03 * partitioned
            self.assertAlmostEqual(weights[0], weights[1], places=14)

    def test_nonsquare_rank_two_merge_matches_independent_expansion(self):
        w, a, b = [[1., 2., 3.], [-1., .5, 0.]], [[1., -1., 2.], [.5, 0., 1.]], [[.5, 2.], [1., -.5]]
        for x in [[2., 1., 3.], [-1., 0., 2.]]:
            for alpha in [0., .5, 2.]:
                expected = [sum(x[i] * (w[o][i] + alpha/2 * sum(b[o][k] * a[k][i] for k in range(2)))
                                for i in range(3)) for o in range(2)]
                self.assertEqual(matvec(merge_lora(w, a, b, alpha), x), expected)
                self.assertEqual(separate_lora(w, a, b, alpha, x), expected)

    def test_adapter_serialization_identity_and_requantization_boundary(self):
        w, a, b, x = [[1., 2.], [-1., .5]], [[1., -1.]], [[.5], [1.]], [2., 1.]
        bundle = json.loads(json.dumps(adapter_bundle(w, a, b, 1., "v1", "t1", "q")))
        merged = load_adapter(bundle, w, "v1", "t1", "q")
        self.assertEqual(matvec(merged, x), [4.5, -.5])
        self.assertEqual(matvec([[round(v) for v in row] for row in merged], x), [6., 0.])
        changed = copy.deepcopy(w); changed[0][0] += .25
        for args in [(changed, "v1", "t1", "q"), (w, "v2", "t1", "q"), (w, "v1", "t2", "q"), (w, "v1", "t1", "v")]:
            with self.assertRaisesRegex(ValueError, "identity mismatch"):
                load_adapter(bundle, *args)


if __name__ == "__main__":
    unittest.main()
