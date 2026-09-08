# Verification record — textbook expansion

Checked locally on 2026-09-08. This records evidence, not a general claim of
production readiness or a completed textbook.

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
