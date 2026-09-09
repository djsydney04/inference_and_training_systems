# Five-hour textbook development pass

Requested: deepen training methods, inference methods, and hardware; break dense
sections into clearer lessons; keep iterating with verified checkpoints.

Session start: 2026-09-09 00:47:20 UTC (September 8, 5:47 pm Pacific).
Five-hour boundary: 2026-09-09 05:47:20 UTC (September 8, 10:47 pm Pacific).
Starting commit: `b4e4029`.

## Working sequence

1. Audit the curriculum; split overloaded chapters while preserving old anchors.
2. Derive optimizer, clipping, mixed-precision and activation-memory contracts;
   add numerical examples and a runnable TensorFlow comparison.
3. Explain sampling, exact speculative decoding and serving scheduling with
   stateful diagrams and distribution-equivalence tests.
4. Deepen SM resource limits, roofline reasoning, collectives and rack topology;
   distinguish analytical models from measured hardware behavior.
5. Expand post-training methods and connect objectives to rollout, evaluation,
   data provenance and failure modes.
6. Review sources, code, accessibility, navigation and visual consistency;
   update verification and push scoped checkpoints throughout the session.

Each iteration must produce an explanatory or verification improvement. The
timebox is not a claim that the whole textbook is complete. Do not invent GPU
measurements, provision paid compute, copy whole external sites, or silently
advance source-check dates.

## Evidence log

- Initial worktree is clean and matches the previous pushed checkpoint.
- The existing product goal is blocked and cannot be replaced while unfinished;
  this file records the bounded session without falsifying that goal's status.
- Iteration 1: added the optimization chapter (17 total), a stateful optimizer
  gallery lab (12 entries total), five Node tests and four TensorFlow numerical
  contract tests. Build passes. Desktop and 320-pixel screenshots inspected;
  first AdamW update is (1.92, 0.92), loss 6.9216. CPU recomputation gradients
  match exactly in the tested example; an infinite scaled gradient skips the
  update without changing the inner optimizer state.
