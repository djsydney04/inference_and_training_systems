"""Dependency-free reference for the same masked classifier update in three frameworks."""
from __future__ import annotations

import math

INPUTS = [[1., 2.], [2., -1.], [-1., 1.]]
WEIGHTS = [[.2, -.3], [.4, .1]]
BIAS = [.1, -.2]
TARGETS = [0, 1, 0]
MASK = [1., 1., 0.]
LEARNING_RATE = .125  # Exactly representable in float32 as well as float64.


def reference(x=INPUTS, w=WEIGHTS, b=BIAS, targets=TARGETS, mask=MASK, reduction="mean"):
    if len(x) != len(targets) or len(x) != len(mask) or not x:
        raise ValueError("one target and mask per row required")
    if any(len(row) != len(w) for row in x) or any(len(row) != len(b) for row in w):
        raise ValueError("inconsistent matrix shapes")
    if any(t not in range(len(b)) for t in targets) or any(m not in (0, 1) for m in mask):
        raise ValueError("valid targets and binary mask required, including masked rows")
    if reduction not in ("sum", "mean") or sum(mask) <= 0:
        raise ValueError("known reduction and nonempty valid-target batch required")
    denominator = sum(mask) if reduction == "mean" else 1.
    logits, probabilities, loss_sum = [], [], 0.
    dw = [[0.] * len(b) for _ in w]
    db = [0.] * len(b)
    for row, target, valid in zip(x, targets, mask):
        z = [b[c] + sum(row[d] * w[d][c] for d in range(len(w))) for c in range(len(b))]
        exp = [math.exp(v - max(z)) for v in z]
        p = [v / sum(exp) for v in exp]
        logits.append(z)
        probabilities.append(p)
        loss_sum += valid * (math.log(sum(exp)) + max(z) - z[target])
        for c in range(len(b)):
            dz = valid * (p[c] - (c == target)) / denominator
            db[c] += dz
            for d in range(len(w)):
                dw[d][c] += row[d] * dz
    return {"logits": logits, "probabilities": probabilities, "loss": loss_sum / denominator,
            "dweights": dw, "dbias": db,
            "next_weights": [[v - LEARNING_RATE * dw[d][c] for c, v in enumerate(row)] for d, row in enumerate(w)],
            "next_bias": [v - LEARNING_RATE * db[c] for c, v in enumerate(b)]}


def cases():
    return [("masked_mean", INPUTS, TARGETS, MASK, "mean"),
            ("masked_sum", INPUTS, TARGETS, MASK, "sum"),
            ("all_valid", INPUTS, TARGETS, [1., 1., 1.], "mean"),
            ("one_valid", INPUTS, TARGETS, [0., 0., 1.], "mean"),
            ("duplicate_batch", INPUTS * 2, TARGETS * 2, MASK * 2, "mean")]


def check(actual, expected, tolerance=1e-10):
    """Compare all named values. Shapes must agree; an absent gradient cannot pass."""
    errors = []
    def visit(a, b):
        if isinstance(b, list):
            if not isinstance(a, list) or len(a) != len(b):
                raise AssertionError("shape mismatch")
            for av, bv in zip(a, b):
                visit(av, bv)
        else:
            if not math.isfinite(a) or not math.isclose(a, b, abs_tol=tolerance, rel_tol=tolerance):
                raise AssertionError(f"{a} != {b}")
            errors.append(abs(a - b))
    for name in ("loss", "dweights", "dbias", "next_weights", "next_bias"):
        visit(actual[name], expected[name])
    return max(errors, default=0.)
