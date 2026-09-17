"""Independent arithmetic checks for the foundations lessons; standard library only.

Run: python3 examples/foundations/check_worked_examples.py
These are numerical references, not a trained model or a hardware benchmark.
"""

import math
import statistics
import struct
import unittest
from itertools import product


def centered_difference(function, values, index, epsilon=1e-5):
    left, right = list(values), list(values)
    left[index] -= epsilon
    right[index] += epsilon
    return (function(right) - function(left)) / (2 * epsilon)


def rotate(pair, angle):
    a, b = pair
    return [a * math.cos(angle) - b * math.sin(angle),
            a * math.sin(angle) + b * math.cos(angle)]


def dot(a, b):
    return sum(x * y for x, y in zip(a, b, strict=True))


class WorkedExamples(unittest.TestCase):
    def test_vector_operations_and_dot_products(self):
        x, y = [2, -3], [-1, 5]
        self.assertEqual([a + b for a, b in zip(x, y)], [1, 2])
        self.assertEqual([3 * a for a in x], [6, -9])
        self.assertEqual([a - b for a, b in zip(x, y)], [3, -8])
        self.assertEqual(math.hypot(3, 4), 5)
        self.assertEqual(dot([2, -1, 3], [4, 5, -2]), -3)
        self.assertEqual(dot([1, 2, -1], [3, 0, 4]), -1)
        self.assertEqual(dot([3, 4], [4, -3]), 0)
        self.assertEqual(dot([3, 4], [6, 8]), 50)
        self.assertEqual(dot([3, 4], [6, 8]) / (5 * 10), 1)

    def test_full_matrix_product_and_transpose(self):
        def multiply(a, b):
            return [[dot(row, col) for col in zip(*b)] for row in a]

        a = [[2, -1, 3], [0, 4, 1]]
        b = [[4, 1], [5, 2], [-2, 3]]
        self.assertEqual(multiply(a, b), [[-3, 9], [18, 11]])
        self.assertEqual(list(map(list, zip(*a))), [[2, 0], [-1, 4], [3, 1]])
        self.assertEqual(multiply([[1, 2], [3, 4]], [[2, 0], [-1, 5]]),
                         [[0, 10], [2, 20]])
        scale, swap = [[2, 0], [0, 1]], [[0, 1], [1, 0]]
        self.assertEqual(multiply(scale, swap), [[0, 2], [1, 0]])
        self.assertEqual(multiply(swap, scale), [[0, 1], [2, 0]])
        identity = [[1, 0], [0, 1]]
        self.assertEqual(multiply([[2, 0], [0, 2]], [[.5, 0], [0, .5]]), identity)
        self.assertEqual(multiply([[3, 4]], identity), [[3, 4]])

    def test_basis_images_and_rank_one_factors(self):
        x = [3, 4]
        rows = [[1, 2], [-1, 1]]
        by_columns = [dot(x, column) for column in zip(*rows)]
        by_basis = [sum(x[i] * rows[i][j] for i in range(2)) for j in range(2)]
        self.assertEqual(by_columns, [-1, 10])
        self.assertEqual(by_columns, by_basis)
        a, b = [1, 2], [3, 4, 5]
        matrix = [[ai * bj for bj in b] for ai in a]
        self.assertEqual(matrix, [[3, 4, 5], [6, 8, 10]])
        # Every 2x2 minor vanishes, while a nonzero entry rules out rank zero.
        for left, right in [(0, 1), (0, 2), (1, 2)]:
            self.assertEqual(matrix[0][left] * matrix[1][right] -
                             matrix[0][right] * matrix[1][left], 0)
        self.assertNotEqual(matrix[0][0], 0)
        self.assertEqual(1 * (4 + 6), 10)
        self.assertLess(1 * (4 + 6), 4 * 6)
        self.assertGreater(3 * (4 + 6), 4 * 6)  # Rank alone does not promise savings.

    def test_reductions_centering_and_bias_broadcast(self):
        x = [[1, 3, 5], [2, 4, 6]]
        self.assertEqual([statistics.mean(row) for row in x], [3, 4])
        self.assertEqual([statistics.mean(col) for col in zip(*x)], [1.5, 3.5, 5.5])
        self.assertEqual(statistics.mean(value for row in x for value in row), 3.5)
        centered = [[value - statistics.mean(row) for value in row] for row in x]
        self.assertEqual(centered, [[-2, 0, 2], [-2, 0, 2]])
        self.assertTrue(all(sum(row) == 0 for row in centered))
        bias = [10, 20, 30]
        self.assertEqual([[value + offset for value, offset in zip(row, bias)]
                          for row in x], [[11, 23, 35], [12, 24, 36]])

    def test_attention_scores_probabilities_values_and_mask(self):
        query, keys, values = [1, 0], [[0, 1], [2, 0]], [[2, 0], [0, 4]]
        scores = [dot(query, key) / math.sqrt(len(query)) for key in keys]
        weights = [math.exp(score - max(scores)) for score in scores]
        probabilities = [weight / sum(weights) for weight in weights]
        # Independent two-class logistic expression, then exact convex mixing.
        second = 1 / (1 + math.exp(-math.sqrt(2)))
        self.assertAlmostEqual(probabilities[1], second)
        self.assertAlmostEqual(sum(probabilities), 1)
        output = [dot(probabilities, column) for column in zip(*values)]
        self.assertEqual([round(value, 4) for value in probabilities], [.1956, .8044])
        self.assertEqual([round(value, 4) for value in output], [.3911, 3.2177])
        self.assertEqual([dot([1, 0], col) for col in zip(*values)], [2, 0])
        self.assertEqual([dot([.5, .5], col) for col in zip(*values)], [1, 2])
        self.assertNotEqual([probabilities[0] * value for value in values[0]], [2, 0])

    def test_derivative_limits_chain_rule_and_descent(self):
        for step in [.1, .01, -.01]:
            self.assertAlmostEqual(((2 + step) ** 2 - 4) / step, 4 + step)
        self.assertAlmostEqual(centered_difference(lambda v: (3 * v[0]) ** 2,
                                                   [2.], 0), 36)
        for weight, gradient, updated in [(1, -4, 1.4), (5, 4, 4.6)]:
            self.assertAlmostEqual(centered_difference(lambda v: (v[0] - 3) ** 2,
                                                       [weight], 0, .01), gradient)
            self.assertAlmostEqual(weight - .1 * gradient, updated)
            self.assertAlmostEqual((updated - 3) ** 2, 2.56)
        self.assertEqual((1 - 2 * (-4) - 3) ** 2, 36)
        for index, expected in enumerate([-2, 3]):
            self.assertAlmostEqual(centered_difference(lambda v: v[0] ** 2 + 3 * v[1],
                                                       [-1., 2.], index), expected)

    def test_softmax_loss_gradient_and_complete_weight_update(self):
        def log_loss(logits, target=1):
            maximum = max(logits)
            return math.log(sum(math.exp(z - maximum) for z in logits)) + (maximum - logits[target])

        logits = [0., math.log(3)]  # Probabilities exactly 1/4, 3/4 in real arithmetic.
        for index, expected in enumerate([.25, -.25]):
            self.assertAlmostEqual(centered_difference(log_loss, logits, index), expected)

        features = [1., 2.]
        weights = [1., -1., 0., 1.]

        def scores(w):
            return [features[0] * w[0] + features[1] * w[2],
                    features[0] * w[1] + features[1] * w[3]]

        self.assertEqual(scores(weights), [1, 1])
        self.assertAlmostEqual(log_loss(scores(weights)), math.log(2))
        gradient = [.5, -.5, 1., -1.]
        for index, expected in enumerate(gradient):
            self.assertAlmostEqual(centered_difference(lambda w: log_loss(scores(w)),
                                                       weights, index), expected)
        updated = [w - .1 * g for w, g in zip(weights, gradient)]
        self.assertEqual(updated, [.95, -.95, -.1, 1.1])
        for actual, expected in zip(scores(updated), [.75, 1.25]):
            self.assertAlmostEqual(actual, expected)
        self.assertAlmostEqual(log_loss(scores(updated)), .4740769841801067)
        self.assertAlmostEqual(math.exp(-log_loss(scores(updated))), .6224593312018546)

    def test_independent_batch_variance_by_enumeration(self):
        population = [10, 10, 10, 50]
        # Enumerate all equally likely batches rather than invoking sigma^2/B.
        for size in [1, 2, 4]:
            means = [statistics.mean(batch) for batch in product(population, repeat=size)]
            self.assertEqual(statistics.mean(means), 20)
            self.assertEqual(statistics.pvariance(means), 300 / size)
        duplicated_means = [statistics.mean([value] * 4) for value in population]
        self.assertEqual(statistics.pvariance(duplicated_means), 300)

    def test_probability_tree_and_conditioning(self):
        leaves = {"Ax": .6 * .5, "Ay": .6 * .5,
                  "Bx": .4 * .9, "By": .4 * .1}
        self.assertAlmostEqual(sum(leaves.values()), 1)
        self.assertEqual(max(leaves, key=leaves.get), "Bx")
        marginal = leaves["Ax"] + leaves["Bx"]
        self.assertAlmostEqual(marginal, .66)
        self.assertAlmostEqual(leaves["Bx"] / marginal, 6 / 11)

    def test_expectation_and_variance(self):
        # Enumerate a population with the stated 3:1 probability weights.
        population = [10, 10, 10, 50]
        self.assertEqual(statistics.mean(population), 20)
        self.assertEqual(statistics.pvariance(population), 300)
        self.assertAlmostEqual(statistics.pstdev(population) / math.sqrt(100),
                               1.7320508075688772)

    def test_likelihood_entropy_and_kl(self):
        token_probabilities = [.8, .5, .25]
        nll = -sum(map(math.log, token_probabilities))
        self.assertAlmostEqual(nll, -math.log(math.prod(token_probabilities)))
        self.assertAlmostEqual(math.exp(nll / 3), 2.154434690031884)
        p, q = [.75, .25], [.5, .5]
        entropy = -sum(pi * math.log(pi) for pi in p)
        cross_entropy = -sum(pi * math.log(qi) for pi, qi in zip(p, q))
        kl = sum(pi * math.log(pi / qi) for pi, qi in zip(p, q))
        self.assertAlmostEqual(entropy, .5623351446188083)
        self.assertAlmostEqual(kl, .13081203594113697)
        self.assertAlmostEqual(cross_entropy, entropy + kl)

    def test_matrix_gradients_against_perturbed_forward(self):
        # Flatten X, row-major W and b. Check every entry independently.
        values = [2., -1., 1., 3., 4., -2., 0., 0.]

        def loss(v):
            x0, x1, w00, w01, w10, w11, b0, b1 = v
            y0 = x0 * w00 + x1 * w10 + b0
            y1 = x0 * w01 + x1 * w11 + b1
            return y0 + 2 * y1

        self.assertEqual(loss(values), 14)
        expected = [7., 0., 2., 4., -1., -2., 1., 2.]
        for index, derivative in enumerate(expected):
            with self.subTest(coordinate=index):
                self.assertAlmostEqual(centered_difference(loss, values, index),
                                       derivative, places=8)
        self.assertAlmostEqual(centered_difference(lambda x: x[0] ** 2 + 3 * x[0],
                                                   [2.], 0), 7)

    def test_rmsnorm_including_denominator_and_gain_derivatives(self):
        x, gain, upstream = [3., 4.], [1., 1.], [1., -1.]
        for epsilon in [0., 1e-6, .25]:
            with self.subTest(epsilon=epsilon):
                r = math.sqrt(statistics.mean(v * v for v in x) + epsilon)
                h = [g * u for g, u in zip(gain, upstream)]
                derivative = [hi / r - xi * dot(h, x) / (len(x) * r**3)
                              for xi, hi in zip(x, h)]

                def loss(v):
                    radius = math.sqrt((v[0] ** 2 + v[1] ** 2) / 2 + epsilon)
                    return (upstream[0] * v[2] * v[0] +
                            upstream[1] * v[3] * v[1]) / radius

                gain_derivative = [g * xi / r for g, xi in zip(upstream, x)]
                for index, expected in enumerate(derivative + gain_derivative):
                    self.assertAlmostEqual(centered_difference(loss, x + gain, index),
                                           expected, places=8)
                if epsilon == 0:
                    self.assertAlmostEqual(dot(x, derivative), 0)
                    self.assertAlmostEqual(derivative[0], .3167838379715733)

    def test_rotary_relative_position_identity(self):
        q, k = [1.3, -.7], [-.2, 2.1]
        for frequency in [1., .01, .0001]:
            for m, n, shift in [(0, 1, 7), (12, 101, 100), (9, 9, -3)]:
                with self.subTest(frequency=frequency, m=m, n=n):
                    score = dot(rotate(q, m * frequency), rotate(k, n * frequency))
                    relative = dot(q, rotate(k, (n - m) * frequency))
                    shifted = dot(rotate(q, (m + shift) * frequency),
                                  rotate(k, (n + shift) * frequency))
                    self.assertAlmostEqual(score, relative)
                    self.assertAlmostEqual(score, shifted)

    def test_weight_and_cache_ledger(self):
        block_shapes = [(8, 8), (8, 4), (8, 4), (8, 8),
                        (8, 24), (8, 24), (24, 8), (8,), (8,)]
        per_block = sum(math.prod(shape) for shape in block_shapes)
        total = 3 * per_block + 32 * 8 + 8 * 32 + 8
        self.assertEqual(per_block, 784)
        self.assertEqual(total, 2872)
        self.assertEqual(total - 32 * 8, 2616)
        self.assertEqual(total * 2, 5744)
        self.assertEqual(math.prod([2, 3, 1, 4, 1, 4]) * 2, 192)

    def test_two_buffer_schedule_against_closed_form(self):
        # Schedule copies and kernels using independent engine/buffer readiness.
        for count in [1, 2, 4, 20]:
            for copy, compute in [(3, 8), (8, 3), (4, 4)]:
                available_buffers = [0, 0]
                copy_finish = compute_finish = 0
                for index in range(count):
                    buffer = index % 2
                    copy_start = max(copy_finish, available_buffers[buffer])
                    copy_finish = copy_start + copy
                    compute_finish = max(copy_finish, compute_finish) + compute
                    available_buffers[buffer] = compute_finish
                self.assertEqual(compute_finish,
                                 copy + compute + (count - 1) * max(copy, compute))
        self.assertEqual(3 + 8 + 3 * 8, 35)

    def test_binary_and_paired_uncertainty(self):
        se = math.sqrt(.8 * .2 / 1000)
        self.assertAlmostEqual(se, .01264911064067352)
        differences = [0] * 88 + [-1] * 5 + [1] * 7
        self.assertEqual(statistics.mean(differences), .02)
        self.assertAlmostEqual(statistics.stdev(differences) / math.sqrt(100),
                               .03475745687015677, places=12)
        for q in [.1, .75, .9]:
            p = .75
            expectation = p * (q - 1) ** 2 + (1 - p) * q**2
            self.assertAlmostEqual(expectation, (q - p) ** 2 + p * (1 - p))

    def test_float32_associativity_and_stable_softmax(self):
        def f32(value):
            return struct.unpack("f", struct.pack("f", value))[0]

        a, b, c = f32(1e8), f32(-1e8), f32(1.)
        self.assertEqual(f32(f32(a + b) + c), 1.)
        self.assertEqual(f32(a + f32(b + c)), 0.)
        logits = [1000., 1001.]
        weights = [math.exp(z - max(logits)) for z in logits]
        probabilities = [weight / sum(weights) for weight in weights]
        self.assertAlmostEqual(probabilities[1], .7310585786300049)
        self.assertAlmostEqual(-math.log(probabilities[1]), .3132616875182228)


if __name__ == "__main__":
    unittest.main(verbosity=2)
