#!/usr/bin/env python3
"""Small MoE arithmetic reference. Standard Python; no model, accelerator or network.

Rows are token vectors. Each linear expert computes x @ W. Selected softmax
weights are renormalized unless requested otherwise. Capacity admission uses
token order, then choice order; it is a computation policy, not just packing.
"""
from __future__ import annotations

from dataclasses import dataclass
import math


@dataclass(frozen=True)
class Route:
    token: int
    expert: int
    choice: int
    weight: float


INPUTS = [[1., 2.], [2., 1.], [-1., 1.], [1., -1.]]
EXPERTS = [[[1., 0.], [0., 1.]], [[2., 0.], [0., 1.]], [[0., 1.], [1., 0.]]]
PROBABILITIES = [[.6, .3, .1], [.2, .5, .3], [.1, .2, .7], [.5, .4, .1]]
LOGITS = [[math.log(p) for p in row] for row in PROBABILITIES]


def softmax(row):
    if not row or not all(math.isfinite(x) for x in row):
        raise ValueError("finite nonempty logits required")
    exps = [math.exp(x - max(row)) for x in row]
    return [x / sum(exps) for x in exps]


def route(logits, k=2, normalize=True):
    if not logits or not isinstance(k, int) or not 1 <= k <= len(logits[0]):
        raise ValueError("invalid routing shape or k")
    if any(len(row) != len(logits[0]) for row in logits):
        raise ValueError("ragged logits")
    result = []
    for token, row in enumerate(logits):
        p = softmax(row)
        selected = sorted(range(len(row)), key=lambda e: (-row[e], e))[:k]
        mass = sum(p[e] for e in selected) if normalize else 1.
        result.extend(Route(token, e, choice, p[e] / mass) for choice, e in enumerate(selected))
    return result


def capacity_limit(routes, expert_count, capacity, renormalize=False):
    if not isinstance(capacity, int) or capacity < 0:
        raise ValueError("nonnegative integer capacity required")
    counts, kept, dropped = [0] * expert_count, [], []
    for item in sorted(routes, key=lambda r: (r.token, r.choice)):
        if counts[item.expert] < capacity:
            counts[item.expert] += 1
            kept.append(item)
        else:
            dropped.append(item)
    if renormalize:
        masses = {}
        for item in kept:
            masses[item.token] = masses.get(item.token, 0.) + item.weight
        kept = [Route(r.token, r.expert, r.choice, r.weight / masses[r.token]
                      if masses[r.token] else 0.) for r in kept]
    return kept, dropped


def grouped_forward(inputs, experts, routes):
    """Pack by expert, run its rows, then scatter-add weighted results."""
    output = [[0.] * len(experts[0][0]) for _ in inputs]
    packed = sorted(routes, key=lambda r: (r.expert, r.token))
    for item in packed:
        x, w = inputs[item.token], experts[item.expert]
        value = [sum(x[i] * w[i][j] for i in range(len(x))) for j in range(len(w[0]))]
        for j, v in enumerate(value):
            output[item.token][j] += item.weight * v
    return output


def dense_reference(inputs, experts, logits, k=2):
    """Independent token-major reference: materialize every expert, mask, combine.

    Does not use route(), packed rows, inverse indices, or grouped_forward().
    """
    result = []
    for x, row in zip(inputs, logits):
        selected = sorted(range(len(row)), key=lambda e: (-row[e], e))[:k]
        denominator = sum(math.exp(row[e] - max(row)) for e in selected)
        expert_values = [[sum(x[i] * w[i][j] for i in range(len(x)))
                          for j in range(len(w[0]))] for w in experts]
        result.append([sum(math.exp(row[e] - max(row)) / denominator * expert_values[e][j]
                           for e in selected) for j in range(len(experts[0][0]))])
    return result


def backward(inputs, experts, logits, upstream, k=2):
    """Dropless selected-softmax derivative, away from top-k selection boundaries.

    Logits are independent inputs. A learned router z=xR would add its own
    gradient to dx and require dR. There is no derivative of the chosen IDs.
    """
    routes = route(logits, k)
    dx = [[0.] * len(x) for x in inputs]
    dw = [[[0.] * len(row) for row in w] for w in experts]
    dg = [[0.] * len(experts) for _ in inputs]
    dz = [[0.] * len(experts) for _ in inputs]
    for r in routes:
        x, w, u = inputs[r.token], experts[r.expert], upstream[r.token]
        value = [sum(x[i] * w[i][j] for i in range(len(x))) for j in range(len(u))]
        dg[r.token][r.expert] = sum(u[j] * value[j] for j in range(len(u)))
        for i in range(len(x)):
            for j in range(len(u)):
                dx[r.token][i] += r.weight * u[j] * w[i][j]
                dw[r.expert][i][j] += x[i] * r.weight * u[j]
    for token in range(len(inputs)):
        token_routes = [r for r in routes if r.token == token]
        mean = sum(r.weight * dg[token][r.expert] for r in token_routes)
        for r in token_routes:
            dz[token][r.expert] = r.weight * (dg[token][r.expert] - mean)
    return dx, dw, dz


def main():
    routes = route(LOGITS)
    print("Packed slot -> (expert, original token, gate)")
    for slot, item in enumerate(sorted(routes, key=lambda r: (r.expert, r.token))):
        print(slot, item.expert, item.token, round(item.weight, 6))
    print("Combined rows:", grouped_forward(INPUTS, EXPERTS, routes))
    kept, dropped = capacity_limit(routes, len(EXPERTS), 2)
    print("Capacity 2 drops:", [(r.token, r.expert) for r in dropped])
    print("After dropping, original gates:", grouped_forward(INPUTS, EXPERTS, kept))
    print("Arithmetic illustration only; these are not GPU timings.")


if __name__ == "__main__":
    main()
