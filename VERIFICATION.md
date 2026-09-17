# Verification record — textbook expansion

## September 16, 2026 — automatic diagram walkthroughs

154 diagram surfaces now have automatic playback, including all 88 lesson
schematics, numerical examples, chip routes and system views. Controls provide
pause, reading pace, reduced-motion opt-in and persistent global preferences.
Wide diagrams bring the selected operation into view horizontally.

All 96 Node tests and the TypeScript/Vite production build pass. The full
desktop/mobile playback run passed 18 browser checks; two more passed for
nested-diagram pause and live-region restoration. The final nested fix also
passed Node tests and a build in a clean checkout. Coverage advances every
adapter 110 times, checks input validity, and rejects missing walkthroughs.
Mobile pop-outs and active-step framing were visually inspected at 390 × 844.
See [playback behavior and validation](docs/DIAGRAM_PLAYBACK.md).

Playback uses teaching pace and existing calculation handlers. Animated
connectors do not represent measured device time; source-image references
remain static. No new accelerator execution claim follows from these checks.

## September 16, 2026 — execution, numerical error and serving progress

Added fifteen lessons: four on sharded state/lifetimes/updates/recovery, four on
quantization and calibration, three on MoE routing/ownership/derivatives, and four
on serving iteration/admission/arrivals/measurement. Each addition has numerical
diagrams, worked checks, primary sources and an executable CPU companion. The
reader retains the concurrent course-guide and Programming-group changes from
GitHub `main` through `0456713`.

**135 Node tests and 23 new standard-library Python checks pass.** The new Node
tests comprise 8 serving, 9 sharding, 7 quantization and 7 MoE checks. CPU evidence
includes complete AdamW updates and checkpoint redistribution, real INT4 packing,
independent dense MoE outputs/finite differences, and trace accounting. A separate
cross-review checked 2,520 MoE finite-difference coordinates (maximum discrepancy
2.56e-11), 576 capacity configurations and 350 small conservative-admission cases.

TypeScript and production build pass. The existing bundle advisory remains:
main JavaScript is approximately 1,075 kB minified / 359 kB gzip. Production DOM:
29 chapters, 158 sections, 170 figures, 71 code listings, 109 checks, 219 source
entries and 34 deep dives. The totals include the incoming system-buildout lesson.
All 31 pages pass at 1440, 1280, 820, 390 and 320 pixels: **155 checks, no document
overflow**, duplicate IDs, missing internal targets, numbering errors or title
mismatches. New controls, keyboard operation and figure popouts were checked
separately. Scoped research dates survive generated section labels.

The system-buildout inspector now uses an unindexed component label for changing
selections, so the search index cannot retain a heading removed on the next click.
The scheduler table distinguishes historical processed positions from live block
reservations. Older TPOT prose explicitly names its terminal-time convention and
links to token-receipt measurements.

See [the execution-gap audit](docs/EXECUTION_GAPS_AUDIT_2026-09-16.md) for sources,
counterexamples and limits. CPU references do not establish real collective
transport, GPU kernels, model quality, production capacity or distributed recovery.

## September 16, 2026 — speculative inference and asynchronous training

Added eleven lessons within decoding, serving and post-training: modern draft
models and their training, packed tree attention, acceptance/cost depth,
prefill/decode separation, cache ownership, handoff latency, fleet capacity,
rollout records, asynchronous scheduling and policy-probability correction.
Primary sources are dated or pinned beside the claims. Ten new glossary entries
and revised latency definitions keep the terminology consistent.

**103 Node tests, 8 inference Python tests and 6 rollout Python tests pass.**
TypeScript and production build pass. The tests check mathematical contracts
and CPU control flow; no GPU serving or training performance is claimed. The
existing bundle advisory remains (main JavaScript about 908 kB minified).

The production reader has 29 chapters, 142 sections, 156 figures, 62 code listings,
94 checks, 199 source entries and 22 deep dives. All 31 pages at 1440, 1280, 820,
390 and 320 pixels pass: 155 checks with no document overflow. There are no
numbering errors, mismatched chapter titles, duplicate IDs or broken internal
targets. New interactive controls and mobile layouts were checked separately.

