# Follow a token through mixture-of-experts execution

Run from the repository root with **Python 3.10 or newer**. No packages, models,
network service or GPU are needed.

```sh
python3 examples/moe/moe_reference.py
python3 -m unittest discover -s examples/moe -p 'test_*.py' -v
```

Read `moe_reference.py` in this order: `route`, `grouped_forward`,
`capacity_limit`, then `backward`. The four token rows have two channels. Three
linear experts replace real feed-forward networks so every value fits on paper.
For each token the router selects two experts and renormalizes their softmax
probabilities. This is the example's explicit routing policy, not a universal MoE
rule. Expert matrices use the row-vector convention `x @ W`.

## Expected arithmetic

Expert assignment counts are `[2, 4, 2]`. Packed token IDs are
`[0, 3, 0, 1, 2, 3, 1, 2]`: a repeated token ID represents a different expert
assignment. Weighted inverse combination returns:

```text
t0  [4/3, 2]
t1  [23/8, 11/8]
t2  [1/3, -5/9]
t3  [13/9, -1]
```

Capacity two admits assignments in token order and drops `(t2, e1)` and
`(t3, e1)`. Keeping the original gates and renormalizing surviving gates produce
different answers. Neither preserves the dropless function. A token with no
survivors receives a zero **expert contribution**; this example does not add a
Transformer residual connection.

## What the five tests establish

- Forward values match the fractions above and an independent dense reference
  that evaluates every expert before masking.
- All 24 token permutations and reversed dispatch order preserve token identity.
- Capacity overflow, survivor renormalization and completely dropped tokens are
  explicit, including under skew.
- Input, expert-weight and router-logit derivatives match centered finite
  differences of the independent dense reference, away from top-k boundaries.
- Selected normalization at top-1 makes the gate constant and removes its task
  gradient. A full-softmax top-1 gate is a different computation.

Logits are independent input variables in this program. For a learned router
`Z = X R`, add `dX_router = dZ R.T` and `dR = X.T dZ`. The reference has no
autograd engine, optimizer, nonlinear expert MLP, load-balancing training loop,
GPU grouped GEMM, distributed collectives or performance measurement. Finite
differences do not differentiate discrete changes in selected expert IDs.

## Extend it deliberately

Replace each linear expert by a two-layer MLP and derive its backward pass.
Retain the route map. Then simulate per-rank send counts and varying token order;
do not reroute to an arbitrary expert merely to make buffers balanced. A real
distributed port also needs split-size exchange, offsets, synchronization,
capacity policy, deterministic identity and numerical-tolerance checks.

Primary sources checked September 16, 2026:

- [Switch Transformers, JMLR 2022](https://www.jmlr.org/papers/v23/21-0998.html):
  top-1 gating, capacity and differentiable auxiliary balancing loss.
- [GShard v1, June 2020](https://arxiv.org/abs/2006.16668v1):
  top-2 conditional computation and distributed sharding.
- [MegaBlocks v1, November 2022](https://arxiv.org/abs/2211.15841v1):
  block-sparse dropless expert computation.
- [DeepSeek-V3 v2, February 2025](https://arxiv.org/html/2412.19437v2#S2.SS1.SSS2):
  sigmoid affinities, selection biases, normalized gates and sequence balancing.

These are sources for the mechanisms. The numerical example is original and
does not reproduce their training results or deployment performance.
