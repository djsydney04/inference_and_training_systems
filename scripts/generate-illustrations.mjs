/** Original vector studies. Run all, or choose one: node scripts/generate-illustrations.mjs model */
import { writeFileSync } from 'node:fs';
const output = new URL('../public/illustrations/', import.meta.url);
const requestedStudy = process.argv[2];
const ink = '#61775b', line = '#9bab91', pale = '#dce3d4', blue = '#2559d6';
const rect = (x,y,w,h,fill='none',stroke=line,extra='') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width=".8" ${extra}/>`;
const path = (d,stroke=line,width=.8,extra='') => `<path d="${d}" stroke="${stroke}" stroke-width="${width}" fill="none" ${extra}/>`;
const dot = (x,y,r=2,fill=blue) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;
const repeat = (n,fn) => Array.from({length:n},(_,i)=>fn(i)).join('');
const grid = (x,y,cols,rows,size,select=()=>false) => repeat(rows,r=>repeat(cols,c=>rect(x+c*size,y+r*size,size-4,size-4,select(r,c)?blue:(r+c)%3===0?'#bccbb0':'#e1e7d9',select(r,c)?blue:line)));
const ticks = (x,y,n,step=12,vertical=false) => repeat(n,i=>path(vertical?`M${x} ${y+i*step}h7`:`M${x+i*step} ${y}v7`));
function save(name,title,description,body,defs='') {
  if (requestedStudy && requestedStudy !== name) return;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 840 560" fill="none" role="img" aria-labelledby="title desc">
<title id="title">${title}</title><desc id="desc">${description}</desc>
<defs>
<pattern id="hatch" width="5" height="5" patternUnits="userSpaceOnUse"><path d="M-1 1L1-1M0 5L5 0M4 6L6 4" stroke="#939d86" stroke-width=".55"/></pattern>
<pattern id="fine" width="4" height="4" patternUnits="userSpaceOnUse"><path d="M0 0H4" stroke="#8fa181" stroke-width=".55"/></pattern>
<marker id="arrow" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L6 3L0 6" fill="${blue}"/></marker>
${defs}</defs>
<g stroke="#bcc3b4" stroke-width=".8"><path d="M28 54V28H54M786 28H812V54M28 506V532H54M786 532H812V506M410 28H430M420 18V38M410 532H430M420 522V542"/></g>
${body}
</svg>`;
  writeFileSync(new URL(`${name}-study.svg`,output),svg.replaceAll('><','>\n<')+'\n');
}