This includes the other agent's schematics and figure popouts from GitHub `main`
through `b4b8801`. Work is isolated on `codex/atlas-learning-clarity`; the shared
checkout was not edited or stashed. The detailed source, calculation and test
record is [the inference/training audit](docs/INFERENCE_TRAINING_AUDIT_2026-09-16.md).

## September 16, 2026 — chip and switch anatomy

Added five detailed component views alongside the GPU, LPU and rack cutaways:
43 selectable parts, nine routes, nine new 3D component types, and a switch
contention experiment. All 92 Node tests and the production build pass.
Browser checks cover every component and route, keyboard controls, popouts,
hidden-view deep links and 1280/390/320-pixel layouts. See
[the diagram record](docs/CHIP_DIAGRAMS.md) for scope, sources and evidence limits.

## September 16, 2026 — programming across accelerators

CUDA and profiling moved into Programming, with a separate kernel-programming
path. Five new lessons compare an operation on H100, AMD MI300X, TPU v5p and
Trainium2. See [the implementation and evidence record](docs/PORTABLE_KERNELS.md).

The clean `b8d5cd3` snapshot passed all 90 tests and its production build. The
C++17 CPU companion passed all five numerical cases under AddressSanitizer and
UndefinedBehaviorSanitizer; maximum absolute error was about 3.76e-6. Browser
checks covered backend and shape changes, tile edges, keyboard inspection,
pop-outs, lesson navigation and 320/390px layouts.

GPU compilation/execution and actual TPU/Trainium runs remain unverified. The
CUDA/HIP companion is a scalar FP32 correctness baseline; the browser illustrates
separate BF16 tensor-unit pipelines. TPU and NKI listings are labeled pseudocode.

## September 16, 2026 — simpler reading flow and missing steps

Replaced the two sidebar modes and second fixed navigation bar with one chapter
picker and one short outline. Reading-path settings remain available in a
disclosure and still drive pagination. Canonical titles and introductions now
use plain language; source-audit dates remain visible in the hardware comparison
and frontier chapters. Detailed subsections are searchable, and direct links
open their containing disclosures before scrolling.

Six existing lessons gained concrete transitions: tensor axes and trainable
matrices; shifted next-token targets; CUDA thread ownership; clocked RTL updates;
training/evaluation/generation modes; and per-user versus aggregate serving speed.
Core explanations and examples remain visible, with eight optional deep dives.

Executed numerical checks against the actual PyTorch companion verify the new
matrix, target-shift, logit-shape and generation-call examples. Icarus simulates
the exact two-register example and its published edge table. CUDA ownership and
serving arithmetic were checked separately; no GPU performance measurement is
claimed. The companion algorithms were not changed in this pass.

`npm test`: **80 passed**. TypeScript and production build pass. The existing
bundle-size advisory remains (main JavaScript approximately 711 kB minified).
See `docs/CLARITY_AUDIT_2026-09-16.md` for the addressed learning gaps.

Final production DOM inventory: 29 chapters, 125 sections, 55 figures, 57 code
listings, 82 checks, 165 source entries and eight deep dives. All 31 pages pass at
1440, 1280, 820, 390 and 320 pixels (155 checks, zero horizontal overflow).
There are no numbering errors, mismatched chapter titles, duplicate IDs or broken
internal links. The removed toolbar and contents-mode tabs are absent from the DOM.

## September 14, 2026 — learning layout and labeling

Canonical titles now agree in chapter headings, navigation and search. The
sidebar has separate current-chapter and all-chapter views; the section navigator
supports explicit jumps and previous/next sections. Selected learning paths
persist locally and drive chapter pagination, with an explicit book-order
fallback for chapters outside the selected path.

