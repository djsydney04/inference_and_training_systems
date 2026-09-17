import copy
import itertools
import math
import unittest

from moe_reference import (INPUTS, EXPERTS, LOGITS, backward, capacity_limit,
                           dense_reference, grouped_forward, route)


class MoeTests(unittest.TestCase):
    def assert_matrix_close(self, actual, expected):
        for a, e in zip(actual, expected):
            for x, y in zip(a, e):
                self.assertAlmostEqual(x, y, places=10)

    def test_hand_calculation_and_dense_reference(self):
        expected = [[4/3, 2], [23/8, 11/8], [1/3, -5/9], [13/9, -1]]
        self.assert_matrix_close(grouped_forward(INPUTS, EXPERTS, route(LOGITS)), expected)
        self.assert_matrix_close(dense_reference(INPUTS, EXPERTS, LOGITS), expected)

    def test_every_token_permutation_preserves_identity(self):
        expected = dense_reference(INPUTS, EXPERTS, LOGITS)
        for permutation in itertools.permutations(range(4)):
            x, z = [INPUTS[t] for t in permutation], [LOGITS[t] for t in permutation]
            actual = grouped_forward(x, EXPERTS, list(reversed(route(z))))
            self.assert_matrix_close(actual, [expected[t] for t in permutation])

    def test_capacity_and_empty_token(self):
        routes = route(LOGITS)
        kept, dropped = capacity_limit(list(reversed(routes)), 3, 2)
        self.assertEqual([(r.token, r.expert) for r in dropped], [(2, 1), (3, 1)])
        renorm, _ = capacity_limit(routes, 3, 2, True)
        self.assert_matrix_close(grouped_forward(INPUTS, EXPERTS, kept)[2:], [[7/9, -7/9], [5/9, -5/9]])
        self.assert_matrix_close(grouped_forward(INPUTS, EXPERTS, renorm)[2:], [[1, -1], [1, -1]])
        skew = [[math.log(.8), math.log(.15), math.log(.05)]] * 4
        kept, dropped = capacity_limit(route(skew, 1), 3, 2, True)
        self.assertEqual(len(dropped), 2)
        self.assertEqual(grouped_forward(INPUTS, EXPERTS, kept)[2:], [[0., 0.], [0., 0.]])

    def test_backward_matches_independent_dense_finite_differences(self):
        upstream = [[.4, -.2], [.1, .8], [-.3, .7], [1.1, -.6]]
        dx, dw, dz = backward(INPUTS, EXPERTS, LOGITS, upstream)
        def objective(x, w, z):
            y = dense_reference(x, w, z)
            return sum(a*b for row, u in zip(y, upstream) for a, b in zip(row, u))
        epsilon = 1e-5
        for group, original, gradient in ((0, INPUTS, dx), (2, LOGITS, dz)):
            for i, row in enumerate(original):
                for j in range(len(row)):
                    plus, minus = copy.deepcopy([INPUTS, EXPERTS, LOGITS]), copy.deepcopy([INPUTS, EXPERTS, LOGITS])
                    plus[group][i][j] += epsilon
                    minus[group][i][j] -= epsilon
                    self.assertAlmostEqual((objective(*plus)-objective(*minus))/(2*epsilon), gradient[i][j], places=8)
        for e, expert in enumerate(EXPERTS):
            for i, row in enumerate(expert):
                for j in range(len(row)):
                    plus, minus = copy.deepcopy(EXPERTS), copy.deepcopy(EXPERTS)
                    plus[e][i][j] += epsilon
                    minus[e][i][j] -= epsilon
                    self.assertAlmostEqual((objective(INPUTS, plus, LOGITS)-objective(INPUTS, minus, LOGITS))/(2*epsilon), dw[e][i][j], places=8)

    def test_normalized_top_one_gate_has_no_task_gradient(self):
        _, _, dz = backward(INPUTS, EXPERTS, LOGITS, [[1., 1.]] * 4, k=1)
        self.assertEqual(dz, [[0., 0., 0.]] * 4)


if __name__ == "__main__":
    unittest.main()
