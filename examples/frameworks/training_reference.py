#!/usr/bin/env python3
"""Framework boundary arithmetic, standard library only; no neural runtime or GPU.

Matrix convention matches torch.nn.Linear: W[out,in], A[rank,in], B[out,rank].
The JSON adapter bundle is a teaching schema, not a PEFT checkpoint.
"""
from __future__ import annotations
import hashlib
import json
import math

IGNORE = -100
IDS = [0, 1, 2, 3, 4, 5, 5, 5]
ATTENTION = [1, 1, 1, 1, 1, 1, 0, 0]
ASSISTANT = [0, 0, 0, 0, 1, 1, 0, 0]


def aligned_labels(ids, attention, assistant):
    if len(ids) != len(attention) or len(ids) != len(assistant):
        raise ValueError("mask lengths differ")
    return [token if visible and target else IGNORE
            for token, visible, target in zip(ids, attention, assistant)]


def causal_loss(logits, labels):
    """Model-owned shift. Return summed loss and count, not a silent zero mean."""
    if len(logits) != len(labels):
        raise ValueError("aligned shape required")
    total, count = 0., 0
    for row, target in zip(logits[:-1], labels[1:]):
        if target == IGNORE:
            continue
        if not 0 <= target < len(row) or not all(math.isfinite(z) for z in row):
            raise ValueError("invalid target or logits")
        maximum = max(row)
        total += math.log(sum(math.exp(z - maximum) for z in row)) + maximum - row[target]
        count += 1
    if not count:
        raise ValueError("no valid prediction targets")
    return total, count


def example_logits():
    probabilities = [.2, .25, .5, math.exp(-.4), math.exp(-.8), .1, .1, .1]
    return [[math.log(p if j == IDS[min(i + 1, len(IDS) - 1)] else (1 - p) / 5)
             for j in range(6)] for i, p in enumerate(probabilities)]


def matvec(w, x):
    if not w or any(len(row) != len(x) for row in w):
        raise ValueError("matrix shape mismatch")
    return [sum(v * item for v, item in zip(row, x)) for row in w]


def merge_lora(w, a, b, alpha):
    rank = len(a)
    if not rank or len(b) != len(w) or any(len(row) != rank for row in b):
        raise ValueError("adapter shape mismatch")
    if not w or not w[0] or any(len(row) != len(w[0]) for row in w + a):
        raise ValueError("input dimension mismatch")
    return [[value + alpha / rank * sum(b[o][k] * a[k][i] for k in range(rank))
             for i, value in enumerate(row)] for o, row in enumerate(w)]


def separate_lora(w, a, b, alpha, x):
    base, branch = matvec(w, x), matvec(b, matvec(a, x))
    return [v + alpha / len(a) * delta for v, delta in zip(base, branch)]


def base_digest(w):
    """Hash exact serialized toy values, not real framework tensor files."""
    return hashlib.sha256(json.dumps(w, separators=(",", ":"), allow_nan=False).encode()).hexdigest()


def adapter_bundle(w, a, b, alpha, tokenizer, template, module):
    return {"format": "atlas-linear-adapter-v1", "base_sha256": base_digest(w),
            "tokenizer": tokenizer, "template": template, "module": module,
            "a": a, "b": b, "alpha": alpha}


def load_adapter(bundle, w, tokenizer, template, module):
    expected = {"format": "atlas-linear-adapter-v1", "base_sha256": base_digest(w),
                "tokenizer": tokenizer, "template": template, "module": module}
    mismatches = [key for key, value in expected.items() if bundle.get(key) != value]
    if mismatches:
        raise ValueError("adapter identity mismatch: " + ", ".join(mismatches))
    return merge_lora(w, bundle["a"], bundle["b"], bundle["alpha"])


def partitioned_gradient(xs, ys, partitions, weight, reducer="mean", backward_divisor=2):
    """Scalar half-squared loss; manually apply declared wrapper divisions."""
    if len(xs) != len(ys) or not xs or reducer not in ("sum", "mean") or backward_divisor < 1:
        raise ValueError("valid dataset and reduction required")
    indices = [i for rank in partitions for microbatch in rank for i in microbatch]
    if sorted(indices) != list(range(len(xs))):
        raise ValueError("each example must occur exactly once")
    rank_divisor = len(partitions) if reducer == "mean" else 1
    scale = rank_divisor * backward_divisor / len(xs)
    rank_grads = []
    for rank in partitions:
        grad = 0.
        for microbatch in rank:
            local_sum = sum((weight * xs[i] - ys[i]) * xs[i] for i in microbatch)
            grad += local_sum * scale / backward_divisor
        rank_grads.append(grad)
    return sum(rank_grads) / rank_divisor


def main():
    labels = aligned_labels(IDS, ATTENTION, ASSISTANT)
    total, count = causal_loss(example_logits(), labels)
    print("Aligned labels:", labels)
    print("Response targets:", count, "mean loss:", total / count)
    broken = [IGNORE if token == 5 else label for token, label in zip(IDS, labels)]
    total, count = causal_loss(example_logits(), broken)
    print("Masking EOS by ID loses its real target:", count, "mean loss:", total / count)
    w, a, b, x = [[1., 2.], [-1., .5]], [[1., -1.]], [[.5], [1.]], [2., 1.]
    bundle = adapter_bundle(w, a, b, 1., "vocab-v1", "chat-v1", "layer.q_proj")
    restored = load_adapter(json.loads(json.dumps(bundle)), w, "vocab-v1", "chat-v1", "layer.q_proj")
    print("Separate adapter:", separate_lora(w, a, b, 1., x))
    print("Serialized adapter restored and merged:", matvec(restored, x))
    print("CPU algebra only; no trained model, PEFT loader or distributed runtime.")


if __name__ == "__main__":
    main()