The reader derives section, figure, code and check references after assembly,
including legacy alphabetic labels and moved content. Existing meaningful
orientation, Transformer, training-ledger and project sections are now indexed.
The resulting inventory is 29 chapters, 125 sections, 55 figures, 56 code listings,
76 checks and 157 source entries; the expanded inventory includes material that
previously had no generated reference.

- `npm test`: **80 passed**, including 13 new tests for learning paths, stable
  IDs, authored chapter/section inventory, numbering and legacy descriptors.
- `npm run build`: passes TypeScript and production bundling. The existing
  bundle-size advisory remains (main JavaScript approximately 687 kB minified).
- Independent browser checks: canonical headings; path-specific neighbors,
  persistence, off-path fallback and back/forward; section controls and five
  rapid mobile navigation cycles; code/check disclosures; mobile drawer inert
  state, Escape and focus return. No browser errors or warnings.
- Final production audit: all 31 pages (overview, gallery and 29 chapters) at
  1440, 1280, 820, 390 and 320 pixels: **155 page/width checks, zero overflow**.
  The complete DOM inventory has zero numbering errors, title mismatches,
  duplicate IDs or broken internal links. Final desktop and mobile screenshots
  are in `output/playwright/learning-layout-{desktop,mobile}.png`.
- Numbered references identify content; they do not imply completion, mastery,
  execution or hardware validation. No companion algorithm changed in this pass.

Authoring rules and the limits of source-inventory tests are documented in
`docs/AUTHORING.md`.

## September 14, 2026 — foundations through implementation

The expansion adds eight chapters, bringing the reader to 29 chapters, five
prerequisite-complete paths and 110 lesson sections after the custom-kernel
training bridge. The following records current local evidence; older entries
below retain their original dates.

Final DOM audit: 110 lessons, 47 figures and 157 source-ledger entries. A fresh
production load requests no remote assets: fonts are now served locally with
their included OFL licenses and provenance. The final kernel-training lesson
passes desktop, 390-pixel and 320-pixel layout checks.

### Executed checks

- `npm test`: **67 passed**. Numerical contracts include gradients, cache
  sizing, accelerator residency/transfer, tensor addresses, bank conflicts,
  reductions, fixed-point arithmetic, exhaustive 8-bit addition, timing slack,
  256 backpressure patterns and every systolic partial sum.
- `npm run build`: TypeScript and production Vite build pass. The full textbook
  and source listings produce a main JavaScript chunk above Vite's configured
  550 kB warning threshold; this is a non-failing size warning, not a verified
  startup-performance improvement.
- PyTorch 2.8.0 / native arm64 Python 3.12.11: **10 tests passed**, covering
  causal prefixes, full/chunked KV equivalence, greedy generation, invalid cache
  metadata, finite-difference backward, exact model/Adam/RNG resume, debugging
  overfit, token-weighted validation tails, real HTTP generation and overload.
- The custom RMSNorm autograd harness passes CPU derivative/contract checks and
  three complete AdamW update comparisons at each of widths 7, 33 and 257,
  including preceding-layer gradients, parameters and optimizer moments.
- The C17 tensor-storage exercise passes three reference cases under Address
  Sanitizer and Undefined Behavior Sanitizer with warnings treated as errors.
  The Triton companion passes Python syntax compilation.
- Icarus 13.0 passes four RTL testbenches: 65,536 adder pairs; 640 accepted MAC
  transactions, 638 consumed and two explicitly reset-flushed; 64 dot-product
  vectors including reset during accumulation; 1,620 systolic per-cycle checks.
- YoWASP Yosys 0.69 completes generic synthesis and structural checks for all
  four circuits. The same Icarus testbenches pass on the generated netlists.
  This is tested post-synthesis behavior, not a formal equivalence proof.

### Actual small-model run

The original byte-level teaching corpus trained for 100 CPU updates: loss moved
from 5.56298 at update 1 to 1.09964 at update 100. A separate CLI resume reached
update 125 with loss 0.78678. A new 69-target-byte evaluation fixture exercised
the validation CLI. These are mechanics checks on tiny constructed text,
not a claim about general language-model quality.

