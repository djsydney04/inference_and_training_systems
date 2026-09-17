import { groupedMoe, routeTokens, limitCapacity, moeBackward, expertTraffic, switchBalance,
  moeExampleInputs as inputs, moeExampleExperts as experts, moeExampleLogits as logits,
  type ExpertRoute, type Matrix } from "./moe-execution-math";

const n = (value: number, digits = 3) => Math.abs(value) < 1e-12 ? "0" : Number(value.toFixed(digits)).toString();
const vector = (row: number[]) => `[${row.map(value => n(value)).join(", ")}]`;
const control = (root: Element, name: string) => root.querySelector<HTMLSelectElement>(`[data-${name}]`)!;
const table = (caption: string, headings: string[], rows: string[][]) => `<table><caption>${caption}</caption><thead><tr>${headings.map(h => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${rows.map(row => `<tr><th scope="row">${row[0]}</th>${row.slice(1).map(cell => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody></table>`;

function routingDiagram(routes: ExpertRoute[], counts: number[], selected: number, outputs: Matrix) {
  const ty = [70, 154, 238, 322], ey = [98, 196, 294];
  const ordered = [...routes].sort((a, b) => Number(a.token === selected) - Number(b.token === selected));
  const paths = ordered.map(route => {
    const active = route.token === selected, y = ty[route.token], middle = ey[route.expert];
    return `<g class="${active ? "moe-route-active" : "moe-route-muted"}"><path d="M170 ${y} C250 ${y},250 ${middle},330 ${middle}"/><path d="M480 ${middle} C555 ${middle},555 ${y},640 ${y}"/>${active ? `<text x="282" y="${(y + middle) / 2 - 7}" text-anchor="middle">${n(route.weight)}</text>` : ""}</g>`;
  }).join("");
  return `<svg viewBox="0 0 830 374" role="img" aria-label="Four token rows route to three experts and combine back to their original token positions. Highlighted token ${selected} uses ${routes.filter(r => r.token === selected).map(r => `expert ${r.expert} with gate ${n(r.weight)}`).join(" and ")}. Combined output ${vector(outputs[selected])}."><g class="moe-map-heading"><text x="24" y="25">Token rows X</text><text x="345" y="25">Expert groups</text><text x="654" y="25">Combined Y</text></g>${paths}${ty.map((y, t) => `<g class="${t === selected ? "moe-node-selected" : "moe-node"}"><rect x="12" y="${y - 27}" width="158" height="54"/><text x="24" y="${y - 5}">t${t} · ${vector(inputs[t])}</text><text class="moe-map-small" x="24" y="${y + 15}">input position ${t}</text><rect x="640" y="${y - 27}" width="180" height="54"/><text x="652" y="${y - 5}">y${t}</text><text class="moe-map-small" x="652" y="${y + 15}">${vector(outputs[t])}</text></g>`).join("")}${ey.map((y, e) => `<g class="moe-node"><rect x="330" y="${y - 31}" width="150" height="62"/><text x="346" y="${y - 7}">Expert ${e} · W${e}</text><text class="moe-map-small" x="346" y="${y + 15}">${counts[e]} assigned rows</text></g>`).join("")}<text class="moe-map-small" x="278" y="363">Pack by expert → run xW → weight and scatter-add</text></svg>`;
}

export function initializeMoeExecutionLabs() {
  const routing = document.getElementById("moe-routing-lab");
  if (routing && !routing.dataset.initialized) {
    routing.dataset.initialized = "true";
    const render = () => {
      const k = Number(control(routing, "moe-k").value), selected = Number(control(routing, "moe-token").value);
      const normalized = control(routing, "moe-normalize").value === "selected";
      const plan = routeTokens(logits, k, normalized), result = groupedMoe(inputs, experts, plan.routes);
      routing.querySelector("[data-moe-map]")!.innerHTML = routingDiagram(plan.routes, plan.counts, selected, result.outputs);
      const selectedRoutes = plan.routes.filter(r => r.token === selected);
      routing.querySelector("[data-moe-routing-summary]")!.textContent = `Token ${selected}: full probabilities ${vector(plan.probabilities[selected])}; ${selectedRoutes.map(r => `e${r.expert} gate ${n(r.weight)}`).join(", ")}. Gate sum ${n(selectedRoutes.reduce((sum, r) => sum + r.weight, 0))}; output ${vector(result.outputs[selected])}. ${plan.routes.length} assignments represent ${inputs.length} input tokens.`;
      routing.querySelector("[data-moe-packed]")!.innerHTML = table("Packed rows retain identity and mixture weights", ["Slot", "Expert", "Original token", "Input", "Gate", "Expert result", "Weighted result"], result.packed.map((r, slot) => [String(slot), `e${r.expert}`, `t${r.token}${r.token === selected ? " ← selected" : ""}`, vector(inputs[r.token]), n(r.weight), vector(result.expertOutputs[slot]), vector(result.expertOutputs[slot].map(v => v * r.weight))]));
    };
    routing.addEventListener("change", render); render();
  }

  const capacity = document.getElementById("moe-capacity-lab");
  if (capacity && !capacity.dataset.initialized) {
    capacity.dataset.initialized = "true";
    const render = () => {
      const skew = control(capacity, "moe-load").value === "skew", k = Number(control(capacity, "moe-cap-k").value);
      const cap = Number(control(capacity, "moe-capacity").value), renormalize = control(capacity, "moe-overflow").value === "renormalize";
      const owners = control(capacity, "moe-owners").value.split("").map(Number);
      const plan = routeTokens(skew ? inputs.map(() => [.8, .15, .05].map(Math.log)) : logits, k);
      const limited = limitCapacity(plan, cap, renormalize), full = groupedMoe(inputs, experts, plan.routes), actual = groupedMoe(inputs, experts, limited.routes);
      const traffic = expertTraffic(limited.routes, [0, 0, 1, 1], owners, 2, 4);
      capacity.querySelector("[data-moe-queues]")!.innerHTML = plan.counts.map((count, e) => {
        const selectedRoutes = plan.routes.filter(r => r.expert === e);
        return `<div class="moe-expert-queue"><strong>Expert ${e} · rank ${owners[e]}</strong><div>${selectedRoutes.map(r => {
          const dropped = limited.dropped.some(d => d.token === r.token && d.expert === r.expert);
          return `<span class="moe-assignment ${dropped ? "moe-assignment-dropped" : ""}">${dropped ? `<s>t${r.token}</s><span class="moe-chip-status">dropped</span>` : `t${r.token}<span class="moe-chip-status">kept</span>`}</span>`;
        }).join("") || "<span>No assignments</span>"}</div><span>${limited.counts[e]} kept / ${count} requested · capacity ${cap}</span></div>`;
      }).join("");
      const changed = actual.outputs.filter((row, t) => row.some((value, j) => Math.abs(value - full.outputs[t][j]) > 1e-10)).length;
      capacity.querySelector("[data-moe-capacity-summary]")!.textContent = `${limited.dropped.length} of ${plan.routes.length} assignments dropped; ${limited.emptyTokens.length} tokens have zero surviving gate mass. ${changed} output rows differ from dropless execution. ${traffic.remoteAssignments} kept assignments cross ranks: ${traffic.oneWayBytes} bytes dispatch plus ${traffic.oneWayBytes} bytes return at two FP32 channels. This count excludes metadata and duplicate-transfer sharing.`;
      capacity.querySelector("[data-moe-traffic]")!.innerHTML = table("Kept assignments by source and destination; diagonal is local", ["Source rank", "Destination 0", "Destination 1"], traffic.counts.map((row, source) => [String(source), ...row.map(String)])) + table("Dropping and renormalization change the numerical result", ["Token", "Dropless output", "Original surviving gate mass", "After capacity policy"], actual.outputs.map((row, t) => [`t${t}`, vector(full.outputs[t]), n(limited.survivingMass[t]), vector(row)]));
    };
    capacity.addEventListener("change", render); render();
  }

  const gradient = document.getElementById("moe-gradient-lab");
  if (gradient && !gradient.dataset.initialized) {
    gradient.dataset.initialized = "true";
    const render = () => {
      const k = Number(control(gradient, "moe-grad-k").value), selected = Number(control(gradient, "moe-grad-token").value);
      const normalized = control(gradient, "moe-grad-normalize").value === "selected";
      const plan = routeTokens(logits, k, normalized), result = moeBackward(inputs, experts, plan, inputs.map(() => [1, 0]));
      const balance = switchBalance(logits), gates = Array(experts.length).fill(0) as number[];
      plan.routes.filter(r => r.token === selected).forEach(r => { gates[r.expert] = r.weight; });
      gradient.querySelector("[data-moe-grad-summary]")!.textContent = `Token ${selected}: task logit derivative ${vector(result.dLogits[selected])}; expert-path input derivative ${vector(result.dInputs[selected])}. ${k === 1 && normalized ? "The one selected normalized gate is exactly 1, so its task gradient is zero." : "These derivatives hold the selected expert IDs fixed."} Separate top-1 balance loss / α = ${n(balance.loss)}.`;
      gradient.querySelector("[data-moe-grad-values]")!.innerHTML = table(`Token ${selected} · task derivatives`, ["Expert", "Selected gate g", "∂Ltask/∂g for selected route", "∂Ltask/∂logit"], gates.map((gate, e) => [`e${e}`, n(gate), plan.routes.some(r => r.token === selected && r.expert === e) ? n(result.dGate[selected][e]) : "No expert route", n(result.dLogits[selected][e])])) + table("Separate Switch top-1 balance calculation, before capacity; coefficient α omitted", ["Expert", "Hard winner fraction f", "Mean probability P", `∂(Lbalance/α)/∂z${selected}`], balance.fractions.map((f, e) => [`e${e}`, n(f), n(balance.meanProbabilities[e]), n(balance.dLogits[selected][e])])) + table("Expert-weight gradients summed over all four tokens", ["Expert", "∂Ltask/∂W · rows"], result.dExperts.map((w, e) => [`e${e}`, w.map(vector).join("; ")]));
    };
    gradient.addEventListener("change", render); render();
  }
}
