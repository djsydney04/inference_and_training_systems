# First-principles textbook review

Reviewed September 16, 2026 (local date). This pass covers the complete assembled
34-chapter book, its opening pages, worked examples, glossary, source ledger and
diagram catalogs. Reviews read the authored paragraphs and captions, traced the
interactive models and equations, and checked technical claims against primary
papers or official documentation. The domain reports list individual lessons and
their evidence rather than treating a passing build as a content review.

- [Foundations and reading sequence](foundations-first-principles.md)
- [Hardware, circuits, kernels and performance](hardware-first-principles.md)
- [Training, evaluation, frameworks and glossary](training-first-principles.md)
- [Inference, serving and research mechanisms](inference-first-principles.md)

## Resulting progression

1. Text, token IDs and the distinction between a model and its execution.
2. Ordinary numbers and functions, arrays, probability, logarithms, derivatives,
   sample averages and finite precision.
3. A next-token loss, a scalar gradient, a six-weight update and fitting a shared
   rule across examples.
4. Embeddings, attention by hand, positions, normalization, feed-forward layers,
   output scores, the complete Transformer and its resource budget.
5. C and memory; logic; CPU and GPU execution; runtime ownership; resources;
   circuit implementation; links and collectives.
6. Attention implementations; data and evaluation; optimization; distributed
   training; generation and decoding; post-training.
7. Alternative accelerators; kernels and profiling; loaded serving; research
   mechanisms; framework choices, a runnable small model and projects.

All original lesson IDs are preserved. Focused routes include prerequisite
chapters. The course guide, sidebar, chapter selector and full-book navigation
must agree on the same order; contiguous curriculum parts prevent subject
categories from silently rearranging the numbered route.

## Review limits

This is a source and executable-example audit, not proof that every possible
model, device or scientific claim is correct. Paper speedups and vendor
specifications remain attributed, dated results. Tiny browser/CPU arithmetic
checks do not reproduce full GPU kernels, distributed training, cloud load tests,
FPGA placement or silicon performance. Installed-framework paths were reviewed
but not rerun where their dependencies were unavailable; prior execution evidence
retains its original version and date.

The assembled DOM inventory includes repeated captions, notes, source entries and
automatically generated figures. Its paragraph count is not a count of distinct
scientific claims. Source inspection, mathematical checks, interactive browser
checks and screenshot inspection are separate forms of evidence.

## Assembled coverage

The inventory below was collected from the actual reader after assembly. Each
chapter is covered by one or more of the linked domain reports. Internal fragment
links resolved and authored/generated IDs were unique at this check.

| Chapter | Sections | Rendered figures |
| --- | ---: | ---: |
| `orientation` | 4 | 4 |
| `first-principles` | 3 | 4 |
| `mathematical-foundations` | 9 | 3 |
| `tensors` | 4 | 6 |
| `transformer` | 14 | 13 |
| `programming` | 7 | 9 |
| `digital-logic` | 9 | 10 |
| `cpu` | 14 | 18 |
| `machine` | 3 | 4 |
| `runtime-foundations` | 4 | 1 |
| `gpu-resources` | 3 | 4 |
| `fpga-asic` | 10 | 11 |
| `rack` | 5 | 9 |
| `collectives` | 3 | 4 |
| `attention` | 2 | 1 |
| `data` | 6 | 4 |
| `optimization` | 4 | 5 |
| `training` | 3 | 5 |
| `parallel-training` | 9 | 9 |
| `inference` | 7 | 8 |
| `decoding` | 8 | 8 |
| `post-training` | 6 | 7 |
| `lpu` | 3 | 4 |
| `accelerator-atlas` | 8 | 9 |
| `cuda-kernels` | 13 | 14 |
| `portable-kernels` | 5 | 6 |
| `performance` | 5 | 6 |
| `serving-lab` | 10 | 11 |
| `frontier` | 12 | 12 |
| `frameworks` | 14 | 9 |
| `end-to-end` | 8 | 10 |
| `projects` | 6 | 7 |
| `glossary` | 0 | 0 |
| `sources` | 0 | 0 |

Total: 34 chapters, 221 sections and 235 rendered figures.
