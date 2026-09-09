# Machine Learning Systems Atlas

An interactive, systems-first guide to transformer architecture, training,
inference, and the machines underneath them.

The textbook now has 18 chapters across foundations, training, hardware,
inference, practice, and reference. A grouped syllabus, four prerequisite-ordered
reading paths, chapter search (⌘/Ctrl K), and previous/next links connect the
material. Deep links and browser back/forward navigation remain supported.
The offwhite interface supports desktop and mobile reading.

## Explore the material

- **Foundations:** tensor shapes, automatic differentiation, decoder blocks,
  causal/hybrid attention, and a tile-by-tile online-softmax lab.
- **Training:** data and token accounting, model-state/ZeRO estimates,
  data manifests, packing and global loss normalization, parallelism,
  a tested two-replica update, checkpoint recovery, SFT, DPO, LoRA, and rollout systems.
- **Hardware:** CPU execution, GPU warps/registers/coalescing, GB200 racks,
  optical links, collectives, and compiler-scheduled LPU dataflow.
- **Serving:** prefill/decode, KV sizing, paged allocation and shared prefixes,
  batching, speculative decoding, quantization, load testing, goodput, overload,
  reliability, and cost accounting.
- **Practice:** profiling protocols, a synthetic critical-path lab, and five
  engineering projects with concrete artifacts and review questions; a tiled
  matrix-multiplication workbench connected to an original CUDA companion.

The thirteen-entry systems gallery connects worked lessons and labs to the syllabus.
GPU, rack, and LPU Three.js cutaways support expandable workbenches, orbit/zoom,
view changes, and keyboard-accessible component selectors. Guided steps keep
geometry highlights and explanations together: SM execution partitions, register
banks and matrix tiles; superchip/scale-up/scale-out connections; and scheduled
SRAM/matrix/switch/vector movement. These are teaching models, not die floorplans
or measured cycle simulators. Reference hardware images have an enlargeable
viewer and [a provenance record](public/figures/ATTRIBUTION.md).

A fourth Three.js workbench follows actual matrix values through global loads,
shared memory, barriers, register accumulation, and output stores. Click a C cell,
change tile size, or inspect padded edge cases. The accessible numerical tables
and 3D view share one tested state model. The [CUDA companion](examples/cuda/README.md)
includes a correctness harness and sanitizer commands; it has not yet been
compiled or executed on NVIDIA hardware.

This remains a developing textbook, not a finished college course or an exhaustive
survey of every recent paper. The [roadmap](ROADMAP.md) records the remaining work.

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
gradient example, two-replica runtime experiment, and numerical-contract tests. Twenty-eight Node
tests cover numerical labs, matrix-tile schedules, prerequisite ordering,
chapter lookup, and camera framing.
The optimization chapter adds a stateful SGD/momentum/AdamW comparison, clipping
counterexample, mixed-precision contracts and activation recomputation.
The separate decoding chapter adds probability accounting, exact speculative
sampling, provisional-state reconciliation, and break-even reasoning. Its
[Python reference](examples/inference/README.md) has four additional tests.
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
conceptual redraws unless explicitly credited otherwise. TensorFlow is the
educational implementation path; GPU serving examples use their native stack
and do not imply that vLLM runs directly on Groq hardware.
