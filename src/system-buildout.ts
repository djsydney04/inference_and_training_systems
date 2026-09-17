import "./system-buildout.css";
import { rackInventory, rackSlotKinds } from "./rack-layout";

type Level = "system" | "rack" | "tray" | "facility";
const info: Record<string, {title:string; body:string; note:string; next?:Level}> = {
  rack: {title:"One NVL72 domain", body:"Eighteen compute trays contribute four GPUs each. Nine switch trays connect those GPUs through eighteen NVSwitch chips. A rack is one scale-up domain within the larger system.", note:"Open the rack to see compute, switches and infrastructure separately.", next:"rack"},
  fabric: {title:"Scale-out compute fabric", body:"Network adapters and external switches carry traffic between rack domains. The schematic shows a leaf/spine relationship, not the exact rail-aligned cabling or switch count of a deployment.", note:"A collective that leaves a rack crosses a different bandwidth, latency and failure boundary."},
  storage: {title:"Storage path", body:"Dataset reads and checkpoint writes use the storage network. Its workload, congestion and availability requirements differ from accelerator collectives.", note:"Provision checkpoint bursts and recovery reads, not just average training traffic."},
  management: {title:"Management paths", body:"In-band services provision and operate the cluster. Out-of-band controllers provide a separate hardware-management path, including when the host operating system is unavailable.", note:"Logical network roles and physical network count are different concepts."},
  tray: {title:"A compute tray", body:"The DGX GB200 reference tray contains two Grace CPUs, four B200 GPUs, four ConnectX-7 adapters and two BlueField-3 DPUs, with local storage and management interfaces.", note:"Board positions here are schematic, not a service drawing.", next:"tray"},
  switches: {title:"Nine switch trays", body:"Each switch tray contains two NVSwitch chips. Every GPU has a link to each of the eighteen chips in the rack fabric.", note:"The drawing separates logical connectivity from rear cable-cartridge placement."},
  power: {title:"Power delivery", body:"Power shelves and bus bars deliver energy to the rack; local converters provide the voltages components require. The DGX GB200 reference describes eight power shelves.", note:"Nameplate supply capacity is not the same as measured operating load or a facility design target.", next:"facility"},
  cooling: {title:"Heat removal", body:"Cold plates transfer heat to a liquid loop. The coolant distribution unit exchanges heat with the facility loop. Components outside the liquid-cooled set still require air cooling.", note:"Coolant flow and return temperature constrain sustained operation; they do not carry tensor data.", next:"facility"},
  cpu: {title:"Grace host CPUs", body:"Host software manages execution, memory and communication. The superchip’s coherent NVLink-C2C connection has a different scope from the rack NVLink fabric.", note:"Host control work and accelerator tensor work share a system but have different bottlenecks."},
  gpu: {title:"B200 accelerator and local memory", body:"The accelerator executes kernels over model shards and activations in device memory. Its scale-up links reach the rack switches; scale-out communication uses a separate adapter path.", note:"Capacity, memory bandwidth and arithmetic throughput are separate limits."},
  nic: {title:"ConnectX scale-out adapters", body:"These adapters join the compute fabric beyond the local rack. Communication software maps collective work onto the actual rank placement and available links.", note:"Four adapters are shown per reference tray. Ports and physical cable routes are abstracted."},
  dpu: {title:"BlueField storage and in-band paths", body:"These interfaces connect storage and in-band management roles in the reference system, separately from the scale-out accelerator compute fabric.", note:"Keep role, isolation policy and shared physical resources explicit."},
  cdu: {title:"Coolant distribution unit", body:"A heat exchanger separates the technology cooling loop from the facility water loop. Pumps, controls, water quality and service isolation determine the operating envelope.", note:"This diagram describes the thermal path; it does not calculate facility sizing."},
  facilitywater: {title:"Facility water loop", body:"The building-side loop transports heat from the coolant distribution unit toward the facility’s heat-rejection equipment. The heat exchanger transfers energy without requiring the facility water to enter the servers.", note:"Water quality, temperature and pressure requirements must be checked on each side of the exchanger."},
};
const esc=(value:string)=>value.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]!);
const node=(id:string,x:number,y:number,w:number,h:number,label:string,sub:string,tone="")=>`<g role="button" tabindex="0" data-system-part="${id}" aria-label="Inspect ${esc(label)}" class="sb-node ${tone}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/><text x="${x+w/2}" y="${y+27}" class="sb-label">${esc(label)}</text><text x="${x+w/2}" y="${y+47}" class="sb-sub">${esc(sub)}</text></g>`;
const wire=(d:string,kind="data")=>`<path class="sb-wire sb-${kind}" d="${d}"/>`;
const start=(title:string)=>`<svg class="sb-svg" viewBox="0 0 1000 560" aria-label="${esc(title)}"><defs><pattern id="sb-vents" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M1 1V5" stroke="#59625b" stroke-width="1"/></pattern></defs>`;

