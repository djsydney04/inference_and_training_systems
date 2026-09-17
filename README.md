# AI Almanac

An interactive, systems-first guide to transformer architecture, training,
inference, and the machines underneath them.

The reader covers foundations, training, hardware, programming, inference,
practice, and reference. Prerequisite-ordered reading paths, chapter search
(⌘/Ctrl K), a searchable source ledger, and direct section links connect the
material. The landing page opens a course guide with a recommended starting point.

The current edition contains **31 chapters, six learning paths, 184 sections
and 191 figures**, with numbered code, worked checks and a searchable source
ledger. Fonts and figures are served locally.

The sidebar exposes chapter groups and the current chapter’s section outline.
Optional worked details open within a lesson; search reveals folded targets.
Chapter titles, introductions, and display numbers come from the curriculum.
The chosen learning path is saved locally and controls previous/next navigation.
See [the authoring guide](docs/AUTHORING.md) before adding or moving content.

Release Please updates the package version and changelog together. The edition
footer and release notes read those files automatically; production builds reject
version mismatches. See [releasing](docs/RELEASING.md) for version rules and the
release PR workflow. The [design direction](DESIGN.md) describes the
landing page, reader, and diagram conventions.

## Explore the material

- **Foundations:** bytes and tokenization, probability and loss, gradients,
  tensors, attention, C types/pointers, storage ownership and strided layouts.
- **Training:** data contracts, packing, optimization, mixed precision,
  recomputation, distributed state, tensor/pipeline/context/expert parallelism,
  gathered-state lifetimes, sharded optimizer updates and checkpoint redistribution,
  post-training objectives, asynchronous actor/learner execution, policy lag and evaluation.
- **Circuits:** gates, two's complement, fixed point, clocked state, setup/hold,
  clock-domain crossings, ready/valid, Verilog simulation, FPGA resources,
  synthesis, pipelined MACs, systolic arrays and ASIC physical implementation.
- **Kernels:** CUDA launch/indexing, memory transactions and bank conflicts,
  barriers, reductions, softmax and RMSNorm forward/backward, GEMM tiling,
  tensor-core pipelines, compiler layers, Triton and profiling.
- **Hardware:** CPU/GPU/LPU, NVIDIA, AMD, Google TPU, AWS Trainium, Cerebras,
  Intel Gaudi, edge/unified-memory systems, interconnect, memory and power.
- **Serving and frontier:** KV allocation, batching, speculative sampling,
  EAGLE/MTP/block drafters, tree attention, MLA, MoE, hybrid state,
  FlashAttention, FP8/FP4, prefill/decode disaggregation, cache handoff,
  expert dispatch/combine and gradients, quantization/calibration error,
  scheduling and admission, fleet bottlenecks, test-time computation, latency tails and goodput.
- **End-to-end practice:** train a byte decoder, verify checkpoint restart and
  cached equivalence, evaluate held-out text, export an actual CPU trace and
  serve the checkpoint over HTTP; then follow a pinned vLLM GPU exercise.
- **Popular frameworks:** PyTorch, JAX, TensorFlow/Keras, Hugging Face training
  tools, Lightning, distributed runtimes, vLLM, SGLang, TensorRT-LLM, llama.cpp,
  MLX and deployment layers. Compare actual updates, model/tokenizer contracts,
  tracing, adapters, cache identity, stop handling and completed-work timing.

The systems gallery includes interactive 2D numerical diagrams and three physical
Three.js workbenches. Matrix multiplication and all-reduce use clear, selectable
2D values and preserve the existing calculation models. Hardware
reference images have [provenance](public/figures/ATTRIBUTION.md). The new source
reviews record dated disclosures and corrected comparisons in
[the hardware source audit](docs/SOURCE_AUDIT_2026-09-14.md),
[the inference/training audit](docs/INFERENCE_TRAINING_AUDIT_2026-09-16.md),
[the execution-gap review](docs/EXECUTION_GAPS_AUDIT_2026-09-16.md), and
[the frameworks audit](docs/FRAMEWORKS_AUDIT_2026-09-16.md).

## Executable companions

