from array import array
import copy
import json
import math
import unittest

from reference import ShardedState, batch_at, loss_and_gradient_sum, partition_batch


class ShardingTests(unittest.TestCase):
    def assert_vectors_close(self, left, right, tolerance=1e-12):
        self.assertEqual(len(left), len(right))
        for a, b in zip(left, right):
            self.assertLessEqual(abs(a - b), tolerance)

    def test_analytic_gradients_match_independent_finite_differences(self):
        weights = [0.3, -0.4, 0.7, 0.2]
        examples = [([1, 2, -1, 0], 0.4), ([0.5, 1, 2, -3], -0.7), ([-1, 0, 2, 1], 1.3)]
        _, analytic = loss_and_gradient_sum(weights, examples)
        for j in range(4):
            plus, minus = weights.copy(), weights.copy()
            plus[j] += 1e-6
            minus[j] -= 1e-6
            estimate = (loss_and_gradient_sum(plus, examples)[0] - loss_and_gradient_sum(minus, examples)[0]) / 2e-6
            self.assertAlmostEqual(analytic[j], estimate, delta=1e-8)

    def test_unequal_rank_batches_normalize_by_global_examples(self):
        local = [loss_and_gradient_sum([1, 2, 3, 4], part)[1] for part in partition_batch(batch_at(0), 2)]
        self.assertEqual(local, [[1, 0, 0, 0], [0, 2, 3, 4]])
        correct = [sum(row[j] for row in local) / 4 for j in range(4)]
        wrong = [(local[0][j] + local[1][j] / 3) / 2 for j in range(4)]
        self.assertEqual(correct, [0.25, 0.5, 0.75, 1])
        self.assertNotEqual(correct, wrong)

    def test_sharded_updates_match_monolithic_adamw(self):
        for ranks in (1, 2, 4):
            sharded = ShardedState.create([1, 2, 3, 4], ranks)
            weights, moments, variances = [1., 2., 3., 4.], [0.] * 4, [0.] * 4
            for iteration in range(5):
                batch = batch_at(iteration)
                _, grad_sum = loss_and_gradient_sum(weights, batch)
                for j, grad in enumerate(grad_sum):
                    grad /= len(batch)
                    moments[j] = 0.9 * moments[j] + 0.1 * grad
                    variances[j] = 0.99 * variances[j] + 0.01 * grad ** 2
                    m_hat = moments[j] / (1 - 0.9 ** (iteration + 1))
                    v_hat = variances[j] / (1 - 0.99 ** (iteration + 1))
                    weights[j] = 0.99 * weights[j] - 0.1 * m_hat / (math.sqrt(v_hat) + 0.01)
                sharded.update(partition_batch(batch, ranks))
                self.assert_vectors_close(sharded.gather(), weights)
                self.assert_vectors_close(sharded.gather("first_moment"), moments)
                self.assert_vectors_close(sharded.gather("second_moment"), variances)

    def test_saved_moments_and_cursor_survive_two_to_four_rank_resume(self):
        uninterrupted = ShardedState.create([1, 2, 3, 4], 2)
        for _ in range(2):
            uninterrupted.update(partition_batch(batch_at(uninterrupted.data_cursor), 2))
        restored = ShardedState.restore(json.loads(json.dumps(uninterrupted.checkpoint())), 4)
        for _ in range(3):
            uninterrupted.update(partition_batch(batch_at(uninterrupted.data_cursor), 2))
            restored.update(partition_batch(batch_at(restored.data_cursor), 4))
        for field in ("weights", "first_moment", "second_moment"):
            self.assert_vectors_close(restored.gather(field), uninterrupted.gather(field))
        self.assertEqual((restored.step, restored.data_cursor), (5, 5))

    def test_reset_optimizer_moments_changes_the_next_update(self):
        state = ShardedState.create([1, 2, 3, 4], 2)
        state.update(partition_batch(batch_at(0), 2))
        reset = ShardedState.create(state.gather(), 2)
        reset.step, reset.data_cursor = state.step, state.data_cursor
        state.update(partition_batch(batch_at(1), 2))
        reset.update(partition_batch(batch_at(1), 2))
        self.assertNotEqual(state.gather(), reset.gather())

    def test_actual_small_buffer_payloads_match_the_byte_contract(self):
        # 4 groups, 8 elements/group, 4 ranks. No Python object headers counted.
        original = array("f", [0] * 8)
        moments = array("f", [0] * 16)
        compute_bits = array("H", [0] * 8)  # 16-bit storage, not BF16 arithmetic.
        full_gradient = array("f", [0] * 8)
        saved_activations = bytearray(4 * 8)
        payload = lambda value: value.itemsize * len(value)
        baseline = payload(original) + payload(moments)
        self.assertEqual(baseline, 96)
        self.assertEqual(payload(compute_bits), 16)
        self.assertEqual(payload(full_gradient), 32)
        # First backward peak without and with the next gathered group.
        self.assertEqual(baseline + payload(compute_bits) + payload(full_gradient) + len(saved_activations), 176)
        self.assertEqual(baseline + 2 * payload(compute_bits) + payload(full_gradient) + len(saved_activations), 192)

    def test_checkpoint_rejects_missing_overlapping_and_inconsistent_shards(self):
        good = ShardedState.create([1, 2, 3, 4], 2).checkpoint()
        bad_cases = []
        missing = copy.deepcopy(good); missing["shards"].pop(); bad_cases.append(missing)
        overlap = copy.deepcopy(good); overlap["shards"][1]["start"] = 1; bad_cases.append(overlap)
        size = copy.deepcopy(good); size["shards"][1]["first_moment"].pop(); bad_cases.append(size)
        negative = copy.deepcopy(good); negative["shards"][0]["second_moment"][0] = -1; bad_cases.append(negative)
        for invalid in bad_cases:
            with self.assertRaises(ValueError):
                ShardedState.restore(invalid, 4)


if __name__ == "__main__":
    unittest.main()
