import { quadraticLoss, type OptimizerState } from "./optimizer-math";
import "./optimizer-diagram.css";

const point = (x: number, y: number) => `${x.toFixed(2)},${y.toFixed(2)}`;
const text = (x: number, y: number, value: string, anchor = "middle", className = "") =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" class="${className}">${value}</text>`;

/** Plot the actual optimizer states against the same objective used by the lab. */
export function optimizerLandscape(history: OptimizerState[], width: number) {
  const height = 320;
  const left = 36, right = width - 28, top = 28, bottom = height - 52;
  const cx = (left + right) / 2, cy = (top + bottom) / 2;
  const extentX = Math.max(4.5, ...history.map(s => Math.abs(s.weight[0]) * 1.25));
  const extentY = Math.max(1.7, ...history.map(s => Math.abs(s.weight[1]) * 1.25));
  const scale = Math.min((right - left) / (2 * extentX), (bottom - top) / (2 * extentY));
  const px = (x: number) => cx + x * scale, py = (y: number) => cy - y * scale;
  const current = history.at(-1)!, start = history[0];
  const [sx, sy] = [px(start.weight[0]), py(start.weight[1])];
  const [nx, ny] = [px(current.weight[0]), py(current.weight[1])];
  const levels = [8, 4, 2, 1, .5, .125];
  const fills = ["#f0f2eb", "#e9eee2", "#e3e9db", "#dce5d2", "#d6e1ca", "#cfdcbe"];
  // L = (x² + 12y²)/2: every ellipse is a true level set, with equal axis scales.
  const contours = levels.map((loss, i) => `<ellipse cx="${cx}" cy="${cy}" rx="${Math.sqrt(2 * loss) * scale}" ry="${Math.sqrt(2 * loss / 12) * scale}" fill="${fills[i]}" class="optimizer-contour"/>`).join("");
  const ticks = [-4, -2, 0, 2, 4].map(x => `<path d="M${px(x)} ${bottom}v5"/>${text(px(x), bottom + 21, String(x))}`).join("")
    + [-1, 0, 1].map(y => `<path d="M${left - 5} ${py(y)}h5"/>${text(left - 10, py(y) + 4, String(y), "end")}`).join("");
  const trail = history.map(s => point(px(s.weight[0]), py(s.weight[1]))).join(" ");
  const positions = history.slice(1, -1).map(s => `<circle cx="${px(s.weight[0])}" cy="${py(s.weight[1])}" r="2.5" class="optimizer-visited"/>`).join("");
  const showCurrentLabel = Math.hypot(nx - sx, ny - sy) > 42 && Math.hypot(nx - cx, ny - cy) > 28;
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="optimizer-landscape-title optimizer-landscape-description">
    <title id="optimizer-landscape-title">Parameter path on the loss landscape</title>
    <desc id="optimizer-landscape-description">Equal-loss contours for L(x,y) = (x squared + 12 y squared) / 2. Both axes use the same scale. Start at (2,1); update ${current.step} is at (${current.weight.map(n => n.toFixed(5)).join(", ")}). The minimum is (0,0).</desc>
    ${contours}
    <g class="optimizer-axes"><path d="M${left} ${top}V${bottom}H${right}"/>${ticks}</g>
    <path class="optimizer-zero" d="M${left} ${cy}H${right}M${cx} ${top}V${bottom}"/>
    ${text(right, bottom + 21, "x", "end")}${text(left, top - 12, "y")}
    <polyline points="${trail}" class="optimizer-path"/>${positions}
    <circle cx="${sx}" cy="${sy}" r="5" class="optimizer-start"/>
    ${text(sx + 10, sy - 13, "Start", "start", "optimizer-label")}
    <circle cx="${cx}" cy="${cy}" r="3.5" class="optimizer-minimum"/>
    <path d="M${cx} ${cy + 8}v${Math.max(30, scale * .8)}" class="optimizer-leader"/>
    ${text(cx, cy + Math.max(50, scale * .8 + 28), "Minimum · (0, 0)", "middle", "optimizer-label")}
    <circle cx="${nx}" cy="${ny}" r="8" class="optimizer-current-halo"/>
    <circle cx="${nx}" cy="${ny}" r="4.5" class="optimizer-current"/>
    ${showCurrentLabel ? text(nx + 12, ny - 12, "Now", "start", "optimizer-label") : ""}
  </svg>`;
}

export function optimizerLossChart(history: OptimizerState[], width: number) {
  const height = 320, left = 38, right = width - 22, top = 28, bottom = height - 52;
  const losses = history.map(s => quadraticLoss(s.weight));
  const ceiling = Math.max(10, Math.ceil(Math.max(...losses) / 2) * 2);
  const px = (step: number) => left + step / 20 * (right - left);
  const py = (loss: number) => bottom - loss / ceiling * (bottom - top);
  const current = history.at(-1)!;
  const points = history.map((s, i) => point(px(s.step), py(losses[i])));
  const grid = [0, ceiling / 2, ceiling].map(value => `<path d="M${left} ${py(value)}H${right}"/>${text(left - 10, py(value) + 4, String(value), "end")}`).join("");
  const ticks = [0, 5, 10, 15, 20].map(step => text(px(step), bottom + 23, String(step))).join("");
  const area = history.length > 1 ? `<path d="M${px(0)} ${bottom}L${points.join("L")}L${px(current.step)} ${bottom}Z" class="optimizer-loss-area"/>` : "";
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="optimizer-loss-title optimizer-loss-description">
    <title id="optimizer-loss-title">Loss after each applied update</title>
    <desc id="optimizer-loss-description">Loss starts at ${losses[0].toFixed(5)} and is ${losses.at(-1)!.toFixed(5)} after ${current.step} updates. Only applied updates are drawn. Exact values are in the update history.</desc>
    <g class="optimizer-loss-grid">${grid}</g>${ticks}${text(left, top - 12, "Loss", "start")}${text(right, height - 6, "Update", "end")}
    <path d="M${left} ${py(losses[0])}H${right}" class="optimizer-baseline"/>
    ${text(right, py(losses[0]) - 10, "Initial loss · 8", "end")}
    ${area}<polyline points="${points.join(" ")}" class="optimizer-path"/>
    ${history.slice(0, -1).map((s, i) => `<circle cx="${px(s.step)}" cy="${py(losses[i])}" r="2.5" class="optimizer-visited"/>`).join("")}
    <circle cx="${px(current.step)}" cy="${py(losses.at(-1)!)}" r="4.5" class="optimizer-current"/>
  </svg>`;
}
