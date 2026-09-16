import { networkExample, networkShapes } from "./network-math";

export const shapeLabel = (shape: number[]) => `[${shape.join(", ")}]`;
const box = (x: number, y: number, w: number, title: string, sub: string, attributes = "") =>
  `<g class="nn-node" ${attributes}><rect x="${x}" y="${y}" width="${w}" height="52" rx="2"/><text x="${x + w / 2}" y="${y + 22}" class="nn-node-title">${title}</text><text x="${x + w / 2}" y="${y + 40}" class="nn-node-sub">${sub}</text></g>`;
const linkBox = (x: number, y: number, w: number, title: string, sub: string, target: string) =>
  `<a href="#${target}" aria-label="Explore ${title}">${box(x, y, w, title, sub)}</a>`;
const partBox = (x: number, y: number, w: number, title: string, sub: string, part: string) =>
  box(x, y, w, title, sub, `role="button" tabindex="0" aria-label="Inspect ${title}" aria-pressed="false" data-nn-part="${part}"`);
const line = (path: string, marker: string, extra = "") =>
  (path.match(/M[^M]+/g) ?? []).map(segment => `<path class="nn-wire ${extra}" d="${segment}" marker-end="url(#${marker})"/>`).join("");
const start = (id: string, width: number, height: number, title: string, description: string) =>
  `<svg viewBox="0 0 ${width} ${height}" class="nn-svg" aria-labelledby="${id}-title ${id}-desc"><title id="${id}-title">${title}</title><desc id="${id}-desc">${description}</desc><defs><marker id="${id}-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7" fill="#2559d6"/></marker></defs>`;

export function wholeNetworkDiagram(decode = false, grouped = false) {
  const s = networkShapes({ ...networkExample, kvHeads: grouped ? 1 : 2 }, decode);
  const a = "nn-whole-arrow";
  return start("nn-whole", 600, 790, "The complete decoder network", "Follow arrows downward. Two bypass paths add attention and feed-forward updates to the residual stream. Every named operation links to its lesson.") +
    `<rect class="nn-block-boundary" x="76" y="158" width="446" height="386" rx="3"/><text x="92" y="179" class="nn-annotation">Decoder block</text><text x="504" y="179" text-anchor="end" class="nn-annotation">× ${networkExample.layers} layers · separate weights</text>` +
    line("M300 80V99M300 151V198M300 250V270M300 322V336M300 388V403M300 455V470M300 522V565M300 617V635M300 687V706", a) +
    line("M300 190H108V362H187", a, "nn-bypass") + line("M300 395H492V496H413", a, "nn-bypass") +
    `<text x="99" y="295" class="nn-annotation" transform="rotate(-90 99 295)">unchanged x</text><text x="510" y="426" class="nn-annotation" transform="rotate(90 510 426)">unchanged a</text>` +
    linkBox(188, 28, 224, "Token IDs", shapeLabel(s.ids), "network-embeddings") +
    linkBox(188, 100, 224, "Embedding lookup", shapeLabel(s.residual), "network-embeddings") +
    linkBox(188, 199, 224, "RMSNorm → attention", "Q / K / V · RoPE · causal mixing", "network-attention") +
    linkBox(188, 270, 224, "Attention output", "Concatenate heads · project to D", "network-attention") +
    linkBox(188, 336, 224, "+ Residual", "a = x + attention(norm(x))", "network-residual") +
    linkBox(188, 403, 224, "RMSNorm → feed-forward", "Expand · SiLU gate · project back", "network-feedforward") +
    linkBox(188, 470, 224, "+ Residual", "y = a + FFN(norm(a))", "network-residual") +
    linkBox(188, 565, 224, "Final RMSNorm", shapeLabel(s.residual), "network-residual") +
    linkBox(188, 635, 224, "Vocabulary projection", `${networkExample.width} channels → ${networkExample.vocabulary} logits`, "network-output") +
    linkBox(188, 706, 224, "Next-token distribution", "Softmax · select · append · repeat", "network-output") +
    `<text x="300" y="782" text-anchor="middle" class="nn-annotation">Arrows carry activations. Click a block to open its explanation.</text></svg>`;
}

export const attentionDiagram = () => {
  const a = "nn-attn-arrow";
  return start("nn-attn", 760, 392, "Inside causal self-attention", "Normalized input splits into query, key and value projections. Position-rotated queries and keys produce masked scores; softmax weights mix values. Concatenated heads project back to the residual width.") +
    line("M380 65V86H120V104M380 86V104M380 86H640V104M120 156V176H268V199M380 156V199M420 225H474M640 156V225H586M530 251V279M530 331V349H290", a) +
    `<text x="653" y="195" class="nn-annotation">values</text>` +
    partBox(260, 13, 240, "Normalized input", "[B, Tq, D]", "input") +
    partBox(20, 104, 200, "Query · Q", "Wq → heads → RoPE", "query") +
    partBox(280, 104, 200, "Key · K", "Wk → heads → RoPE → cache", "key") +
    partBox(540, 104, 200, "Value · V", "Wv → heads → cache", "value") +
    partBox(188, 199, 232, "Scores → causal softmax", "QKᵀ / √dh + mask", "scores") +
    partBox(474, 199, 112, "Mix values", "P × V", "mix") +
    partBox(418, 279, 224, "Join heads + Wo", "[B, Tq, D]", "project") +
    `<text x="275" y="354" style="text-anchor:end" class="nn-node-title">Back to the residual addition</text></svg>`;
};

