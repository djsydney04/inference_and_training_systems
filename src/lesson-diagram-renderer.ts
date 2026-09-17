import { subjectDiagram } from "./lesson-subject-diagrams";
import type { LessonVisual } from "./lesson-visual-data";
const escape = (s: string) => s.replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]!);
type Bounds = [number, number, number, number];
const words = (s: string, limit: number) => {
  const lines: string[] = [];
  for (const word of s.split(/\s+/)) {
    const last = lines.length - 1;
    if (last < 0 || lines[last].length + word.length + 1 > limit) lines.push(word);
    else lines[last] += ` ${word}`;
  }
  return lines;
};
const linesFor = (s: string, width: number, cls: string) => words(s, Math.floor(width / (cls === 'lv-label' ? 8.4 : 7)));
const label = (s: string, x: number, y: number, width: number, cls: string, lineHeight = 20) => `<text x="${x}" y="${y}" class="${cls}">${linesFor(s, width, cls).map((part, i) => `<tspan x="${x}" dy="${i ? lineHeight : 0}">${escape(part)}</tspan>`).join('')}</text>`;
const arrow = (id: string, path: string) => `<path class="lv-wire" d="${path}" marker-end="url(#${id})"/>`;

/** Short labels lead; annotations are optional. Geometry never implies capacity. */
export function lessonDiagram(topic: LessonVisual, detailed = false, selected = 0) {
  const subject = subjectDiagram(topic, detailed, selected);
  if (subject) return subject;
  const n = topic.steps.length, id = `${topic.id}-visual-arrow`;
  const rows = ['memory', 'hierarchy'].includes(topic.kind);
  const cycle = topic.kind === 'cycle', fork = topic.kind === 'fork';
  const special = topic.id === 'math-reading-kit';
  const comparisonGrid = topic.kind === "compare" && n === 4;
  const columns = comparisonGrid ? 2 : n;
  const gap = 48, nodeWidth = (804 - gap * (columns - 1)) / columns;
  const contentHeight = (w: number) => Math.max(...topic.steps.map(step =>
    linesFor(step.label, w - 40, 'lv-label').length * 20 +
    (detailed ? 16 + linesFor(step.detail, w - 40, 'lv-detail').length * 18 : 0)));
  const flowHeight = Math.max(100, contentHeight(nodeWidth) + 48);
  const branchHeight = Math.max(96, contentHeight(fork ? 220 : 228) + 40);
  const rowHeight = Math.max(68, ...topic.steps.map(step => Math.max(linesFor(step.label, 280, 'lv-label').length * 20, detailed ? linesFor(step.detail, 350, 'lv-detail').length * 18 : 0) + 30));
  const lowerY = 40 + branchHeight + 108;
  const height = comparisonGrid ? 2*flowHeight+156 : cycle ? (n===3 ? 2*branchHeight+196 : 3*branchHeight+172) : special ? 310 : rows ? 56 + n * (rowHeight + 20) : fork ? lowerY + branchHeight + 40 : flowHeight + 96;
  const positions: Bounds[] = topic.steps.map((_, i) => {
    if (comparisonGrid) return [24+(i%2)*(nodeWidth+gap),40+Math.floor(i/2)*(flowHeight+64),nodeWidth,flowHeight];
    if (special) return [24 + i * 282, 32, 246, 238];
    if (cycle) return (n===3 ? [[312,20,228,branchHeight],[584,branchHeight+76,228,branchHeight],[40,branchHeight+76,228,branchHeight]] : [[312,20,228,branchHeight],[584,branchHeight+76,228,branchHeight],[312,2*branchHeight+132,228,branchHeight],[40,branchHeight+76,228,branchHeight]])[i] as Bounds;
    if (fork) return [[24, (height - branchHeight) / 2, 220, branchHeight], [316, 40, 220, branchHeight], [316, lowerY, 220, branchHeight], [608, (height - branchHeight) / 2, 220, branchHeight]][i] as Bounds;
    if (rows) return [detailed ? 40 : 96, 28 + i * (rowHeight + 20), detailed ? 772 : 660, rowHeight];
    return [24 + i * (nodeWidth + gap), 48, nodeWidth, flowHeight];
  });
  const join = (a: Bounds, b: Bounds, vertical = false) => vertical
    ? `M${a[0] + a[2] / 2} ${a[1] + a[3]}V${b[1] - 2}`
    : `M${a[0] + a[2]} ${a[1] + a[3] / 2}H${b[0] - 2}`;
  let wires = '';
  if (special) wires = '<text x="282" y="153" class="lv-operator">×</text><text x="564" y="153" class="lv-operator">=</text>';
  else if (cycle) {
    const [a, b, c, d] = positions;
    const cx=(p:Bounds)=>p[0]+p[2]/2, cy=(p:Bounds)=>p[1]+p[3]/2;
    wires=arrow(id,`M${a[0]+a[2]} ${cy(a)}Q${cx(b)} ${cy(a)} ${cx(b)} ${b[1]-2}`);
    if(n===3) wires+=arrow(id,`M${cx(b)} ${b[1]+b[3]}C${cx(b)} ${height-24} ${cx(c)} ${height-24} ${cx(c)} ${c[1]+c[3]+2}`)+arrow(id,`M${cx(c)} ${c[1]}Q${cx(c)} ${cy(a)} ${a[0]-2} ${cy(a)}`);
    else wires+=arrow(id,`M${cx(b)} ${b[1]+b[3]}Q${cx(b)} ${cy(c)} ${c[0]+c[2]+2} ${cy(c)}`)+arrow(id,`M${c[0]} ${cy(c)}Q${cx(d)} ${cy(c)} ${cx(d)} ${d[1]+d[3]+2}`)+arrow(id,`M${cx(d)} ${d[1]}Q${cx(d)} ${cy(a)} ${a[0]-2} ${cy(a)}`);
  } else if (fork) {
    const [a,b,c,d] = positions, middle = height/2;
    wires = arrow(id, `M${a[0]+a[2]} ${middle}H280V${b[1]+b[3]/2}H${b[0]-2}`) + arrow(id, `M280 ${middle}V${c[1]+c[3]/2}H${c[0]-2}`) + arrow(id, `M${b[0]+b[2]} ${b[1]+b[3]/2}H572V${middle}H${d[0]-2}`) + arrow(id, `M${c[0]+c[2]} ${c[1]+c[3]/2}H572V${middle}`);
  } else if (['flow', 'timeline'].includes(topic.kind)) positions.slice(0, -1).forEach((position, i) => { wires += arrow(id, join(position, positions[i + 1])); });
  const matrices = [[[1,2,3],[4,5,6]],[[1,0,2,1],[0,1,1,2],[1,1,0,1]],[[4,5,4,8],[10,11,13,20]]];
  const nodes = topic.steps.map((step, i) => {
    const [x,y,w,h] = positions[i];
    let contents = '';
    if (special) {
      const values = matrices[i], cols = values[0].length, dx = 36, ox = x + (w-cols*dx)/2, oy = y+76;
      contents = label(['A · [2, 3]','B · [3, 4]','C · [2, 4]'][i],x+20,y+32,w-40,'lv-label');
      // Numerical values are the drawing itself, never optional annotations.
      contents += values.map((row,r) => row.map((value,c) => `<rect class="lv-value-cell ${i===0&&r===0||i===1&&c===0||i===2&&r===0&&c===0?'is-dot-product':''}" x="${ox+c*dx}" y="${oy+r*34}" width="34" height="32"/><text class="lv-value" x="${ox+c*dx+17}" y="${oy+r*34+22}" text-anchor="middle">${value}</text>`).join('')).join('');
      if (detailed) contents += label(step.detail,x+20,y+h-20,w-40,'lv-detail');
    } else if (rows) {
      const titleLines = linesFor(step.label, detailed ? 280 : w-72, 'lv-label').length;
      contents = label(step.label,x+28,y+(h-titleLines*20)/2+15,detailed ? 280 : w-72,'lv-label');
      if (detailed) contents += label(step.detail,x+360,y+(h-linesFor(step.detail,350,'lv-detail').length*18)/2+13,350,'lv-detail',18);
    } else {
      const titleHeight = linesFor(step.label,w-40,'lv-label').length*20;
      const detailsHeight = detailed ? 16+linesFor(step.detail,w-40,'lv-detail').length*18 : 0;
      const top = y+(h-titleHeight-detailsHeight)/2+15;
      contents = label(step.label,x+20,top,w-40,'lv-label');
      if (detailed) contents += label(step.detail,x+20,top+titleHeight+12,w-40,'lv-detail',18);
    }
    return `<g class="lv-node ${selected===i?'is-selected':''}" data-lv-node="${i}" role="button" tabindex="0" aria-pressed="${selected===i}" aria-label="Inspect ${escape(step.label)}"><title>${escape(step.note)}</title><rect class="lv-node-body" x="${x}" y="${y}" width="${w}" height="${h}"/>${contents}</g>`;
  }).join('');
  return `<svg viewBox="0 0 852 ${height}" class="lv-svg lv-${topic.kind}" data-diagram-form="${topic.kind}" aria-labelledby="${topic.id}-visual-title"><title id="${topic.id}-visual-title">${escape(topic.title)}. ${escape(topic.relationship)}.</title><defs><marker id="${id}" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7" fill="context-stroke"/></marker></defs>${wires}${nodes}${special?'<text x="28" y="302" class="lv-footnote">Highlighted dot product: 1 × 1 + 2 × 0 + 3 × 1 = 4</text>':''}</svg>`;
}
