# Foundations, shared content and reading-order review

Review date: September 16, 2026. Root review alongside three independent domain
reviews, integrated in an isolated worktree and synchronized with concurrent
illustration work.

## Paragraph and lesson review

Read the complete authored text of `content.ts`, `foundations-content.ts`,
`mathematics-content.ts`, `network-content.ts`,
`transformer-foundations-content.ts`, `textbook-content.ts`,
`systems-content.ts`, landing/course-guide/gallery copy and authoring guidance.
Training, hardware and inference portions of the shared files also received their
specialist review. The training reviewer read the entire glossary; all reviewers
read their domain's visual-catalog notes and numerical models. See their reports
for lesson-by-lesson tables and source checks.

| Lesson or page | Review and resulting change |
| --- | --- |
| Landing, course guide and gallery | Reviewed scope statements, links, descriptions and repeated illustration captions. Changed the gallery's misleading “attention without the matrix” title; the course guide now describes the actual first three chapters. Grouped navigation remains chronological. |
| `reading-from-zero` | Added a beginner reading contract: definitions, dependency order, diagrams versus measurements, optional code and focused routes. |
| `systems-mental-models`, `systems-scale-ladder`, `training-lifecycle` | Removed undefined memory acronyms from the opening; distinguished fitting training targets from evaluating held-out tokens; expanded SFT/RL vocabulary and avoided a mandatory SFT→DPO→RL sequence. |
| `what-a-model-is` | Reviewed probability versus truth, weights/checkpoint/engine/interface and generated-token loop. Replaced undefined operation names with plain descriptions and changed “sampling rule” to the general decoding rule. |
| `tokens-and-bytes` | Defined bit→byte→token and vector/matrix before the embedding shape. Explained IDs versus learned coordinates; kept UTF-8, tokenizer version and parameter-byte assumptions explicit. |
| `learning-practice` | Checked all gates/links; removed circular placement of the weight-update prerequisite and made the serving checkpoint a post-project assessment. |
| `numbers-and-functions` | Added variables, fractions, signs, exponents, square roots, function composition, weights/bias, update notation, exp/ln, scientific notation and units with worked arithmetic. |
| `math-reading-kit` | Moved from the early overview into mathematics; put scalar/vector/matrix definitions before axis notation. Checked both dot products, stored-parameter versus activation counts, row/column conventions and unit conversions. |
| `indices-and-reductions` | Read every axis/broadcasting example; independently checked feature means, token means, scalar mean and semantic-broadcast warning. |
| `vectors-and-linear-maps` | Checked norm, angle, basis images, rank bound, LoRA parameter count and transpose-versus-inverse distinction; explained cosine at first use. |
| `conditional-sequences` | Checked conditional probability, independence, chain factorization, greedy counterexample and posterior 6/11. Corrected fixed-length wording so it does not imply conditioning a variable-length stopping model without renormalization. |
| `likelihood-and-information` | Added a basic softmax derivation before numerical stability; checked total/mean likelihood, perplexity, entropy, cross-entropy, KL and support conditions. Removed wording that referred to a training example as already completed. |
| `chain-rule-and-sharing` | Checked finite-change expansion, shared-input gradient 7, projection derivatives, bias sum and cancellation example. |
| `expectation-and-batches` | Moved after the derivative definition. Checked weighted mean/variance, standard error, unbiased-gradient conditions, shared-state accumulation and covariance caveats. |
| `numerical-reasoning` | Checked FP32 nonassociativity, stable softmax, all-masked rows, finite differences and absolute/relative tolerance. |
| Tensor overview, `probability-and-loss` | Removed queries/head reshaping before attention was defined. Checked shifted “cat newline” byte targets, three score rows, loss reductions, stable gradient and perplexity. |
| `autodiff`, `first-weight-update` | Moved applied learning after mathematics. Checked scalar 4→2.6 update and loss 0.72, full six-weight projection, finite differences and saved-forward lifetimes. Removed “exact” from finite browser arithmetic. |
| `learning-from-examples` | Added two-example loss 5→2.8125, shared gradient −5 and weight 0→0.5, initialization, steps/epochs and generalization. |
| `network-map`, `network-embeddings` | Read all dimensions, parameter/activation distinctions and every architecture arrow. The map is a reference to components then derived in order. |
| `attention-by-hand`, `position-rotations` | Defined query/key/value/head, derived the variance-based √d scale, checked [¼,¾]→5, masks, cache positions, pair rotation and relative-angle identity. |
| `network-residual`, `normalization-and-residual-math` | Checked pre-norm branch placement, unchanged bypass, RMS versus LayerNorm example, denominator derivatives, learned-gain sum and residual identity contribution. |
| `network-attention`, `network-feedforward`, `network-output` | Checked all head/group/cache shapes and diagrams, fixed-score masking model, gate arithmetic and sign, three-matrix counts, logits/probabilities and tying. Defined sigmoid and removed the claim that generation requires random sampling. |
| `decoder-block`, `attention-and-mlp`, `attention-primitives`, `tensor-head-layout` | Moved complete-block and code summaries after component explanations. Corrected reshape versus transpose. Replaced a finite mask sentinel with −∞ and used FP32 score/value arithmetic under explicit full-sequence, finite-input and no-padding assumptions. |
| `transformer-parameter-budget` | Checked all per-block/whole-model counts, tied versus untied weights, BF16 payloads, dense attention FLOPs and three-matmul training approximation. |
| `attention-cost-models`, original attention controls | Added growth notation and retained-state definitions. Fixed W=4 under changing T, bounded the fixed sparse rule to four addressed keys, and replaced a diagonal “no history” recurrence picture with a hand-drawn state chain. |
| `flashattention` | Checked running max/denominator/numerator, rescaling and final weighted sum; kept full pairwise work and numerical precision distinct from intermediate IO. |
| `attention-research-cases` | Moved dated GLM/Kimi comparisons after the mechanism chapters. Fixed KDA correction's dependence on previous state and removed unconditional overwrite language. Specialist rechecked modern model sources. |
| Shared machine/rack/LPU material | Defined SM/HBM, separated shared memory from L1 cache, corrected “immediate operands,” qualified CPU core-count generalization and separated activation/routing/storage in the LPU timetable. Hardware specialist checked specifications and drawings. |
| Shared training/data/post-training | Defined packing/worker/microbatch, qualified gradient scaling versus learning-rate equivalence, noted integer target-count width, defined DPO symbols, corrected empty local/global batch wording and LoRA initialization. Training specialist checked full objectives and snippets. |
| Shared inference/serving/performance/projects | Qualified prefill bottlenecks and timing; distinguished the pending token from KV; made all operands FP32 in the roofline byte calculation; stated terminal-versus-last-token TPOT assumptions. Removed unrelated employer/job-opening context. Specialist reviewed remaining code and numerical examples. |
| Glossary and sources | Reviewed source-discovery assembly and link identity; glossary specialist corrected scoped terms and added missing foundations. Paper/vendor references remain versioned rather than implied measurements. |