// The attention matrix mixes positions; the vocabulary distribution is a later operation.
// Pen-like boundaries belong to conceptual stages; cell positions and bar widths stay exact.
{
  const text = (x,y,value,size=13,extra='') => `<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="${size}" fill="#52624f" ${extra}>${value}</text>`;
  const penBox = (x,y,w,h) => path(`M${x+1} ${y+1} Q${x+w*.5} ${y-1.5} ${x+w-1} ${y+.7} Q${x+w+1.5} ${y+h*.5} ${x+w-.5} ${y+h-1} Q${x+w*.5} ${y+h+1.5} ${x+.7} ${y+h-.5} Q${x-1.5} ${y+h*.5} ${x+1} ${y+1} Z`,ink,1.1);
  const arrow = (x1,y1,x2,y2) => path(`M${x1} ${y1} Q${(x1+x2)/2} ${(y1+y2)/2+1.2} ${x2} ${y2}`,blue,1.4,'marker-end="url(#arrow)"');
  let model = text(66,75,'From a prefix to the next-token distribution',18);
  model += text(65,113,'8 positions · 6 features',12);
  for(let r=0;r<8;r++) {
    model += text(51,155+r*25,String(r),10);
    for(let c=0;c<6;c++) model += rect(65+c*18,142+r*25,14,18,(r+c)%3===0?'#bccbb0':'#e1e7d9',line);
  }
  model += arrow(183,238,251,238);
  model += text(265,113,'Stored positions (keys)',12);
  for(let r=0;r<8;r++) {
    model += text(252,155+r*25,String(r),10);
    for(let c=0;c<8;c++) model += rect(266+c*22,142+r*25,18,18,c>r?'url(#hatch)':r===7?'#dce6fb':'#dce3d4',c>r?line:r===7?blue:ink);
  }
  model += penBox(261,137,183,201);
  model += arrow(451,239,478,179);
  model += penBox(482,137,155,83);
  model += text(559,158,'Value mixing',13,'text-anchor="middle"');
  model += text(559,178,'+ rest of model',13,'text-anchor="middle"');
  model += text(559,203,'(operations omitted)',11,'text-anchor="middle"');
  model += arrow(559,222,559,241);
  model += penBox(482,246,155,82);
  model += text(559,266,'Final position only',12,'text-anchor="middle"');
  model += text(559,287,'Vocabulary projection',12,'text-anchor="middle"');
  model += text(559,309,'one logit per token',11,'text-anchor="middle"');
  model += arrow(559,332,559,351);
  model += penBox(482,355,155,61);
  model += text(559,378,'Softmax',13,'text-anchor="middle"');
  model += text(559,399,'probabilities sum to 1',11,'text-anchor="middle"');
  model += path('M639 385 Q651 386 653 373 L653 242 Q653 238 659 238',blue,1.4,'marker-end="url(#arrow)"');
  model += penBox(660,134,153,231);
  const percentages=[5,15,10,5,40,10,5,10];
  model += text(667,113,'Vocabulary token',12);
  percentages.forEach((percent,i)=>{
    const y=143+i*27;
    model += text(665,y+13,String.fromCharCode(65+i),11);
    model += rect(680,y,percent*2.5,17,i===4?blue:'url(#fine)',i===4?blue:ink);
    model += text(684+percent*2.5,y+13,`${percent}%`,10);
  });
  model += text(65,380,'Token vectors',13);
  model += text(266,380,'Causal attention weights',13);
  model += text(266,399,'Rows: query positions',11);
  model += text(266,416,'Hatching: future positions',11);
  model += text(666,380,'Next-token',13)+text(666,399,'probabilities',13);
  model += text(65,462,'Q/K/V projections are omitted. Value vectors also enter the value-mixing step.',12);
  model += text(65,484,'Cells and bars are illustrative: the bars are not calculated from the displayed matrix.',12);
  save('model','From a prefix to the next-token distribution','Eight token-position vectors lead to an eight-by-eight causal attention-weight matrix. Future key positions are hatched. Attention weights feed value mixing and omitted model operations. The final position then passes through a vocabulary projection and softmax to an illustrative eight-token distribution whose percentages sum to one hundred. Position rows are not vocabulary classes. Q, K and V projections are omitted; value vectors also feed value mixing.',model);
}

// A tensor's planes share a linear address space.
let b = '';
for(let p=2;p>=0;p--) {
  const x=85+p*27,y=105+p*25;
  b+=rect(x-10,y-10,250,210,'#eef0e8',ink);
  b+=grid(x,y,8,6,29,(r,c)=>p===0&&r===2);
}
b+=repeat(8,i=>path(`M${85+i*29+12} 286C${85+i*29+12} 380 ${510+i*24} 320 ${510+i*24} 400`,i===3?blue:line,i===3?1.6:.7));
b+=repeat(4,r=>repeat(10,c=>rect(480+c*25,130+r*30,21,22,(r===1&&c>2&&c<7)?blue:'url(#fine)')));
b+=path('M468 122h-10v134h10M735 122h10v134h-10',ink);
b+=grid(475,402,11,2,25,(r,c)=>r===0&&c<8);
b+=path('M86 440v24h288M480 480v-9h270',ink)+ticks(86,466,25,12);
save('tensor','A tensor and its storage','Stacked tensor planes connect to a linear row of stored values. A selected row and its storage positions are blue. This is a conceptual layout, not an address calculation.',b);

