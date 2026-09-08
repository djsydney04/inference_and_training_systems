# Verification record — textbook expansion

Checked locally on 2026-09-08. This records evidence, not a general claim of
production readiness or a completed textbook.

## Code and numerical checks

- `npm test`: eleven passing tests for online-softmax equivalence with a late
  large maximum, memory-sector accounting, paged allocation and shared-prefix
  ownership, copy-on-write, ZeRO state accounting, token/compute units, curriculum
  prerequisites and route boundaries, synthetic overlap, and perspective-camera
  framing across portrait/landscape aspect ratios.
- `npm run build`: strict TypeScript check and Vite static build pass.
- TensorFlow: nine passing `unittest` tests for causal prefix invariance and
  finite gradients; manifest checks; resumed versus uninterrupted updates;
  response-only masking; DPO values/gradient direction; LoRA initialization;
  token-weighted partition/accumulation gradient equivalence with sum/mean
  reducers; the mean-of-means counterexample; and empty local/global masks.
- Earlier checkpoint's CPU toy training: update 1 loss 4.9707, update 30 loss 4.4095, then restore
  from the committed checkpoint and continue to update 120 loss 2.8363.
  Batch size 2, accumulation 2, seed 7; the full command is in the companion
  README. Batch losses fluctuate. No throughput claim is made.

The TensorFlow tests ran with Python 3.11.5 / TensorFlow 2.20.0 / Keras 3.15.1 /
NumPy 2.4.6 on Apple Silicon CPU. This does not validate CUDA, mixed precision,
distributed execution, or a production corpus.

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
The same 90 page/viewport combinations passed on that build, with 36 source
entries, no broken anchors, and no page errors. The mobile expanded SM workbench
has no horizontal overflow, including the reduced-motion path. Manual component
selection exits guided mode; browser navigation restores an expanded model to
its original chapter before resolving the destination.

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
The token-normalization tests evaluate logical partitions on one CPU process;
they do not launch TensorFlow distribution strategies or validate transport.

External sources and model support change. Lesson links identify primary sources;
the date attached to an older source note is not silently advanced by this QA.
