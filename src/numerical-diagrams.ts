import { getMatmulState, selectMatmulOutput, type MatmulState } from "./kernel-lab";
import { getRingState, selectRingRank, type RingState } from "./hardware-labs";
import "./numerical-diagrams.css";

function matrix(name: string, values: (number | null)[][], cellClass: (row: number, col: number) => string, selectable = false) {
  return `<div class="flat-matrix"><strong>${name}</strong><div class="flat-matrix-grid" style="--matrix-columns:${values[0].length}">${values.map((row, r) => row.map((value, c) => selectable
    ? `<button type="button" data-output-cell="${r},${c}" class="${cellClass(r, c)}" aria-label="Inspect C[${r}, ${c}], ${value === null ? "another block" : `value ${value}`}" aria-pressed="${cellClass(r,c).includes("is-selected")}">${value ?? "·"}</button>`
    : `<span class="${cellClass(r, c)}" title="${name}[${r}, ${c}] = ${value ?? "not loaded"}">${value ?? "·"}</span>`).join("")).join("")}</div></div>`;
}

function matmulDiagram({ config: c, step, frame: f }: MatmulState) {
  const staged = (r: number, col: number, operand: "A" | "B") => {
    const inTile = operand === "A"
      ? r >= f.rowStart && r < f.rowStart+c.tile && col >= f.kStart && col < f.kStart+c.tile
      : r >= f.kStart && r < f.kStart+c.tile && col >= f.colStart && col < f.colStart+c.tile;
    const selected = operand === "A" ? r === c.row : col === c.col;
    return inTile ? (selected ? "is-operand" : "is-staged") : "";
  };
  const output = Array.from({length:c.m}, (_,r) => Array.from({length:c.n}, (_,col) =>
    r >= f.rowStart && r < f.rowStart+c.tile && col >= f.colStart && col < f.colStart+c.tile ? f.accumulators[r-f.rowStart][col-f.colStart] : null));
  const shared = (values: number[][]) => step ? values : values.map(row => row.map(() => null));
  const sharedClass = (r: number, col: number, operand: "A" | "B") => {
    const valid = operand === "A" ? f.rowStart+r<c.m && f.kStart+col<c.k : f.kStart+r<c.k && f.colStart+col<c.n;
    if (!valid) return "is-padding";
    return step ? ((operand === "A" ? r===c.row-f.rowStart : col===c.col-f.colStart) ? "is-operand" : "is-staged") : "";
  };
  return `<div class="matrix-diagram" aria-label="Matrix multiplication: global operands, shared memory and output">
    <div class="matrix-memory"><p class="numerical-label">Global memory <span>A ${c.m} × ${c.k} · B ${c.k} × ${c.n}</span></p><div class="matrix-pair">${matrix("A",f.a,(r,col)=>staged(r,col,"A"))}${matrix("B",f.b,(r,col)=>staged(r,col,"B"))}</div></div>
    <p class="matrix-transfer"><span aria-hidden="true">↓</span> Load the highlighted tile <span>K = ${f.kStart}–${Math.min(c.k-1,f.kStart+c.tile-1)}</span></p>
    <div class="matrix-shared"><p class="numerical-label">Shared memory <span>${step ? "Operands available to the block" : "Waiting for the first load"}</span></p><div class="matrix-pair">${matrix("Shared A",shared(f.sharedA),(r,col)=>sharedClass(r,col,"A"))}${matrix("Shared B",shared(f.sharedB),(r,col)=>sharedClass(r,col,"B"))}</div></div>
    <div class="matrix-output"><p class="numerical-label">${f.phase==="store"?"Stored outputs":"Running sums"}<span>${f.completedK} / ${c.k} reduction positions</span></p>${matrix("C",output,(r,col)=>r===c.row&&col===c.col?"is-selected":output[r][col]===null?"is-other-block":"is-staged",true)}<p class="matrix-output-note">Select an output to trace its operands.</p></div>
    <div class="numerical-legend"><span><i class="legend-operand"></i>Selected operands</span><span><i class="legend-staged"></i>Other tile values</span><span><i class="legend-padding"></i>Zero-filled edge</span></div>
  </div>`;
}