// A training update, drawn as tensors and dependencies rather than a trajectory.
const trainingLabel=(x,y,label,size=26,color=ink)=>`<text x="${x}" y="${y}" text-anchor="middle" fill="${color}" font-family="Arial, sans-serif" font-size="${size}">${label}</text>`;
const forward=d=>path(d,ink,1.5,'marker-end="url(#forward-arrow)"');
const backward=d=>path(d,blue,1.7,'marker-end="url(#arrow)"');
const layerX=[250,358,466], layerCenters=layerX.map(x=>x+34);
b=trainingLabel(107,113,'Batch')+trainingLabel(392,86,'Model')+trainingLabel(726,113,'Loss');
b+=path('M238 133v-15h310v15',ink);
// Packed tokens feed a succession of parameterized layers.
b+=repeat(4,r=>repeat(4,c=>rect(68+c*20,164+r*20,16,15,r===1&&c<3?'#a9b99c':(r+c)%3===0?'url(#fine)':pale)));
b+=forward('M151 200H236');
layerX.forEach((x,i)=>{
 b+=rect(x-7,153,82,94,'#f0f3eb',ink)+grid(x,164,6,6,12);
 b+=trainingLabel(x+34,270,`W${['₁','₂','₃'][i]}`,20);
 if(i<2)b+=forward(`M${x+77} 200H${x+94}`);
});
// A prediction vector and a target both feed the scalar loss.
b+=forward('M543 200H571')+repeat(5,r=>rect(579,158+r*18,18,13,r%2?'url(#fine)':pale));
b+=forward('M605 200H683')+rect(694,168,64,64,'#e4eadc',ink)+trainingLabel(726,210,'L',28);
b+=trainingLabel(788,272,'Target',18)+rect(777,212,22,26,'url(#fine)',ink)+forward('M777 225H770V216H759');
// Reverse dependencies produce one gradient tensor for each parameter tensor.
b+=backward('M726 240V300H500V320');
b+=backward('M500 300H392V320')+backward('M392 300H284V320');
b+=trainingLabel(105,370,'Gradients',26,blue);
layerX.forEach((x,i)=>{
 b+=grid(x,330,6,6,12,(r,c)=>i===1?c===2:r===2&&c===4);
 b+=path(`M${x+34} 407V422H392`,line,1);
 // Forward intermediates are retained or recomputed for the local derivative.
 b+=path(`M${x+9} 252V318`,line,.8,'stroke-dasharray="3 5"');
});
// The optimizer consumes gradients; the updated parameters return to the model.
b+=backward('M392 424V449');
b+=grid(301,445,6,6,6)+grid(450,445,6,6,6,(r,c)=>r===2||c===4);
b+=path('M347 462H436',ink,1.3,'marker-end="url(#forward-arrow)"');
b+=trainingLabel(392,509,'Weight update');
b+=path('M494 462H625V139H284',blue,1.5);
// Pale bridges distinguish crossing paths from joins.
b+=path('M625 187V213M625 290V310','#f4f5f0',5)+path('M625 187V213M625 290V310',blue,1.5);
layerCenters.forEach(x=>{b+=backward(`M${x} 139V151`);});
b+=trainingLabel(714,452,'Next batch',22,blue)+path('M639 462h114',line,.8);
save('gradient','From a training batch to updated weights','A batch flows through three parameterized model layers and a prediction vector into a loss, which also receives a target. Blue reverse paths lead to gradient tensors. Saved or recomputed forward values support their calculation. The optimizer uses the gradients to update parameters; the updated parameters return to the layers for the next batch. Tensor cells and layer counts are illustrative, not numerical results.',b,
 '<marker id="forward-arrow" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L6 3L0 6" fill="'+ink+'"/></marker>');

// Documents become token sequences, then packed batches.
b='';
for(let p=2;p>=0;p--){
 b+=rect(73+p*14,85+p*13,164,270,'#eef0e8',ink);
 b+=repeat(18,r=>path(`M${88+p*14} ${105+p*13+r*13}h${90+(r*19)%43}`,line,.7));
}
b+=repeat(6,r=>path(`M260 ${142+r*30}C310 ${142+r*30} 310 ${150+r*36} 340 ${150+r*36}`,r===2?blue:line,r===2?1.6:.7));
b+=repeat(6,r=>repeat(6,c=>rect(343+c*26,135+r*36,22,24,r===2?blue:(r+c)%2?pale:'url(#fine)')));
b+=repeat(6,r=>path(`M501 ${150+r*36}H${525+r*5}V${122+r*48}H576`,r===2?blue:line,r===2?1.6:.7));
b+=repeat(8,r=>repeat(6,c=>rect(580+c*26,97+r*42,22,31,r===2&&c<4?blue:r===7&&c>2?'url(#hatch)':pale)));
b+=path('M72 451H259M341 451H499M579 451H733',ink)+ticks(72,451,16)+ticks(341,451,14)+ticks(579,451,14);
save('data','From documents to a training batch','Pages of source text become token sequences and packed rows. Blue follows one example through the process; hatching marks unused space. Boundaries and loss masks still have to be tracked.',b);