The CPU profiler compared identical greedy output IDs for a 30-byte prompt and
24 output bytes with one CPU thread and seven repetitions. Median whole-generation
times in that run were 9.458 ms without caching and 6.138 ms with caching. A
separate instrumented pass exported a real CPU operator trace. These values are
machine-specific and do not establish CUDA throughput, streamed TTFT or a general
cache speedup. The script records the measurement boundary and all repetitions.

### Reader and diagram checks

- Production preview serves HTTP 200. All 30 reader pages (overview plus 29
  chapters) passed at widths 1280, 390 and 320: exactly the intended chapter
  visible and no document-wide horizontal overflow.
- No duplicate IDs or unresolved internal anchors after integration.
- Browser checks cover gradient updates, tensor transpose/padding addresses,
  coalescing and bank conflicts, reduction stages/reset, full-pipeline stalls
  and release, and all 27 systolic multiply-accumulates.
- Desktop/mobile screenshots were inspected. Wide diagrams preserve readable
  labels with a horizontal-scroll cue and numerical tables. Mobile drawer
  inertness, open/close/Escape, chapter search and source filtering pass.
- Browser console reports no errors or warnings during the production checks.
  Screenshots remain local under ignored `output/playwright/`.

### Source corrections and remaining hardware evidence

The [source audit](docs/SOURCE_AUDIT_2026-09-14.md) records primary documents and
version boundaries. The existing Kimi comparison now separates its fixed-batch
2.3× result from its larger-batch 6.3× result. The LPU section acknowledges the
published Groq 3 architectural first look while keeping the older cutaway's
scope explicit. Announced platform specifications are not local measurements.

CUDA/Triton/extension compilation, GPU sanitizers and profiling, real-accelerator
vLLM load tests, multi-host experiments, FPGA target mapping/place-and-route,
board measurements and ASIC physical signoff remain unverified. The original
TensorFlow runtime examples were not changed or rerun in this expansion; their
prior evidence is recorded below. None of these results are implied by the CPU,
browser or RTL checks above.

## Historical verification

Checked locally on 2026-09-08. This records evidence, not a general claim of
production readiness or a completed textbook.

## September 9 working-pass additions

The optimization chapter and its interactive trajectory pass the static build
and five new Node tests (21 Node tests total). Four new TensorFlow tests pass for
clipping order, loss scaling/nonfinite skip, stateless activation recomputation,
and FP16/BF16 cast behavior. The CPU recomputation example reports zero observed
input/weight gradient difference. The first browser AdamW update is (1.92, 0.92)
with loss 6.9216. Desktop and 320-pixel layouts were inspected with no page errors.
The earlier checkpoint's detailed verification record follows.

The next decoding slice adds seven Node tests (28 total), including 2,025 rational
distribution pairs, filtering order and support boundaries. Four pure-Python
tests pass for conditional speculation, all-accepted bonus emission, disjoint
support correction and invalid inputs. The seed-23, 50,000-sample two-token
experiment has maximum frequency error 0.00226. Normal, identical and disjoint
browser cases pass at desktop and 320 pixels without page errors. The full
14-test TensorFlow suite also passes after the optimizer additions.

The hardware slice adds seven Node tests (35 total): register-allocation cliffs,
shared-memory/thread limits, roofline units, complete rings with 2–8 ranks,
reduce-scatter ownership, contributor invariants at intermediate steps, and
sent-byte accounting. All six ring transitions pass in the production browser;
rank 0 ends with chunks [52,56], [60,64], [68,72], [76,80], 48 sent bytes per
rank and 192 across the ring. Desktop and 320-pixel 3D views were inspected.
The mobile document remains 320 pixels wide; canvas width is 272 pixels.
The residency browser returns 37.5% at 65 registers/256 threads, and an explicit
cannot-fit result for 128 KiB shared storage. No page errors observed.
These are analytical/state models, not GPU or network measurements.

