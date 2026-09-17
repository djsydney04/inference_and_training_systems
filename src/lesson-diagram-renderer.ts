import type { LessonVisual } from "./lesson-visual-data";
const escape = (s: string) => s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]!);
type Bounds = [number,number,number,number];
const words = (s: string, limit: number) => {
  const lines: string[]=[];
  for(const word of s.split(/\s+/)) {
    const last=lines.length-1;
    if(last<0 || lines[last].length+word.length+1>limit)lines.push(word);
    else lines[last]+=` ${word}`;
  }
  return lines;
};
const label = (s: string,x:number,y:number,width:number,cls:string,lineHeight=20) => `<text x="${x}" y="${y}" class="${cls}">${words(s,Math.floor(width/(cls==='lv-label'?8.4:7))).map((part,i)=>`<tspan x="${x}" dy="${i?lineHeight:0}">${escape(part)}</tspan>`).join('')}</text>`;
const arrow = (id:string,path:string,cls='') => `<path class="lv-wire ${cls}" d="${path}" marker-end="url(#${id})"/>`;

/** Layout encodes only the relationships asserted by the lesson, never fake capacity. */
export function lessonDiagram(topic: LessonVisual, detailed=true, selected=0) {
  const n=topic.steps.length,id=`${topic.id}-visual-arrow`;
  const rowKinds=['memory','hierarchy'];
  const rows=rowKinds.includes(topic.kind);
  const cycle=topic.kind==='cycle';
  const fork=topic.kind==='fork';
  const special=topic.id==='math-reading-kit';
  const height=special?296:rows?44+n*78:cycle||fork?354:286;
  const positions:Bounds[]=topic.steps.map((_,i)=>{
    if(special)return[24+i*282,38,246,222];
    if(cycle) return n===3?([[30,34,316,104],[506,34,316,104],[268,216,316,104]][i] as Bounds):([[30,34,316,104],[506,34,316,104],[506,216,316,104],[30,216,316,104]][i] as Bounds);
    if(fork)return [[20,129,220,102],[316,30,220,102],[316,228,220,102],[612,129,220,102]][i] as Bounds;
    if(rows)return[28,22+i*78,796,64];
    return[24+i*(824/n),44,824/n-24,196];
  });
  let wires='';
  if(special)wires='<text x="282" y="153" class="lv-operator">×</text><text x="564" y="153" class="lv-operator">=</text>';
  else if(cycle){
    wires=arrow(id,'M346 86H504');
    wires+=n===3?arrow(id,'M664 138V183H426V214')+arrow(id,'M268 268H188V140'):arrow(id,'M664 138V214')+arrow(id,'M506 268H348')+arrow(id,'M188 216V140');
  } else if(fork)wires=arrow(id,'M240 180H276V81H314')+arrow(id,'M276 180V279H314')+arrow(id,'M536 81H574V180H610')+arrow(id,'M536 279H574V180');
  else if(['flow','timeline'].includes(topic.kind))positions.slice(0,-1).forEach(([x,y,w,h],i)=>{wires+=arrow(id,`M${x+w} ${y+h/2}H${positions[i+1][0]-2}`);});
  const matrices=[[[1,2,3],[4,5,6]],[[1,0,2,1],[0,1,1,2],[1,1,0,1]],[[4,5,4,8],[10,11,13,20]]];
  const nodes=topic.steps.map((step,i)=>{
    const [x,y,w,h]=positions[i];
    let contents='';
    if(special){
      const values=matrices[i],cols=values[0].length,dx=36,ox=x+(w-cols*dx)/2,oy=y+73;
      contents=label(['A · [2, 3]','B · [3, 4]','C · [2, 4]'][i],x+18,y+30,w-36,'lv-label');
      if(detailed)contents+=values.map((row,r)=>row.map((value,c)=>`<rect class="lv-value-cell ${i===0&&r===0||i===1&&c===0||i===2&&r===0&&c===0?'is-dot-product':''}" x="${ox+c*dx}" y="${oy+r*34}" width="34" height="32"/><text class="lv-value" x="${ox+c*dx+17}" y="${oy+r*34+22}" text-anchor="middle">${value}</text>`).join('')).join('');
      contents+=label(step.detail,x+18,y+h-19,w-36,'lv-detail');
    }else if(rows){
      contents=`<text class="lv-index" x="${x+16}" y="${y+38}">${String(i+1).padStart(2,'0')}</text>`+label(step.label,x+64,y+28,300,'lv-label');
      if(detailed)contents+=label(step.detail,x+385,y+27,390,'lv-detail',18);
    }else{
      contents=`<text class="lv-index" x="${x+16}" y="${y+24}">${String(i+1).padStart(2,'0')}</text>`;
      const top=cycle||fork?y+47:y+65;
      contents+=label(step.label,x+16,top,w-32,'lv-label');
      if(detailed)contents+=label(step.detail,x+16,top+words(step.label,Math.floor((w-32)/8.4)).length*20+12,w-32,'lv-detail',18);
    }
    return `<g class="lv-node ${selected===i?'is-selected':''}" data-lv-node="${i}" role="button" tabindex="0" aria-pressed="${selected===i}" aria-label="Inspect ${escape(step.label)}"><title>${escape(step.note)}</title><rect class="lv-node-body" x="${x}" y="${y}" width="${w}" height="${h}"/>${contents}</g>`;
  }).join('');
  const footer=special?'Highlighted dot product: 1 × 1 + 2 × 0 + 3 × 1 = 4':topic.kind==='compare'?'Compare roles; the columns are not stages in a pipeline.':topic.kind==='memory'?'Storage roles and ownership · row widths do not encode capacity.':topic.kind==='hierarchy'?'Abstraction levels / responsibilities · read the notes for containment.':topic.kind==='matrix'?'Symbolic operator contract · no fixed tile shape is implied.':topic.kind==='timeline'?'Dependency order · widths do not represent elapsed time.':'';
  return `<svg viewBox="0 0 852 ${height}" class="lv-svg lv-${topic.kind}" aria-labelledby="${topic.id}-visual-title"><title id="${topic.id}-visual-title">${escape(topic.title)}. ${escape(topic.relationship)}.</title><defs><marker id="${id}" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7" fill="context-stroke"/></marker></defs>${wires}${nodes}${footer?`<text x="28" y="${height-12}" class="lv-footnote">${escape(footer)}</text>`:''}</svg>`;
}