// A conceptual combinational path between clocked registers.
const register=(x,y)=>rect(x,y,70,116,'#edf0e6',ink)+path(`M${x} ${y+85}l10 7-10 7M${x+17} ${y+16}h35m-35 9h35m-35 9h22`,ink);
const gate=(x,y)=>`<path d="M${x} ${y}h25a30 30 0 0 1 0 60h-25Z" stroke="${ink}" fill="#dce4d4"/>`;
b=register(93,152)+register(670,152);
b+=gate(265,118)+gate(265,272)+gate(480,195);
b+=path('M163 176H211V133H265M163 224H229V287H265M163 248H193V317H265M320 148H387V210H480M320 302H408V240H480M535 225H670',blue,1.5);
b+=path('M66 104H218V163H265',ink,1);
b+=repeat(5,i=>rect(363+i*16,86,10,18,'url(#fine)'));
b+=path('M78 244H93M78 244V392H655V244H670M128 392V464',ink)+repeat(13,i=>path(`M${82+i*52} 464h13v-24h26v24h13`,ink));
b+=path('M65 421H772',line,.7,'stroke-dasharray="3 5"')+dot(128,392,3,ink)+dot(408,302,2,ink);
save('logic','Logic between clock edges','Fine wires connect combinational gates between two registers. A clock waveform underneath connects to the triangular clock inputs on both registers. Blue highlights a data path; this illustration does not specify a complete circuit or timing budget.',b);

// Increasingly distant storage layers, with regular bank structure.
b='';
const widths=[170,290,420,600];
widths.forEach((w,r)=>{
 const x=420-w/2,y=82+r*102;
 b+=rect(x,y,w,69,'#edf0e6',ink);
 const count=Math.floor((w-20)/20);
 b+=repeat(count,i=>rect(x+12+i*20,y+12,14,44,r===1&&i>3&&i<7?blue:i%3===0?'url(#fine)':pale));
 if(r<3)b+=repeat(9,i=>path(`M${x+25+i*(w-50)/8} ${y+69}V${y+83}H${420-widths[r+1]/2+25+i*(widths[r+1]-50)/8}V${y+102}`,i===4?blue:line,i===4?1.5:.7));
 b+=path(`M${x-17} ${y}h-8v69h8M${x+w+17} ${y}h8v69h-8`,line);
});
b+=path('M89 81V456M83 81h12M83 456h12M738 456H768',ink);
save('memory','Layers of memory','Narrow local storage connects to progressively wider layers of cache and memory. Hatching suggests banks; blue follows an access. Widths are illustrative and do not encode capacity, bandwidth, or latency.',b);

// Three matrix fields, with a tile brought close to the output.
b=grid(96,188,8,8,24,(r,c)=>r>=2&&r<4&&c<2)+grid(461,70,10,8,24,(r,c)=>r<2&&c>=3&&c<5)+grid(461,290,10,8,24,(r,c)=>r>=2&&r<4&&c>=3&&c<5);
b+=path('M296 248H352V350H453M569 112H727V277H569V282',blue,1.6,'marker-end="url(#arrow)"');
b+=rect(334,225,62,62,'#edf0e8',ink)+grid(343,234,2,2,23,()=>true);
b+=path('M85 176h-8v207h8M449 58h-8v198h8M709 278h8v207h-8',ink);
b+=path('M117 125h159M197 91v68M758 343v112M737 399h42',line,1);
save('tiling','Bring a tile to the computation','Three fields represent matrix operands and output. Blue marks selected tiles, with a small local tile between the larger arrays. The visible grids have compatible shapes: A is 8 by 8, B is 8 by 10, and C is 8 by 10. The selected two-term tiles illustrate reuse; no numerical values or hardware tile shape are prescribed.',b);

// A source listing branches into an IR graph and becomes scheduled work.
b=rect(64,110,172,323,'#eef0e8',ink)+repeat(23,r=>path(`M${79+(r%4===2?13:0)} ${128+r*12}h${85+(r*13)%47}`,r%6===0?blue:line,r%6===0?1.3:.7));
const ops=[[352,113],[352,210],[352,307],[474,162],[474,260],[474,358]];
b+=path('M236 272H285V139H352M285 272V236H352M285 272V333H352M394 139H428V188H474M394 236H446V188H474M394 236H430V286H474M394 333H443V384H474M516 188H553V139H599M516 286H570V247H599M516 384H553V355H599',line);
ops.forEach(([x,y],i)=>{b+=rect(x,y,42,52,i===3?blue:'url(#hatch)',i===3?blue:ink)+path(`M${x+10} ${y+17}h22m-22 8h22m-22 8h14`,i===3?'#edf0e8':ink);});
b+=repeat(3,r=>rect(600,111+r*108,160,69,'#eef0e8',ink)+repeat(6,c=>rect(610+c*24,124+r*108,18,43,r===1&&c<3?blue:pale)));
save('compiler','From program to execution plan','Source lines become a connected intermediate representation and then scheduled groups of operations. Blue emphasizes a selected transformation. This is a conceptual compiler path, not a specific compiler IR.',b);

