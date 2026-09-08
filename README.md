# The Inference Engineering Atlas

An interactive, systems-first guide to transformer architecture, training,
inference, and the machines underneath them.

The current textbook edition includes chapter reading objectives, original
worked explanations, revealable exercises, TensorFlow companion programs, and
interactive diagrams. The offwhite interface supports desktop and mobile reading.

## Explore the material

- **Foundations:** tensor shapes, automatic differentiation, decoder blocks,
  causal/hybrid attention, and a tile-by-tile online-softmax lab.
- **Training:** data and token accounting, model-state/ZeRO estimates,
  parallelism, checkpoint recovery, SFT, DPO, LoRA, and rollout systems.
- **Hardware:** CPU execution, GPU warps/registers/coalescing, GB200 racks,
  optical links, collectives, and compiler-scheduled LPU dataflow.
- **Serving:** prefill/decode, KV sizing, paged allocation and shared prefixes,
  batching, speculative decoding, quantization, and evaluation budgets.

GPU, rack, and LPU Three.js cutaways support orbit/zoom, view changes, and
keyboard-accessible component selectors. Reference hardware images have an
enlargeable viewer and [a provenance record](public/figures/ATTRIBUTION.md).

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
decoder, checkpoint-resume example, post-training losses, adapter, and six tests.
The [verification record](VERIFICATION.md) states what has actually been checked
and what has not been measured.

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
