import {
  matmulFrame,
  type MatmulConfig,
  type MatmulPhase,
} from "./matmul-math";

let config: MatmulConfig = { m: 4, n: 4, k: 6, tile: 2, row: 0, col: 0 };
let step = 0;
export const getMatmulState = () => ({
  config: { ...config },
  step,
  frame: matmulFrame(config, step),
});
export type MatmulState = ReturnType<typeof getMatmulState>;
const descriptions: Record<MatmulPhase, [string, string]> = {
  start: [
    "Choose a block, then load its first operands",
    "Each block owns an output tile. Shared buffers have not been loaded; partial sums begin at zero.",
  ],
  load: [
    "Load global operands into shared memory",
    "Threads cooperatively populate the two shared arrays. Out-of-range operands become zero. The partial sums have not changed.",
  ],
  ready: [
    "Wait for every operand producer",
    "All block threads reach the first barrier. A consumer must not read a shared value that another thread has not finished writing.",
  ],
  accumulate: [
    "Multiply, then keep the partial sums",
    "Each output thread reuses one row of shared A and one column of shared B. This stage adds one K tile to its running accumulator.",
  ],
  release: [
    "Wait before reusing shared storage",
    "All consumers must finish reading the current tile before any thread overwrites its shared operands with the next tile.",
  ],
  store: [
    "Write only the valid outputs",
    "The full reduction is complete. Out-of-range output threads do not store. Other blocks independently compute the remaining tiles of C.",
  ],
};
let render = () => {};
export function selectMatmulOutput(row: number, col: number) {
  if (row < 0 || row >= config.m || col < 0 || col >= config.n) return;
  if (
    Math.floor(row / config.tile) !== Math.floor(config.row / config.tile) ||
    Math.floor(col / config.tile) !== Math.floor(config.col / config.tile)
  )
    step = 0;
  config = { ...config, row, col };
  render();
}

