import type { LessonVisual } from './lesson-visual-data';

const escape = (s: string) => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]!);
const txt = (x: number, y: number, value: string | number, cls = 'lv-art-label', anchor = 'start') => value === '' ? '' : `<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${escape(String(value))}</text>`;
const rect = (x:number,y:number,w:number,h:number,cls='lv-art-cell') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" class="${cls}"/>`;
const line = (path:string,cls='lv-art-line') => `<path d="${path}" class="${cls}"/>`;
const wrapped = (value:string,x:number,y:number,width:number,cls='lv-detail') => {
  const rows:string[]=[];
  for(const word of value.split(/\s+/)) {
    if(!rows.length || rows.at(-1)!.length+word.length+1>Math.floor(width/7.5)) rows.push(word);
    else rows[rows.length-1]+=' '+word;
  }
  return `<text x="${x}" y="${y}" class="${cls}">${rows.map((row,i)=>`<tspan x="${x}" dy="${i?18:0}">${escape(row)}</tspan>`).join('')}</text>`;
};
const cells = (x:number,y:number,rows:number,cols:number,size:number,active:(r:number,c:number)=>boolean,values?:(r:number,c:number)=>string|number) => Array.from({length:rows},(_,r)=>Array.from({length:cols},(_,c)=>rect(x+c*size,y+r*size,size-3,size-3,active(r,c)?'lv-art-cell lv-art-active':'lv-art-cell')+(values?txt(x+c*size+(size-3)/2,y+r*size+size*.65,values(r,c),'lv-art-value','middle'):'')).join('')).join('');

/** Explicit small examples. Cells have a stated mathematical role, never a
 * guessed physical count or anonymous decoration inside a commercial chip. */
