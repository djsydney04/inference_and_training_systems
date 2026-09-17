/** Original pen-style schematics. Coordinates are illustrative; labels carry exact values. */
export const ink = (path: string, blue = false) => `<path class="notebook-ink${blue ? " notebook-blue" : ""}" d="${path}"/>`;
export const label = (x: number, y: number, text: string, small = false) =>
  `<text x="${x}" y="${y}"${small ? ' class="notebook-small"' : ""}>${text}</text>`;
const box = (x: number, y: number, width: number, height: number) => ink(
  `M${x + 2} ${y + 1} Q${x + width / 2} ${y - 2} ${x + width} ${y + 1} L${x + width - 1} ${y + height} Q${x + width / 2} ${y + height + 2} ${x} ${y + height - 1} Z M${x + 4} ${y + 4} Q${x + width / 2} ${y + 1} ${x + width - 4} ${y + 3}`,
);
export const arrow = (x1: number, y1: number, x2: number, y2: number, blue = false) => {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const wing = (offset: number) => `${x2 - 9 * Math.cos(angle + offset)} ${y2 - 9 * Math.sin(angle + offset)}`;
  return ink(`M${x1} ${y1} Q${(x1 + x2) / 2 + 2} ${(y1 + y2) / 2 - 2} ${x2} ${y2} M${wing(.5)} L${x2} ${y2} L${wing(-.5)}`, blue);
};
export const figure = (title: string, description: string, height: number, drawing: string, boundary: string) => `
<figure class="notebook-figure">
  <figcaption><span>Worked drawing</span><strong>${title}</strong><p>${description}</p></figcaption>
  <div class="notebook-scroll" tabindex="0" role="region" aria-label="${title}; scroll horizontally on narrow screens">
    <svg viewBox="0 0 680 ${height}" width="680" height="${height}" role="img" aria-label="${description}" xmlns="http://www.w3.org/2000/svg">${drawing}</svg>
  </div>
  <p class="figure-boundary">${boundary}</p>
</figure>`;

export const probabilityTree = figure(
  "Multiply along a path; add across alternatives",
  "A has probability 0.6 and B has probability 0.4. After A, x and y have probabilities 0.5 each. After B, x has probability 0.9 and y has probability 0.1.",
  300,
  box(22, 121, 90, 50) + label(41, 153, "prefix") +
  arrow(112, 135, 254, 71) + arrow(112, 159, 254, 229, true) +
  label(160, 87, "0.6") + label(160, 225, "0.4") +
  box(255, 45, 62, 50) + label(278, 77, "A") +
  box(255, 205, 62, 50) + label(278, 237, "B") +
  arrow(318, 62, 474, 36) + arrow(318, 80, 474, 109) +
  arrow(318, 220, 474, 190, true) + arrow(318, 240, 474, 267) +
  label(376, 36, "0.5") + label(376, 119, "0.5") +
  label(376, 181, "0.9") + label(376, 279, "0.1") +
  label(493, 43, "Ax: 0.30") + label(493, 116, "Ay: 0.30") +
  label(493, 197, "Bx: 0.36") + label(493, 274, "By: 0.04") +
  ink("M490 204 Q551 207 612 201", true),
  "Two generated positions and an invented vocabulary. Branch lengths do not encode probabilities. The four leaf probabilities sum to one; all values are explained in the text.",
);

export const gradientFork = figure(
  "A shared input receives both gradient contributions",
  "At x = 2, the squared branch contributes derivative 4 and the three-times-x branch contributes derivative 3. Their sum gives dy/dx = 7.",
  255,
  box(22, 101, 90, 50) + label(40, 133, "x = 2") +
  arrow(112, 113, 249, 55) + arrow(112, 140, 249, 204) +
  box(250, 29, 122, 50) + label(270, 61, "a = x²") +
  box(250, 179, 122, 50) + label(269, 211, "b = 3x") +
  arrow(373, 55, 499, 112) + arrow(373, 204, 499, 139) +
  box(500, 100, 156, 53) + label(518, 133, "y = a + b") +
  label(399, 51, "∂y/∂a = 1", true) + label(397, 226, "∂y/∂b = 1", true) +
  label(142, 45, "da/dx = 4", true) + label(143, 228, "db/dx = 3", true) +
  label(41, 179, "4 + 3 = 7", true) + ink("M38 186 Q91 189 135 184", true),
  "A scalar computation graph with exact derivatives. Arrows show forward dependence. Backward traverses the same dependencies in reverse, adding at shared inputs.",
);

export const runtimePipeline = figure(
  "A buffer is reusable after its last reader finishes",
  "Host input A is copied before kernel A reads it. Copy B can overlap kernel A using a separate buffer. The device buffer for A cannot be overwritten until kernel A completes.",
  265,
  label(24, 40, "copy engine", true) + label(24, 119, "compute", true) +
  arrow(156, 238, 648, 238) + label(539, 260, "time →", true) +
  box(165, 20, 116, 42) + label(181, 48, "copy A") +
  box(291, 20, 119, 42) + label(306, 48, "copy B") +
  box(291, 94, 180, 44) + label(313, 123, "kernel A") +
  box(487, 94, 160, 44) + label(507, 123, "kernel B") +
  arrow(282, 42, 293, 92, true) + arrow(411, 43, 485, 92, true) +
  ink("M294 167 Q388 171 474 167 M295 161 L294 175 M474 161 L475 175", true) +
  label(264, 199, "A remains live throughout kernel A", true),
  "A possible schedule with independent copy and compute resources. Widths are schematic. Actual overlap depends on device capabilities, memory type, stream dependencies and contention.",
);
