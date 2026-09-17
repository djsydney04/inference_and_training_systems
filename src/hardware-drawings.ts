import "./hardware-drawings.css";
import { rackSlotKinds } from "./rack-layout";

// These are original redrawings of the cited architectural / mechanical references.
// Block boundaries are architectural unless the view explicitly says front or top.
type Part = { id: string; title: string; note: string; link?: string };
type View = { id: string; title: string; boundary: string; source: string; sourceName: string; parts: Part[]; draw(): string };
const hopper = "https://developer.nvidia.com/blog/nvidia-hopper-architecture-in-depth/";
const gb200 = "https://docs.nvidia.com/dgx/dgxgb200-user-guide/hardware.html";
const amd = "https://instinct.docs.amd.com/projects/amdgpu-docs/en/latest/gpu-partitioning/mi300x/overview.html";
const tsp = "https://doi.org/10.1109/ISCA45697.2020.00023";
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]!);
const text = (x: number, y: number, value: string, cls = "hd-label", anchor = "start") => `<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${esc(value)}</text>`;
const rect = (x: number, y: number, w: number, h: number, cls = "hd-outline") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" class="${cls}"/>`;
const group = (id: string, name: string, drawing: string) => `<g data-hd-part="${id}" role="button" tabindex="0" aria-label="Inspect ${esc(name)}" aria-pressed="false"><title>${esc(name)}</title>${drawing}</g>`;
const block = (id: string, x: number, y: number, w: number, h: number, name: string, sub = "", kind = "compute") => group(id, name, rect(x,y,w,h,`hd-component hd-${kind}`) + text(x+w/2,y+h/2+(sub?-4:5),name,"hd-label","middle") + (sub?text(x+w/2,y+h/2+17,sub,"hd-small","middle"):""));
const line = (d: string, cls="hd-link") => `<path d="${d}" class="${cls}"/>`;
const tag = (x: number, y: number, label: string) => text(x,y,label,"hd-caption");
const svg = (id: string, height: number, drawing: string) => `<svg class="hd-svg" viewBox="0 0 880 ${height}" role="group" aria-labelledby="${id}-drawing-title"><title id="${id}-drawing-title">${esc(views.find(v=>v.id===id)!.title)}</title>${drawing}</svg>`;

