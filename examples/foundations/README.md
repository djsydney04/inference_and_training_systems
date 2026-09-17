# Reconstruct the worked examples

Run with Python 3.10 or newer; no packages or hardware downloads are required:

    python3 examples/foundations/check_worked_examples.py

The ten checks cover the probability tree, moments and minibatch estimates,
likelihood/entropy, matrix derivatives, RMSNorm input and gain derivatives,
rotary positions, model/cache payload counts, a two-buffer schedule, evaluation
uncertainty, and binary32 rounding.

Several checks use a different calculation from the lesson formula: matrix and
normalization derivatives are compared with perturbed forward evaluations; the
pipeline is scheduled from individual engine and buffer availability; paired
uncertainty is computed from the actual list of 100 differences.

Read the corresponding lessons first, predict a result, then change one input:

- Give the probability tree a different second-token distribution. When does a
  greedy first choice disagree with the most probable complete path?
- Change one matrix input or weight. Recalculate both the forward result and all
  affected derivatives before checking finite differences.
- Change the normalization epsilon. Does the gradient remain perpendicular to
  the input? Explain the numerator and denominator paths.
- Add the same offset to both RoPE positions, then offset only one. Which dot
  product should remain invariant?
- Make transfers slower than compute. Reconstruct the first four completion
  times and identify the throughput limit.
- Keep the accuracy difference fixed while changing the number of paired
  disagreements. What happens to the estimated standard error?

These are small arithmetic contracts with declared floating-point tolerances.
They do not measure language ability, real CPU/GPU concurrency, transport
bandwidth or serving latency. The statistical examples assume the sampling units
described in the lessons; real evaluation requires its own dataset and protocol.
