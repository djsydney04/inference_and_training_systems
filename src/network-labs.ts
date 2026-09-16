import "./network.css";
import { wholeNetworkDiagram, shapeLabel } from "./network-diagrams";
import { networkExample, networkShapes, causalAttentionRow, rmsNormalize, swigluChannels } from "./network-math";

const explanations: Record<string, Record<string, [string, string]>> = {
  attention: {
    input: ["One input, three learned views", "RMSNorm prepares each token’s D channels. Wq, Wk and Wv then mix channels with different learned weights. None of these projections mixes token positions."],
    query: ["Q: what this position is looking for", "Wq maps D channels to H × dh channels. Reshape into heads and rotate query channel pairs with RoPE. During decode, only the new token needs a query; here Q changes from [1, 2, 4, 4] to [1, 2, 1, 4]."],
    key: ["K: what can match a query", "Keys use a separate projection and the same position-dependent rotation scheme. Store each new rotated key in this layer’s cache. With one shared KV head, each cached key has 4 channels instead of 8 across two heads."],
    value: ["V: the content retrieved", "Values use their own learned projection. In this RoPE variant they are not rotated. Cache them alongside keys. A large attention weight means this value vector contributes strongly to the weighted sum."],
    scores: ["Compare, mask, normalize", "Each query–key dot product is scaled by 1/√dh. Set forbidden future scores to −∞ before applying softmax over key positions. The resulting weights sum to one for each query head and position."],
    mix: ["A weighted sum over token positions", "Multiply the probability row by V: output[c] = Σj probability[j] × value[j, c]. This is the step that moves information between positions. Each head produces dh output channels."],
    project: ["Rejoin heads and write an update", "Concatenating H heads restores D = H × dh channels. Wo mixes those channels. The result still has one row per query token and is added to the original residual stream."],
  },
  feedforward: {
    input: ["Each token is processed independently", "The input is the normalized residual after attention. It already contains contextual information. Every token uses the same feed-forward weights, but its activations differ."],
    gate: ["A learned gate with a nonlinearity", "Multiply x by Wgate [8, 24], then apply SiLU to each of the 24 channels. SiLU(z) = z / (1 + exp(−z)). It is a signed activation, not a probability or binary switch."],
    up: ["Expand into a wider feature space", "Wup [8, 24] produces 24 channels for each token. It reads the same input as the gate branch but uses separate learned parameters."],
    multiply: ["Pair channels, not tokens", "Multiply matching entries of SiLU(xWgate) and xWup. This is an elementwise product, not a matrix multiplication. The width stays 24; no token reads another token’s FFN activation."],
    down: ["Return to the residual width", "Wdown [24, 8] combines the gated features into an 8-channel update. Add it to the pre-FFN residual. Expanded activations are temporary; they are not the KV cache."],
  },
  residual: {
    stream: ["The vector that persists between sub-layers", "Each token carries D channels through the stack. The bypass preserves the input to this particular sub-layer, including all updates from earlier sub-layers."],
    norm: ["Normalize across this token’s channels", "Divide by the root-mean-square magnitude, then multiply by learned per-channel gains. Sequence length and width stay unchanged. The magnitude control below isolates this arithmetic."],
    branch: ["Compute an update from the normalized input", "The attention branch exchanges information between positions. The feed-forward branch transforms each position independently. Both return a D-channel update."],
    add: ["Add corresponding channels", "Addition requires equal [B, Tq, D] shapes. It is not concatenation and does not double the width. A zero branch update makes the entire sub-layer an identity function."],
  },
  output: {
    hidden: ["A contextual vector, not a word ID", "The last block returns D channels per input position. Final RMSNorm prepares them for vocabulary scoring. During generation, use the latest position’s vector."],
    logits: ["One score per vocabulary entry", "Multiply by the output matrix [D, V]. Here eight features produce 32 logits. Scores may be any real number; the largest score identifies the greedy choice."],
    softmax: ["Normalize over vocabulary, not positions", "Exponentiate scores after subtracting their maximum, then divide by the sum. This vocabulary softmax is distinct from the attention softmax inside every layer."],
    select: ["Choose an ID and start the next pass", "Greedy decoding takes the largest score; sampling draws from a chosen distribution. Append the ID, look up its embedding, and run it through every layer while reusing the corresponding layer’s KV cache."],
  },
};