export function subjectDiagram(topic: LessonVisual, detailed: boolean, selected: number): string | null {
  const id=topic.id, marker=`${id}-subject-arrow`, extra=detailed?58:0;
  let height=338+extra, body='', family='';
  const arrow=(path:string)=>`<path class="lv-wire" d="${path}" marker-end="url(#${marker})"/>`;
  const node=(index:number,x:number,y:number,w:number,h:number,art:string,nested=false)=>{
    const step=topic.steps[index];
    return `<g class="lv-node lv-subject-node ${nested?'lv-nested-node':''} ${selected===index?'is-selected':''}" data-lv-node="${index}" role="button" tabindex="0" aria-pressed="${selected===index}" aria-label="Inspect ${escape(step.label)}"><title>${escape(step.note)}</title>${rect(x,y,w,h,'lv-node-body')}${wrapped(step.label,x+16,y+26,w-32,'lv-label')}${art}${detailed&&!art.includes(`>${escape(step.detail)}<`)?wrapped(step.detail,x+16,y+h-42,w-32):''}</g>`;
  };
  const panel=(index:number,art:(x:number,y:number)=>string)=>{
    const x=24+index*282,y=24;
    return node(index,x,y,240,284+extra,art(x,y));
  };

  if(id==='attention-and-mlp') {
    family='tensor-axes';
    body=topic.steps.map((_,i)=>panel(i,(x,y)=>
      txt(x+40,y+72,'channels →')+cells(x+40,y+88,4,4,40,(r,c)=>i===0?c===1:i===1?r===1:false)+
      txt(x+40,y+270,['mix tokens ↓','mix channels →','X + ΔX → same shape'][i]))).join('');
  } else if(id==='cpu-practical-lab') {
    family='matrix-traversal';
    body=panel(0,(x,y)=>cells(x+40,y+82,4,4,40,(r)=>r===0,(r,c)=>r*4+c)+arrow(`M${x+40} ${y+66}h155`))+panel(1,(x,y)=>cells(x+40,y+82,4,4,40,(_,c)=>c===0,(r,c)=>r*4+c)+arrow(`M${x+24} ${y+82}v155`))+panel(2,(x,y)=>txt(x+120,y+144,'Σ = 120','lv-art-equation','middle')+txt(x+120,y+185,'both orders','lv-art-label','middle'));
  } else if(id==='probability-and-loss') {
    family='probability-bars';
    const heights=[50,100,50];
    body=panel(0,(x,y)=>txt(x+120,y+128,'[0, ln 2, 0]','lv-art-equation','middle')+txt(x+120,y+176,'softmax','lv-art-label','middle'))+
      panel(1,(x,y)=>heights.map((h,i)=>rect(x+29+i*64,y+205-h,42,h,i===2?'lv-art-cell lv-art-active':'lv-art-cell')+txt(x+50+i*64,y+231,['¼','½','¼'][i],'lv-art-value','middle')).join(''))+
      panel(2,(x,y)=>txt(x+120,y+122,'−ln(¼)','lv-art-equation','middle')+txt(x+120,y+175,'≈ 1.386','lv-art-equation','middle')+txt(x+120,y+220,'target: third token','lv-art-label','middle'));
  } else if(id==='c-pointers-arrays') {
    family='address-strip';height=326+extra;
    body=node(0,24,24,210,268+extra,txt(48,110,'p = base','lv-art-equation')+arrow('M80 132V184H250'));
    body+=node(1,270,24,282,268+extra,cells(286,116,1,6,40,(_,c)=>c===3,(_,c)=>c)+txt(286,96,'element index')+line('M286 171H523')+txt(302,205,'i = 3; length = 6'));
    body+=node(2,594,24,234,268+extra,txt(614,126,'base + 12 B','lv-art-equation')+txt(614,169,'if sizeof(float) = 4'));
    body+=arrow('M426 174V246H704V193');
  } else if(id==='c-values-bytes'||id==='binary-and-signed') {
    family='bit-fields';
    const signed=id==='binary-and-signed';
    body=panel(0,(x,y)=>cells(x+19,y+99,1,8,25,(_,c)=>c===0,()=>1)+txt(x+120,y+175,signed?'11111111₂ = 255':'eight bits per byte','lv-art-label','middle')+(!signed?txt(x+120,y+213,'four bytes = 32 bits','lv-art-label','middle'):''))+
      panel(1,(x,y)=>cells(x+19,y+99,1,8,25,(_,c)=>c===0,()=>1)+txt(x+120,y+175,signed?'11111111₂ = −1':'type defines meaning','lv-art-label','middle')+txt(x+120,y+213,signed?'8-bit two’s complement':'integer or floating point','lv-art-label','middle'))+
      panel(2,(x,y)=>signed?txt(x+120,y+129,'11111111','lv-art-value','middle')+txt(x+120,y+166,'→ 1111111111111111','lv-art-value','middle')+txt(x+120,y+213,'sign extension: still −1','lv-art-label','middle'):txt(x+120,y+130,'value + value','lv-art-equation','middle')+txt(x+120,y+182,'rules follow the type','lv-art-label','middle'));
  } else if(id==='systems-scale-ladder') {
    family='nested-scale';height=428+extra*4;
    const bounds=[[504,244,260,126+extra],[364,172,432,220+extra*2],[204,100,608,306+extra*3],[24,24,804,392+extra*4]];
    for(const i of [3,2,1,0]) {
      const [x,y,w,h]=bounds[i];
      body+=node(i,x,y,w,h,i===0?txt(x+28,y+70,'a × b + c','lv-art-equation'):'',true);
    }
  } else if(id==='cuda-first-launch') {
    family='launch-grid';height=414+extra*3;
    body=node(0,24,24,804,372+extra*3,txt(48,86,'N = 1000 · 4 blocks × 256 threads')+Array.from({length:4},(_,i)=>rect(50+i*190,110,174,42,i===3?'lv-art-cell lv-art-active':'lv-art-cell')+txt(64+i*190,137,`block ${i}`)).join(''),true);
    body+=node(1,240,170,548,210+extra*2,rect(270,225,478,30)+txt(286,246,'logical indices 768 … 1023')+rect(703,225,45,30,'lv-art-mask'),true);
    body+=node(2,498,278,244,85+extra,txt(516,332,'i = 999 → valid'),true);
  } else if(id==='parallel-axes') {
    family='partitioned-matrices';
    body=panel(0,(x,y)=>cells(x+29,y+89,4,3,25,()=>true)+cells(x+138,y+89,4,3,25,()=>true)+txt(x+42,y+220,'replica 0')+txt(x+140,y+220,'replica 1'))+
      panel(1,(x,y)=>cells(x+36,y+89,4,6,29,(_,c)=>c<3)+line(`M${x+121} ${y+78}v135`)+txt(x+42,y+239,'one operator, two shards'))+
      panel(2,(x,y)=>Array.from({length:4},(_,i)=>rect(x+53,y+65+i*40,135,28,i<2?'lv-art-cell lv-art-active':'lv-art-cell')+txt(x+120,y+85+i*40,`layer ${i}`,'lv-art-value','middle')).join('')+txt(x+45,y+256,'two stages, two layers each'));
  } else if(id==='cpu-simd') {
    family='vector-lanes';height=370+extra;
    const labels=['x','2x + 10','y',''];
    const vals=[[1,2,3,4],[12,14,16,18],[12,14,16,18],[1,2,3,'—']];
    for(let i=0;i<4;i++) {
      const x=24+i*207;
      body+=node(i,x,24,183,310+extra,txt(x+20,100,labels[i])+cells(x+19,120,4,1,37,(r)=>i!==3||r<3,(r)=>vals[i][r])+ (i===3?txt(x+70,245,'inactive'):'')+(i<2?Array.from({length:4},(_,r)=>arrow(`M${x+62} ${137+r*37}H${x+209}`)).join(''):''));
    }
  } else if(id==='cpu-load-store') {
    family='publication-lanes';height=460+extra;
    body=txt(62,24,'Publisher')+txt(560,24,'Consumer')+line('M426 32V426','lv-art-divider');
    body+=node(0,40,48,302,112+extra,txt(58,117,'payload = 42','lv-art-value'));
    body+=node(1,40,228+extra,302,112+extra,txt(58,295+extra,'store ready = 1','lv-art-value'));
    body+=node(2,510,228+extra,302,112+extra,txt(528,295+extra,'load observes 1','lv-art-value'));
    body+=node(3,510,388+extra*2,302,112+extra,txt(528,454+extra*2,'payload is 42','lv-art-value'));
    height=524+extra*3;
    body+=arrow(`M191 ${160+extra}V${226+extra}`)+arrow(`M344 ${280+extra}H508`)+arrow(`M661 ${340+extra*2}V${386+extra*2}`);
  } else if(id==='cpu-numa') {
    family='numa-map';
    body=topic.steps.map((_,i)=>panel(i,(x,y)=>{
      let a=rect(x+30,y+75,75,50,'lv-art-cell lv-art-active')+txt(x+67,y+106,'CPU','lv-art-value','middle')+rect(x+130,y+75,80,50)+txt(x+170,y+106,'CPU','lv-art-value','middle');
      a+=cells(x+30,y+174,2,3,25,(r)=>i===0||(i===2&&r===0),(r,c)=>i===0?r*3+c:i===2&&r===0?c*2:'·')+cells(x+130,y+174,2,3,25,(r)=>i===1||(i===2&&r===0),(r,c)=>i===1?r*3+c:i===2&&r===0?c*2+1:'·');
      a+=txt(x+28,y+254,'node 0')+txt(x+132,y+254,'node 1');
      a+=arrow(`M${x+67} ${y+125}V${y+172}`);
      if(i!==0) a+=arrow(`M${x+67} ${y+125}V${y+147}H${x+166}V${y+172}`);
      if(i===1) a=a.replace(arrow(`M${x+67} ${y+125}V${y+172}`),'');
      return a;
    })).join('');
  } else if(id==='cpu-translation') {
    family='translation-table';
    body=panel(0,(x,y)=>txt(x+24,y+82,'virtual  →  physical')+rect(x+24,y+103,192,52)+txt(x+42,y+135,'0x1   →   0xABC','lv-art-value')+txt(x+24,y+214,'offset stays 0x234'))+
      panel(1,(x,y)=>cells(x+36,y+73,8,8,21,(r,c)=>r===6&&c===4)+txt(x+24,y+267,'64-byte line · byte 52'))+
      panel(2,(x,y)=>line(`M${x+120} ${y+77}v66`)+rect(x+31,y+144,178,62)+txt(x+120,y+180,'fault handler','lv-art-value','middle')+txt(x+120,y+247,'mapping or permission','lv-art-label','middle'));
  } else if(id==='attention-by-hand') {
    family='weighted-sum';height=448+extra;
    body=node(0,24,24,240,154+extra,txt(48,100,'q · k₀     q · k₁','lv-art-value'))+
      node(1,306,24,240,154+extra,txt(330,100,'[¼, ¾]','lv-art-equation'))+
      node(2,24,248+extra,522,142+extra,txt(48,330+extra,'¼ × 2 + ¾ × 6 = 5','lv-art-equation'))+
      node(3,590,138+extra,238,146+extra,txt(616,224+extra,'[5]','lv-art-equation'));
    body+=arrow('M266 98H304')+arrow(`M426 ${178+extra}V${246+extra}`)+arrow(`M548 ${319+extra}H570V${211+extra}H588`);
    height+=extra;
  } else if(id==='kernel-roofline') {
    family='tile-reuse';
    body=panel(0,(x,y)=>cells(x+27,y+85,3,2,30,()=>true)+cells(x+126,y+85,2,3,30,()=>false)+txt(x+31,y+220,'A: 3 × 2   B: 2 × 3'))+
      panel(1,(x,y)=>cells(x+27,y+85,3,2,30,(r)=>r===0)+cells(x+126,y+85,2,3,30,(_,c)=>c===0)+txt(x+30,y+220,'2 terms per output'))+
      panel(2,(x,y)=>cells(x+62,y+85,3,3,38,(r,c)=>r===0&&c===0)+txt(x+62,y+240,'C: 3 × 3'));
  } else return null;

  return `<svg viewBox="0 0 852 ${height}" class="lv-svg lv-subject lv-${family}" data-diagram-form="${family}" aria-labelledby="${id}-subject-title"><title id="${id}-subject-title">${escape(topic.title)}. ${escape(topic.relationship)}.</title><defs><marker id="${marker}" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7" fill="context-stroke"/></marker></defs>${body}</svg>`;
}

