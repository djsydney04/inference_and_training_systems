import { chapters, learningPaths } from "./curriculum";

const glyph = (kind: string) => {
  const common = 'viewBox="0 0 360 180" fill="none" aria-hidden="true"';
  if (kind === "matmul")
    return `<svg ${common}>${[
      [36, 25],
      [157, 25],
      [157, 110],
    ]
      .map(([x, y], matrix) =>
        Array.from(
          { length: 12 },
          (_, i) =>
            `<rect x="${x + (i % 4) * 23}" y="${y + Math.floor(i / 4) * 19}" width="19" height="15" fill="${matrix === 2 ? "#4e6051" : i % 4 < 2 && i < 8 ? "#2559d6" : "#c7d2c3"}"/>`,
        ).join(""),
      )
      .join(
        "",
      )}<path d="M83 96v47h62m-5-4 5 4-5 4M202 87v15m-4-5 4 5 4-5" stroke="#2559d6"/><path d="M277 112h45m-45 21h45m-45 21h28" stroke="#8b9b87"/></svg>`;
  if (kind === "replicas")
    return `<svg ${common}><rect x="43" y="24" width="102" height="42" fill="#b6c7b2"/><rect x="215" y="24" width="102" height="42" fill="#b6c7b2"/><path d="M63 43h20m12 0h28M235 43h20m12 0h28" stroke="#40563e" stroke-width="4"/><path d="M94 66v31h86m86-31v31h-86v25m-5-5 5 5 5-5" stroke="#2559d6" stroke-width="2"/><rect x="125" y="129" width="110" height="30" fill="#2559d6"/></svg>`;
  if (kind === "training")
    return `<svg ${common}>${[0, 1, 2, 3].map((row) => `<rect x="35" y="${25 + row * 35}" width="50" height="23" fill="#515f53"/><rect x="89" y="${25 + row * 35}" width="50" height="23" fill="#a7b7a6"/><rect x="143" y="${25 + row * 35}" width="${row === 0 ? 175 : 42}" height="23" fill="#2559d6"/>`).join("")}<path d="M208 75v71m-4-5 4 5 4-5" stroke="#2559d6"/><path d="M227 87h96M227 119h96M227 151h96" stroke="#adb8aa"/></svg>`;
  if (kind === "mask")
    return `<svg ${common}>${[0, 1].map((row) => Array.from({ length: 8 }, (_, i) => `<rect x="${34 + i * 37}" y="${30 + row * 79}" width="29" height="29" fill="${i < (row === 0 ? 3 : 5) ? "#d3d9ce" : "#2559d6"}"/>`).join("")).join("")}<path d="M164 68v25m-5-5 5 5 5-5M275 68v25m-5-5 5 5 5-5" stroke="#2559d6"/><path d="M34 152h177m14 0h105" stroke="#59625b"/></svg>`;
  if (kind === "cpu")
    return `<svg ${common}><rect x="24" y="69" width="61" height="40" fill="#9caf9e"/><rect x="117" y="28" width="60" height="124" fill="#d2d9ce"/>${[0, 1, 2].map((i) => `<rect x="218" y="${26 + i * 49}" width="53" height="32" fill="${i === 1 ? "#2559d6" : "#4e6051"}"/><path d="M177 ${44 + i * 48}h41M271 ${44 + i * 48}h42" stroke="#2559d6"/>`).join("")}<rect x="313" y="26" width="22" height="130" fill="#a8b7a4"/><path d="M85 89h32M140 48h15m-15 21h15m-15 21h15m-15 21h15m-15 21h15" stroke="#2559d6"/></svg>`;
  if (kind === "gpu")
    return `<svg ${common}><path d="M40 100 164 30 322 90 196 158Z" fill="#b5bdb4" stroke="#59625b"/><path d="M125 82 177 54 240 79 187 108Z" fill="#303a34"/>${Array.from({ length: 12 }, (_, i) => `<path d="M${139 + (i % 4) * 13 - Math.floor(i / 4) * 8} ${79 + Math.floor(i / 4) * 7 + (i % 4) * 5}l9-5 9 4-9 5Z" fill="#aebbb4"/>`).join("")}<path d="m66 101 34-20 30 12-34 20Zm159 13 34-20 30 12-34 20ZM92 64l34-20 30 12-34 20Zm153 5 34-20 30 12-34 20Z" fill="#2559d6"/><path d="M192 112v35M103 76l19 8M220 110l16 7" stroke="#2559d6" stroke-width="2"/></svg>`;
  if (kind === "rack")
    return `<svg ${common}>${[79, 159, 239].map((x) => `<path d="M${x} 22h59v142h-59Z" fill="#e0e1d9" stroke="#59625b"/>${Array.from({ length: 10 }, (_, i) => `<rect x="${x + 5}" y="${28 + i * 13}" width="49" height="8" fill="${i === 4 || i === 5 ? "#2559d6" : "#505b52"}"/>`).join("")}`).join("")}<path d="M108 13h160M108 13v9m80-9v9m80-9v9" stroke="#2559d6"/></svg>`;
  if (kind === "lpu")
    return `<svg ${common}>${Array.from({ length: 7 }, (_, i) => `<rect x="${38 + i * 42}" y="32" width="31" height="116" fill="${i === 3 ? "#8d9c8f" : i === 2 || i === 4 ? "#2559d6" : "#b1bbb1"}"/>`).join("")}${[57, 82, 107, 132].map((y) => `<path d="M20 ${y}h320m-8-4 8 4-8 4" stroke="#303a34"/>`).join("")}</svg>`;
  if (kind === "cache")
    return `<svg ${common}><rect x="32" y="33" width="94" height="31" stroke="#59625b"/><rect x="32" y="114" width="94" height="31" stroke="#59625b"/>${[0, 1, 2, 3].map((i) => `<rect x="${198 + (i % 2) * 61}" y="${28 + Math.floor(i / 2) * 73}" width="43" height="45" fill="${i === 0 ? "#2559d6" : "#c5cec4"}"/>`).join("")}<path d="M126 49h31v-1h41M126 129h31V51h41M126 129h50v-4h83" stroke="#2559d6" stroke-width="2"/></svg>`;
  if (kind === "trace")
    return `<svg ${common}>${[0, 1, 2].map((i) => `<path d="M35 ${48 + i * 43}h294" stroke="#c1c6bc"/>`).join("")}<path d="M65 35h60v24H65Zm74 43h75v24h-75Zm60 43h109v24H199Z" fill="#2559d6"/><path d="M136 34v115M224 34v115" stroke="#59625b" stroke-dasharray="3 4"/></svg>`;
  return `<svg ${common}>${Array.from({ length: 36 }, (_, i) => `<rect x="${97 + (i % 6) * 27}" y="${16 + Math.floor(i / 6) * 27}" width="22" height="22" fill="${i % 6 <= Math.floor(i / 6) ? "#2559d6" : "#dce1d8"}" opacity="${i % 6 === Math.floor(i / 6) ? 1 : 0.6}"/>`).join("")}</svg>`;
};

export const galleryItems = [
  {
    kind: "attention",
    id: "speculative-exactness",
    title: "Account for every proposed token",
    scope: "Proposal → acceptance → corrected distribution",
    copy: "Change proposal quality and trace the probability mass that exact speculative sampling accepts or repairs.",
    type: "Inference methods lab",
  },
  {
    kind: "training",
    id: "optimizer-state",
    title: "One loss, three optimizers",
    scope: "Gradient → history → parameter update",
    copy: "Compare SGD, momentum and AdamW on a shared objective; inspect every update and its stored state.",
    type: "Training methods lab",
  },
  {
    kind: "matmul",
    id: "tiled-matmul",
    title: "Inside a matrix multiplication",
    scope: "Global loads → shared tiles → partial sums",
    copy: "Inspect actual operands, step through both barriers, and test the ragged edge of a matrix.",
    type: "Numerical 3D workbench",
  },
  {
    kind: "replicas",
    id: "replica-update",
    title: "Do the replicas agree?",
    scope: "Targets → gradients → one update",
    copy: "Run a real two-replica TensorFlow experiment and compare it with an unpartitioned reference.",
    type: "Verified runtime lesson",
  },
  {
    kind: "training",
    id: "training-state",
    title: "Where does training memory go?",
    scope: "Parameters → gradients → optimizer",
    copy: "Change the ZeRO stage and reconcile model-state memory with a global token budget.",
    type: "Training calculator",
  },
  {
    kind: "mask",
    id: "post-training-loss",
    title: "Which tokens change the policy?",
    scope: "Prompt → response mask → objective",
    copy: "Connect demonstrations and preferences to the exact likelihoods being optimized.",
    type: "Post-training worked lesson",
  },
  {
    kind: "cpu",
    id: "cpu-execution",
    title: "A core can work out of order",
    scope: "Rename → ready work → retirement",
    copy: "Step through CPU execution and distinguish logical state from speculative work.",
    type: "CPU mechanism lab",
  },
  {
    kind: "gpu",
    id: "gpu",
    title: "Inside the GPU",
    scope: "Package → SM → operand",
    copy: "Inspect execution partitions, register banks and staged matrix operands.",
    type: "3D workbench",
  },
  {
    kind: "rack",
    id: "rack",
    title: "A rack is a network",
    scope: "Tray → switch → fabric",
    copy: "Connect compute, communication, power and cooling at rack scale.",
    type: "3D workbench",
  },
  {
    kind: "lpu",
    id: "lpu",
    title: "Scheduled tensor streams",
    scope: "SRAM → matrix → vector",
    copy: "Step through the compiler-owned path of an activation tile.",
    type: "3D workbench",
  },
  {
    kind: "attention",
    id: "flashattention",
    title: "Attention without the matrix",
    scope: "HBM → running statistics",
    copy: "Watch an online softmax preserve the result across tiles.",
    type: "Numerical lab",
  },
  {
    kind: "cache",
    id: "paged-kv",
    title: "Who owns these KV blocks?",
    scope: "Logical → physical memory",
    copy: "Grow two requests and see how shared prefixes survive reclamation.",
    type: "Stateful lab",
  },
  {
    kind: "trace",
    id: "performance",
    title: "Find the exposed bottleneck",
    scope: "CPU → GPU → network",
    copy: "Change overlap in an illustrative training trace and inspect step time.",
    type: "Performance lab",
  },
];

export const galleryMarkup = `<section id="gallery" class="atlas-gallery" aria-labelledby="gallery-title"><header><p class="home-kicker">Systems gallery</p><h1 id="gallery-title">Open the machine.<br>Follow the work.</h1><p>Each instrument connects a physical or mathematical mechanism to the lesson that explains it.</p></header><div class="gallery-list">${galleryItems.map((item, i) => `<a class="gallery-entry" href="#${item.id}"><div class="gallery-preview">${glyph(item.kind)}</div><div><span>${item.type}</span><h2>${item.title}</h2><p>${item.copy}</p><small>${item.scope}</small></div><b aria-hidden="true">${String(i + 1).padStart(2, "0")}</b></a>`).join("")}</div></section>`;

export const homeMarkup = `<section id="top" class="atlas-home" aria-labelledby="home-title">
  <header class="home-intro"><p class="home-kicker">An open, interactive textbook</p><h1 id="home-title">Machine Learning<br>Systems</h1><p class="home-disciplines">Training. Hardware. Inference.</p><p class="home-description">Understand how models learn, how machines execute them, and how to make the complete system work.</p><div class="home-actions"><a class="primary-action" href="#orientation">Start the curriculum</a><a class="text-action" href="#gallery">Explore the systems gallery</a></div></header>
  <section class="curriculum-map" aria-label="How the curriculum connects"><div class="map-lifecycle"><a href="#tensors"><span>Understand</span><strong>Tensors & models</strong><small>shapes · gradients · attention</small></a><i>→</i><a href="#data"><span>Train</span><strong>Data → optimizer</strong><small>pre-training · adaptation</small></a><i>→</i><a href="#inference"><span>Serve</span><strong>Requests → tokens</strong><small>state · scheduling · latency</small></a></div><a class="map-hardware" href="#machine"><span>Underneath every stage</span><strong>CPU / GPU / LPU <i>→</i> memory <i>→</i> interconnect <i>→</i> cluster</strong></a></section>
  <section class="path-section"><div><p class="home-kicker">Choose a reading path</p><h2>One foundation.<br> Several ways in.</h2><p>The full sequence builds from first principles. Focused paths connect the chapters used together in engineering work.</p></div><div class="path-picker"><div role="group" aria-label="Learning path">${learningPaths.map((path, i) => `<button data-learning-path="${path.id}" aria-pressed="${i === 0}" class="${i === 0 ? "is-active" : ""}">${path.title}</button>`).join("")}</div><p data-path-description>${learningPaths[0].description}</p><ol data-path-route>${learningPaths[0].route.map((id) => `<li><a href="#${id}">${chapters.find((c) => c.id === id)?.title}</a></li>`).join("")}</ol></div></section>
  <section class="home-feature"><div class="home-machine-plate">${glyph("gpu")}</div><div><p class="home-kicker">From a label to a mechanism</p><h2>Why does a fast chip wait?</h2><p>Start at a GPU package, open an SM, and follow an operand from memory to execution. Then connect the model to a profiler trace.</p><a href="#gpu">Open the GPU workbench</a></div></section>
  <section class="home-standard"><h2>Learn it. Build it. Prove it.</h2><p>Worked equations explain the mechanism. Labs make it observable. Engineering projects ask for correctness tests, traces, failure recovery, and a clear account of what improved.</p><a href="#projects">See the engineering projects</a><small>A developing curriculum, not a hiring guarantee. Advanced roles also require substantial implementation and research experience.</small></section>
</section>`;
