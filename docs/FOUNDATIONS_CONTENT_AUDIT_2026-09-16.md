# Foundations, derivations and reading flow

This pass adds 17 sections and approximately 10,000 words across two new chapters
and the existing Transformer and training-data chapters. Three original SVG
drawings use slightly irregular pen strokes, readable labels and restrained blue
annotations. They stay still; their full explanations and equations are in the
surrounding text.

## Gaps addressed

| Gap in the preceding reading sequence | New sections |
| --- | --- |
| Tensor notation assumed reductions and broadcasting were already understood | `indices-and-reductions` |
| Matrix shapes preceded geometric meaning and the rank constraint behind adapters | `vectors-and-linear-maps` |
| A single token's softmax jumped to sequences and sampled minibatches | `conditional-sequences`, `expectation-and-batches` |
| Cross-entropy, likelihood and KL appeared without their relationship | `likelihood-and-information` |
| Backward formulas needed a derivation of shared contributions and finite arithmetic | `chain-rule-and-sharing`, `numerical-reasoning` |
| Processor descriptions jumped to kernels without operating-system and runtime foundations | `processes-and-threads`, `virtual-memory-and-locality`, `device-transfer-lifetimes`, `latency-throughput-and-scaling` |
| Position and normalization were compressed into optional summaries | `position-rotations`, `normalization-and-residual-math` |
| Model size, cached state and arithmetic needed one connected ledger | `transformer-parameter-budget` |
| Experimental advice assumed familiarity with generalization, uncertainty and calibration | `evaluation-generalization`, `evaluation-uncertainty`, `evaluation-calibration` |

The mathematical chapter follows the first-principles overview and precedes
tensors. The runtime chapter follows CPUs and GPUs, builds on C/memory, and is a
prerequisite for GPU resources and inference. Focused paths expand these
prerequisites automatically. Evaluation sections precede the ablation lesson;
the three Transformer sections follow their corresponding component explanations.

The tensor-gradient lesson now links to the earlier next-token derivation and
uses the formerly repeated explanation to teach saved forward values and update
boundaries. Eleven glossary entries connect new terminology to worked contexts;
RoPE also links to its full derivation. A duplicate Autodiff definition was
consolidated into the existing, more general entry.

## Numerical evidence

Run `python3 examples/foundations/check_worked_examples.py` with Python 3.10+ and
the standard library. All ten checks passed locally. They include all-coordinate
finite differences for a matrix projection; input and gain derivatives for
RMSNorm at three epsilon values; several RoPE frequencies and offsets; and an
independently scheduled two-buffer pipeline with both compute and copy
bottlenecks. Probability, entropy, evaluation uncertainty, parameter/cache
accounting and binary32 rounding are checked as well.

These checks establish the stated small arithmetic examples. Pipeline durations
are model assumptions, statistical intervals depend on the stated sampling
units, and no device throughput or trained-model quality is inferred from them.
The companion README supplies prediction-first exercises for changing those
assumptions.

## Reader and integration evidence

- TypeScript and the production build passed, including release/content-note
  validation. The build retains the existing large-bundle advisory.
- All 181 Node tests passed after integration with concurrent framework,
  hardware-drawing and selective-motion changes.
- All 24 UI checks passed at 1440, 768, 390 and 320 pixel viewport widths.
- All 20 desktop/mobile playback checks passed, including the static-artwork
  audit for the three new notebook figures.
- The production preview returned HTTP 200. Direct DOM inspection found 33
  chapters, all new sections under the intended parents, no duplicate IDs and
  no unresolved internal links in the new content. Figure numbers were assigned
  by the existing reader, with no playback attached to the notebook drawings.
- Desktop screenshots of the probability tree, gradient branches and transfer
  pipeline were inspected. Mobile screenshots confirmed readable prose and
  locally scrollable figures. Keyboard inspection covered horizontal scrolling,
  opening a worked answer, figure expansion and Escape restoration.

Screenshots and temporary Playwright configuration are in the ignored
`output/playwright/` directory of the isolated content worktree. They are local
review evidence, not published assets.

Primary references sit beside the lessons and enter the source ledger. They
include author textbooks, OSTEP, original Transformer/RoPE/normalization papers,
CUDA memory documentation and primary evaluation papers. Existing framework
lessons from the concurrent work were linked instead of reproduced.