| Path | What it demonstrates | Environment |
| --- | --- | --- |
| [PyTorch](examples/pytorch/README.md) | Decoder, training, exact restart, KV cache, held-out loss, HTTP and CPU trace | Native Python + pinned PyTorch; CPU |
| [TensorFlow](examples/tensorflow/README.md) | RoPE/RMSNorm/SwiGLU decoder, distributed objective, post-training, tensor parallel algebra | TensorFlow; logical CPU replicas |
| [C](examples/c-basics/README.md) | Ownership, padded/transpose views and reference matmul | C17 compiler; ASan/UBSan |
| [CUDA](examples/cuda/LEARNING_PATH.md) | Reductions, softmax/RMSNorm derivatives and Triton | NVIDIA CUDA host required for device execution |
| [CUDA to PyTorch](examples/cuda/TORCH_RMSNORM.md) | Custom autograd operation and complete AdamW update comparisons | Analytical CPU path verified; compiled CUDA path requires GPU |
| [CUDA/HIP baseline](examples/portable-kernels/README.md) | Shared row-major matmul, launch coverage and independent FP64 reference | CPU sanitizer path verified; device paths require CUDA/ROCm hardware |
| [RTL](examples/rtl/README.md) | Adder, elastic MAC, dot-product FSM, systolic array; synthesized-netlist simulation | Icarus; Yosys or YoWASP for synthesis |
| [Inference](examples/inference/README.md) | Exact speculative acceptance, residual sampling and KV-handoff ownership | Standard Python |
| [Actor/learner runtime](examples/training-runtime/README.md) | Event-driven rollout schedule, bounded policy lag and clipped ratios | Standard Python; declared synthetic durations |
| [Sharded training](examples/sharded-training/README.md) | Uneven data contributions, complete AdamW updates and checkpoint redistribution | Standard Python; logical CPU ranks |
| [Quantization](examples/quantization/README.md) | Affine codes, groups, calibration error, K/V error and actual INT4 packing | Standard Python; floating arithmetic |
| [Mixture of experts](examples/moe/README.md) | Routing, grouped execution, weighted combination, capacity and derivatives | Standard Python; linear experts |
| [Serving traces](examples/serving-runtime/README.md) | Token receipts, terminal results, goodput and offered-population accounting | Standard Python; declared trace |
| [Framework contracts](examples/frameworks/README.md) | Same update across APIs, graph reuse, causal labels, adapter reload, stop strings and CUDA replay | Standard Python; PyTorch/JAX and Transformers/PEFT CPU checks verified; TensorFlow/Keras and CUDA replay unexecuted |

The written path is broad; verification boundaries remain specific. CPU tests,
RTL simulation and generic synthesis do not establish GPU kernel performance,
FPGA board frequency, cluster scaling or production serving capacity. Those
hardware exercises include commands and proof obligations. See
[verification](VERIFICATION.md) and [the roadmap](ROADMAP.md).

## Local development

```bash
npm install
npm run dev
```

Build the static site with:

```bash
npm run build
```

The generated site is written to `dist/` and can be hosted by any static web
server.

## Verify a change

Use Node 22.13 or newer for the TypeScript-based numerical tests:

```bash
npm test
npm run build
```

The integrated suite currently has **173 Node tests**. Companion READMEs contain
their Python, C, RTL and target-hardware commands. The latest framework additions
include 14 standard-library Python tests, actual PyTorch/JAX CPU parity and a
Transformers/PEFT save/reload/merge check. Earlier TensorFlow companion results
are separate from the new, unexecuted TensorFlow/Keras comparison path.

Browser checks cover every chapter, numerical controls, labels and navigation
at desktop and phone widths. The [verification record](VERIFICATION.md) states
the checked revisions and distinguishes numerical examples, actual runtime
execution and unmeasured hardware performance.

## Extend the textbook

- `src/curriculum.ts`: chapter metadata, prerequisites, and focused routes.
- `src/reader.ts`: chapter routing, syllabus, local contents, search, and migration
  of older material into the new chapter sequence.
- `src/atlas-home.ts`: curriculum overview and original SVG gallery previews.
- `src/systems-content.ts`: data, profiling, serving, and engineering-project lessons.
- `src/speculation-frontier-*`, `src/disaggregation-*`, and `src/rollout-training-*`:
  modern inference and actor/learner lessons, controls and tested numerical models.
- `src/sharded-training-*`, `src/quantization-*`, `src/moe-execution-*`, and
  `src/serving-runtime-*`: execution, numerical error, ownership and measurement labs.
- `src/framework-*` and `examples/frameworks/`: framework responsibility maps,
  execution/training/serving contracts, timing/replay lessons and CPU companions.
- `src/scenes.ts` and `src/scene-detail.ts`: Three.js workbenches and guided stages.
- `src/kernel-content.ts`, `src/kernel-lab.ts`, and `src/kernel-scene.ts`: the
  replica-runtime lesson and value-driven matrix workbench.
- `src/matmul-math.ts`: pure tile scheduling, padding, and access/FLOP accounting.
- `src/camera-fit.ts`, `src/trace-math.ts`, and `tests/`: testable model logic.

Existing lesson content remains in `content.ts`, `textbook-content.ts`, and
`training-content.ts`. Keep anchor IDs stable; add prerequisites and citations
when introducing a chapter. Run the build and tests, then inspect the changed
chapter and its workbench at both desktop and narrow widths.

## Editorial policy

The site uses original explanations and redrawn diagrams, alongside a small
attributed selection of hardware reference images. Facts and performance
claims link to primary sources. Vendor-provided numbers are labeled as such.
The [Modal GPU Glossary](https://modal.com/gpu-glossary/readme) informs topic
coverage, while this project adds a structured learning path, training and
inference systems, current model architectures, and interactive machine models.
The glossary is a topic reference, not copied site content. Paper figures are
conceptual redraws unless explicitly credited otherwise. TensorFlow and PyTorch provide
educational implementation paths; GPU serving examples use their native stack
and do not imply that vLLM runs directly on Groq hardware.

## UI lint

```bash
npx playwright install chromium
npm run lint:ui
```

The lint starts an isolated production preview and checks every chapter and
reference page at four viewport widths (320, 390, 768, and 1440px). It catches
clipped content and schematic labels, verifies keyboard/numerical behavior in
the 2D workbenches, and checks that edition metadata matches the release notes.
Failure screenshots and traces are written to `output/ui-lint/`.
