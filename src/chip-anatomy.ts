import "./chip-anatomy.css";
import { chipExplorers, chipRouteStep, outputContention } from "./chip-anatomy-data";
import type { ChipPart, ChipView } from "./chip-anatomy-data";

const escape = (value: string) => value.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const width = 196, height = 90;

function internals(part: ChipPart) {
  const name = {memory:"Storage",compute:"Arithmetic",control:"Control",link:"Transfer path"}[part.kind];
  return `<path d="M${part.x+14} ${part.y+59}H${part.x+182}"/><text class="chip-kind-label" x="${part.x+14}" y="${part.y+78}">${name}</text>`;
}

function diagram(view: ChipView) {
  const bottom = Math.max(...view.parts.map(p => p.y)) + height + 26;
  const arrow = `${view.id}-arrow`;
  const edges = view.edges.map(e => {
    const a = view.parts.find(p => p.id === e.from)!;
    const b = view.parts.find(p => p.id === e.to)!;
    let points: number[][];
    if (e.bends) points = [...e.bends, [b.x + width, b.y + height / 2]];
    else if (a.y === b.y) points = [[a.x + (a.x < b.x ? width : 0), a.y + height / 2], [b.x + (a.x < b.x ? 0 : width), b.y + height / 2]];
    else if (a.x === b.x) points = [[a.x + width / 2, a.y + (a.y < b.y ? height : 0)], [b.x + width / 2, b.y + (a.y < b.y ? 0 : height)]];
    else {
      const right = a.x < b.x;
      const start = [a.x + (right ? width : 0), a.y + height / 2];
      const end = [b.x + (right ? 0 : width), b.y + height / 2];
      const mid = (start[0] + end[0]) / 2;
      points = [start, [mid, start[1]], [mid, end[1]], end];
    }
    return `<path class="chip-wire${e.control ? " is-control" : ""}" data-chip-edge="${e.from}:${e.to}" d="${points.map((p, i) => `${i ? "L" : "M"}${p[0]} ${p[1]}`).join(" ")}" marker-end="url(#${arrow})"/>`;
  }).join("");
  const nodes = view.parts.map(p => `<g class="chip-node chip-${p.kind}" data-chip-part="${p.id}" role="button" tabindex="0" aria-pressed="false" aria-label="Inspect ${escape(p.label)}"><title>${escape(p.label)}: ${escape(p.detail)}</title><rect class="chip-node-body" x="${p.x}" y="${p.y}" width="${width}" height="${height}"/><text class="chip-node-label" x="${p.x + 14}" y="${p.y + 26}">${escape(p.label)}</text><text class="chip-node-detail" x="${p.x + 14}" y="${p.y + 46}">${escape(p.detail)}</text><g class="chip-internals" aria-hidden="true">${internals(p)}</g>${p.open ? `<text class="chip-open-mark" x="${p.x + width - 18}" y="${p.y + 76}" aria-hidden="true">↗</text>` : ""}</g>`).join("");
  return `<svg viewBox="0 0 988 ${bottom}" class="chip-svg" aria-labelledby="${view.id}-title ${view.id}-description"><title id="${view.id}-title">${escape(view.title)}</title><desc id="${view.id}-description">Select a named component or use the component menu. Arrows show directed relationships; dashed arrows show control. Component footers identify storage, arithmetic, control and transfer paths. Sizes do not encode resource counts.</desc><defs><marker id="${arrow}" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7" fill="context-stroke"/></marker></defs>${edges}${nodes}</svg>`;
}

