"""Reference speculative sampling on a tiny discrete vocabulary.

No neural network or KV cache is executed. Target scoring is written serially
for readability: this script demonstrates probability correctness, not speed.
"""
import json
import math
import random
from collections import Counter


def validate(probabilities):
    if (not probabilities or any(not math.isfinite(p) or p < 0 for p in probabilities)
            or not math.isclose(sum(probabilities), 1., abs_tol=1e-12, rel_tol=0)):
        raise ValueError("Expected a normalized finite distribution")


def draw(probabilities, rng):
    validate(probabilities)
    u, cumulative = rng.random(), 0.
    last_positive = None
    for token, probability in enumerate(probabilities):
        if probability > 0:
            last_positive = token
        cumulative += probability
        if u < cumulative:
            return token
    return last_positive


def speculative_round(target, draft, prefix, draft_length, rng):
    if not isinstance(draft_length, int) or draft_length < 1:
        raise ValueError("draft_length must be positive")
    candidates, proposals = [], []
    for _ in range(draft_length):
        q = draft(prefix + candidates)
        validate(q)
        proposals.append(q)
        candidates.append(draw(q, rng))
    # A real Transformer can score this known candidate sequence in parallel.
    targets = [target(prefix + candidates[:i]) for i in range(draft_length + 1)]
    for p in targets:
        validate(p)
    if any(len(p) != len(proposals[0]) for p in targets + proposals):
        raise ValueError("Target and draft vocabularies must agree")
    accepted = []
    for i, candidate in enumerate(candidates):
        p, q = targets[i], proposals[i]
        # q[candidate] is positive because candidate was sampled from q.
        if rng.random() < min(1., p[candidate] / q[candidate]):
            accepted.append(candidate)
            continue
        residual = [max(0., a - b) for a, b in zip(p, q)]
        normalizer = sum(residual)
        if normalizer <= 0:
            raise ArithmeticError("A zero-mass rejection branch was taken")
        correction = draw([v / normalizer for v in residual], rng)
        return accepted + [correction], len(accepted)
    return accepted + [draw(targets[-1], rng)], len(accepted)


def target(prefix):
    return [.6, .4] if not prefix else ([.2, .8] if prefix[-1] == 0 else [.7, .3])


def draft(prefix):
    return [.5, .5]


def generate_two(rng):
    prefix = []
    while len(prefix) < 2:
        output, _ = speculative_round(target, draft, prefix, 3, rng)
        prefix.extend(output)
    return tuple(prefix[:2])


def empirical_check(samples=50000, seed=23):
    rng = random.Random(seed)
    counts = Counter(generate_two(rng) for _ in range(samples))
    expected = {(0, 0): .12, (0, 1): .48, (1, 0): .28, (1, 1): .12}
    errors = {str(k): abs(counts[k] / samples - p) for k, p in expected.items()}
    return {"samples": samples, "seed": seed, "expected": {str(k): v for k, v in expected.items()},
            "observed": {str(k): counts[k] / samples for k in expected},
            "max_absolute_frequency_error": max(errors.values()),
            "scope": "two-token Markov toy; no model, cache, or speed measurement"}


if __name__ == "__main__":
    print(json.dumps(empirical_check(), indent=2))