function cabinet(x:number,y:number,w:number,label:string) {
  const h=212;
  return `<g class="sb-cabinet" role="button" tabindex="0" data-system-part="rack" aria-label="Inspect ${label}"><path d="M${x+w} ${y}l12 -10v${h}l-12 10Z" fill="#aeb6ad"/><path d="M${x} ${y}l12 -10h${w}l-12 10Z" fill="#d7dbd1"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#e9ece3" stroke="#778276"/>${Array.from({length:18},(_,i)=>`<rect x="${x+7}" y="${y+12+i*10}" width="${w-14}" height="7" fill="${i%6===2?"#2559d6":"#465449"}"/>`).join("")}<text x="${x+w/2}" y="${y+h+24}" class="sb-label">${label}</text><text x="${x+w/2}" y="${y+h+43}" class="sb-sub">72 GPUs</text></g>`;
}

function systemDiagram(count:number,plane:string) {
  let svg=start("A system of NVL72 racks with separate compute, storage, management and facility paths");
  svg+=`<text x="36" y="28" class="sb-overline">Across racks</text>`;
  const gap=900/count,w=Math.min(144,gap-25);
  for(let i=0;i<count;i++){
    const x=50+i*gap+(gap-w)/2;
    svg+=wire(`M500 90V110H${x+w/2}V226`,plane==="data"?"data":"context");
    if(plane!=="data") {
      const origin=plane==="storage"?180:plane==="management"?502:824;
      svg+=wire(`M${origin} 493V482H${x+w/2}V440`,plane);
    }
    svg+=cabinet(x,228,w,`Rack ${i+1}`);
  }
  svg+=node("fabric",350,34,300,60,"Scale-out fabric","external switches · separate from NVLink");
  svg+=node("storage",42,493,276,60,"Storage","datasets + checkpoints",plane==="storage"?"is-selected":"");
  svg+=node("management",364,493,276,60,"Management","in-band services + out-of-band control",plane==="management"?"is-selected":"");
  svg+=node("cooling",686,493,276,60,"Facility","power delivery + heat removal",plane==="facility"?"is-selected":"");
  return svg+`<text x="500" y="168" class="sb-sub">${plane==="data"?"Compute traffic: adapters → leaf / spine → peer rack":plane==="storage"?"Storage is a separate path; blue compute wiring remains contextual":plane==="management"?"Management is a separate operational path, including out-of-band access":"Power and heat follow physical infrastructure, not the compute network"}</text></svg>`;
}

function rackDiagram() {
  let svg=start("Rack composition showing eighteen compute trays, nine switch trays, eight power shelves and separate cooling");
  svg+=`<rect x="44" y="36" width="322" height="478" class="sb-enclosure"/><text x="205" y="64" class="sb-label">DGX GB200 rack</text>`;
  const kinds=rackSlotKinds.map(kind=>kind==="compute"?"tray":kind==="switch"?"switches":"power");
  let c=0,n=0,p=0;
  kinds.forEach((kind,i)=>{const number=kind==="tray"?++c:kind==="switches"?++n:++p;const y=82+i*11.7;
    svg+=`<g role="button" tabindex="0" data-system-part="${kind}" aria-label="Inspect ${kind} ${number}" class="sb-rack-slot"><rect x="65" y="${y}" width="280" height="9" fill="${kind==="tray"?"#465449":kind==="switches"?"#2559d6":"#b78a57"}"/><path d="M73 ${y+3}h220" stroke="#ffffff" opacity=".18"/></g>`;
  });
  svg+=wire("M366 172H465")+wire("M366 290H465")+wire("M366 417H465","facility");
  svg+=node("tray",468,116,474,78,"18 compute trays","4 GPUs + 2 CPUs per tray · 72 GPUs + 36 CPUs total");
  svg+=node("switches",468,250,474,78,"9 switch trays","2 NVSwitch chips per tray · 18 switching endpoints");
  svg+=node("power",468,384,224,78,"8 power shelves","reference rack composition","sb-power");
  svg+=node("cooling",718,384,224,78,"Cooling manifolds","supply + return","sb-cooling");
  return svg+`<text x="500" y="546" class="sb-sub">Functional grouping and spacing are schematic; use service documentation for physical slot positions.</text></svg>`;
}