## Diagram inspection

Read every branch in `network-diagrams.ts`, `network-labs.ts`, `network-math.ts`,
`foundations-math.ts`, `lesson-math.ts`, `lesson-subject-diagrams.ts` and
`lesson-diagram-renderer.ts`. Read the probability, gradient and runtime notebook
schematics and the newly pulled mathematical figure primitives. Verified all
matrix-product entries and labels, causal masks, shared-gradient arrows,
normalization arithmetic, channel axes and reference counts. Existing example
bounds are preserved; finite-number helpers are not claimed robust for arbitrary
extreme inputs outside their controls.

Specialists checked the complete hardware/portable/CPU and inference/training
catalogs. Integrated corrections align token/rank examples, buffer lifetimes,
unsigned promotions, the two-stage MAC, WMMA scope and the real capstone HTTP
behavior. New network box outlines and recurrent-state drawings use a pen-like
style while numerical bar lengths, coordinates and matrix cells retain exact
meaning. Repeated conceptual illustration plates were separately checked against
their captions; their corrections are recorded in the domain reports.

## Primary references inspected

- [Transformer full text](https://arxiv.org/html/1706.03762v7): scaling argument,
  causal shift, attention roles, output softmax and original architecture scope.
- [RoFormer full text](https://arxiv.org/html/2104.09864v5): pair rotations and
  relative-position identity.
- [LoRA full text](https://arxiv.org/html/2106.09685v2): nonzero/random one-factor
  initialization, zero other factor and low-rank update scope.
- [Unicode 17 chapter 3](https://www.unicode.org/versions/Unicode17.0.0/core-spec/chapter-3/):
  bytes, encoding and UTF-8 scope.
- [Deep Learning probability](https://www.deeplearningbook.org/contents/prob.html)
  and [numerical computation](https://www.deeplearningbook.org/contents/numerical.html):
  distributions, log losses and finite precision.
- [NumPy broadcasting](https://numpy.org/doc/stable/user/basics.broadcasting.html)
  and [TensorFlow softmax](https://www.tensorflow.org/api_docs/python/tf/nn/softmax):
  axis/broadcasting and softmax contracts.

Full textbook source checks and framework/hardware evidence appear in the other
three reports. URLs establish only the claims at their stated scope, not local
reproduction of vendor or paper measurements.