function hopperDie() {
  let drawing = tag(32,28,"GH100 · full silicon organization") + tag(32,56,"8 GPCs × 9 TPCs × 2 SMs = 144 physical SMs") + rect(28,78,824,376,"hd-package");
  drawing += group("gpc","Graphics processing clusters",Array.from({length:8},(_,i)=>{
    const x=48+(i%4)*199, y=i<4?98:304;
    return rect(x,y,185,128,"hd-component")+tag(x+10,y+21,`GPC ${i+1} · 9 TPCs`)+Array.from({length:9},(_,t)=>{
      const tx=x+10+(t%3)*55,ty=y+34+Math.floor(t/3)*29;
      return rect(tx,ty,49,23,"hd-tpc")+rect(tx+4,ty+4,18,15,"hd-sm")+rect(tx+27,ty+4,18,15,"hd-sm");
    }).join("");
  }).join(""));
  drawing+=block("l2",48,244,782,42,"L2 cache and on-chip interconnect","","memory");
  drawing+=block("hbm",48,478,550,64,"HBM3 on H100 SXM","5 active stacks · 80 GB","memory");
  drawing+=block("io",622,478,208,64,"External I/O","NVLink · PCIe","io");
  drawing+=line("M323 454V478M725 454V478");
  drawing+=tag(48,574,"Each small pair is one TPC; each small rectangle is one SM.");
  drawing+=text(48,605,"H100 SXM enables 132 SMs and 50 MB of L2.","hd-emphasis");
  drawing+=tag(48,630,"Disabled-unit placement is not inferred. HBM blocks below indicate connectivity, not package positions.");
  return svg("hopper-die",654,drawing);
}
function hopperSM() {
  let d=tag(32,28,"H100 · one streaming multiprocessor")+rect(28,46,824,584,"hd-package");
  d+=block("instruction",48,64,784,42,"Shared instruction cache","","control");
  for(let i=0;i<4;i++) {
    const x=48+(i%2)*400,y=124+Math.floor(i/2)*201;
    d+=rect(x,y,384,186,"hd-partition")+tag(x+12,y+21,`Scheduler partition ${i+1} of 4`);
    d+=block("scheduler",x+12,y+31,360,32,"L0 instruction cache · warp scheduler","","control");
    d+=block("registers",x+12,y+73,360,32,"16,384 × 32-bit registers","","memory");
    d+=block("arithmetic",x+12,y+116,224,55,"FP32 · INT32 · FP64","Load/store · special functions");
    d+=block("tensor",x+246,y+116,126,55,"Tensor Core","4th generation");
  }
  d+=block("tma",48,531,784,32,"Tensor Memory Accelerator (TMA)","","io");
  d+=block("shared",48,578,784,34,"256 KB combined L1 data cache / shared memory","","memory");
  d+=tag(48,658,"4 partitions · 4 Tensor Cores · 128 FP32 lanes per SM");
  return svg("hopper-sm",680,d);
}
function mi300x() {
  let d=tag(32,28,"MI300X · chiplet organization")+tag(32,52,"8 XCDs above 4 I/O dies · 8 HBM3 stacks · 192 GB product capacity")+rect(28,72,824,476,"hd-package");
  for(let i=0;i<4;i++) {
    const x=165+(i%2)*280,y=114+Math.floor(i/2)*195;
    d+=group("iod","I/O die",rect(x,y,264,160,"hd-component hd-io")+text(x+132,y+138,`I/O die ${i+1} · Infinity Cache`,"hd-label","middle"));
    for(let k=0;k<2;k++)d+=block("xcd",x+12+k*124,y+13,116,89,`XCD ${i*2+k+1}`,"38 enabled CUs");
  }
  for(let i=0;i<8;i++) {
    const x=i<4?46:741,y=111+(i%4)*100;
    d+=block("hbm",x,y,92,73,`HBM3`,"24 GB","memory");
    d+=line(`M${i<4?138:725} ${y+37}H${i<4?165:741}`);
  }
  d+=text(48,582,"304 enabled compute units across eight compute chiplets.","hd-emphasis");
  d+=tag(48,610,"Overlapping outlines indicate 3D stacking: two XCDs sit above each I/O die.");
  return svg("mi300x",636,d);
}
function rackFront() {
  let d=tag(32,28,"DGX GB200 NVL72 · front elevation")+rect(173,52,334,687,"hd-cabinet")+rect(192,65,296,660,"hd-rack-inside");
  for(let i=0;i<2;i++)d+=group("management","Management switches",rect(205,72+i*16,270,14,"hd-component hd-management")+Array.from({length:16},(_,j)=>rect(220+j*14,75+i*16,9,5,"hd-port")).join(""));
  rackSlotKinds.forEach((kind,i)=>{
    const y=109+i*17;
    let face=rect(205,y,270,15,`hd-component hd-${kind}`);
    if(kind==="power")face+=Array.from({length:6},(_,j)=>rect(215+j*43,y+3,35,9,"hd-psu")).join("");
    else if(kind==="compute")face+=rect(214,y+3,52,9,"hd-vent")+Array.from({length:4},(_,j)=>rect(281+j*34,y+4,24,6,"hd-port")).join("")+rect(436,y+3,28,9,"hd-vent");
    else face+=Array.from({length:18},(_,j)=>rect(216+j*14,y+4,9,6,"hd-port")).join("");
    d+=group(kind,kind==="power"?"Power shelf":kind==="compute"?"Compute tray":"NVLink switch tray",face);
  });
  const callout=(id:string,y:number,name:string,sub:string)=>group(id,name,line(`M478 ${y}H543`)+text(560,y-2,name)+text(560,y+19,sub,"hd-small"));
  d+=callout("management",86,"2 management switches","Ethernet management network");
  d+=callout("power",141,"4 upper power shelves","6 power supplies per shelf");
  d+=callout("compute",261,"10 upper compute trays","2 Grace CPUs + 4 GPUs per tray");
  d+=callout("switch",421,"9 NVLink switch trays","2 NVSwitch chips per tray");
  d+=callout("compute",566,"8 lower compute trays","18 compute trays in total");
  d+=callout("power",668,"4 lower power shelves","8 power shelves in total");
  d+=line("M215 713L465 727M465 713L215 727","hd-brace");
  d+=tag(32,775,"72 Blackwell GPUs · 36 Grace CPUs · 18 NVSwitch chips");
  return svg("rack-front",800,d);
}
function trayTop() {
  let d=tag(32,28,"DGX GB200 compute tray · top view")+tag(32,54,"REAR · blind-mate rack connections")+text(848,54,"FRONT · service access","hd-caption","end")+rect(28,74,824,470,"hd-chassis");
  d+=line("M70 93V526M115 93V526","hd-cooling");
  for(let i=0;i<4;i++)d+=block("gpu",142,100+i*104,129,85,`GPU ${i+1}`,"Blackwell");
  for(let i=0;i<2;i++) {
    d+=block("cpu",305,151+i*208,133,85,`Grace ${i+1}`,"CPU");
    d+=line(`M271 ${142+i*208}H289V${194+i*208}H305M271 ${246+i*208}H289V${194+i*208}`);
  }
  for(let i=0;i<4;i++)d+=block("nic",463,110+i*100,106,68,`CX-7 ${i+1}`,"400 Gb/s","io");
  d+=group("fans","Air cooling fan bank",rect(592,99,83,411,"hd-component")+Array.from({length:4},(_,i)=>`<circle cx="633" cy="${150+i*100}" r="29" class="hd-fan"/>`+line(`M613 ${130+i*100}L653 ${170+i*100}M653 ${130+i*100}L613 ${170+i*100}`,"hd-fan-blade")).join(""));
  d+=block("dpu",699,106,130,101,"BlueField-3","DPU 1","io");
  d+=block("storage",699,228,130,162,"Storage / BMC","Front service zone","memory");
  d+=block("dpu",699,411,130,101,"BlueField-3","DPU 2","io");
  d+=group("cooling","Cold plates and liquid connections",text(85,286,"Liquid connections","hd-small","middle").replace('<text ','<text transform="rotate(-90 85 286)" '));
  d+=tag(32,578,"GPU / CPU zone → adapters → fan bank → front service zone");
  d+=tag(32,605,"Component placement follows the published top view; outlines and cable routes are simplified.");
  return svg("tray-top",630,d);
}
function groq() {
  let d=tag(32,28,"Groq Tensor Streaming Processor · published 2020 architecture")+tag(32,54,"Functional organization · instruction flow is vertical; operand streams are horizontal");
  const names=["Memory","Vector","Shuffle","Matrix","Shuffle","Vector","Memory"];
  const ids=["memory","vector","shuffle","matrix","shuffle","vector","memory"];
  d+=block("instructions",36,79,808,48,"Compiler-scheduled instruction streams","","control");
  for(let i=0;i<7;i++){
    const x=36+i*117;
    d+=line(`M${x+53} 127V159`,"hd-instruction");
    d+=block(ids[i],x,160,106,288,names[i],"",i===0||i===6?"memory":"compute");
  }
  for(let lane=0;lane<4;lane++) d+=line(`M49 ${223+lane*54}H830`,"hd-stream");
  d+=group("streams","Horizontal operand streams",text(440,477,"Data streams pass between functional slices","hd-emphasis","middle"));
  d+=tag(36,520,"The four lines illustrate streams; they do not represent the number of superlanes.");
  d+=tag(36,547,"Repeated functional classes are schematic, not a claimed physical slice count or a current-product floorplan.");
  return svg("groq-slices",575,d);
}
const views: View[] = [
  {id:"hopper-die",title:"H100: full chip and enabled product",source:hopper,sourceName:"NVIDIA Hopper architecture · Figures 3–4",boundary:"Full GH100 organization is shown separately from H100 SXM’s enabled configuration. This is a block diagram, not a photomicrograph or a map of disabled units.",parts:[
    {id:"gpc",title:"GPC → TPC → SM",note:"The full GH100 design has eight graphics processing clusters. Each contains nine texture processing clusters with two streaming multiprocessors each: 144 physical SMs. H100 SXM enables 132 SMs; PCIe H100 is a different configuration.",link:"hopper-sm"},
    {id:"l2",title:"L2 cache",note:"H100 SXM exposes 50 MB of shared L2, compared with 60 MB in the full GH100 design. SM requests can hit in L2 or travel to the memory controllers; HBM is not a cache."},
    {id:"hbm",title:"HBM3 capacity",note:"The H100 SXM product uses five active HBM3 stacks for 80 GB. The six interfaces in the full GH100 design must not be mistaken for six active stacks on this product."},
    {id:"io",title:"Two different external paths",note:"PCIe connects the GPU to the host I/O system; NVLink connects compatible accelerators. Neither link is the on-package HBM memory interface."}],draw:hopperDie},
  {id:"hopper-sm",title:"Inside one H100 SM",source:hopper,sourceName:"NVIDIA Hopper SM block diagram · Figure 4",boundary:"Four scheduler partitions follow NVIDIA’s published SM organization. Execution boxes summarize functional units; box area does not indicate throughput. H100 accumulators use registers, not Blackwell’s Tensor Memory.",parts:[
    {id:"instruction",title:"Shared instruction cache",note:"The shared instruction cache supplies the partition-local instruction caches. The instruction path is distinct from operand storage."},
    {id:"scheduler",title:"Warp scheduler",note:"Each of four partitions has a warp scheduler and dispatch logic. A warp is a group of 32 threads; not every unit can execute every instruction."},
    {id:"registers",title:"Register file",note:"Each partition has 16,384 32-bit registers. Across four partitions that is 65,536 registers. Register use per thread can limit how many warps remain resident."},
    {id:"arithmetic",title:"Ordinary execution pipelines",note:"FP32, integer, FP64, load/store and special-function paths execute different instruction classes. Tensor Core peak throughput does not apply to this entire instruction mix."},
    {id:"tensor",title:"Fourth-generation Tensor Cores",note:"There is one Tensor Core per scheduler partition, four per SM. The supported matrix instruction specifies tile shapes, input types and accumulation semantics."},
    {id:"tma",title:"Tensor Memory Accelerator",note:"Hopper’s TMA supports asynchronous bulk tensor transfers, including global-to-shared copies. Synchronization establishes when the shared-memory tile is safe to consume."},
    {id:"shared",title:"L1 / shared memory",note:"The combined L1 data-cache and shared-memory structure is 256 KB per SM. This does not mean a thread block can allocate 256 KB of shared memory; allocation limits and carveout apply."}],draw:hopperSM},
  {id:"mi300x",title:"MI300X: compute chiplets over I/O dies",source:amd,sourceName:"AMD MI300X chiplet and partitioning overview",boundary:"Chiplet topology follows AMD’s published organization. This is a topological package drawing; interposer routes, exact die dimensions and bump locations are omitted.",parts:[
    {id:"xcd",title:"Eight accelerator compute dies",note:"Each XCD has 38 enabled compute units on MI300X, for 304 enabled CUs. The physical design contains 40 CUs per XCD; an architectural maximum is not the enabled product count."},
    {id:"iod",title:"Four I/O dies under the XCDs",note:"Two compute dies are stacked over each I/O die. These base dies provide memory and interconnect functions, including the distributed Infinity Cache."},
    {id:"hbm",title:"Eight HBM3 stacks",note:"MI300X has eight HBM3 stacks and 192 GB advertised memory capacity. The lines indicate attachment to the package fabric, not independent private memory owned by each nearby XCD."}],draw:mi300x},
  {id:"rack-front",title:"NVL72: the actual tray order",source:gb200,sourceName:"NVIDIA DGX GB200 hardware · rack configuration",boundary:"Front-view tray order follows NVIDIA’s reference rack: two management switches, four power shelves, ten compute trays, nine switch trays, eight compute trays, four power shelves. Faceplates are simplified; port glyphs are illustrative, not connector counts.",parts:[
    {id:"management",title:"Management Ethernet",note:"Two top-of-rack switches serve system management. They are separate from the NVLink fabric and from the scale-out data network."},
    {id:"power",title:"Eight power shelves",note:"Four shelves sit above the upper compute group and four below the lower group. Each shelf contains six power supplies. Power distribution is separate from data connectivity."},
    {id:"compute",title:"Eighteen compute trays",note:"Each 1RU compute tray contains two Grace CPUs and four Blackwell GPUs. Ten trays sit above and eight below the switch group: 36 CPUs and 72 GPUs per rack.",link:"tray-top"},
    {id:"switch",title:"Nine NVLink switch trays",note:"The central nine trays each contain two NVSwitch chips. Passive copper cable cartridges at the rear connect compute and switch trays; the front-panel order is not a network topology."}],draw:rackFront},
  {id:"tray-top",title:"Inside a GB200 compute tray",source:gb200,sourceName:"NVIDIA DGX GB200 hardware · compute tray top view",boundary:"A simplified plan of the published tray, rear at left and front at right. CPU/GPU cold plates use liquid cooling; fans cool the air-cooled components. Connection lines explain association and are not cable routing instructions.",parts:[
    {id:"gpu",title:"Four Blackwell GPUs",note:"The four GPU cold plates occupy the rear compute zone. Each Grace CPU is paired with two GPUs as a GB200 Superchip."},
    {id:"cpu",title:"Two Grace CPUs",note:"The two CPU sites sit beside the GPU pairs. NVLink-C2C connects each CPU to its GPUs; the logical connection shown is distinct from external NVLink switching."},
    {id:"nic",title:"Four ConnectX-7 adapters",note:"The reference tray has four ConnectX-7 network adapters, each with a single 400 Gb/s OSFP connection for scale-out traffic."},
    {id:"fans",title:"Air cooling zone",note:"Fans move air through components such as networking and storage. The fan symbols show the fan-bank region, not a serviceable fan inventory."},
    {id:"dpu",title:"Two BlueField-3 DPUs",note:"Two DPUs provide infrastructure and network processing. They are distinct from both the Grace application CPUs and the ConnectX adapters."},
    {id:"storage",title:"Storage and management",note:"The tray has four E1.S data NVMe drives plus a separate M.2 boot drive. The front service zone also exposes management interfaces; this box summarizes the region."},
    {id:"cooling",title:"Liquid-cooling connections",note:"Rack manifolds supply and return coolant for the CPU and GPU cold plates. The blue lines locate the rear liquid connection zone; they do not claim the internal plumbing route."}],draw:trayTop},
  {id:"groq-slices",title:"Groq: slices and streams",source:tsp,sourceName:"Abts et al. · ISCA 2020 Tensor Streaming Processor",boundary:"This view explains the published first-generation TSP. It is a functional slice diagram, not an exact die floorplan, not a current Groq product specification, and not a CUDA-style collection of SMs.",parts:[
    {id:"instructions",title:"Compiler-scheduled control",note:"The compiler schedules work across functional slices. Instruction distribution and operand streaming are separate paths."},
    {id:"memory",title:"On-chip SRAM slices",note:"Memory slices read and write explicitly scheduled on-chip state. These are not a demand-filled GPU cache hierarchy."},
    {id:"vector",title:"Vector arithmetic",note:"Vector units perform elementwise and other non-matrix work required between matrix operations."},
    {id:"shuffle",title:"Data rearrangement",note:"Shuffle operations align and rearrange values for subsequent consumers. Layout changes still require execution resources."},
    {id:"matrix",title:"Matrix arithmetic",note:"Matrix units execute the dense linear algebra scheduled by the compiler. Data must reach the correct unit at the required time."},
    {id:"streams",title:"Operand streams",note:"Operands move horizontally between functional slices while instruction control is distributed vertically. The drawing’s four guide lines are not a count of hardware lanes."}],draw:groq}
];
const explorers = [
  {host:"gpu-scene",id:"gpu",title:"GPU architecture, drawn in plan",ids:["hopper-die","hopper-sm","mi300x"]},
  {host:"rack-scene",id:"rack-model",title:"The NVL72 rack and compute tray",ids:["rack-front","tray-top"]},
  {host:"lpu-scene",id:"lpu-hardware",title:"The Groq streaming architecture",ids:["groq-slices"]}
];
export function prepareHardwareDrawings() {
  for(const explorer of explorers) {
    const host=document.getElementById(explorer.host)?.closest(".three-lab");
    if(!host)continue;
    host.outerHTML=`<figure id="${explorer.id}" class="hardware-drawing wide-figure" data-hardware-drawing="${explorer.id}" data-lesson="${esc(explorer.title)}"><figcaption><span>Hardware reference drawing</span><strong>${esc(explorer.title)}</strong><p>Inspect the named parts, or let the guided tour move through each view.</p></figcaption><div class="hd-tabs" role="group" aria-label="Hardware view">${explorer.ids.map((id,i)=>`<button type="button" data-hd-view="${id}" aria-pressed="${i===0}">${esc(views.find(v=>v.id===id)!.title)}</button>`).join("")}</div><div class="hd-canvas" tabindex="0" aria-label="Hardware drawing; scroll horizontally for all components"></div><div class="hd-inspector" aria-live="polite"></div><p class="hd-boundary"></p><a class="hd-source lesson-source" target="_blank" rel="noreferrer"></a></figure>`;
  }
}
export function initializeHardwareDrawings() {
  for(const explorer of explorers) {
    const root=document.querySelector<HTMLElement>(`[data-hardware-drawing="${explorer.id}"]`);
    if(!root)continue;
    let view=views.find(v=>v.id===explorer.ids[0])!;
    const select=(id:string)=>{
      const part=view.parts.find(p=>p.id===id)!;
      root.querySelectorAll<SVGElement>("[data-hd-part]").forEach(node=>node.setAttribute("aria-pressed",String(node.dataset.hdPart===id)));
      root.querySelector(".hd-inspector")!.innerHTML=`<span>${esc(view.title)}</span><h4>${esc(part.title)}</h4><p>${esc(part.note)}</p>${part.link?`<button type="button" data-hd-open="${part.link}">Look inside →</button>`:""}`;
    };
    const render=(id:string)=>{
      view=views.find(v=>v.id===id)!;
      root.querySelector(".hd-canvas")!.innerHTML=view.draw();
      root.querySelectorAll<HTMLElement>("[data-hd-view]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.hdView===id)));
      root.querySelector(".hd-boundary")!.textContent=view.boundary;
      const source=root.querySelector<HTMLAnchorElement>(".hd-source")!;source.href=view.source;source.textContent=`Drawing reference: ${view.sourceName} ↗`;
      select(view.parts[0].id);
    };
    root.addEventListener("click",event=>{
      const target=event.target as Element;
      const tab=target.closest<HTMLElement>("[data-hd-view], [data-hd-open]");
      if(tab)render(tab.dataset.hdView??tab.dataset.hdOpen!);
      const part=target.closest<SVGElement>("[data-hd-part]");if(part)select(part.dataset.hdPart!);
    });
    root.addEventListener("keydown",event=>{
      const part=(event.target as Element).closest<SVGElement>("[data-hd-part]");
      if(part&&["Enter"," "].includes(event.key)){event.preventDefault();select(part.dataset.hdPart!);}
    });
    render(view.id);
  }
}
