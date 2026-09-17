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
  `<svg viewBox="0 0 ${width} ${height}" class="nn-svg" aria-labelledby="${id}-title ${id}-desc"><title id="${id}-title">${title}</title><desc id="${id}-desc">${description}</desc><defs><marker id="${id}-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7" fill="context-stroke"/></marker></defs>`;

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
  const mask = Array.from({length:16},(_,i)=>{const row=Math.floor(i/4),col=i%4;return `<rect class="nn-mask-cell ${col<=row?'is-visible':'is-masked'}" x="${88+col*22}" y="${380+row*22}" width="20" height="20"/>${col>row?`<text x="${98+col*22}" y="${395+row*22}" class="nn-mask-mark">×</text>`:''}`;}).join('');
  return start("nn-attn", 800, 514, "Inside causal self-attention", "Queries and keys produce scores over token positions. A causal mask removes future positions before softmax. The resulting probabilities weight value vectors, then the heads are joined and projected.") +
    `<rect class="nn-operation-region" x="32" y="104" width="736" height="111"/><text x="48" y="199" class="nn-annotation">Split into H query heads and Hkv key/value heads; apply RoPE to Q and K.</text>` +
    line("M400 76V92H164V124M400 92V124M400 92H636V124M164 176V238H180V270M400 176V238H350V270M448 296H532M636 176V270M612 322V396M612 448V483",a) +
    partBox(280,24,240,"Normalized input X","[B, Tq, D]","input") +
    partBox(64,124,200,"Query Q","Linear Wq → RoPE","query") +
    partBox(300,124,200,"Key K","Linear Wk → RoPE → cache","key") +
    partBox(536,124,200,"Value V","Linear Wv → cache","value") +
    partBox(88,270,360,"Scores → mask → softmax","P = softmax(QKᵀ / √dh + causal mask)","scores") +
    partBox(532,270,160,"Weighted values","P × V","mix") +
    partBox(480,396,264,"Join heads → Wo","[B, Tq, D]","project") +
    `<text x="88" y="345" class="nn-annotation">Per head: [Tq, Tk] probabilities</text><text x="536" y="345" class="nn-annotation">Per head: [Tq, dh]</text>${mask}<text x="194" y="399" class="nn-annotation">Example: Tq = Tk = 4</text><text x="194" y="421" class="nn-annotation">Rows: query positions</text><text x="194" y="443" class="nn-annotation">Columns: key positions</text><text x="194" y="465" class="nn-annotation">× future key · masked before softmax</text><text x="612" y="506" class="nn-node-sub">To the residual addition</text></svg>`;
};

export const feedForwardDiagram = () => {
  const a="nn-ffn-arrow";
  const channels=(x:number,y:number,count:number)=>Array.from({length:count},(_,i)=>`<rect class="nn-channel" x="${x+i*9}" y="${y}" width="7" height="13"/>`).join('');
  return start("nn-ffn",760,494,"Inside a SwiGLU feed-forward network","Two independent linear maps expand the same token to 24 channels. SiLU gates one branch; corresponding channels are multiplied. The down projection restores eight channels without mixing token positions.")+
    line("M380 76V95H195V120M380 95H565V120M195 172V226H316V256M565 172V226H448V256M380 308V372M380 424V466",a)+
    partBox(260,24,240,"One normalized token","D = 8 channels","input")+
    partBox(80,120,230,"Gate projection → SiLU","Wgate [8, 24]","gate")+
    partBox(450,120,230,"Up projection","Wup [8, 24]","up")+
    channels(88,190,24)+channels(458,190,24)+
    partBox(260,256,240,"Elementwise multiply","SiLU(xWgate) ⊙ (xWup)","multiply")+
    channels(274,326,24)+
    partBox(260,372,240,"Down projection","Wdown [24, 8]","down")+
    channels(344,442,8)+
    `<text x="65" y="284" class="nn-annotation">24 paired channels</text><text x="532" y="284" class="nn-annotation">Each token is processed</text><text x="532" y="306" class="nn-annotation">independently with</text><text x="532" y="328" class="nn-annotation">the same weights.</text><text x="380" y="490" text-anchor="middle" class="nn-annotation">8-channel update → residual addition</text></svg>`;
};

export const embeddingDiagram = () => {
  const a="nn-embed-arrow";
  const ids=[7,2,9,4];
  const values=[[.2,-.1,.8,0,.3,-.4,.1,.6],[-.3,.5,.1,.9,0,.2,-.2,.4],[.7,.1,-.5,.2,.6,0,.3,-.1],[0,.4,.2,-.3,.8,.1,.5,-.2]];
  const row=(x:number,y:number,data:number[])=>data.map((value,c)=>`<rect class="nn-lookup-cell" x="${x+c*34}" y="${y}" width="32" height="30"/><text class="nn-lookup-value" x="${x+c*34+16}" y="${y+20}" text-anchor="middle">${value.toFixed(1)}</text>`).join('');
  return start("nn-embed",900,256,"Embedding is an exact row lookup","Toy embedding values are copied without arithmetic. IDs 7, 2, 9 and 4 select those rows of E in the requested order; the same numerical vectors appear in the output.")+
    `<text x="66" y="30" class="nn-node-title">IDs</text><text x="330" y="30" class="nn-node-title">E [32, 8] · selected rows</text><text x="723" y="30" class="nn-node-title">X [1, 4, 8] · token order</text>`+
    ids.map((id,r)=>`<rect class="nn-tile" x="38" y="${53+r*39}" width="56" height="30"/><text x="66" y="${74+r*39}" class="nn-node-title">${id}</text>`+line(`M94 ${68+r*39}H171M470 ${68+r*39}H573`,a)+`<text x="190" y="${74+r*39}" class="nn-row-id" text-anchor="end">${id}</text>`+row(198,53+r*39,values[r])+row(582,53+r*39,values[r])).join('')+
    `<text x="450" y="242" text-anchor="middle" class="nn-annotation">Declared toy weights · each output vector exactly copies its selected row · other vocabulary rows omitted</text></svg>`;
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