export function initializeNetworkLabs() {
  const mode = document.querySelector<HTMLSelectElement>("[data-nn-mode]");
  const heads = document.querySelector<HTMLSelectElement>("[data-nn-heads]");
  if (!mode || !heads) return;
  const renderShapes = () => {
    const decode = mode.value === "decode";
    const grouped = heads.value === "1";
    const shape = networkShapes({ ...networkExample, kvHeads: grouped ? 1 : 2 }, decode);
    document.querySelector("[data-nn-whole]")!.innerHTML = wholeNetworkDiagram(decode, grouped);
    const rows: [string, number[]][] = [
      ["Token IDs", shape.ids], ["Residual stream", shape.residual], ["Queries", shape.query],
      ["New keys / values, each", shape.newKV], ["Keys / values available, each", shape.cache],
      ["Attention scores", shape.scores], ["FFN hidden channels", shape.hidden], ["Vocabulary logits", shape.logits],
    ];
    document.querySelector("[data-nn-shapes]")!.innerHTML =
      `<p class="nn-mode-note">${decode ? "One new query position reads five key positions. The four-token prompt is already cached." : "Four query positions read their allowed prefix within the four-token prompt."}</p><dl class="nn-shapes">${rows.map(([label, values]) => `<div><dt>${label}</dt><dd><code>${shapeLabel(values)}</code></dd></div>`).join("")}</dl><p class="nn-note">KV state across all three layers: <strong>${shape.cacheElements} values</strong>, including both K and V. FFN matrices per layer: <strong>${shape.feedForwardParameters} weights</strong>.</p>`;
  };
  mode.addEventListener("change", renderShapes);
  heads.addEventListener("change", renderShapes);
  renderShapes();

  document.querySelectorAll<HTMLElement>("[data-nn-inspector]").forEach(figure => {
    const parts = explanations[figure.dataset.nnInspector!];
    const buttons = [...figure.querySelectorAll<SVGElement>("[data-nn-part]")];
    const select = (button: SVGElement) => {
      const [title, copy] = parts[button.dataset.nnPart!];
      buttons.forEach(b => b.setAttribute("aria-pressed", String(b === button)));
      figure.querySelector("[data-nn-description]")!.innerHTML = `<strong>${title}</strong><p>${copy}</p>`;
    };
    buttons.forEach(button => {
      button.addEventListener("click", () => select(button));
      button.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); select(button); }
      });
    });
    select(buttons[0]);
  });

  const magnitude = document.querySelector<HTMLInputElement>("[data-nn-magnitude]")!;
  const renderNorm = () => {
    const scale = Number(magnitude.value);
    const x = [3 * scale, 4 * scale];
    const normalized = rmsNormalize(x, [1, 1]);
    document.querySelector("[data-nn-magnitude-label]")!.textContent = `${scale}×`;
    document.querySelector("[data-nn-norm]")!.innerHTML = `<div><span>Input x</span><strong>[${x.join(", ")}]</strong></div><span aria-hidden="true">→</span><div><span>RMSNorm(x)</span><strong>[${normalized.map(n => n.toFixed(3)).join(", ")}]</strong></div><p>The bypass still carries [${x.join(", ")}]. Normalization changes the branch input.</p>`;
  };
  magnitude.addEventListener("input", renderNorm); renderNorm();

  const query = document.querySelector<HTMLSelectElement>("[data-nn-query]")!;
  const values = [[2, 0], [0, 2], [1, 1], [-1, 2]];
  const words = ["The", "small", "robot", "learns"];
  const renderAttention = () => {
    const position = Number(query.value);
    const { weights, output } = causalAttentionRow([1, 0, 2, -1], values, position);
    document.querySelector("[data-nn-attention-values]")!.innerHTML = `<div class="nn-attention-bars">${weights.map((weight, i) => `<div class="nn-weight-row ${i > position ? "is-masked" : ""}"><span>${i + 1} · ${words[i]}</span><div class="nn-weight-track"><i style="width:${weight * 100}%"></i></div><strong>${(weight * 100).toFixed(1)}%</strong><span>${i > position ? "masked" : `V = [${values[i].join(", ")}]`}</span></div>`).join("")}</div><p class="nn-weight-result">Weighted value = <strong>[${output.map(n => n.toFixed(3)).join(", ")}]</strong></p><p class="nn-note">${position === 0 ? "The first position has one allowed key, so its weight is 100% and its output equals that value vector." : `Query ${position + 1} reads ${position + 1} positions, including itself. The displayed percentages may differ slightly from 100% in total because of rounding.`}</p>`;
  };
  query.addEventListener("change", renderAttention); renderAttention();

  const gate = document.querySelector<HTMLInputElement>("[data-nn-gate]")!;
  const renderGate = () => {
    const input = Number(gate.value);
    const { activated, product } = swigluChannels([input], [2]);
    document.querySelector("[data-nn-gate-label]")!.textContent = input.toFixed(2);
    document.querySelector("[data-nn-gate-values]")!.innerHTML = `<div><span>Gate before SiLU</span><strong>${input.toFixed(2)}</strong></div><div><span>SiLU(gate)</span><strong>${activated[0].toFixed(3)}</strong></div><div><span>Up branch</span><strong>2.000</strong></div><div><span>Channel product</span><strong>${product[0].toFixed(3)}</strong></div><p>${input < 0 ? "A negative pre-activation can produce a negative gate. This channel is attenuated and its sign is flipped." : input === 0 ? "A zero gate removes this channel’s contribution, even though the up branch is nonzero." : "A positive gate can amplify the up branch. It is not constrained to the interval from zero to one."}</p>`;
  };
  gate.addEventListener("input", renderGate); renderGate();
}
