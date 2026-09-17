import itertools
import math
import unittest

from reference import grouped_weights, matvec, mse, pack_int4, quantize, scalar_attention, unpack_int4


class QuantizationTests(unittest.TestCase):
    def test_rounding_and_odd_zero_point(self):
        self.assertEqual([quantize(v, 0.5, 3, 0, 7)[0] for v in [-0.75, -0.25, 0.25, 0.75]], [1, 3, 3, 5])
        for value in range(-40, 41):
            code, decoded = quantize(value / 8, 0.25, 3, 0, 7)
            self.assertIn(code, range(8))
            self.assertEqual(decoded, (code - 3) * 0.25)

    def test_packing_matches_hand_encoded_bytes_and_all_pairs(self):
        self.assertEqual(pack_int4([-1, 2, -7]), bytes([0x2F, 0x09]))
        for pair in itertools.product(range(-7, 8), repeat=2):
            self.assertEqual(unpack_int4(pack_int4(pair), 2), list(pair))
        for length in range(7):
            sequence = [-7, 0, 7, 1, -1, 3][:length]
            self.assertEqual(unpack_int4(pack_int4(sequence), length), sequence)
        with self.assertRaises(ValueError): unpack_int4(bytes([0x08]), 1)
        with self.assertRaises(ValueError): unpack_int4(bytes([0x10]), 1)

    def test_group_tail_and_inverse_channel_transform(self):
        codes, scales, decoded = grouped_weights([[1, 2, 7, 0, 0]], 4, 2)
        self.assertEqual(codes, [[4, 7, 7, 0, 0]])
        self.assertEqual(scales, [[2 / 7, 1, 1]])
        self.assertAlmostEqual(decoded[0][0], 8 / 7)
        w, x, s = [[0.49, 1.04, 0.11, 4.2]], [8, 0.1, 0.1, 0.1], [8, 1, 1, 1]
        transformed = [[v * factor for v, factor in zip(w[0], s)]]
        self.assertAlmostEqual(matvec(w, x)[0], matvec(transformed, [v / factor for v, factor in zip(x, s)])[0])

    def test_weight_error_ranking_can_reverse_at_output(self):
        w = [0.49, 1.04]
        a = [quantize(v, 0.5)[1] for v in w]
        b = [quantize(v, 0.52)[1] for v in w]
        self.assertLess(mse(w, b), mse(w, a))
        self.assertAlmostEqual((b[0] - w[0]) ** 2, 9 * (a[0] - w[0]) ** 2)

    def test_calibration_shift_reverses_a_clipping_choice(self):
        calibration, shifted = [0.25] * 100 + [3], [3] * 100 + [0.25]
        loss = lambda samples, scale: mse(samples, [quantize(v, scale, 0, -3, 3)[1] for v in samples])
        selected = min([0.25, 0.5, 1], key=lambda scale: loss(calibration, scale))
        self.assertEqual(selected, 0.25)
        self.assertLess(loss(calibration, selected), loss(calibration, 1))
        self.assertGreater(loss(shifted, selected), loss(shifted, 1))

    def test_keys_and_values_change_different_parts_of_attention(self):
        p, y = scalar_attention(1, [0, 1], [0, 10])
        self.assertAlmostEqual(y, 10 * math.e / (1 + math.e))
        p2, y2 = scalar_attention(1, [0, 1], [0, 8])
        self.assertEqual(p, p2)
        self.assertAlmostEqual(y2, 0.8 * y)
        self.assertEqual(scalar_attention(1, [0, 0], [0, 10])[1], 5)


if __name__ == "__main__":
    unittest.main()
