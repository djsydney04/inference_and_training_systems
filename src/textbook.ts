import { appendCacheToken, cacheOwners, coalescedSectors, initialCache, mergeSoftmaxTile, releaseCacheRequest } from "./lesson-math";

const find = <T extends Element = HTMLElement>(selector: string) => document.querySelector<T>(selector);
const write = (selector: string, value: string) => { const el = find(selector); if (el) el.textContent = value; };

function initSoftmax() {
  const tiles = [[2, 1], [3, 0], [6, 4]];
  const values = [[1, 4], [2, 8], [5, 3]];
  let step = 0;
  let state = { maximum: -Infinity, denominator: 0, numerator: 0 };
  const render = () => {
    const host = find("[data-softmax-tiles]");
    if (!host) return;
    host.innerHTML = tiles.map((scores, i) => `<div class="softmax-tile ${i < step ? "is-loaded" : ""}"><span>Tile ${i + 1}</span><strong>scores [${scores.join(", ")}]</strong><small>values [${values[i].join(", ")}]</small></div>`).join("");
    write("[data-softmax-max]", step ? state.maximum.toFixed(2) : "−∞");
    write("[data-softmax-denom]", state.denominator.toFixed(4));
    write("[data-softmax-num]", state.numerator.toFixed(4));
    write("[data-softmax-result]", step ? `${step}/3 tiles · ${step === 3 ? "Final" : "Partial"} output u/ℓ = ${(state.numerator / state.denominator).toFixed(4)}` : "No scores processed yet.");
    const button = find<HTMLButtonElement>("[data-softmax-step]");
    if (button) button.disabled = step === 3;
  };
  find("[data-softmax-step]")?.addEventListener("click", () => {
    if (step >= 3) return;
    state = mergeSoftmaxTile(state, tiles[step], values[step]); step += 1; render();
  });
  find("[data-softmax-reset]")?.addEventListener("click", () => {
    step = 0; state = { maximum: -Infinity, denominator: 0, numerator: 0 }; render();
  });
  render();
}

function initCPU() {
  const stages: Record<string, [string, string]> = {
    fetch: ["Fetch", "The program counter identifies the next instruction. Branch prediction guesses the next path early enough to keep the pipeline supplied."],
    decode: ["Decode", "Instruction bits are decoded into operations and operand requirements. The instruction set describes observable behavior; the core chooses its internal implementation."],
    rename: ["Rename", "Logical registers are mapped onto a larger physical register file. Renaming removes false name dependencies while preserving true producer–consumer dependencies."],
    issue: ["Issue", "The scheduler finds operations whose inputs and execution resources are ready. Independent younger work can proceed while an older load waits."],
    execute: ["Execute", "Arithmetic, vector, branch, and load/store units carry out the work. Loads may need address translation and one or more levels of the cache hierarchy."],
    retire: ["Retire", "Completed instructions commit in program order. Speculative work on a wrong branch is discarded, preserving the architecture’s precise state."],
  };
  document.querySelectorAll<HTMLButtonElement>("[data-cpu-stage]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll<HTMLButtonElement>("[data-cpu-stage]").forEach((b) => {
        b.classList.toggle("is-active", b === button); b.setAttribute("aria-pressed", String(b === button));
      });
      const [title, text] = stages[button.dataset.cpuStage ?? "fetch"];
      const output = find("[data-cpu-readout]");
      if (output) output.innerHTML = `<strong>${title}</strong><p>${text}</p>`;
    });
  });
  find<HTMLButtonElement>('[data-cpu-stage="fetch"]')?.click();
}