function ringDiagram({rank, frame:f}:RingState) {
  return `<div class="ring-overview"><p class="numerical-label">${f.complete ? "All-reduce complete" : f.phase === "start" ? "Each rank starts with its own values" : f.phase === "reduce-scatter" ? "Reduce-scatter: add each arriving chunk" : "All-gather: copy the completed chunks"}<span>Step ${f.step} of ${f.totalSteps}</span></p><p class="ring-direction">Send direction <strong>0 → 1 → 2 → 3 → 0</strong></p>
    <div class="ring-map" role="group" aria-label="Inspect a rank's buffers">${f.buffers.map((chunks,r)=>{
      const sent=f.transfers.find(t=>t.from===r);
      const received=f.transfers.find(t=>t.to===r);
      return `<button type="button" class="ring-rank ${rank===r?"is-selected":""}" data-rank="${r}" aria-pressed="${rank===r}" aria-label="Inspect rank ${r}"><span class="ring-rank-heading">Rank ${r}<small>${chunks.filter(c=>c.contributors.length===4).length}/4 complete</small></span><span class="ring-column-labels"><span>Chunk</span><span>Values</span><span>Sources</span></span>${chunks.map((chunk,i)=>`<span class="ring-chunk ${chunk.contributors.length===4?"is-complete":""} ${received?.chunk===i?"just-received":""}"><span>${i}</span><strong>[${chunk.values.join(", ")}]</strong><span class="rank-sources" aria-label="Contributions from ranks ${chunk.contributors.join(', ')}">${[0,1,2,3].map(source=>`<i class="${chunk.contributors.includes(source)?"is-present":""}">${source}</i>`).join("")}</span></span>`).join("")}<span class="ring-last-send">${sent?`Sent chunk ${sent.chunk}`:"Next rank"}<strong>→ ${(r+1)%4}</strong></span></button>`;
    }).join("")}</div><p class="numerical-key">Filled source markers show which ranks have contributed. Blue chunks contain the complete sum.</p></div>`;
}

export function initializeNumericalDiagrams() {
  const matmul=document.getElementById("matmul-scene");
  const ring=document.getElementById("ring-scene");
  if(matmul) {
    const render=(state:MatmulState)=>{
      const focus=matmul.contains(document.activeElement) ? (document.activeElement as HTMLElement).dataset.outputCell : undefined;
      matmul.innerHTML=matmulDiagram(state);
      if(focus) matmul.querySelector<HTMLButtonElement>(`[data-output-cell="${focus}"]`)?.focus({preventScroll:true});
    };
    matmul.addEventListener("click",event=>{
      const value=(event.target as Element).closest<HTMLElement>("[data-output-cell]")?.dataset.outputCell;
      if(value){const [r,c]=value.split(",").map(Number);selectMatmulOutput(r,c);}
    });
    document.addEventListener("atlas:matmulchange",event=>render((event as CustomEvent<MatmulState>).detail));
    render(getMatmulState());
  }
  if(ring) {
    const render=(state:RingState)=>{
      const focus=ring.contains(document.activeElement) ? (document.activeElement as HTMLElement).dataset.rank : undefined;
      ring.innerHTML=ringDiagram(state);
      if(focus) ring.querySelector<HTMLButtonElement>(`[data-rank="${focus}"]`)?.focus({preventScroll:true});
    };
    ring.addEventListener("click",event=>{
      const value=(event.target as Element).closest<HTMLElement>("[data-rank]")?.dataset.rank;
      if(value!==undefined)selectRingRank(Number(value));
    });
    document.addEventListener("atlas:ringchange",event=>render((event as CustomEvent<RingState>).detail));
    render(getRingState());
  }
}
