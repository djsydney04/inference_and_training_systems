/** Original vector studies. Run: node scripts/generate-illustrations.mjs */
import { writeFileSync } from 'node:fs';
const output = new URL('../public/illustrations/', import.meta.url);
const ink = '#61775b', line = '#9bab91', pale = '#dce3d4', blue = '#2559d6';
const rect = (x,y,w,h,fill='none',stroke=line,extra='') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width=".8" ${extra}/>`;
const path = (d,stroke=line,width=.8,extra='') => `<path d="${d}" stroke="${stroke}" stroke-width="${width}" fill="none" ${extra}/>`;
const dot = (x,y,r=2,fill=blue) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;
const repeat = (n,fn) => Array.from({length:n},(_,i)=>fn(i)).join('');
const grid = (x,y,cols,rows,size,select=()=>false) => repeat(rows,r=>repeat(cols,c=>rect(x+c*size,y+r*size,size-4,size-4,select(r,c)?blue:(r+c)%3===0?'#bccbb0':'#e1e7d9',select(r,c)?blue:line)));
const ticks = (x,y,n,step=12,vertical=false) => repeat(n,i=>path(vertical?`M${x} ${y+i*step}h7`:`M${x+i*step} ${y}v7`));
function save(name,title,description,body,defs='') {
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

// Contour engraving with an illustrative optimization trajectory.
b=path('M85 460H762M95 470V76',ink)+ticks(115,460,52,12)+ticks(87,95,30,12,true);
for(let i=0;i<15;i++){
 const s=1-i*.052;
 b+=`<g transform="translate(427 270) scale(${s})">${path('M-288-16C-310-167-118-213 52-171C205-220 330-104 282 39C260 160 92 216-62 154C-195 184-327 112-288-16Z',i%3===0?ink:line,i%3===0?1:.7)}</g>`;
}
b+=path('M203 143L635 367L317 320L507 195L425 293L462 254L444 268',blue,2,'marker-end="url(#arrow)"');
b+=[[203,143],[635,367],[317,320],[507,195],[425,293],[462,254]].map(([x,y],i)=>dot(x,y,i===0?5:3)).join('');
b+=dot(444,268,5)+path('M192 128v-30h94M655 368h90v49',ink);
save('gradient','A path through a loss landscape','Contour lines surround a low-loss region. Blue points trace an illustrative optimizer trajectory. The contour spacing and step lengths are not measured results.',b);

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
b+=path('M66 104H218V163H265M66 352H375V258H457V240H480',ink,1);
b+=repeat(5,i=>rect(363+i*16,86,10,18,'url(#fine)'));
b+=path('M128 268V392H705V268M128 392V421',ink)+repeat(13,i=>path(`M${82+i*52} 464h13v-24h26v24h13`,ink));
b+=path('M65 421H772',line,.7,'stroke-dasharray="3 5"')+dot(128,392,3,ink)+dot(408,302,2,ink);
save('logic','Logic between clock edges','Fine wires connect combinational gates between two registers. A clock waveform sits underneath. Blue highlights a data path; this illustration does not specify a complete circuit or timing budget.',b);

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
b=grid(96,188,8,8,24,(r,c)=>r>=2&&r<4&&c<2)+grid(461,70,10,6,24,(r,c)=>r<2&&c>=3&&c<5)+grid(461,290,10,8,24,(r,c)=>r>=2&&r<4&&c>=3&&c<5);
b+=path('M296 248H352V350H453M556 218V282',blue,1.6,'marker-end="url(#arrow)"');
b+=rect(334,225,62,62,'#edf0e8',ink)+grid(343,234,2,2,23,()=>true);
b+=path('M85 176h-8v207h8M449 58h-8v150h8M709 278h8v207h-8',ink);
b+=path('M117 125h159M197 91v68M758 343v112M737 399h42',line,1);
save('tiling','Bring a tile to the computation','Three fields represent matrix operands and output. Blue marks selected tiles, with a small local tile between the larger arrays. It illustrates reuse, not particular matrix dimensions or values.',b);

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
