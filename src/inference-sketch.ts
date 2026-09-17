/** Deterministic pen-like outlines for schematics; quantitative marks keep exact coordinates. */
export function sketchBox(x: number, y: number, width: number, height: number, attributes = "") {
  const right = x + width, bottom = y + height;
  return `<path d="M${x + 1} ${y + 1} Q${x + width * .48} ${y - 1.2} ${right - 1} ${y + .6} Q${right + 1.2} ${y + height * .51} ${right - .5} ${bottom - 1} Q${x + width * .49} ${bottom + 1.3} ${x + .7} ${bottom - .4} Q${x - 1.1} ${y + height * .48} ${x + 1} ${y + 1} Z" stroke-linecap="round" stroke-linejoin="round" ${attributes}/>`;
}

/** A slightly bowed stroke with an explicit arrowhead, from producer to consumer. */
export function sketchArrow(x1: number, y1: number, x2: number, y2: number, attributes = "") {
  const angle = Math.atan2(y2 - y1, x2 - x1), size = 6;
  const head = (offset: number) => `${x2 - size * Math.cos(angle + offset)} ${y2 - size * Math.sin(angle + offset)}`;
  return `<path d="M${x1} ${y1} Q${(x1 + x2) / 2 - Math.sin(angle) * 1.2} ${(y1 + y2) / 2 + Math.cos(angle) * 1.2} ${x2} ${y2} M${head(.48)} L${x2} ${y2} L${head(-.48)}" fill="none" stroke-linecap="round" stroke-linejoin="round" ${attributes}/>`;
}
