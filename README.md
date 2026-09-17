# AI Almanac

An interactive, systems-first guide to transformer architecture, training,
inference, and the machines underneath them.

The reader covers foundations, training, hardware, programming, inference,
practice, and reference. Prerequisite-ordered reading paths, chapter search
(⌘/Ctrl K), a searchable source ledger, and direct section links connect the
material. The landing page opens a course guide with a recommended starting point.

The sidebar exposes chapter groups and the current chapter’s section outline.
Optional worked details open within a lesson; search reveals folded targets.
Chapter titles, introductions, and display numbers come from the curriculum.
The chosen learning path is saved locally and controls previous/next navigation.
See [the authoring guide](docs/AUTHORING.md) before adding or moving content.

The edition footer and release notes share metadata from `src/release.ts` and
the version in `package.json`. The [design direction](DESIGN.md) describes the
landing page, reader, and diagram conventions.

## Explore the material

- **Foundations:** bytes and tokenization, probability and loss, gradients,
  tensors, attention, C types/pointers, storage ownership and strided layouts.
- **Training:** data contracts, packing, optimization, mixed precision,
  recomputation, distributed state, tensor/pipeline/context/expert parallelism,
  post-training objectives and evaluation.
- **Circuits:** gates, two's complement, fixed point, clocked state, setup/hold,
  clock-domain crossings, ready/valid, Verilog simulation, FPGA resources,
  synthesis, pipelined MACs, systolic arrays and ASIC physical implementation.
- **Kernels:** CUDA launch/indexing, memory transactions and bank conflicts,
  barriers, reductions, softmax and RMSNorm forward/backward, GEMM tiling,
  tensor-core pipelines, compiler layers, Triton and profiling.
- **Hardware:** CPU/GPU/LPU, NVIDIA, AMD, Google TPU, AWS Trainium, Cerebras,
  Intel Gaudi, edge/unified-memory systems, interconnect, memory and power.
- **Serving and frontier:** KV allocation, batching, speculative sampling,
  MLA, MoE, hybrid state, FlashAttention, FP8/FP4, disaggregation, test-time
  computation, latency tails and goodput.
- **End-to-end practice:** train a byte decoder, verify checkpoint restart and
  cached equivalence, evaluate held-out text, export an actual CPU trace and
  serve the checkpoint over HTTP; then follow a pinned vLLM GPU exercise.

The systems gallery includes interactive 2D numerical diagrams and three physical
Three.js workbenches. Matrix multiplication and all-reduce use clear, selectable
2D values and preserve the existing calculation models. Hardware
reference images have [provenance](public/figures/ATTRIBUTION.md). The new source
review records dated disclosures and corrected comparisons in
[the September 14 source audit](docs/SOURCE_AUDIT_2026-09-14.md).

## Executable companions

| Path | What it demonstrates | Environment |
| --- | --- | --- |
| [PyTorch](examples/pytorch/README.md) | Decoder, training, exact restart, KV cache, held-out loss, HTTP and CPU trace | Native Python + pinned PyTorch; CPU |
| [TensorFlow](examples/tensorflow/README.md) | RoPE/RMSNorm/SwiGLU decoder, distributed objective, post-training, tensor parallel algebra | TensorFlow; logical CPU replicas |
| [C](examples/c-basics/README.md) | Ownership, padded/transpose views and reference matmul | C17 compiler; ASan/UBSan |
| [CUDA](examples/cuda/LEARNING_PATH.md) | Reductions, softmax/RMSNorm derivatives and Triton | NVIDIA CUDA host required for device execution |
| [CUDA to PyTorch](examples/cuda/TORCH_RMSNORM.md) | Custom autograd operation and complete AdamW update comparisons | Analytical CPU path verified; compiled CUDA path requires GPU |
| [RTL](examples/rtl/README.md) | Adder, elastic MAC, dot-product FSM, systolic array; synthesized-netlist simulation | Icarus; Yosys or YoWASP for synthesis |
| [Sampling](examples/inference/README.md) | Exact speculative acceptance and residual sampling | Standard Python |

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

See the [TensorFlow companion](examples/tensorflow/README.md) for a runnable tiny
decoder, checkpoint-resume example, post-training losses, adapter, token-weighted
gradient example, two-replica runtime experiment, and numerical-contract tests. Eighty Node
tests cover numerical labs, matrix-tile schedules, prerequisite ordering,
chapter lookup, and camera framing.
The optimization chapter adds a stateful SGD/momentum/AdamW comparison, clipping
counterexample, mixed-precision contracts and activation recomputation.
The separate decoding chapter adds probability accounting, exact speculative
sampling, provisional-state reconciliation, and break-even reasoning. Its
[Python reference](examples/inference/README.md) has four additional tests.
The parallel-training chapter derives a partitioned MLP and compares GPipe-style
and 1F1B schedules. Four additional TensorFlow tests validate the tensor-shard
algebra on CPU, including all gradients and explicit counterexamples.
The [verification record](VERIFICATION.md) states what has actually been checked
and what has not been measured.

## Extend the textbook

- `src/curriculum.ts`: chapter metadata, prerequisites, and focused routes.
- `src/reader.ts`: chapter routing, syllabus, local contents, search, and migration
  of older material into the new chapter sequence.
- `src/atlas-home.ts`: curriculum overview and original SVG gallery previews.
- `src/systems-content.ts`: data, profiling, serving, and engineering-project lessons.
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
