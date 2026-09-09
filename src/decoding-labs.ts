import {speculativeMass,speculativeDraw} from "./decoding-math";
const presets: Record<string,[number[],number[]]> = {
  unequal:[[.1,.4,.2,.3],[.4,.1,.3,.2]], close:[[.1,.4,.2,.3],[.12,.38,.22,.28]],
  identical:[[.1,.4,.2,.3],[.1,.4,.2,.3]], disjoint:[[0,.6,0,.4],[.7,0,.3,0]],
};
export function initializeDecodingLabs() {
  const host=document.getElementById("speculation-lab");if(!host)return;
  const find=<T extends Element=HTMLElement>(s:string)=>host.querySelector<T>(s)!;
  let stage=0;
  const candidate=find<HTMLSelectElement>("[data-spec-candidate]");
  const labels=["A","B","C","D"], percent=(v:number)=>(v*100).toFixed(1)+"%";
  const render=()=>{
    const [p,q]=presets[find<HTMLSelectElement>("[data-spec-preset]").value];
    let index=Number(candidate.value);
    if(!q[index]) index=q.findIndex(v=>v>0);
    candidate.innerHTML=labels.map((label,i)=>`<option value="${i}" ${i===index?"selected":""} ${q[i]===0?"disabled":""}>Token ${label}${q[i]===0?" · never proposed":""}</option>`).join("");
    const u=Number(find<HTMLInputElement>("[data-spec-uniform]").value)/100;
    const draw=speculativeDraw(p,q,q.slice(0,index).reduce((s,v)=>s+v,0)+q[index]/2,u,.65);
    const mass=speculativeMass(p,q);
    find("[data-spec-uniform-value]").textContent=u.toFixed(2);
    const explanations=[
      ["1 / Propose from q",`Token ${labels[index]} has proposal probability ${percent(q[index])}. Target probability at the same prefix is ${percent(p[index])}.`],
      ["2 / Accept overlapping mass",`Acceptance threshold for ${labels[index]} is ${percent(draw.threshold)}. With u=${u.toFixed(2)}, this candidate is ${draw.accepted?"accepted":"rejected"}. Total unconditional acceptance is ${percent(mass.acceptance)}.`],
      ["3 / Repair after rejection",mass.residual?`Rejection occurs with probability ${percent(mass.rejected)}. The missing mass is normalized only in that branch. This example ${draw.accepted?"keeps its accepted candidate":`replaces the candidate with token ${labels[draw.token]}`}.`:"The distributions are identical. Rejection has zero probability; no residual sampler is constructed or called."],
      ["4 / Reconstruct the target",`For every token, accepted mass + repair mass equals p. The total is 100%. This identity holds even for disjoint proposal and target support.`],
    ];
    find("[data-spec-explanation]").innerHTML=`<span>${explanations[stage][0]}</span><p>${explanations[stage][1]}</p>`;
    const columns=[{name:"Proposal q",values:q,show:true},{name:"Target p",values:p,show:true},{name:"Accepted mass",values:mass.accepted,show:stage>=1},{name:"Repair mass",values:mass.repair,show:stage>=2},{name:"Output mass",values:mass.output,show:stage>=3}];
    find("[data-spec-chart]").innerHTML=`<svg viewBox="0 0 900 290" role="img" aria-label="Probability decomposition; exact masses appear in the table below.">${columns.map((c,j)=>`<g opacity="${c.show?1:.2}"><text x="${50+j*170}" y="28">${c.name}</text>${c.values.map((value,i)=>`<text x="${32+j*170}" y="${65+i*51}">${labels[i]}</text><rect x="${50+j*170}" y="${49+i*51}" width="135" height="23" fill="#e8eade"/><rect x="${50+j*170}" y="${49+i*51}" width="${135*value}" height="23" fill="${j===0?"#59625b":"#2559d6"}"/><text x="${50+j*170}" y="${88+i*51}" class="probability-number">${c.show?percent(value):"—"}</text>`).join("")}</g>`).join("")}</svg>`;
    find("[data-spec-table]").innerHTML=`<table><caption>Full probability accounting, including the conditional residual</caption><thead><tr><th scope="col">Token</th><th scope="col">q</th><th scope="col">p</th><th scope="col">Accepted</th><th scope="col">Repair mass</th><th scope="col">Residual if rejected</th><th scope="col">Output</th></tr></thead><tbody>${labels.map((l,i)=>`<tr><th scope="row">${l}</th><td>${percent(q[i])}</td><td>${percent(p[i])}</td><td>${percent(mass.accepted[i])}</td><td>${percent(mass.repair[i])}</td><td>${mass.residual?percent(mass.residual[i]):"not used"}</td><td>${percent(mass.output[i])}</td></tr>`).join("")}</tbody></table>`;
    find<HTMLButtonElement>("[data-spec-next]").disabled=stage===3;
  };
  find("[data-spec-next]").addEventListener("click",()=>{stage=Math.min(3,stage+1);render();});
  find("[data-spec-reset]").addEventListener("click",()=>{stage=0;render();});
  find("[data-spec-preset]").addEventListener("change",()=>{stage=0;render();});
  candidate.addEventListener("change",render);
  find("[data-spec-uniform]").addEventListener("input",render);
  render();
}
