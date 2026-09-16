# Clickable decoder network

Entry: `#network-map` in the Transformer chapter, or **Open the whole neural
network** in the diagram gallery.

The addition contains six linked lessons and seven original figures: the full
decoder, embedding lookup, residual branch, attention graph, numerical attention
weights, SwiGLU graph and output loop. The overview changes tensor shapes between
four-token prefill and a cached decode step. A head-sharing control shows the
cache effect while keeping query heads fixed.

The operation graphs expose explanations through pointer and keyboard selection.
The arithmetic controls isolate causal masking, RMS normalization and a SwiGLU
channel. All values are illustrative; no trained checkpoint or performance
simulation is presented. Primary papers are linked next to the relevant lessons.

## Design

Visual thesis: retain the atlas typography and cobalt signal paths; let arrows,
tensor dimensions and residual bypasses explain the structure.

Content plan: whole network, input vectors, residual/normalization, attention,
feed-forward, then prediction. Every detail returns to the complete network.
Longer derivations use the reader's existing disclosures and section numbering.

Interaction thesis: navigation opens the selected component; selecting an
operation updates its adjacent explanation; parameter changes update only the
relevant arithmetic or shapes. There is no autonomous animation. Wide diagrams
scroll inside the figure on small screens.

## Verification — September 16, 2026

- `npm test`: 85 tests passed in the shared working tree, including five new
  numerical-contract tests. They cover causal independence from future values,
  shape changes during decode, KV sharing, stable softmax, RMSNorm and signed
  SwiGLU activations.
- `npm run build`: TypeScript and production build passed. Vite retains its
  existing large-chunk warning; this work does not claim a bundle-size reduction.
- Playwright on the local preview: diagram deep links, every inspector button,
  Space/Enter operation selection, negative gate values, normalization magnitude,
  prefill/decode and shared-KV shape updates, first-token causal masking, valid
  fragment targets, unique lesson IDs and reduced-motion behavior checked.
- All six new lessons checked at 390px and 320px without document-level horizontal
  overflow. The feed-forward deep link also received a settled mobile screenshot.
- Desktop map, attention and feed-forward screenshots were visually inspected.
  Local captures live in the ignored `output/playwright/network-*.png` paths.

The browser pass found and fixed a reader issue: SVG anchors expose `href` as an
animated value and have no HTML `.hash` property. Internal navigation now reads
the authored fragment attribute, supporting both HTML and SVG links.

An older preview was already serving port 4183. These checks use the separate
development preview on `http://127.0.0.1:4297/`.
