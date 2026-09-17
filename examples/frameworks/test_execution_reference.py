import copy
import math
import unittest

from execution_reference import INPUTS, WEIGHTS, BIAS, TARGETS, MASK, reference


class ExecutionReferenceTests(unittest.TestCase):
    def test_all_parameter_gradients_from_independent_binary_loss(self):
        result, eps = reference(), 1e-5
        def loss(w, b):
            total = 0.
            for x, t, m in zip(INPUTS, TARGETS, MASK):
                z = [b[c] + sum(x[d]*w[d][c] for d in range(2)) for c in range(2)]
                total += m * math.log1p(math.exp(z[1-t]-z[t]))
            return total/sum(MASK)
        for d in range(2):
            for c in range(2):
                p, m = copy.deepcopy(WEIGHTS), copy.deepcopy(WEIGHTS)
                p[d][c] += eps; m[d][c] -= eps
                self.assertAlmostEqual((loss(p,BIAS)-loss(m,BIAS))/(2*eps), result["dweights"][d][c], places=8)
        for c in range(2):
            p, m = BIAS.copy(), BIAS.copy(); p[c] += eps; m[c] -= eps
            self.assertAlmostEqual((loss(WEIGHTS,p)-loss(WEIGHTS,m))/(2*eps), result["dbias"][c], places=8)

    def test_mask_and_reduction_contract(self):
        mean, summed = reference(), reference(reduction="sum")
        self.assertAlmostEqual(summed["loss"], 2*mean["loss"])
        changed = copy.deepcopy(INPUTS); changed[2] = [100., -100.]
        self.assertEqual(reference(x=changed)["dweights"], mean["dweights"])
        repeated = reference(x=INPUTS*2, targets=TARGETS*2, mask=MASK*2)
        self.assertAlmostEqual(repeated["loss"], mean["loss"])

    def test_empty_masks_and_invalid_masked_targets_fail(self):
        with self.assertRaises(ValueError): reference(mask=[0,0,0])
        with self.assertRaises(ValueError): reference(targets=[0,1,-100])
        with self.assertRaises(ValueError): reference(x=[[1]])


if __name__ == "__main__":
    unittest.main()