function viewMarkup(view: ChipView, first: boolean) {
  return `<div class="chip-view" data-chip-panel="${view.id}"${first ? "" : " hidden"}>
    <div class="chip-view-heading"><h4 id="${view.id}-heading">${escape(view.title)}</h4><span>Logical organization</span></div>
    <div class="chip-controls"><label>Component<select data-chip-picker aria-label="Component in ${escape(view.label)}">${view.parts.map(p => `<option value="${p.id}">${escape(p.label)}</option>`).join("")}</select></label><label>Diagram size<select data-chip-zoom aria-label="Diagram size in ${escape(view.label)}"><option value="1">100%</option><option value="1.3">130%</option><option value="1.6">160%</option></select></label><span class="chip-scroll-hint">Scroll to inspect wider diagrams</span></div>
    <div class="chip-canvas" tabindex="0" aria-label="${escape(view.label)} diagram; scroll horizontally for all components">${diagram(view)}</div>
    <div class="chip-legend" aria-hidden="true"><span><i class="chip-memory"></i>Storage</span><span><i class="chip-compute"></i>Arithmetic</span><span><i class="chip-control"></i>Control</span><span><i class="chip-link"></i>Links</span><span>Dashed line: control dependency</span></div>
    <div class="chip-trace"><label>Follow a route<select data-chip-route>${view.routes.map((r, i) => `<option value="${i}">${escape(r.label)}</option>`).join("")}</select></label><div class="chip-trace-buttons"><button type="button" data-chip-prev aria-label="Previous route step">Previous</button><button type="button" data-chip-next>Start route</button><button type="button" data-chip-reset>Explore freely</button></div><p class="chip-trace-status" data-chip-status aria-live="polite">Select a component or start a route.</p><p class="chip-route-note">${escape(view.routes[0].note)}</p></div>
    <div class="chip-inspector" data-chip-inspector aria-live="polite"></div>
    ${view.id === "network-switch" ? `<div class="chip-contention"><h4>Share one output port</h4><p>All senders start together, each through an input as fast as the single shared output.</p><div class="chip-contention-controls"><label>Senders<input type="range" min="1" max="16" step="1" value="4" data-incast-senders><output data-incast-count>4</output></label><label>Output port<select data-incast-rate><option>100</option><option>200</option><option selected>400</option><option>800</option></select><span>Gb/s · decimal bits per second</span></label><label>Message per sender<select data-incast-size><option value="0.25">256 KiB</option><option value="1" selected>1 MiB</option><option value="16">16 MiB</option></select></label></div><div data-incast-result aria-live="polite"></div><p class="chip-contention-boundary">Ideal fluid model: equal sharing, no protocol overhead and unlimited buffering. The backlog is storage that would be needed if no sender slowed down. Real switches have finite buffers and may signal, pause or drop traffic; these are not measured switch latencies.</p></div>` : ""}
    <p class="chip-boundary">${escape(view.boundary)}</p>
    <details class="deep-dive chip-reference"><summary>All component explanations</summary><div class="chip-reference-list">${view.parts.map(p => `<article><h4 id="${view.id}-${p.id}-reference">${escape(p.label)}</h4><p>${escape(p.body)}</p><p><strong>Watch for:</strong> ${escape(p.watch)}</p><p><strong>Example:</strong> ${escape(p.example)}</p></article>`).join("")}</div></details>
  </div>`;
}

/** Insert before reader numbering, source discovery and search indexing. */
export function prepareChipAnatomy() {
  chipExplorers.forEach(explorer => {
    const host = document.getElementById(explorer.host)?.closest(".hardware-mount");
    if (!host || document.getElementById(explorer.id)) return;
    const sources = new Map(explorer.views.flatMap(view => view.sources));
    host.insertAdjacentHTML("afterend", `<section class="lesson chip-anatomy" id="${explorer.id}" data-lesson="${escape(explorer.title)}"><header><span>Chip anatomy</span><h3>${escape(explorer.title)}</h3></header><p>${escape(explorer.intro)}</p><figure class="chip-explorer" data-chip-explorer="${explorer.id}"><figcaption><span>Interactive component schematic</span><strong>${escape(explorer.title)}</strong><p>Select a part or step through a route. Open the diagram for a larger view.</p></figcaption>${explorer.views.length > 1 ? `<div class="chip-view-tabs" role="group" aria-label="${escape(explorer.title)} views">${explorer.views.map((view, i) => `<button type="button" data-chip-view="${view.id}" aria-pressed="${i === 0}">${escape(view.label)}</button>`).join("")}</div>` : ""}${explorer.views.map((view, i) => viewMarkup(view, i === 0)).join("")}</figure><div class="chip-sources">${[...sources].map(([url, label]) => `<a class="lesson-source" href="${url}" target="_blank" rel="noreferrer">${escape(label)}</a>`).join("")}</div></section>`);
  });
}

