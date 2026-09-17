# Reconstruct the worked examples

Run with Python 3.10 or newer; no packages or hardware downloads are required:

    python3 examples/foundations/check_worked_examples.py

The eighteen checks cover vectors, every entry of a rectangular matrix product,
transpose and order of multiplication, basis images and rank-one factors,
reductions and broadcasting, scaled attention and masking, the probability tree,
moments and minibatch estimates, likelihood/entropy, derivatives and a complete
weight update, RMSNorm input and gain derivatives, rotary positions, model/cache
payload counts, a two-buffer schedule, evaluation uncertainty, and binary32 rounding.

Several checks use a different calculation from the lesson formula: matrix and
normalization derivatives are compared with perturbed forward evaluations; the
pipeline is scheduled from individual engine and buffer availability; paired
uncertainty is computed from the actual list of 100 differences. The minibatch
variance check enumerates all possible small batches, including a correlated
counterexample, rather than just substituting into the variance formula.

If linear algebra is new, begin at the chapter's `#numbers-and-vectors` lesson.
Work through `#dot-products-by-hand` and `#matrix-products-by-hand` before using
the compact equations. Each pen-style drawing also has its calculation in text.

The new mathematics examples use zero-based array indices and explicit row
vectors for matrix products. The derivatives compare perturbed forward losses
against the lesson answers to seven decimal places by default (eight for the
existing matrix and RMSNorm checks). Drawings round for readability; checks use
full precision. Neither rounded labels nor passing small checks establish the
accuracy of an arbitrary large model.

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
- Reverse the order of the two matrices. Is the reverse product defined, and
  does it even have the same shape?
- Replace the attention scores with equal numbers, then allow only one key.
  Calculate the new value mixture before running a check.
- For the final weight-update exercise, change the target from index 1 to 0.
  Which gradient signs reverse, and which weight entries move the most?

These are small arithmetic contracts with declared floating-point tolerances.
They do not measure language ability, real CPU/GPU concurrency, transport
bandwidth or serving latency. The statistical examples assume the sampling units
described in the lessons; real evaluation requires its own dataset and protocol.