/** State the scope of each miniature beside its optional explanation. */
export const subjectNotes: Record<string,string> = {
  'attention-and-mlp': 'The 4 × 4 grids represent four token positions and four channels. Blue marks one mixing direction; it does not show attention scores or a physical tensor layout.',
  'cpu-practical-lab': 'This 4 × 4 example contains 0 through 15, matching the C companion at N = 4. The highlighted row and column show the first inner loop. Both complete traversals sum to 120.',
  'probability-and-loss': 'Toy logits [0, ln 2, 0] give probabilities [¼, ½, ¼]. The observed target is the third token, so its loss is −ln(¼). Bar heights encode probability.',
  'c-pointers-arrays': 'Six illustrative float elements, assuming sizeof(float) = 4. Index 3 is twelve bytes past the base. The pointer alone does not carry the six-element bound.',
  'c-values-bytes': 'Each square is one bit; eight shown bits make one byte. This is a storage and interpretation example, not a CPU register diagram.',
  'binary-and-signed': 'The same eight one-bits mean unsigned 255 or signed −1 in two’s complement. Extending the sign to sixteen bits preserves −1.',
  'systems-scale-ladder': 'Nested outlines express logical scale. Their area does not encode storage capacity, device count or silicon area.',
  'cuda-first-launch': 'For N = 1000, four 256-thread blocks cover 1024 logical indices. The selected last block covers 768–1023; its last 24 threads must skip the access. Thread 999 is valid. This is a launch hierarchy, not a physical GPU floorplan.',
  'parallel-axes': 'Two replicas own the same model; two tensor shards own different columns of one operator; two pipeline stages own two layers each. The small grids show logical ownership, not equal memory or compute costs.',
  'cpu-simd': 'A four-lane example computes y = 2x + 10 for x = [1, 2, 3, 4], then stores [12, 14, 16, 18]. The separate tail shows three active lanes and one inactive lane. This does not claim a particular CPU vector width.',
  'cpu-load-store': 'The arrow crossing the thread boundary is release/acquire synchronization when the load observes the released value. Vertical arrows show program order. The payload has one writer and no later modification.',
  'cpu-numa': 'Six illustrative pages numbered 0–5 belong to one allocation; dots mark unused positions. The worker stays on node 0. Local, remote and interleaved placement change where those same six pages live.',
  'cpu-translation': 'With 4 KiB pages, virtual page 1 maps to physical frame 0xABC and preserves offset 0x234. In the separate 64-byte cache-line example, address 0xABC234 is byte 52 of its line. These responsibilities are not a mandatory serial lookup pipeline.',
  'attention-by-hand': 'The query and keys produce the illustrated weights after normalization. Two scalar values, 2 and 6, are mixed as ¼ × 2 + ¾ × 6 = 5. The output is a value-channel result, not a vocabulary probability.',
  'kernel-roofline': 'Illustrative tiles A[3,2] and B[2,3] produce C[3,3]. A selected row and column contribute two products to one output. These dimensions explain reuse, not a hardware instruction shape.',
};