Parallel training adds five Node tests (40 total) and four TensorFlow tests.
The schedule tests sweep both methods across stage/microbatch combinations,
checking each operation once, no resource collision, causal dependencies,
nonnegative activation lifetimes and zero remaining bundles. For P=4/M=8,
both schedules take 22 abstract units; peak bundles are [8,8,8,8] versus
[4,3,2,1]. Browser controls reproduce those values at desktop and 320 pixels.
The two-shard float64 MLP has output error 5.55e-17, maximum gradient error
2.78e-17 and independently reduced dX error 2.60e-18. Duplicated output bias
produces 0.30349 error. This does not test distributed autograd or communication.

The complete 18-test TensorFlow suite passes after the tensor-partition work.
Reader/render improvements add four Node tests (44 total). Browser WebGL
instrumentation records no additional draw calls during a settled one-second
idle interval (213 → 213), then new drawing after a ring step (608). This is
evidence for draw invalidation, not a GPU-power measurement. Chapter-section
links track the active lesson; mobile link navigation closes/inerts the drawer
and preserves a 320-pixel document width.

## Code and numerical checks

- `npm test`: sixteen passing tests for online-softmax equivalence with a late
  large maximum, memory-sector accounting, paged allocation and shared-prefix
  ownership, copy-on-write, ZeRO state accounting, token/compute units, curriculum
  prerequisites and route boundaries, synthetic overlap, and perspective-camera
  framing across portrait/landscape aspect ratios; tiled-matmul output equality,
  load/barrier/accumulate schedules, ragged-edge padding and masked stores,
  logical access accounting, and invalid input rejection.
- `npm run build`: strict TypeScript check and Vite static build pass.
- TensorFlow: ten passing `unittest` tests for causal prefix invariance and
  finite gradients; manifest checks; resumed versus uninterrupted updates;
  response-only masking; DPO values/gradient direction; LoRA initialization;
  token-weighted partition/accumulation gradient equivalence with sum/mean
  reducers; the mean-of-means counterexample; empty local/global masks; and a
  real two-logical-CPU `MirroredStrategy` update compared with a full-batch
  reference in a fresh subprocess. The suite completed in 20.122 seconds.
- The replica experiment compares four updates, two microbatches per replica,
  and 11 valid targets. Maximum observed absolute differences: gradient
  `7.450580596923828e-9`, parameter `3.725290298461914e-9`, optimizer state
  `4.656612873077393e-10`. It checks both parameter copies and all local
  optimizer-state copies, not just a primary replica's value.
- Earlier checkpoint's CPU toy training: update 1 loss 4.9707, update 30 loss 4.4095, then restore
  from the committed checkpoint and continue to update 120 loss 2.8363.
  Batch size 2, accumulation 2, seed 7; the full command is in the companion
  README. Batch losses fluctuate. No throughput claim is made.

The TensorFlow tests ran with Python 3.11.5 / TensorFlow 2.20.0 / Keras 3.15.1 /
NumPy 2.4.6 on Apple Silicon CPU. The replica experiment validates TensorFlow's
single-process logical-CPU distribution path. It does not validate CUDA/NCCL,
multi-host transport, mixed precision, or a production corpus.

The original CUDA GEMM companion has ten integer/fractional reference cases,
poisoned outputs, launch/completion checks, and documented memory/race/barrier
sanitizer commands. It has **not been compiled or executed** in this environment:
the Mac has no `nvcc` or CUDA device. Browser/Node results are not CUDA validation.

## Browser checks

The Vite site was served locally on `http://127.0.0.1:4180` and inspected with a
real Chromium browser. Tested paths include:

- loading all three official images and opening/closing the native figure dialog;
- advancing all three softmax tiles and resetting;
- changing coalescing stride to eight (1,024 ideal transferred bytes, 12.5% useful);
- decoding and releasing a request without reclaiming the other request's prefix;
- GPU package/SM, rack/tray, and LPU views, with component picker/inspector agreement;
- guided matrix, rack communication-domain, and LPU vector steps, including
  expanded workbenches and Escape-to-close;
