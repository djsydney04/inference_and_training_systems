import { sketchArrow, sketchBox } from "./inference-sketch";
import { committedTreeSlots, compareSpeculationDepths, draftTreeLayout } from "./speculation-frontier-math";

const parents = [null, null, 0, 0, 1, 2, 4];
const names = ["A", "B", "C", "D", "E", "F", "G"];
const points = [[150, 108], [366, 108], [96, 192], [204, 192], [366, 192], [96, 276], [366, 276]];

export function initializeSpeculationFrontierLabs() {
  const host = document.getElementById("speculation-tree-lab");
  if (host && !host.dataset.initialized) {
    host.dataset.initialized = "true";
    const select = host.querySelector<HTMLSelectElement>("[data-tree-query]")!;
    const layout = draftTreeLayout(parents, 4);
    const render = () => {
      const selected = Number(select.value), path = layout.paths[selected];
      host.querySelector("[data-tree-diagram]")!.innerHTML = `<svg viewBox="0 0 470 326" role="img" aria-label="Prefix P branches into A and B. A branches into C and D; B into E; C into F; E into G. Selected path is ${path.map(i => names[i]).join(", ")}."><g>${parents.map((parent, i) => {
        const [x, y] = points[i], [px, py] = parent === null ? [258, 30] : points[parent];
        return sketchArrow(px, py + 20, x, y - 25, `class="${path.includes(i) ? "tree-edge-selected" : "tree-edge"}"`);
      }).join("")}</g>${sketchBox(167, 10, 182, 42, 'class="tree-prefix"')}<text x="258" y="37" text-anchor="middle">Prefix P · positions 0–3</text>${points.map(([x, y], i) => `<g>${sketchBox(x - 48, y - 25, 96, 48, `class="${i === selected ? "tree-query" : path.includes(i) ? "tree-ancestor" : "tree-other"}"`)}<text x="${x}" y="${y - 5}" text-anchor="middle" class="${i === selected ? "tree-query-label" : ""}">${names[i]}</text><text x="${x}" y="${y + 13}" text-anchor="middle" class="tree-coordinate ${i === selected ? "tree-query-label" : ""}">pos ${layout.positions[i]} · slot ${layout.storageSlots[i]}</text></g>`).join("")}</svg>`;
      const probabilityOwner = parents[selected] === null ? "the last prefix token" : `parent ${names[parents[selected]!]}`;
      host.querySelector("[data-tree-explanation]")!.textContent = `Query ${names[selected]} sees P and ${path.map(i => names[i]).join(" → ")}. Its target output predicts the next position (${layout.positions[selected] + 1}); the distribution used to verify ${names[selected]} comes from ${probabilityOwner}. If this path is accepted, gather provisional slots ${committedTreeSlots(parents, 4, selected).join(", ")} into consecutive cache positions starting at 4.`;
      host.querySelector("[data-tree-mask]")!.innerHTML = `<table><caption>Target attention mask · rows are queries, columns are stored keys. P represents all four prefix keys. A dot blocks attention.</caption><thead><tr><th scope="col">Query</th><th scope="col">P</th>${names.map(name => `<th scope="col">${name}</th>`).join("")}</tr></thead><tbody>${layout.mask.map((row, i) => `<tr class="${i === selected ? "tree-selected-row" : ""}"><th scope="row">${names[i]}${i === selected ? " ← selected" : ""}</th><td class="tree-visible">1</td>${row.map(visible => `<td class="${visible ? "tree-visible" : ""}">${visible ? "1" : "·"}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
    };
    select.addEventListener("change", render); render();
  }

  const planner = document.getElementById("speculation-depth-lab");
  if (planner && !planner.dataset.initialized) {
    planner.dataset.initialized = "true";
    const find = <T extends HTMLElement>(selector: string) => planner.querySelector<T>(selector)!;
    const render = () => {
      const first = Number(find<HTMLInputElement>("[data-depth-first]").value) / 100;
      const fall = Number(find<HTMLInputElement>("[data-depth-fall]").value) / 100;
      const step = Number(find<HTMLInputElement>("[data-depth-draft]").value) / 10;
      const block = find<HTMLSelectElement>("[data-depth-mode]").value === "block";
      const alpha = Array.from({length: 8}, (_, i) => Math.max(0, first - fall * i));
      const timings = alpha.map((_, i) => ({
        draftMs: block ? 2 * step + 0.08 * i : step * (i + 1),
        verifyMs: 8 + 0.15 * i * i,
        overheadMs: 0.5,
      }));
      const rows = compareSpeculationDepths(alpha, timings, 8);
      const best = rows.reduce((a, b) => a.msPerToken <= b.msPerToken ? a : b);
      find<HTMLOutputElement>("[data-depth-first-value]").value = `${(first * 100).toFixed(0)}%`;
      find<HTMLOutputElement>("[data-depth-fall-value]").value = `${(fall * 100).toFixed(0)} points`;
      find<HTMLOutputElement>("[data-depth-draft-value]").value = `${step.toFixed(1)} ms`;
      find("[data-depth-result]").textContent = `Lowest modeled time among depths 1–8: γ=${best.depth}, ${best.msPerToken.toFixed(2)} ms/token. ${best.msPerToken < 8 ? `${best.ratio.toFixed(2)}× the baseline token rate` : "The 8 ms/token baseline is faster; disable speculation in this example"}. ${block ? "Parallel-block drafting costs 2d + 0.08(γ−1) ms" : "Serial drafting costs γd ms"}; verification costs 8 + 0.15(γ−1)² ms; bookkeeping adds 0.5 ms per round.`;
      find("[data-depth-table]").innerHTML = `<table><caption>Hypothetical inputs · baseline 8 ms/token · one correction or bonus per round · no EOS</caption><thead><tr><th scope="col">Depth γ</th><th scope="col">α at depth</th><th scope="col">P(A ≥ γ)</th><th scope="col">Expected tokens</th><th scope="col">Draft ms</th><th scope="col">Verify ms</th><th scope="col">Total ms/token</th></tr></thead><tbody>${rows.map((row, i) => `<tr class="${row.depth === best.depth ? "tree-selected-row" : ""}"><th scope="row">${row.depth}${row.depth === best.depth ? " · minimum" : ""}</th><td>${(alpha[i] * 100).toFixed(0)}%</td><td>${(row.survival * 100).toFixed(1)}%</td><td>${row.expectedTokens.toFixed(3)}</td><td>${timings[i].draftMs.toFixed(2)}</td><td>${timings[i].verifyMs.toFixed(2)}</td><td>${row.msPerToken.toFixed(2)}</td></tr>`).join("")}</tbody></table>`;
    };
    planner.querySelectorAll("input").forEach(input => input.addEventListener("input", render));
    planner.querySelector("select")!.addEventListener("change", render); render();
  }
}
