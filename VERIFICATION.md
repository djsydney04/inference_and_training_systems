# Verification record — textbook expansion

Checked locally on 2026-09-08. This records evidence, not a general claim of
production readiness or a completed textbook.

## Code and numerical checks

- `npm test`: seven passing tests for online-softmax equivalence with a late
  large maximum, memory-sector accounting, paged allocation and shared-prefix
  ownership, copy-on-write, ZeRO state accounting, and token/compute units.
- `npm run build`: strict TypeScript check and Vite static build pass.
- TensorFlow: six passing `unittest` tests for causal prefix invariance and
  finite gradients; manifest checks; resumed versus uninterrupted updates;
  response-only masking; DPO values/gradient direction; and LoRA initialization.
- CPU toy training: update 1 loss 4.9707, update 30 loss 4.4095, then restore
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
- chapter tracking in the middle of long lessons, desktop and mobile reading.

Document width matches the viewport at 320, 390, 768, 1024, and 1440 pixels.
An anchor audit found no duplicate IDs and no broken in-page links. The closed
mobile chapter drawer is inert; its keyboard-open and Escape-close paths pass.

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

The checkpoint demo is single-process, deterministic, and update-boundary only.
It verifies local shard hashes and atomic manifest visibility but does not claim
distributed consensus, object-store atomicity, or power-loss durability.

External sources and model support change. Lesson links identify primary sources;
the date attached to an older source note is not silently advanced by this QA.