function trayDiagram() {
  let svg=start("Compute tray with two Grace hosts, four B200 GPUs and separate network adapters");
  svg+=`<rect x="26" y="24" width="948" height="510" class="sb-enclosure"/><text x="500" y="50" class="sb-label">Compute tray · logical wiring, not board layout</text>`;
  for(let pair=0;pair<2;pair++){
    const x=60+pair*470;
    svg+=`<rect x="${x}" y="92" width="410" height="274" class="sb-superchip"/>`;
    svg+=wire(`M${x+205} 172V205H${x+100}V232M${x+205} 205H${x+310}V232`);
    svg+=node("cpu",x+97,112,216,60,"Grace CPU","host + coherent C2C");
    svg+=node("gpu",x+18,232,174,94,"B200 GPU","local HBM");
    svg+=node("gpu",x+218,232,174,94,"B200 GPU","local HBM");
    svg+=`<text x="${x+205}" y="351" class="sb-sub">One GB200 superchip</text>`;
  }
  svg+=node("nic",60,410,270,80,"4 ConnectX adapters","scale-out compute fabric");
  svg+=node("dpu",366,410,270,80,"2 BlueField DPUs","storage + in-band management");
  svg+=node("switches",672,410,270,80,"NVLink connections","to the rack’s switch trays");
  svg+=wire("M162 326V386H806V410")+wire("M838 326V386")+wire("M296 326V386")+wire("M632 326V386");
  return svg+`<text x="500" y="523" class="sb-sub">Local storage, converters and management controllers are present but omitted from this wiring view.</text></svg>`;
}

function facilityDiagram() {
  let svg=start("Separate electrical and thermal paths for an accelerator rack");
  svg+=`<text x="34" y="48" class="sb-overline">Energy enters</text><text x="34" y="300" class="sb-overline">Heat leaves</text>`;
  svg+=wire("M286 136H355M645 136H714","facility");
  svg+=node("power",30,100,256,100,"Facility power","distribution + redundancy","sb-power");
  svg+=node("power",356,100,290,100,"Shelves + bus bar","conversion + rack delivery","sb-power");
  svg+=node("gpu",714,100,256,100,"Components","compute + memory + networking");
  svg+=wire("M842 200V334M714 375H646M356 375H286","cooling");
  svg+=wire("M286 425H356M646 425H714","return");
  svg+=node("facilitywater",30,334,256,112,"Facility loop","heat rejection + water system","sb-cooling");
  svg+=node("cdu",356,334,290,112,"CDU / heat exchanger","separates the two water loops","sb-cooling");
  svg+=node("cooling",714,334,256,112,"Cold plates + manifolds","technology cooling loop","sb-cooling");
  return svg+`<text x="500" y="513" class="sb-sub">Thermal relationship schematic: the two coolant loops exchange heat; their water need not mix.</text><text x="500" y="541" class="sb-sub">Return line is conceptual. Air cooling remains necessary for other rack components.</text></svg>`;
}