// Diagonal schedule with distinct work blocks, empty slots, and dependencies.
b='';
for(let r=0;r<6;r++){
 const y=92+r*65;
 b+=rect(65,y,44,42,'url(#fine)',ink)+path(`M121 ${y+48}H774`,line,.6);
 for(let c=0;c<13;c++) b+=rect(134+c*48,y,42,42,c>=r&&c<r+5?(c===r+2?blue:(c+r)%2?'url(#fine)':pale):'url(#hatch)',c>=r&&c<r+5?ink:'#c9d1c1');
 if(r<5)b+=path(`M${155+r*48} ${y+44}V${y+56}H${203+r*48}V${y+63}`,blue,1.2,'marker-end="url(#arrow)"');
}
b+=path('M134 490H754',ink,1,'marker-end="url(#arrow)"')+ticks(134,484,14,48);
save('pipeline','A pipeline across devices','Rows of scheduled work are staggered across six devices. Hatched slots indicate idle positions, and blue connects dependent work between stages. Durations and the schedule are illustrative.',b);

// Logical block lists map onto physical pages; two lists share one page.
b='';
for(let r=0;r<3;r++){
 const y=97+r*141;
 b+=path(`M62 ${y+25}H96`,ink)+repeat(4,c=>rect(99+c*48,y,38,50,c===0&&r<2?blue:pale));
}
b+=repeat(3,r=>repeat(4,c=>{
 const x=519+c*57,y=98+r*126;
 return rect(x,y,45,92,r===0&&c===0?'#e1e9fd':'#edf0e6',r===0&&c===0?blue:ink)+repeat(8,k=>path(`M${x+7} ${y+10+k*10}h31`,r===0&&c===0?blue:line,.6));
}));
b+=path('M290 122H376V120H517M290 263H396V143H517',blue,1.6,'marker-end="url(#arrow)"');
b+=path('M290 404H421V396H517M290 148H350V269H576M290 289H455V143H634M290 430H478V421H691',line,.8,'marker-end="url(#arrow)"');
b+=path('M508 476H747M508 471v10M747 471v10',ink);
save('cache','Logical requests, physical pages','Three logical block lists point to physical memory pages. Two requests share the blue page, while other paths reach distinct pages. The drawing illustrates ownership and indirection, not a complete page table.',b);

// Token choices fan out; one path is selected.
b='';
const levels=[[280],[180,380],[105,245,335,455],[72,143,212,282,348,414,479]];
const xs=[97,287,486,706];
levels.slice(0,-1).forEach((ys,l)=>ys.forEach((y,i)=>{
 const next=levels[l+1];
 const indices=l===2?(i===3?[6]:[i*2,i*2+1]):[i*2,i*2+1];
 for(const n of indices){if(next[n]===undefined)continue;const active=(l===0&&n===0)||(l===1&&i===0&&n===1)||(l===2&&i===1&&n===2);b+=path(`M${xs[l]+34} ${y}C${xs[l]+94} ${y} ${xs[l+1]-72} ${next[n]} ${xs[l+1]-34} ${next[n]}`,active?blue:line,active?2:.75);}
}));
levels.forEach((ys,l)=>ys.forEach((y,i)=>{const active=[0,0,1,2][l]===i;b+=rect(xs[l]-34,y-23,68,46,active?'#e2eafd':'#edf0e6',active?blue:ink)+repeat(4,k=>path(`M${xs[l]-24} ${y-12+k*8}h${38-(k%2)*11}`,active?blue:line,.7));}));
b+=path('M96 508H752',ink)+xs.map(x=>path(`M${x} 500v16`)).join('');
save('decoding','One continuation among many','Possible token continuations form a branching tree. Blue follows one selected path. Branches and spacing are conceptual, not a beam-search trace or a probability scale.',b);

