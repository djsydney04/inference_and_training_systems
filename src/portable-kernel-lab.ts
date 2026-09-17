import "./portable-kernel.css";
import { kernelBackends } from "./portable-kernel-data";
import { tileBounds, tilePlan, type TileShape } from "./portable-kernel-math";

export const portableKernelLab = `<figure class="portable-kernel-lab" id="portable-kernel-workbench"><figcaption><span>Interactive comparison</span><strong>One matrix product, four execution paths</strong><p>Choose a backend, inspect a stage, then follow one output tile through its reduction steps.</p></figcaption><nav class="pk-backends" aria-label="Kernel backend">${kernelBackends.map((b,i)=>`<button type="button" data-pk-backend="${b.id}" aria-pressed="${i===0}">${b.name}<small>${b.software}</small></button>`).join("")}</nav><div class="pk-controls"><label>Problem shape <select data-pk-shape><option value="regular">Aligned · [256,256] × [256,256]</option><option value="edge">Ragged · [129,130] × [130,257]</option></select></label><label>K step <input type="range" min="1" max="8" value="1" data-pk-step><output data-pk-step-label></output></label></div><div class="pk-scroll" tabindex="0" aria-label="Execution path; scroll horizontally on narrow screens" data-pk-path></div><div class="pk-stage" aria-live="polite" data-pk-note></div><div class="pk-work"><div><h4>Output tile ownership</h4><div class="pk-tiles" data-pk-tiles></div><p data-pk-selection aria-live="polite"></p></div><div class="pk-accounting" data-pk-accounting></div></div><p class="pk-ownership" data-pk-ownership></p><p class="figure-boundary" data-pk-boundary></p><a class="pk-deeper" data-pk-deeper>Open the worked example</a></figure>`;

