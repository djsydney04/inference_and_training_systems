# Design direction

## Visual thesis

An annotated engineering atlas printed on warm drafting stock: quiet typography,
precise rules, cobalt signal paths, and manipulable machine cutaways that feel
like technical objects rather than product-demo decoration.

## Token system

- Paper — `#f4f1e8`: the reading surface requested in the brief.
- Ink — `#171916`: primary type and structural strokes.
- Graphite — `#626760`: secondary type and dormant geometry.
- Rule — `#d3cfc3`: hierarchy and diagram grid lines.
- Signal — `#2559d6`: active data, selected components, and links.
- Signal pale — `#dbe5ff`: selected regions and explanatory overlays.

Type pairs Source Serif 4 for durable textbook reading with IBM Plex Sans for
controls, figures, and technical annotations. The body measure stays below 76
characters. Mathematical notation uses the serif face; tensor shapes and code
use the system monospace stack.

## Layout

Desktop uses a slim chapter rail, a bounded reading column, and an optional
figure margin. Major labs break the measure and use the full available canvas.
Mobile collapses the rail into a chapter drawer and stacks figure notes below
the visual.

```text
┌──────────────────────────────────────────────────────────────────┐
│ ATLAS                      Path / progress              Index     │
├──────────────┬───────────────────────────────┬───────────────────┤
│ chapters     │ explanation                   │ figure notes      │
│              │ math / code                   │                   │
│              ├───────────────────────────────┴───────────────────┤
│              │ wide interactive machine or simulation           │
└──────────────┴───────────────────────────────────────────────────┘
```

The content is left aligned. Figures use a strict datum grid. Chapter numbers
encode the real learning order rather than acting as ornament.

## Content plan

1. Hero: a live hierarchy from token to rack; choose a learning path.
2. Foundations: tensors, matmul, Transformer anatomy, and attention variants.
3. Training: objective, data, optimization, distributed systems, pre-training,
   and post-training.
4. Hardware: CPU, GPU die and SM, memory, interconnect, optics, and NVL72.
5. Inference: prefill/decode, KV cache, batching, vLLM, disaggregation, and
   speculative decoding.
6. LPU: deterministic tensor-streaming architecture and system tradeoffs.
7. Sources: a maintained primary-source reading ledger with freshness dates.

## Interaction thesis

- The hero continuously moves one pulse through token → tensor → GPU → rack;
  clicking a stage scrolls to that level of the text.
- Three.js cutaways support orbit, component selection, and semantic zoom;
  selecting a part updates an adjacent explanation rather than producing a
  decorative tooltip.
- Attention and inference labs use explicit controls: change sequence length,
  attention policy, batch size, and cache block size, then see complexity and
  memory movement change immediately.

Reduced-motion mode disables automatic pulses and camera easing. Every canvas
has an equivalent textual description and keyboard-operated controls.

## Self-critique

The off-white surface is explicit in the brief, but a cream-and-serif treatment
can drift into a generic editorial template. The corrective choice is the
instrument-like cobalt datum system, dense engineering annotations, square
controls, and large manipulable models. Cards are reserved for actual selectable
objects (papers or model components), never used as generic section wrappers.