// Requests enter a queue and are dispatched to workers, then responses return.
b=repeat(9,r=>rect(64,91+r*39,77,25,r===3?blue:'url(#fine)',r===3?blue:ink)+path(`M141 ${104+r*39}H${176+r*5}V${141+r*22}H269`,r===3?blue:line,r===3?1.5:.7));
b+=rect(270,119,124,289,'#eef0e8',ink)+repeat(10,r=>rect(283,132+r*26,98,19,r===2?blue:r%2?pale:'url(#hatch)'));
for(let r=0;r<3;r++){
 const y=91+r*146;
 b+=path(`M394 ${158+r*90}H${433+r*16}V${y+42}H501`,r===1?blue:line,r===1?1.6:.8);
 b+=rect(502,y,168,85,'#eef0e8',ink)+repeat(6,c=>rect(513+c*25,y+12,19,59,r===1&&c===2?blue:'url(#fine)'));
 b+=path(`M670 ${y+42}H${712+r*12}V460H762`,r===1?blue:line,r===1?1.5:.7);
}
b+=path('M765 460V82',blue,1.3,'marker-end="url(#arrow)"')+ticks(64,490,59,12);
save('serving','From incoming requests to running work','Request slips enter a central queue, pass to three worker groups, and join a response path. Blue follows selected work. The illustration does not imply a particular scheduling policy.',b);

// Logical ranks around a ring, with directions explicit.
b='';
const ranks=Array.from({length:8},(_,i)=>{const a=-Math.PI/2+i*Math.PI/4;return [420+260*Math.cos(a),280+184*Math.sin(a)];});
ranks.forEach(([x,y],i)=>{
 const [nx,ny]=ranks[(i+1)%8],dx=nx-x,dy=ny-y,len=Math.hypot(dx,dy),ux=dx/len,uy=dy/len;
 b+=path(`M${x+ux*54} ${y+uy*43}L${nx-ux*54} ${ny-uy*43}`,i<2?blue:ink,i<2?1.8:.9,'marker-end="url(#arrow)"');
 b+=rect(x-44,y-32,88,64,'#edf0e6',ink)+repeat(4,c=>rect(x-35+c*19,y-21,14,42,c===i%4?blue:pale,c===i%4?blue:line));
});
b+=`<ellipse cx="420" cy="280" rx="170" ry="110" stroke="${line}" stroke-width=".6" stroke-dasharray="3 6"/>`;
b+=path('M354 280H486M420 214V346',line,.7)+rect(406,266,28,28,'url(#hatch)',ink);
save('collective','A collective over logical ranks','Eight logical ranks pass chunks around a directed ring. Blue marks one chunk within each rank and selected transfers. Physical links and exact reduction steps belong to the numerical workbench.',b);

// A CPU-like organization: instruction queue, scheduler, execution, retirement.
b=rect(62,116,118,326,'#edf0e6',ink)+repeat(17,r=>rect(73,128+r*18,96,12,r===5?blue:'url(#fine)'));
b+=rect(250,94,120,370,'#edf0e6',ink)+repeat(16,r=>rect(262,108+r*21,96,15,r===5?blue:r%3===0?'url(#hatch)':pale));
b+=repeat(12,r=>path(`M180 ${134+r*23}H${204+r*2}V${122+r*26}H250`,r===4?blue:line,r===4?1.5:.65));
for(let r=0;r<4;r++){
 const y=111+r*92;
 b+=path(`M370 ${141+r*89}H${410+r*11}V${y+26}H470`,r===1?blue:line,r===1?1.5:.7);
 b+=rect(470,y,115,56,r===1?'#e0e9fb':'#edf0e6',r===1?blue:ink)+repeat(5,c=>rect(480+c*19,y+10,13,35,r===1?blue:'url(#fine)'));
 b+=path(`M585 ${y+26}H${616+r*9}V${155+r*79}H690`,r===1?blue:line,r===1?1.5:.7);
}
b+=rect(690,125,80,310,'#edf0e6',ink)+repeat(15,r=>path(`M701 ${138+r*19}h58`,r===5?blue:line,r===5?1.5:.7));
b+=path('M309 470V492H731V440',ink,.8);
save('execution','From instructions to completed work','An instruction stream enters a scheduling structure, fans into several execution units, and joins retirement state. Blue follows selected work. The arrangement is conceptual, not a commercial CPU floorplan.',b);