export function initializeChipAnatomy() {
  chipExplorers.forEach(explorer => {
    const figure = document.querySelector<HTMLElement>(`[data-chip-explorer="${explorer.id}"]`);
    if (!figure || figure.dataset.chipReady) return;
    figure.dataset.chipReady = "true";
    const showView = (id: string) => {
      figure.querySelectorAll<HTMLElement>("[data-chip-panel]").forEach(panel => { panel.hidden = panel.dataset.chipPanel !== id; });
      figure.querySelectorAll<HTMLElement>("[data-chip-view]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.chipView === id)));
      window.dispatchEvent(new Event("resize"));
    };
    // Search may target a component in a folded, currently inactive view.
    document.addEventListener("atlas:beforenavigate", () => {
      let fragment: string;
      try { fragment = decodeURIComponent(location.hash.slice(1)); } catch { return; }
      const target = document.getElementById(fragment);
      const panel = target?.closest<HTMLElement>("[data-chip-panel]");
      if (panel && figure.contains(panel)) showView(panel.dataset.chipPanel!);
    });
    figure.querySelectorAll<HTMLButtonElement>("[data-chip-view]").forEach(button => button.addEventListener("click", () => showView(button.dataset.chipView!)));
    explorer.views.forEach(view => {
      const panel = figure.querySelector<HTMLElement>(`[data-chip-panel="${view.id}"]`)!;
      const picker = panel.querySelector<HTMLSelectElement>("[data-chip-picker]")!;
      const routePicker = panel.querySelector<HTMLSelectElement>("[data-chip-route]")!;
      const prev = panel.querySelector<HTMLButtonElement>("[data-chip-prev]")!;
      const next = panel.querySelector<HTMLButtonElement>("[data-chip-next]")!;
      let step = -1;
      const controls = () => {
        prev.disabled = step <= 0;
        next.disabled = step >= view.routes[Number(routePicker.value)].steps.length - 1;
        next.textContent = step < 0 ? "Start route" : next.disabled ? "Route complete" : "Next step";
      };
      const select = (id: string, fromRoute = false) => {
        const part = view.parts.find(p => p.id === id)!;
        if (!fromRoute) step = -1;
        picker.value = id;
        panel.querySelectorAll<HTMLElement>("[data-chip-part]").forEach(node => node.setAttribute("aria-pressed", String(node.dataset.chipPart === id)));
        const previous = fromRoute ? chipRouteStep(view, Number(routePicker.value), step).previous : null;
        panel.querySelectorAll<SVGElement>("[data-chip-edge]").forEach(line => {
          const [from, to] = line.dataset.chipEdge!.split(":");
          line.classList.toggle("is-active", fromRoute ? from === previous && to === id : from === id || to === id);
        });
        panel.querySelector("[data-chip-inspector]")!.innerHTML = `<div><span>${escape(part.detail)}</span><h4>${escape(part.label)}</h4><p>${escape(part.body)}</p>${part.open ? `<button type="button" class="chip-open" data-chip-open="${part.open}">Open ${escape(explorer.views.find(v => v.id === part.open)!.label.toLowerCase())} ↗</button>` : ""}</div><div class="chip-explanation"><h5>What limits it</h5><p>${escape(part.watch)}</p><h5>Work through it</h5><p>${escape(part.example)}</p></div>`;
        panel.querySelector("[data-chip-status]")!.textContent = fromRoute ? `Step ${step + 1} of ${view.routes[Number(routePicker.value)].steps.length} · ${part.label}` : "Explore freely · connected routes are highlighted.";
        controls();
      };
      const move = (target: number) => {
        const state = chipRouteStep(view, Number(routePicker.value), target);
        step = target;
        select(state.current.id, true);
        const node = panel.querySelector<SVGGraphicsElement>(`[data-chip-part="${state.current.id}"]`)!;
        const canvas = panel.querySelector<HTMLElement>(".chip-canvas")!;
        const box = node.getBoundingClientRect(), area = canvas.getBoundingClientRect();
        canvas.scrollLeft += box.left - area.left - (area.width - box.width) / 2;
      };
      picker.addEventListener("change", () => select(picker.value));
      panel.addEventListener("click", event => {
        const target = event.target as Element;
        const node = target.closest<SVGElement>("[data-chip-part]");
        if (node) select(node.dataset.chipPart!);
        const open = target.closest<HTMLButtonElement>("[data-chip-open]");
        if (open) {
          showView(open.dataset.chipOpen!);
          figure.querySelector<HTMLButtonElement>(`[data-chip-view="${open.dataset.chipOpen}"]`)?.focus({ preventScroll: true });
          figure.querySelector<HTMLElement>(`[data-chip-panel="${open.dataset.chipOpen}"] .chip-controls`)?.scrollIntoView({ block: "nearest" });
        }
      });
      panel.addEventListener("keydown", event => {
        const node = (event.target as Element).closest<SVGElement>("[data-chip-part]");
        if (node && ["Enter", " "].includes(event.key)) { event.preventDefault(); select(node.dataset.chipPart!); }
      });
      panel.querySelector<HTMLSelectElement>("[data-chip-zoom]")!.addEventListener("change", event => {
        panel.querySelector<HTMLElement>(".chip-canvas")!.style.setProperty("--chip-zoom", (event.target as HTMLSelectElement).value);
      });
      prev.addEventListener("click", () => { if (step > 0) move(step - 1); });
      next.addEventListener("click", () => { if (!next.disabled) move(step + 1); });
      panel.querySelector("[data-chip-reset]")!.addEventListener("click", () => select(picker.value));
      routePicker.addEventListener("change", () => {
        panel.querySelector(".chip-route-note")!.textContent = view.routes[Number(routePicker.value)].note;
        select(view.routes[Number(routePicker.value)].steps[0]);
      });
      select(view.parts[0].id);
      const incast = panel.querySelector<HTMLElement>(".chip-contention");
      if (incast) {
        const renderIncast = () => {
          const senders = Number(incast.querySelector<HTMLInputElement>("[data-incast-senders]")!.value);
          const rate = Number(incast.querySelector<HTMLSelectElement>("[data-incast-rate]")!.value);
          const size = Number(incast.querySelector<HTMLSelectElement>("[data-incast-size]")!.value);
          const model = outputContention(senders, rate, size);
          incast.querySelector("[data-incast-count]")!.textContent = String(senders);
          incast.querySelector("[data-incast-result]")!.innerHTML = `<div class="chip-share" role="img" aria-label="${senders} senders divide ${rate} gigabits per second equally">${Array.from({ length: senders }, (_, i) => `<i title="Sender ${i + 1}: ${model.fairGbps.toFixed(1)} Gb/s"></i>`).join("")}</div><dl><div><dt>Rate per sender</dt><dd>${model.fairGbps.toFixed(1)} <small>Gb/s</small></dd></div><div><dt>All messages delivered</dt><dd>${model.finishUs.toFixed(2)} <small>µs</small></dd></div><div><dt>Peak burst backlog</dt><dd>${(model.queuedBytes / 2 ** 20).toFixed(2)} <small>MiB</small></dd></div></dl><p>${senders} × ${size} MiB ÷ (${rate} Gb/s ÷ 8). Inputs finish after ${model.inputUs.toFixed(2)} µs; the shared output still has to drain the remaining bytes.</p>`;
        };
        incast.addEventListener("input", renderIncast);
        renderIncast();
      }
    });
  });
}