export const feedForwardDiagram = () => {
  const a = "nn-ffn-arrow";
  return start("nn-ffn", 760, 405, "Inside a SwiGLU feed-forward network", "One token's normalized vector branches into up and gate projections. SiLU transforms the gate. Elementwise multiplication combines the two expanded vectors. A down projection restores the residual width.") +
    line("M380 66V85H195V108M380 85H565V108M195 160V214M565 160V180H352V240H300M195 266V281H380V300M380 352V389", a) +
    `<text x="480" y="251" class="nn-annotation">Same operation for every token</text><text x="480" y="272" class="nn-annotation">No arrows between token positions</text>` +
    partBox(260, 14, 240, "One normalized token", "D = 8 channels", "input") +
    partBox(80, 108, 230, "Gate projection → SiLU", "8 → F = 24 channels", "gate") +
    partBox(450, 108, 230, "Up projection", "8 → F = 24 channels", "up") +
    partBox(80, 214, 230, "Elementwise product", "24 paired channels → 24", "multiply") +
    partBox(260, 300, 240, "Down projection", "F = 24 → D = 8 channels", "down") +
    `<text x="394" y="392" class="nn-annotation">Add update to this token’s residual</text></svg>`;
};

export const embeddingDiagram = () => {
  const a = "nn-embed-arrow";
  return start("nn-embed", 760, 228, "Embedding is a learned table lookup", "Illustrative token IDs 7, 2, 9 and 4 select four rows of a vocabulary by width weight table. The result has four token positions and eight channels.") +
    `<text x="90" y="31" text-anchor="middle" class="nn-node-title">Token IDs</text><text x="364" y="31" text-anchor="middle" class="nn-node-title">Learned table E [32, 8]</text><text x="640" y="31" text-anchor="middle" class="nn-node-title">Activations X [1, 4, 8]</text>` +
    [7, 2, 9, 4].map((id, row) => `<rect class="nn-tile" x="54" y="${53 + row * 39}" width="72" height="28"/><text x="90" y="${73 + row * 39}" text-anchor="middle" class="nn-node-title">${id}</text>` + line(`M126 ${67 + row * 39}H${245 + row * 8}`, a) +
      Array.from({ length: 8 }, (_, col) => `<rect class="nn-cell" x="${268 + col * 25}" y="${53 + row * 39}" width="21" height="28" opacity="${.22 + ((id + col) % 5) * .15}"/><rect class="nn-cell" x="${555 + col * 22}" y="${53 + row * 39}" width="18" height="28" opacity="${.22 + ((id + col) % 5) * .15}"/>`).join("") + line(`M469 ${67 + row * 39}H546`, a)).join("") +
    `<text x="380" y="220" text-anchor="middle" class="nn-annotation">Selected rows only · colors represent illustrative channel values, not trained embeddings</text></svg>`;
};

export const residualDiagram = () => {
  const a = "nn-res-arrow";
  return start("nn-res", 760, 230, "A residual connection preserves a direct path", "The input splits into an unchanged bypass and a normalized branch through attention or feed-forward. Both paths meet at addition. Normalization is inside the branch, not on the bypass.") +
    line("M126 124H198M398 124H440M612 124H672M154 124V36H700V98M726 124H751", a) +
    `<text x="424" y="26" text-anchor="middle" class="nn-annotation">Identity path · unchanged vector</text>` +
    partBox(14, 98, 112, "Input x", "D channels", "stream") +
    partBox(198, 98, 200, "RMSNorm", "Scale each token’s channels", "norm") +
    partBox(440, 98, 172, "Sub-layer", "Attention or FFN", "branch") +
    `<g role="button" tabindex="0" aria-label="Inspect residual addition" aria-pressed="false" data-nn-part="add" class="nn-node"><circle cx="700" cy="124" r="26"/><text x="700" y="132" text-anchor="middle" class="nn-plus">+</text></g><text x="380" y="203" text-anchor="middle" class="nn-node-title">y = x + sublayer(RMSNorm(x))</text></svg>`;
};

export const outputDiagram = () => {
  const a = "nn-output-arrow";
  return start("nn-output", 760, 225, "From hidden channels to the next token", "The final normalized hidden vector is projected into a score for every vocabulary entry. Softmax converts scores into probabilities. Training scores the actual next token; generation selects a token and feeds its ID back into the network.") +
    line("M170 86H202M370 86H402M568 86H600M680 112V182H85V112", a) +
    partBox(6, 60, 164, "Final hidden state", "D = 8 channels", "hidden") +
    partBox(204, 60, 166, "Logits", "32 vocabulary scores", "logits") +
    partBox(404, 60, 164, "Softmax", "32 probabilities", "softmax") +
    partBox(602, 60, 152, "Select token", "One vocabulary ID", "select") +
    `<text x="380" y="169" text-anchor="middle" class="nn-annotation">Embedding lookup → all decoder blocks → final norm</text><text x="380" y="207" text-anchor="middle" class="nn-annotation">Append the ID; run the next decode step with each layer’s cached keys and values</text></svg>`;
};