export function initializeMatmulLab() {
  const host = document.getElementById("matmul-workbench");
  if (!host) return;
  const find = <T extends Element = HTMLElement>(selector: string) =>
    host.querySelector<T>(selector)!;
  const output = find<HTMLSelectElement>("[data-matmul-output]");
  render = () => {
    const threadOpen = find("#matmul-inspector")
      .querySelector<HTMLDetailsElement>(".matmul-thread")?.open ?? false;
    const state = getMatmulState(),
      { frame: f } = state;
    const [title, body] = descriptions[f.phase];
    output.innerHTML = Array.from({ length: config.m }, (_, r) =>
      Array.from(
        { length: config.n },
        (_, c) =>
          `<option value="${r},${c}" ${r === config.row && c === config.col ? "selected" : ""}>C[${r}, ${c}]</option>`,
      ).join(""),
    ).join("");
    find("[data-matmul-progress]").textContent =
      `Step ${step} / ${f.totalSteps} · K tile ${f.chunk + 1} / ${f.chunks}`;
    find("[data-matmul-phase]").textContent = title;
    find<HTMLButtonElement>("[data-matmul-next]").disabled =
      step === f.totalSteps;
    find<HTMLButtonElement>("[data-matmul-back]").disabled = step === 0;
    host
      .querySelectorAll<HTMLElement>("[data-matmul-stage]")
      .forEach((el) =>
        el.classList.toggle("is-active", el.dataset.matmulStage === f.phase),
      );
    find("[data-matmul-loads]").textContent = `${f.stagedReads} scalars`;
    find("[data-matmul-flops]").textContent =
      `${f.usefulFlops} / ${f.scheduledFlops}`;
    find("[data-matmul-stores]").textContent = String(f.stores);
    const terms = f.terms.map((t) => `(${t.a} × ${t.b})`).join(" + ");
    const tx = config.col - f.colStart, ty = config.row - f.rowStart;
    const aCol = f.kStart + tx, bRow = f.kStart + ty;
    const aLoad = aCol < config.k
      ? `A[${config.row},${aCol}] = ${f.a[config.row][aCol]}` : "zero (K edge)";
    const bLoad = bRow < config.k
      ? `B[${bRow},${config.col}] = ${f.b[bRow][config.col]}` : "zero (K edge)";
    find("#matmul-inspector").innerHTML =
      `<span>${f.phase === "start" ? "One output block" : `Reduction indices ${f.kStart}–${Math.min(config.k - 1, f.kStart + config.tile - 1)}`}</span><h3>C[${config.row}, ${config.col}]</h3><p>${body}</p><div class="matmul-arithmetic"><span>This K tile’s contribution</span><code>${terms} = ${f.terms.reduce((s, t) => s + t.a * t.b, 0)}</code></div><dl><div><dt>Current partial sum</dt><dd data-matmul-partial>${f.selectedValue}</dd></div><div><dt>Full dot-product reference</dt><dd>${f.selectedReference}</dd></div><div><dt>Reduction positions accumulated</dt><dd>${f.completedK} / ${config.k}</dd></div><div><dt>Full-block logical input reuse</dt><dd>${f.naiveReads} → ${f.fullStagedReads} loads (${f.reuseFactor.toFixed(1)}×)</dd></div></dl>`;
    find("#matmul-inspector").insertAdjacentHTML("beforeend",
      `<details class="matmul-thread" ${threadOpen ? "open" : ""}><summary>Inspect this thread’s work</summary><p><code>threadIdx = (x:${tx}, y:${ty})</code><br><code>blockIdx = (x:${Math.floor(config.col / config.tile)}, y:${Math.floor(config.row / config.tile)})</code></p><p>In this stage’s load, this thread writes <code>sharedA[${ty},${tx}]</code> from ${aLoad}, and <code>sharedB[${ty},${tx}]</code> from ${bLoad}.</p><p>After the barrier it consumes shared A row ${ty} and shared B column ${tx}, including values loaded by its peers. Loading ownership and consumption are different.</p></details>`);
    const table = (name: string, rows: (number | null)[][]) =>
      `<div><table><caption>${name}</caption><thead><tr><th scope="col">r / c</th>${rows[0].map((_, c) => `<th scope="col">${c}</th>`).join("")}</tr></thead><tbody>${rows.map((row, r) => `<tr><th scope="row">${r}</th>${row.map((v) => `<td>${v ?? "·"}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
    const partial = Array.from({ length: config.m }, (_, r) =>
      Array.from({ length: config.n }, (_, c) =>
        r >= f.rowStart &&
        r < f.rowStart + config.tile &&
        c >= f.colStart &&
        c < f.colStart + config.tile
          ? f.accumulators[r - f.rowStart][c - f.colStart]
          : null,
      ),
    );
    find("[data-matmul-tables]").innerHTML =
      table("A", f.a) +
      table("B", f.b) +
      table(f.phase === "store" ? "C: this block’s stored outputs" : "C: this block’s partial outputs", partial) +
      table(
        "Shared A: zero-filled edges",
        step ? f.sharedA : f.sharedA.map((row) => row.map(() => null)),
      ) +
      table(
        "Shared B: zero-filled edges",
        step ? f.sharedB : f.sharedB.map((row) => row.map(() => null)),
      );
    document.dispatchEvent(
      new CustomEvent<MatmulState>("atlas:matmulchange", { detail: state }),
    );
  };
  find("[data-matmul-next]").addEventListener("click", () => {
    step = Math.min(getMatmulState().frame.totalSteps, step + 1);
    render();
  });
  find("[data-matmul-back]").addEventListener("click", () => {
    step = Math.max(0, step - 1);
    render();
  });
  find("[data-matmul-reset]").addEventListener("click", () => {
    step = 0;
    render();
  });
  find<HTMLSelectElement>("[data-matmul-shape]").addEventListener(
    "change",
    (e) => {
      const edge = (e.target as HTMLSelectElement).value === "edges";
      config = {
        ...config,
        m: edge ? 3 : 4,
        n: edge ? 3 : 4,
        k: edge ? 5 : 6,
        row: edge ? 2 : 0,
        col: edge ? 2 : 0,
      };
      step = 0;
      render();
    },
  );
  find<HTMLSelectElement>("[data-matmul-tile]").addEventListener(
    "change",
    (e) => {
      config.tile = Number((e.target as HTMLSelectElement).value);
      step = 0;
      render();
    },
  );
  output.addEventListener("change", () => {
    const [row, col] = output.value.split(",").map(Number);
    selectMatmulOutput(row, col);
  });
  render();
}