function initCoalescing() {
  const select = find<HTMLSelectElement>("[data-memory-stride]");
  const render = () => {
    const stride = Number(select?.value ?? 1);
    const result = coalescedSectors(stride);
    const lanes = find("[data-memory-lanes]");
    const sectors = find("[data-memory-sectors]");
    if (lanes) lanes.innerHTML = result.addresses.map((address, lane) => `<div title="Lane ${lane} loads byte address ${address}"><small>${lane}</small><b>${address}</b></div>`).join("");
    if (sectors) sectors.innerHTML = result.sectors.map((sector) => `<div><span>sector ${sector}</span><div>${Array.from({ length: 8 }, (_, word) => `<i class="${result.addresses.includes(sector * 32 + word * 4) ? "is-used" : ""}"></i>`).join("")}</div></div>`).join("");
    write("[data-memory-efficiency]", `${result.sectors.length} sectors · ${result.transferredBytes} B moved · ${100 * result.usefulBytes / result.transferredBytes}% useful`);
  };
  select?.addEventListener("change", render); render();
}

function initPagedCache() {
  let state = initialCache();
  const render = (message = "A and B share physical blocks 2 and 7. Their final blocks are private.") => {
    const tables = find("[data-cache-tables]");
    const pool = find("[data-physical-cache]");
    if (!tables || !pool) return;
    tables.innerHTML = state.requests.map((r) => `<div><strong>Request ${r.name}</strong><span>${r.tokens} tokens</span><div>${r.blocks.map((block, logical) => `<span>logical ${logical}<b>→ physical ${block}</b></span>`).join("")}</div></div>`).join("");
    pool.innerHTML = Array.from({ length: state.capacity }, (_, block) => {
      const owners = cacheOwners(state, block);
      const used = state.requests.filter((r) => r.blocks.includes(block)).map((r) => Math.min(state.blockSize, r.tokens - r.blocks.indexOf(block) * state.blockSize));
      const filled = Math.max(0, ...used);
      return `<div class="cache-block ${owners.length > 1 ? "is-shared" : owners.length ? "is-private" : "is-free"}"><span>physical ${block}</span><strong>${owners.join(" + ") || "free"}</strong><div>${Array.from({ length: state.blockSize }, (_, i) => `<i class="${i < filled ? "is-filled" : ""}"></i>`).join("")}</div></div>`;
    }).join("");
    const occupied = Array.from({ length: state.capacity }, (_, i) => i).filter((i) => cacheOwners(state, i).length).length;
    write("[data-cache-status]", `${message} ${occupied}/${state.capacity} physical blocks allocated.`);
    document.querySelectorAll<HTMLButtonElement>("[data-cache-append], [data-cache-release]").forEach((button) => {
      button.disabled = !state.requests.some((r) => r.name === (button.dataset.cacheAppend ?? button.dataset.cacheRelease));
    });
  };
  document.querySelectorAll<HTMLButtonElement>("[data-cache-append]").forEach((button) => button.addEventListener("click", () => {
    const name = button.dataset.cacheAppend ?? "A";
    try { state = appendCacheToken(state, name); render(`Added one token to ${name}.`); }
    catch (error) { write("[data-cache-status]", (error as Error).message); }
  }));
  find("[data-cache-release]")?.addEventListener("click", () => { state = releaseCacheRequest(state, "A"); render("A finished. B’s shared prefix stays allocated."); });
  find("[data-cache-reset]")?.addEventListener("click", () => { state = initialCache(); render(); });
  render();
}

function initFigureViewer() {
  const dialog = document.createElement("dialog");
  dialog.className = "figure-dialog";
  dialog.setAttribute("aria-label", "Enlarged reference figure");
  dialog.innerHTML = '<form method="dialog"><button>Close figure</button></form><img alt="" /><p></p>';
  document.body.append(dialog);
  document.querySelectorAll<HTMLButtonElement>("[data-figure-open]").forEach((button) => button.addEventListener("click", () => {
    const image = dialog.querySelector("img")!;
    image.src = button.dataset.figureOpen ?? "";
    image.alt = button.querySelector("img")?.alt ?? "Reference figure";
    dialog.querySelector("p")!.textContent = button.closest("figure")?.querySelector("figcaption")?.textContent ?? "";
    dialog.showModal();
  }));
  dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
}

export function initializeTextbook() {
  initSoftmax(); initCPU(); initCoalescing(); initPagedCache();
  initFigureViewer();
}