export function initializePortableKernelLab() {
  const host=document.getElementById("portable-kernel-workbench");if(!host)return;
  const shapeControl=host.querySelector<HTMLSelectElement>("[data-pk-shape]")!;
  const stepControl=host.querySelector<HTMLInputElement>("[data-pk-step]")!;
  let backend=kernelBackends[0], stage=0, row=0, column=0;
  const shape=():TileShape=>shapeControl.value==="edge"?{m:129,k:130,n:257}:{m:256,k:256,n:256};
  const render=()=>{
    const problem=shape(), plan=tilePlan(problem,backend.tile);
    stepControl.max=String(plan.reductions);
    stepControl.value=String(Math.min(Number(stepControl.value),plan.reductions));
    row=Math.min(row,plan.rows-1);column=Math.min(column,plan.columns-1);
    const bounds=tileBounds(problem,backend.tile,row,column,Number(stepControl.value)-1);
    host.querySelector("[data-pk-step-label]")!.textContent=`${stepControl.value} / ${plan.reductions}`;
    host.querySelectorAll("[data-pk-backend]").forEach(b=>b.setAttribute("aria-pressed",String(b.getAttribute("data-pk-backend")===backend.id)));
    host.querySelector("[data-pk-path]")!.innerHTML=`<svg viewBox="0 0 900 180" aria-label="${backend.name} matrix data path">${backend.stages.map((s,i)=>`<g role="button" tabindex="0" data-pk-stage="${i}" aria-label="Inspect ${s.label}" aria-pressed="${stage===i}" class="pk-node ${stage===i?"is-selected":""}"><rect x="${12+i*224}" y="35" width="204" height="104"/><text x="${114+i*224}" y="76" class="pk-label">${s.label}</text><text x="${114+i*224}" y="102" class="pk-detail">${s.detail}</text></g>${i<3?`<path d="M${216+i*224} 87h17m-5 -4l5 4l-5 4" class="pk-wire"/>`:""}`).join("")}</svg>`;
    host.querySelector("[data-pk-note]")!.innerHTML=`<strong>${backend.stages[stage].label}</strong><p>${backend.stages[stage].note}</p>`;
    const tiles=host.querySelector<HTMLElement>("[data-pk-tiles]")!;
    tiles.style.setProperty("--pk-columns",String(plan.columns));
    tiles.innerHTML=Array.from({length:plan.outputTiles},(_,i)=>{
      const r=Math.floor(i/plan.columns),c=i%plan.columns,b=tileBounds(problem,backend.tile,r,c,0);
      const edge=b.rowEnd-b.rowStart<backend.tile.m||b.columnEnd-b.columnStart<backend.tile.n;
      return `<button type="button" data-pk-tile="${r},${c}" aria-pressed="${r===row&&c===column}" aria-label="Inspect output tile row ${r+1}, column ${c+1}${edge?", partial tile":""}" class="${edge?"pk-edge":""}">${r+1},${c+1}${edge?" *":""}</button>`;
    }).join("");
    host.querySelector("[data-pk-selection]")!.textContent=`C rows [${bounds.rowStart}, ${bounds.rowEnd}), columns [${bounds.columnStart}, ${bounds.columnEnd}). This update reads K [${bounds.kStart}, ${bounds.kEnd}). * marks an output tile that needs masking or padding.`;
    host.querySelector("[data-pk-accounting]")!.innerHTML=`<h4>Same equation, different partition</h4><dl><dt>Teaching tile M × N × K</dt><dd>${backend.tile.m} × ${backend.tile.n} × ${backend.tile.k}</dd><dt>Output tiles × K steps</dt><dd>${plan.outputTiles} × ${plan.reductions} = ${plan.tileUpdates} updates</dd><dt>Valid output elements</dt><dd>${plan.usefulOutputs.toLocaleString()} (${plan.paddedOutputs.toLocaleString()} padded slots)</dd><dt>BF16 A/B tiles · one buffer</dt><dd>${plan.operandBytes/1024} KiB</dd><dt>FP32 accumulator tile</dt><dd>${plan.accumulatorBytes/1024} KiB</dd></dl>`;
    host.querySelector("[data-pk-ownership]")!.textContent=backend.ownership;
    host.querySelector("[data-pk-boundary]")!.textContent=`${backend.boundary} Tile choices are illustrative, not tuned recommendations. Buffer and accumulator bytes describe separate resources, not a residency estimate. No device executes in this browser.`;
    const link=host.querySelector<HTMLAnchorElement>("[data-pk-deeper]")!;link.href=`#${backend.lesson}`;link.textContent=`Open the ${backend.name} example`;
  };
  const selectStage=(index:number)=>{
    stage=index;
    host.querySelectorAll("[data-pk-stage]").forEach(node=>{const selected=Number(node.getAttribute("data-pk-stage"))===stage;node.setAttribute("aria-pressed",String(selected));node.classList.toggle("is-selected",selected);});
    host.querySelector("[data-pk-note]")!.innerHTML=`<strong>${backend.stages[stage].label}</strong><p>${backend.stages[stage].note}</p>`;
  };
  host.addEventListener("click",event=>{
    const target=event.target as Element;
    const b=target.closest<HTMLElement>("[data-pk-backend]");if(b){backend=kernelBackends.find(candidate=>candidate.id===b.dataset.pkBackend)!;row=column=stage=0;stepControl.value="1";render();return;}
    const s=target.closest<HTMLElement>("[data-pk-stage]");if(s){selectStage(Number(s.dataset.pkStage));return;}
    const t=target.closest<HTMLElement>("[data-pk-tile]");if(t){[row,column]=t.dataset.pkTile!.split(",").map(Number);render();host.querySelector<HTMLButtonElement>(`[data-pk-tile="${row},${column}"]`)!.focus({preventScroll:true});}
  });
  host.addEventListener("keydown",event=>{const s=(event.target as Element).closest<HTMLElement>("[data-pk-stage]");if(s&&["Enter"," "].includes(event.key)){event.preventDefault();selectStage(Number(s.dataset.pkStage));}});
  shapeControl.addEventListener("change",()=>{row=column=0;stepControl.value="1";render();});
  stepControl.addEventListener("input",render);render();
}
