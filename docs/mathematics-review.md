# Mathematics chapter review — September 16, 2026

The chapter now starts with ordinary arithmetic and assumes no previous linear
algebra or calculus. It contains fourteen lessons, twelve original pen-style
worked drawings (ten new), and 24 questions with worked answers. All existing
lesson anchors remain available. Derivatives precede minibatch gradients.

## Mathematical review

The original numeric examples were largely correct. The important changes are
explicit assumptions, consistent conventions, and missing intermediate steps:

| Topic | Clarification or correction |
| --- | --- |
| Matrix products | Calculate all four entries of a rectangular product. Distinguish dot products, elementwise multiplication, transpose, and inverse. State the row-vector convention and explain PyTorch's stored transpose. |
| Shapes and rank | Distinguish a vector's coordinate count, an array's number of axes, and a matrix's independent output directions. Name the reduction axis and keep its singleton dimension for broadcasting. |
| Linear maps | Explain basis, span, independence, affine bias, and why a learned “projection” is not necessarily an idempotent geometric projection. |
| Low-rank updates | Rank is bounded by `min(D,r,F)`. Storing the factors saves parameters only if `r(D+F) < DF`. The base weights remain stored. |
| Attention | Divide by the square root of key width, normalize across permitted keys for each query, and mix every value coordinate. Distinguish attention weights from vocabulary probabilities. Keep the variance rationale optional until variance is introduced. |
| Sequence probabilities | Describe the tree as a process with exactly two draws, rather than implying ordinary autoregressive probabilities are unchanged by conditioning a variable-length model on its final length. |
| Entropy and KL | Explicitly omit zero-target-probability contributions, including shared zero coordinates. Positive target mass at zero model probability gives infinite cross-entropy and KL. Replace a “top choice is right” heading whose example actually had a tie. |
| Perplexity | Carry full precision into exponentiation; the displayed intermediate mean is rounded. Explain geometric mean and why perplexity is not accuracy. |
| Backward convention | Define the Jacobian's orientation: column sensitivities use `Jᵀg`; row sensitivities use `gᵀJ`. Add every shared path, reduce broadcast axes, and apply mean-loss scaling once. |
| Gradient estimates | Replace ambiguous “second derivative” wording with the other example's gradient. Separate unbiased estimates, independent-sample variance reduction, correlated duplicates, and finite-population sampling. |
| Numerical checks | Distinguish real-number identities from floating-point evaluation. Work a centered difference numerically and retain the caveats for masked rows and nondifferentiable points. |

## Independent arithmetic

Run `python3 examples/foundations/check_worked_examples.py`: eighteen test groups
pass, including the eight added for this expansion. These use Python's standard
library and require no model weights or accelerators.

New checks cover vector operations, all matrix entries, transpose, matrix order,
identity/inverse, basis images, rank-one minors, reductions, centering, bias,
attention, masks, derivative limits, composition, and a complete softmax weight
update. Derivatives are compared against independently perturbed forward losses.
Batch variance is checked by enumerating all small batches, with duplicated
samples as a counterexample. The existing probability, entropy, normalization,
rotation, storage, scheduling, evaluation, and binary32 checks also pass.

Representative results:

- Matrix product: rows `[-3,9]` and `[18,11]`.
- Attention: weights approximately `[0.1956,0.8044]`, value mixture
  `[0.3911,3.2177]`; a single allowed first key gives `[2,0]`.
- Matrix backward: `dX=[7,0]`, `dW=[[2,4],[-1,-2]]`, `db=[1,2]`.
- Complete update exercise: scores `[1,1]` become `[0.75,1.25]`, target
  probability rises from `0.5` to `0.622459…`, and loss falls from `ln 2` to
  `0.474077…`.

## References checked

Definitions and conventions were checked against the authors' texts, the
original attention paper, and official array/framework documentation. The
teaching prose and small drawings are original.

- [Deep Learning, chapter 2](https://www.deeplearningbook.org/contents/linear_algebra.html): vector/matrix operations, transpose, inverse and rank.
- [Deep Learning, chapter 3](https://www.deeplearningbook.org/contents/prob.html): conditional probability, entropy and KL.
- [Deep Learning, chapter 4](https://www.deeplearningbook.org/contents/numerical.html): numerical stability and softmax.
- [NumPy broadcasting](https://numpy.org/doc/stable/user/basics.broadcasting.html): trailing-axis compatibility and singleton dimensions.
- [PyTorch Linear](https://docs.pytorch.org/docs/2.8/generated/torch.nn.Linear.html): stored weight orientation.
- [Dive into Deep Learning: calculus](https://d2l.ai/chapter_preliminaries/calculus.html): derivatives, partial derivatives and gradients.
- [Stanford CS231n derivative notes](https://cs231n.stanford.edu/handouts/derivatives.pdf): Jacobians and backward chain rules.
- [Attention Is All You Need, section 3.2.1](https://arxiv.org/html/1706.03762v7#S3.SS2.SSS1): score scaling and value mixing.
- [LoRA](https://arxiv.org/abs/2106.09685): factorized trainable updates to retained base weights.

## Site validation

- `npm test`: 198 passing tests after integration with the newer main branch.
- `npm run build`: TypeScript, release consistency and Vite production build pass.
- Existing chapter layout checks pass at 320, 390, 768 and 1440 pixels.
- Local HTTP preview returns 200. Screenshot review covers all twelve drawings;
  the matrix column guide was moved beside the numbers so it cannot cross them.
- Browser inspection confirms fourteen lessons, twelve figures, 24 questions,
  no overlapping or out-of-bounds SVG labels, no duplicate IDs, and no broken
  internal chapter links.
- Keyboard answer reveals, expanded-figure opening/Escape/restoration, and
  horizontal keyboard scrolling of figures at 390 and 320 pixels pass.
- Review screenshots are saved under `output/playwright/mathematics-*`.

These checks verify the declared examples and local rendering. They are not a
formal proof of the entire book or validation of trained-model behavior.

## Integration with the newer main branch

The merge retains the new numbers/functions lesson and the relocated tensor-shape
lesson, bringing the integrated mathematics chapter to fourteen lessons and 24
worked questions. It also retains the move of applied loss and weight-update
lessons into the subsequent tensors chapter. All mathematics additions and
corrections from this review remain in the integrated reading sequence.

The integrated version passes all 198 Node tests, the eighteen Python numerical
checks, the production build, and the four existing chapter layout checks.