export function prepareSystemBuildout() {
  document.getElementById("rack-model")?.insertAdjacentHTML("beforebegin",`<section class="lesson" id="system-buildout" data-lesson="Build the complete system"><header><span>From a tray to a cluster</span><h3>A rack needs more than accelerators</h3></header><p>Follow the system at four scales. Separate the links that move tensors from the paths that deliver power, remove heat, store checkpoints and keep machines manageable.</p><figure class="system-buildout"><figcaption><span>Layered system atlas</span><strong>Inspect the system, rack, tray and facility</strong><p>Select a component for notes; open its next level to follow what it contains.</p></figcaption><nav class="sb-levels" aria-label="System diagram level">${(["system","rack","tray","facility"] as Level[]).map(level=>`<button type="button" data-sb-level="${level}" aria-pressed="${level==="system"}">${({system:"Whole system",rack:"Rack composition",tray:"Compute tray",facility:"Power and cooling"})[level]}</button>`).join("")}</nav><div class="sb-controls"><label>Racks <select data-sb-count><option>1</option><option>2</option><option selected>4</option><option>8</option></select></label><label>Inspect a path <select data-sb-plane><option value="data">Compute</option><option value="storage">Storage</option><option value="management">Management</option><option value="facility">Facility</option></select></label><output data-sb-totals></output></div><div class="sb-canvas" tabindex="0" aria-label="System diagram; scroll horizontally to inspect the full view"></div><div class="sb-inspector" aria-live="polite"></div><p class="sb-boundary">Based on NVIDIA’s DGX GB200 reference architecture, June 2025. Topology and floor placement are abstracted; counts are for that reference configuration. This is not a procurement or facility-sizing tool.</p><p class="sb-source"><a class="lesson-source" href="https://docs.nvidia.com/dgx-superpod/reference-architecture-scalable-infrastructure-gb200/latest/dgx-superpod-components.html" target="_blank" rel="noreferrer">DGX GB200 components</a> · <a class="lesson-source" href="https://docs.nvidia.com/dgx-superpod/reference-architecture-scalable-infrastructure-gb200/latest/network-fabrics.html" target="_blank" rel="noreferrer">Network fabrics and domain boundaries</a></p></figure></section>`);
}

export function initializeSystemBuildout() {
  const figure=document.querySelector<HTMLElement>(".system-buildout");if(!figure)return;
  let level:Level="system";
  const count=figure.querySelector<HTMLSelectElement>("[data-sb-count]")!;
  const plane=figure.querySelector<HTMLSelectElement>("[data-sb-plane]")!;
  const inspect=(key:string)=>{
    const part=info[key];
    figure.querySelector(".sb-inspector")!.innerHTML=`<div><span>Selected component</span><strong class="sb-component-title">${esc(part.title)}</strong><p>${esc(part.body)}</p></div><aside><p>${esc(part.note)}</p>${part.next&&part.next!==level?`<button type="button" data-sb-level="${part.next}">Open ${part.next==="facility"?"power and cooling":part.next}</button>`:""}</aside>`;
    figure.querySelectorAll("[data-system-part]").forEach(node=>{const active=node.getAttribute("data-system-part")===key;node.classList.toggle("is-selected",active);node.setAttribute("aria-pressed",String(active));});
  };
  const render=()=>{
    figure.querySelector(".sb-canvas")!.innerHTML=level==="system"?systemDiagram(Number(count.value),plane.value):level==="rack"?rackDiagram():level==="tray"?trayDiagram():facilityDiagram();
    figure.querySelector<HTMLElement>(".sb-controls")!.hidden=level!=="system";
    const inventory=rackInventory(Number(count.value));
    figure.querySelector("[data-sb-totals]")!.textContent=`${inventory.gpus} GPUs · ${inventory.cpus} CPUs · ${inventory.computeTrays} compute trays`;
    figure.querySelectorAll(".sb-levels button").forEach(button=>button.setAttribute("aria-pressed",String(button.getAttribute("data-sb-level")===level)));
    inspect(level==="system"?({data:"fabric",storage:"storage",management:"management",facility:"cooling"})[plane.value]!:level==="rack"?"rack":level==="tray"?"tray":"power");
  };
  figure.addEventListener("click",event=>{
    const target=event.target as Element;
    const change=target.closest<HTMLElement>("[data-sb-level]");if(change){level=change.dataset.sbLevel as Level;render();return;}
    const part=target.closest<HTMLElement>("[data-system-part]");if(part)inspect(part.dataset.systemPart!);
  });
  figure.addEventListener("keydown",event=>{const part=(event.target as Element).closest<HTMLElement>("[data-system-part]");if(part&&["Enter"," "].includes(event.key)){event.preventDefault();inspect(part.dataset.systemPart!);}});
  count.addEventListener("change",render);plane.addEventListener("change",render);render();
}
