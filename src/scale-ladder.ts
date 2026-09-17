import "./scale-ladder.css";

// Conceptual silhouettes: repeated cells and trays do not specify hardware counts.
const path = (d: string, className = "") => `<path d="${d}" class="${className}"/>`;
const rect = (x: number, y: number, width: number, height: number, className = "") =>
  `<rect x="${x}" y="${y}" width="${width}" height="${height}" class="${className}"/>`;
const repeat = (count: number, draw: (index: number) => string) => Array.from({ length: count }, (_, index) => draw(index)).join("");

const scalar = `
  <ellipse class="scale-ground" cx="100" cy="159" rx="29" ry="5"/>
  <g class="scale-lift">
    <circle class="scale-wash" cx="100" cy="111" r="43"/>
    <circle class="scale-value" cx="100" cy="111" r="28"/>
    <text class="scale-number" x="100" y="117">0.7</text>
  </g>`;

const tensor = `
  <ellipse class="scale-ground" cx="101" cy="167" rx="65" ry="7"/>
  <g class="scale-lift">
    ${path("M34 76 108 42 173 74 99 111Z", "scale-back")}
    ${path("M34 76V134L99 167V111Z M99 111V167L173 130V74Z", "scale-side")}
    ${path("M34 95 99 129 173 93M34 115 99 149 173 112", "scale-muted")}
    ${path("M56 87V145M77 99V155M124 98V154M149 86V143", "scale-muted")}
    ${path("M59 65 124 99M84 53 149 87M56 87 130 53M78 99 151 64", "scale-muted")}
    ${path("M84 53 106 64 81 76 59 65Z", "scale-value")}
    ${path("M59 65V84L81 95V76", "scale-blue-side")}
    ${path("M81 76 106 64V83L81 95Z", "scale-blue-side")}
  </g>`;

const layer = `
  <ellipse class="scale-ground" cx="100" cy="165" rx="74" ry="6"/>
  <g class="scale-lift">
    ${path("M37 61 80 93M37 104 80 93M37 147 80 115M37 104 80 115M120 93 164 72M120 115 164 139", "scale-wire")}
    ${path("M37 104H80M120 104 164 72", "scale-signal")}
    ${[48, 91, 134].map((y, i) => rect(15, y, 23, 25, i === 1 ? "scale-value" : "scale-paper")).join("")}
    ${rect(79, 77, 42, 54, "scale-back")}
    <text class="scale-function" x="100" y="110">f</text>
    ${rect(164, 59, 22, 25, "scale-value")}${rect(164, 126, 22, 25, "scale-paper")}
    <circle class="scale-packet" cx="59" cy="104" r="3"/>
  </g>`;

const chip = `
  <ellipse class="scale-ground" cx="100" cy="166" rx="76" ry="7"/>
  ${path("M29 55H171V159H29Z", "scale-side")}
  <g class="scale-lift">
    ${repeat(9, i => path(`M${44 + i * 14} 45V33M${44 + i * 14} 149V161`, "scale-pin"))}
    ${repeat(6, i => path(`M29 ${57 + i * 16}H17M171 ${57 + i * 16}H183`, "scale-pin"))}
    ${rect(29, 45, 142, 104, "scale-back")}
    ${rect(42, 58, 20, 77, "scale-paper")}${rect(138, 58, 20, 77, "scale-paper")}
    ${repeat(6, i => path(`M46 ${66 + i * 12}H58M142 ${66 + i * 12}H154`, "scale-muted"))}
    ${rect(74, 66, 52, 61, "scale-ink-face")}
    ${repeat(3, row => repeat(3, col => rect(80 + col * 14, 75 + row * 14, 10, 10, row === 1 && col === 1 ? "scale-value" : "scale-die-cell")))}
    ${path("M62 97H74M126 97H138", "scale-signal")}
    <circle cx="35" cy="141" r="2" class="scale-muted"/>
  </g>`;

const rackDrawing = (x: number, y: number, size = 1, active = false) => `<g transform="translate(${x} ${y}) scale(${size})">
  ${path("M0 9 23 0 86 0 63 9Z", "scale-back")}
  ${path("M63 9 86 0V130L63 142Z", "scale-ink-face")}
  ${rect(0, 9, 63, 133, "scale-paper")}
  ${repeat(6, i => `<g${i === 2 ? ' class="scale-tray"' : ""}>${rect(7, 18 + i * 18, 49, 13, active && i === 2 ? "scale-value" : "scale-back")}${path(`M13 ${24 + i * 18}H33`, active && i === 2 ? "scale-blue-ink" : "scale-muted")}<circle cx="49" cy="${24 + i * 18}" r="1.5" class="${active && i === 2 ? "scale-packet" : "scale-muted"}"/></g>`)}
  ${path("M8 142V147M55 142V147", "scale-pin")}
  ${path("M70 25 80 21M70 34 80 30M70 43 80 39", "scale-die-cell")}
</g>`;

const rack = `<ellipse class="scale-ground" cx="101" cy="173" rx="56" ry="7"/><g class="scale-lift">${rackDrawing(58, 20, 1, true)}</g>`;
const cluster = `
  ${path("M9 137 101 91 195 135 101 183Z", "scale-ground")}
  ${path("M44 112V145L101 173 160 144V110M101 173V123", "scale-wire")}
  ${path("M44 112V145L101 173V123", "scale-signal")}
  <g class="scale-lift">${rackDrawing(78, 17, .6)}${rackDrawing(17, 54, .6, true)}${rackDrawing(133, 54, .6)}</g>
  ${path("M87 166 101 159 115 166 101 173Z", "scale-value")}
  ${path("M87 166V172L101 179 115 172V166M101 173V179", "scale-blue-side")}
  <circle class="scale-packet" cx="70" cy="158" r="3"/>`;

const levels = [
  { name: "Scalar", detail: "One value", target: "tensors", drawing: scalar },
  { name: "Tensor", detail: "Values with shape", target: "tensors", drawing: tensor },
  { name: "Layer", detail: "Connected operations", target: "transformer", drawing: layer },
  { name: "Chip", detail: "Compute + memory", target: "gpu", drawing: chip },
  { name: "Rack", detail: "A scale-up domain", target: "rack", drawing: rack },
  { name: "Cluster", detail: "Connected domains", target: "training", drawing: cluster },
];

export const scaleLadderMarkup = `<nav class="scale-ladder scale-atlas" data-scale-ladder aria-label="Explore the scale ladder">
  ${levels.map((level, index) => `<a class="scale-level" href="#${level.target}" style="--scale-step: ${index}" aria-label="${level.name}: ${level.detail}. Open lesson.">
    <svg viewBox="0 0 200 190" width="200" height="190" aria-hidden="true" focusable="false">${level.drawing}</svg>
    <span class="scale-label">${level.name}<span class="scale-link-arrow" aria-hidden="true">↗</span></span>
    <small>${level.detail}</small>
  </a>`).join("")}
</nav>`;

/** Reveal the illustrated sequence once; navigation and artwork work without it. */
export function initializeScaleLadder() {
  const ladder = document.querySelector<HTMLElement>("[data-scale-ladder]");
  if (!ladder || !window.IntersectionObserver || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    ladder.classList.add("scale-arrived");
    observer.disconnect();
  }, { threshold: .2 });
  observer.observe(ladder);
}