- gallery → deep-linked chapter → back/forward; post-training lesson placement;
- chapter pagination, search via ⌘ K, Enter-to-open, Escape-to-close, and a search
  result that clears a previously incompatible glossary filter;
- the synthetic trace: 4 ms communication with 3 ms overlap gives an 11 ms step.

All 16 chapters, overview, and gallery were checked at 320, 390, 768, 1024, and
1440 pixels: exactly one reader page is shown and document width matches viewport.
An anchor audit found no duplicate IDs and no broken in-page links. The closed
mobile chapter drawer is inert; its keyboard-open and Escape-close paths pass.

The production build was also served on `http://127.0.0.1:4181` with HTTP 200.
The same 90 page/viewport combinations passed on that build, with 39 source
entries, no broken anchors, and no page errors. The mobile expanded SM workbench
has no horizontal overflow, including the reduced-motion path. Manual component
selection exits guided mode; browser navigation restores an expanded model to
its original chapter before resolving the destination.

The new matrix workbench additionally passed these browser checks:

- Regular C[0,0] progresses through partial sums `0, 0, 0, 2` for the first
  four states and finishes at `-4`, with 24 logical input loads.
- Ragged C[2,2] finishes at `4`, with 10 logical input loads, 10 useful versus
  48 scheduled FLOPs, and one valid output store at tile width two.
- Same-block output selection preserves the step; a different block resets it.
  Clicking the rendered C[1,1] cell updates the selector and thread inspector.
- Both camera views and tile widths render; expanded/closed layouts and numerical
  tables were inspected at desktop and narrow widths. Tables have row/column
  headers and captions, and fit at 320 pixels.
- Simulated WebGL unavailability opens the numerical tables automatically;
  advancing to the first accumulation still produces the expected value `2`.
- Search includes lesson labels and anchor terms: “matrix tile” reaches the new
  lesson. Browser back restores an expanded workbench before changing chapter.

Screenshot inspection caught a mobile grid sizing defect that a document-width
check alone missed: the chapter was clipping an oversized content track. The
reader now uses a zero-minimum grid track and shrinkable chapter children.
The replica diagram's target counts and reduction sequence now fit at 320 pixels.
The final 90-combination audit also checks chapter-child bounds, not only document
width. All pass. The matrix workbench's 320-pixel expanded reduced-motion path
has equal scroll/client widths (298 pixels), and its thread disclosure stays open
when advancing the schedule.

Screenshots are local QA artifacts under ignored `output/playwright/`, not
published source figures. A fresh browser reload produced no JavaScript page
errors during the three-model interaction check.

## Interpretation boundaries

The attention tile lab computes a single query/value channel, not kernel timing.
Coalescing uses an aligned, ideal 32-byte sector model, not measured HBM traffic.
Paged KV uses a small pedagogical allocation pool, not vLLM implementation code.
The ZeRO calculator excludes activations, workspace, and allocator overhead.
The LPU schedule is abstract; slot spacing is not a disclosed cycle schedule.
Three.js geometry explains component relationships, not proprietary die layouts.
SM partitions, bank markers, warp cells, and tile dimensions are illustrative.
The rack route view shows one GPU's logical switch connections, not the full
cable placement. The profiling timeline assumes no compute/communication
contention; it is synthetic, not an actual Nsight trace.

The checkpoint demo is single-process, deterministic, and update-boundary only.
It verifies local shard hashes and atomic manifest visibility but does not claim
distributed consensus, object-store atomicity, or power-loss durability.
The original token-normalization algebra tests still evaluate logical partitions
without a distribution runtime. The separate new replica test does launch a
TensorFlow strategy, but all devices are logical CPUs in one process; network,
GPU collectives, model sharding and worker failure recovery remain untested.
The matmul workbench uses small signed integers and JavaScript arithmetic. Its
logical loads are not measured HBM transactions, its geometry is not a physical
layout, and its SIMT schedule does not model Tensor Core instructions or timing.

External sources and model support change. Lesson links identify primary sources;
the date attached to an older source note is not silently advanced by this QA.
