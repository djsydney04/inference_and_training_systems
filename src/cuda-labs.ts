import { tensorAddress, warpAccess, reductionStages } from "./cuda-math";

export function initializeCudaLabs() {
  const memory = document.getElementById("tensor-address-lab");
  if (memory) {
    const get = <T extends Element>(selector: string) => memory.querySelector<T>(selector)!;
    const render = () => {
      const mode = get<HTMLSelectElement>("[data-address-layout]").value;
      const rows = mode === "transpose" ? 5 : 3, cols = mode === "transpose" ? 3 : 5;
      const rs = mode === "transpose" ? 1 : mode === "padded" ? 8 : 5, cs = mode === "transpose" ? 5 : 1;
      const select = get<HTMLSelectElement>("[data-address-cell]");
      const selected = Math.min(Number(select.value) || 0, rows * cols - 1);
      select.innerHTML = Array.from({ length: rows * cols }, (_, i) => `<option value="${i}">${Math.floor(i / cols)}, ${i % cols}</option>`).join("");
      select.value = String(selected);
      const row = Math.floor(selected / cols), col = selected % cols;
      const address = tensorAddress(rows, cols, rs, cs, row, col);
      const occupied = new Set(Array.from({ length: rows * cols }, (_, i) => tensorAddress(rows, cols, rs, cs, Math.floor(i / cols), i % cols).offset));
      get<HTMLElement>("[data-address-grid]").innerHTML = `<div class="cuda-logical" style="--cuda-cols:${cols}">${Array.from({ length: rows * cols }, (_, i) => `<span class="${i === selected ? "is-selected" : ""}"><b>[${Math.floor(i / cols)},${i % cols}]</b><small>word ${tensorAddress(rows, cols, rs, cs, Math.floor(i / cols), i % cols).offset}</small></span>`).join("")}</div><div class="cuda-address-arrow">Logical coordinates ↓ physical storage</div><div class="cuda-storage">${Array.from({ length: mode === "padded" ? 24 : 15 }, (_, i) => `<span class="${i === address.offset ? "is-selected" : !occupied.has(i) ? "is-padding" : ""}"><b>${i}</b><small>${i * 4} B</small></span>`).join("")}</div>`;
      get<HTMLElement>("[data-address-result]").textContent = `Shape ${rows}×${cols}, strides (${rs}, ${cs}) elements. [${row},${col}] → ${row}×${rs} + ${col}×${cs} = word ${address.offset}, byte offset ${address.byteOffset}. ${mode === "transpose" ? "Transpose changes the view; the 15 stored words stay in place." : mode === "padded" ? "Three unused words follow each logical row." : "The final index varies fastest."}`;
    };
    memory.querySelectorAll("select").forEach(el => el.addEventListener("change", render)); render();
  }
  const warp = document.getElementById("warp-address-lab");
  if (warp) {
    const get = <T extends Element>(selector: string) => warp.querySelector<T>(selector)!;
    const render = () => {
      const stride = Number(get<HTMLSelectElement>("[data-warp-stride]").value), offset = Number(get<HTMLSelectElement>("[data-warp-offset]").value);
      const result = warpAccess(stride, offset);
      get<HTMLElement>("[data-warp-diagram]").innerHTML = `<div class="cuda-lanes">${result.lanes.map(l => `<span style="--cuda-tone:${l.sector % 2}"><small>lane ${l.lane}</small><b>${l.byte}</b><small>sector ${l.sector}</small><small>bank ${l.bank}</small></span>`).join("")}</div>`;
      get<HTMLElement>("[data-warp-result]").textContent = `${result.distinctWords} distinct words touch ${result.sectors.length} sectors (${result.sectorBytes} B). Distinct-byte utilization: ${(100 * result.utilization).toFixed(1)}%. If the same word pattern addresses 32-bank shared memory: ${result.bankConflictDegree} distinct words in the busiest bank (same-word reads broadcast).`;
      get<HTMLElement>("[data-warp-table]").innerHTML = `<table><caption>One FP32 load per lane</caption><thead><tr><th>Lane</th><th>Word</th><th>Byte</th><th>32-byte sector</th><th>Shared bank</th></tr></thead><tbody>${result.lanes.map(l => `<tr><th scope="row">${l.lane}</th><td>${l.word}</td><td>${l.byte}</td><td>${l.sector}</td><td>${l.bank}</td></tr>`).join("")}</tbody></table>`;
    };
    warp.querySelectorAll("select").forEach(el => el.addEventListener("change", render)); render();
  }
  const reduction = document.getElementById("cuda-reduction-lab");
  if (reduction) {
    const get = <T extends Element>(selector: string) => reduction.querySelector<T>(selector)!;
    let step = 0;
    const render = () => {
      const n = Number(get<HTMLSelectElement>("[data-reduce-length]").value), input = Array.from({ length: n }, (_, i) => i + 1), stages = reductionStages(input, 8);
      const stage = stages[step];
      get<HTMLElement>("[data-reduce-diagram]").innerHTML = `<svg viewBox="0 0 760 240" role="img" aria-label="${step ? `Stride ${stage.stride}: lanes below the stride add a partner value, then all lanes reach a barrier.` : "Eight scratch slots receive inputs, with zero padding after the last valid input."}">${Array.from({ length: 8 }, (_, i) => {
        const x = 12 + i * 94;
        return `<text x="${x + 36}" y="26" text-anchor="middle">lane ${i}</text><rect x="${x}" y="42" width="74" height="58" fill="${i < stage.active ? "#2559d6" : "#e7e4db"}" rx="2"/><text x="${x + 37}" y="78" text-anchor="middle" fill="${i < stage.active ? "white" : "#59625b"}">${stage.values[i]}</text>${step && i < stage.stride ? `<path d="M${x + stage.stride * 94 + 37} 107 V${136 + i * 15} H${x + 37} V112" fill="none" stroke="#2559d6"/><text x="${x + 37}" y="214" text-anchor="middle">+ lane ${i + stage.stride}</text>` : ""}`;
      }).join("")}<text x="380" y="238" text-anchor="middle">${step ? "Add using the previous state → block barrier → next stage" : "Load inputs or the sum identity, zero → block barrier"}</text></svg>`;
      get<HTMLElement>("[data-reduce-result]").textContent = step === 0 ? `Loaded ${n} inputs and ${8 - n} zeros. Every thread reaches the barrier.` : `Stage ${step}/3: ${stage.stride} lanes add a partner at offset ${stage.stride}; all eight participate in the barrier. ${step === 3 ? `Lane 0 holds the total ${stage.values[0]}.` : "Inactive writers still have synchronization duties."}`;
      get<HTMLButtonElement>("[data-reduce-back]").disabled = step === 0;
      get<HTMLButtonElement>("[data-reduce-next]").disabled = step === stages.length - 1;
      get<HTMLElement>("[data-reduce-table]").innerHTML = `<table><caption>Scratch state after each complete stage</caption><thead><tr><th>State</th>${Array.from({ length: 8 }, (_, i) => `<th>Lane ${i}</th>`).join("")}</tr></thead><tbody>${stages.map((s, i) => `<tr><th scope="row">${i === 0 ? "Load" : `Stride ${s.stride}`}</th>${s.values.map((v, lane) => `<td>${v}${lane >= s.active ? " · idle" : ""}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
    };
    get<HTMLButtonElement>("[data-reduce-back]").addEventListener("click", () => { step = Math.max(0, step - 1); render(); });
    get<HTMLButtonElement>("[data-reduce-next]").addEventListener("click", () => { step = Math.min(3, step + 1); render(); });
    get<HTMLSelectElement>("[data-reduce-length]").addEventListener("change", () => { step = 0; render(); }); render();
  }
}
