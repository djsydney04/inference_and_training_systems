/** Adapters advance the existing lessons. They never follow links or open dialogs. */
export interface DiagramWalkthrough {
  kind: "flow" | "simulation" | "comparison";
  advance(): string;
}

const all = <T extends Element = HTMLElement>(root: ParentNode, selector: string) => [...root.querySelectorAll<T>(selector)];
const label = (element: Element) => {
  const texts = element.querySelectorAll("text");
  return (texts.length ? [...texts].map(t => t.textContent).join(" · ") : (element as HTMLElement).innerText || element.textContent || "")
    .replace(/\s+/g, " ").trim();
};
const click = (element: Element | null) => element?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
const setValue = (element: HTMLInputElement | HTMLSelectElement, value: string) => {
  element.value = value;
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
};
function focus(root: HTMLElement, elements: Element[]) {
  all(root, ".walkthrough-focus").forEach(e => e.classList.remove("walkthrough-focus"));
  elements.forEach(e => e.classList.add("walkthrough-focus"));
}

function selections(root: HTMLElement, selector: string, kind: DiagramWalkthrough["kind"] = "flow"): DiagramWalkthrough {
  return { kind, advance() {
    const nodes = all(root, selector);
    const selected = nodes.findIndex(e => e.getAttribute("aria-pressed") === "true" || e.classList.contains("is-active"));
    const next = (selected + 1) % nodes.length;
    click(nodes[next]);
    return `${next + 1}/${nodes.length} · ${label(nodes[next])}`;
  } };
}

function steps(root: HTMLElement, next: string, reset: string, limit = Infinity, readout?: string): DiagramWalkthrough {
  let count = 0;
  return { kind: "simulation", advance() {
    const button = root.querySelector<HTMLButtonElement>(next)!;
    if (button.disabled || count >= limit) {
      click(root.querySelector(reset)); count = 0;
      return "Start again · initial state";
    }
    click(button); count++;
    return readout ? label(root.querySelector(readout)!) : `Step ${count} · ${label(button)}`;
  } };
}

function sweep(root: HTMLElement, selector: string, name: string, values?: string[], readout?: string): DiagramWalkthrough {
  return { kind: "comparison", advance() {
    const input = root.querySelector<HTMLInputElement | HTMLSelectElement>(selector)!;
    const choices = values ?? [...(input as HTMLSelectElement).options].map(o => o.value);
    const next = (choices.indexOf(input.value) + 1) % choices.length;
    setValue(input, choices[next]);
    const value = readout ? label(root.querySelector(readout)!) : input instanceof HTMLSelectElement ? input.selectedOptions[0].textContent : input.value;
    return `${name}: ${value}`;
  } };
}

/** These sliders represent ordered simulation states, not numerical parameters. */
function phaseSlider(root: HTMLElement, selector: string, readout: string): DiagramWalkthrough {
  return { kind: "simulation", advance() {
    const input = root.querySelector<HTMLInputElement>(selector)!;
    // Re-read bounds because changing the reader's scenario can change its length.
    const start = Number(input.min), end = Number(input.max), step = Number(input.step) || 1;
    const value = Number(input.value) >= end ? start : Math.min(end, Number(input.value) + step);
    setValue(input, String(value));
    return `${value === start ? "Start again" : "Next state"} · ${label(root.querySelector(readout)!)}`;
  } };
}

function tour(root: HTMLElement, frames: () => { nodes: Element[]; note: string }[]): DiagramWalkthrough {
  let index = -1;
  return { kind: "flow", advance() {
    const list = frames(); index = (index + 1) % list.length;
    focus(root, list[index].nodes);
    return `${index + 1}/${list.length} · ${list[index].note}`;
  } };
}

function staticArchitecture(root: HTMLElement): DiagramWalkthrough {
  const lesson = root.closest("[data-lesson]")?.id;
  const notes: Record<string, string[]> = {
    "frontier-mla": ["Compress the current hidden vector into a latent.", "Append that latent to the compressed history.", "Transform the current query into the latent space.", "Score the cache, mask and normalize the scores.", "Form a weighted sum while values remain compressed.", "Expand the resulting sum into the output channels."],
    "frontier-hybrid": ["The token updates the first recurrent layer’s fixed state.", "The second recurrent layer maintains its own fixed state.", "The third recurrent layer also processes this token.", "The attention layer reads history that grows with context."],
    "frontier-disaggregation": ["Admit a request within the available budget.", "The prefill worker produces KV pages.", "Transfer the pages with their layout and position metadata.", "Confirm ownership before decoding; release pages at completion."],
  };
  return tour(root, () => {
    const rects = all<SVGRectElement>(root, "svg > g > rect");
    const texts = all<SVGTextElement>(root, "svg > g > text");
    const order = lesson === "frontier-mla" ? [0, 1, 3, 4, 2, 5] : lesson === "frontier-hybrid" ? [0, 1, 2, 3] : rects.map((_, i) => i);
    return order.map((r, i) => {
      const rect = rects[r];
      const { x, y, width, height } = rect;
      const within = texts.filter(t => Number(t.getAttribute("x")) >= x.baseVal.value && Number(t.getAttribute("x")) < x.baseVal.value + width.baseVal.value && Number(t.getAttribute("y")) >= y.baseVal.value && Number(t.getAttribute("y")) < y.baseVal.value + height.baseVal.value);
      return { nodes: [rect, ...within, ...(lesson === "frontier-hybrid" ? [rects[r + 4]] : [])], note: notes[lesson ?? ""]?.[i] ?? within.map(label).join(" · ") };
    });
  });
}

export const diagramHostSelector = "figure, .textbook-lab, .three-lab, .architecture-figure, .wide-figure, [data-spec-lab]";

export function diagramWalkthrough(root: HTMLElement): DiagramWalkthrough | null {
  // The entrance drawing is a quiet, manually explored preview.
  if (root.closest(".atlas-landing")) return null;
  // Catalog studies are captioned external artwork, separate from live diagrams.
  if (root.matches("figure.book-study")) return null;
  if (root.matches(".notebook-figure")) return { kind: "flow", advance() {
    click(root.querySelector("[data-notebook-next]"));
    return label(root.querySelector("[data-notebook-status]")!);
  } };
  // A parent figure can contain an independently owned lesson schematic.
  if (root.matches(".lesson-visual")) return selections(root, "[data-lv-node]");
  if (root.matches("[data-nn-inspector]")) return selections(root, "[data-nn-part]");
  if (root.matches(".chip-explorer")) return { kind: "flow", advance() {
    const panel = root.querySelector<HTMLElement>("[data-chip-panel]:not([hidden])")!;
    const next = panel.querySelector<HTMLButtonElement>("[data-chip-next]")!;
    if (!next.disabled) click(next);
    else {
      const route = panel.querySelector<HTMLSelectElement>("[data-chip-route]")!;
      if (route.selectedIndex < route.options.length - 1) setValue(route, route.options[route.selectedIndex + 1].value);
      else {
        setValue(route, route.options[0].value);
        const views = all(root, "[data-chip-view]");
        if (views.length > 1) click(views[(views.findIndex(e => e.getAttribute("aria-pressed") === "true") + 1) % views.length]);
        const active = root.querySelector<HTMLElement>("[data-chip-panel]:not([hidden])")!;
        click(active.querySelector("[data-chip-reset]"));
      }
      click(root.querySelector("[data-chip-panel]:not([hidden]) [data-chip-next]"));
    }
    return root.querySelector("[data-chip-panel]:not([hidden]) [data-chip-status]")!.textContent!;
  } };
  if (root.matches(".system-buildout")) {
    let part = -1;
    return { kind: "flow", advance() {
      let nodes = all(root, "[data-system-part]").filter((node, i, arr) => arr.findIndex(other => other.dataset.systemPart === node.dataset.systemPart) === i);
      part++;
      if (part >= nodes.length) {
        click(root.querySelector(".sb-levels [aria-pressed=true]")?.nextElementSibling ?? root.querySelector(".sb-levels button"));
        nodes = all(root, "[data-system-part]").filter((node, i, arr) => arr.findIndex(other => other.dataset.systemPart === node.dataset.systemPart) === i);
        part = 0;
      }
      click(nodes[part]); return `${part + 1}/${nodes.length} · ${label(nodes[part])}`;
    } };
  }
  if (root.matches(".portable-kernel-lab")) {
    let stage = -1;
    return { kind: "flow", advance() {
      stage = (stage + 1) % 4;
      if (stage === 0) {
        const k = root.querySelector<HTMLInputElement>("[data-pk-step]")!;
        if (Number(k.value) === Number(k.max)) {
          const backends = all(root, "[data-pk-backend]");
          click(backends[(backends.findIndex(b => b.getAttribute("aria-pressed") === "true") + 1) % backends.length]);
        } else if (root.dataset.walkthroughStarted) setValue(k, String(Number(k.value) + 1));
        root.dataset.walkthroughStarted = "true";
      }
      const nodes = all(root, "[data-pk-stage]"); click(nodes[stage]);
      return `${stage + 1}/4 · ${label(nodes[stage])}`;
    } };
  }
  if (root.querySelector("[data-sharded-phase]")) return phaseSlider(root, "[data-sharded-phase]", "[data-sharded-phase-name]");
  if (root.querySelector("[data-serving-stop-step]")) return phaseSlider(root, "[data-serving-stop-step]", "[data-serving-stop-result]");
  if (root.querySelector("[data-sr-next]")) return steps(root, "[data-sr-next]", "[data-sr-reset]", Infinity, "[data-sr-state] .sr-readout strong");
  if (root.querySelector("[data-pd-handoff-next]")) return steps(root, "[data-pd-handoff-next]", "[data-pd-handoff-reset]", Infinity, "[data-pd-handoff-state] .pd-state-title");
  const stepRecipes = [
    ["matmul", "next", "reset"], ["ring", "next", "reset"], ["pipe", "next", "reset"],
    ["optimizer", "next", "reset"], ["spec", "next", "reset"], ["systolic", "next", "reset"],
    ["softmax", "step", "reset"], ["first", "step", "reset"], ["elastic", "next", "reset"],
  ];
  for (const [prefix, next, reset] of stepRecipes) {
    if (root.querySelector(`[data-${prefix}-${next}]`)) return steps(root, `[data-${prefix}-${next}]`, `[data-${prefix}-${reset}]`, prefix === "first" ? 8 : prefix === "elastic" ? 12 : Infinity);
  }
  if (root.querySelector("[data-reduce-next]")) return { kind: "simulation", advance() {
    const next = root.querySelector<HTMLButtonElement>("[data-reduce-next]")!;
    if (next.disabled) {
      const input = root.querySelector<HTMLSelectElement>("[data-reduce-length]")!;
      setValue(input, input.value); return "Start again · initial values";
    }
    click(next); return "Reduction · combine the next set of pairs";
  } };
  if (root.querySelector("[data-cache-reset]")) {
    let step = -1;
    const actions = ["append=A", "append=B", "append=A", "release=A", "append=B", "reset"];
    return { kind: "simulation", advance() {
      step = (step + 1) % actions.length;
      const [action, request] = actions[step].split("=");
      const button = root.querySelector(`[data-cache-${action}${request ? `="${request}"` : ""}]`);
      click(button); return `${step + 1}/${actions.length} · ${label(button!)}`;
    } };
  }
  for (const selector of ["[data-sequence-step]", "[data-step]", "[data-training-stage]", "[data-cpu-stage]", "[data-tensor-view]", "[data-plate-layer]", "[data-parallel-mode]"]) {
    if (root.querySelector(selector)) return selections(root, selector, /tensor-view|plate-layer|parallel-mode/.test(selector) ? "comparison" : "flow");
  }
  if (root.querySelector("[data-inference-step]")) return { kind: "flow", advance() {
    click(root.querySelector("[data-inference-step]")); return label(root.querySelector("[data-phase-readout] strong")!);
  } };

  // Each recipe changes one named teaching axis; other reader settings stay fixed.
  // New controls must be selected deliberately here, never discovered and cycled.
  const comparisons: [string, string, string[]?, string?][] = [
    ["nn-query", "Query position"], ["attention-mode", "Attention pattern"], ["address-layout", "Storage layout"],
    ["memory-stride", "Lane stride"], ["occ-registers", "Registers per thread"], ["capacity-batch", "Concurrent sequences"],
    ["warp-stride", "Word stride"], ["fixed-fraction", "Fraction bits"], ["train-zero", "State sharding"],
    ["bit-a", "Operand A (B stays fixed)", ["0", "1", "3", "7", "15", "127", "-128", "-1"]],
    ["timing-period", "Clock period (ns)", ["5", "3", "1", "0.75", "0.5"]],
    ["intensity", "Arithmetic intensity", ["1", "4", "16", "32", "64", "128"]],
    ["trace-overlap", "Independent compute (ms)", ["0", "2", "4", "6", "8"]],
    ["kv-tokens", "Cached tokens", ["512", "2048", "8192", "32768"]],
    ["acceptance", "Draft acceptance", ["10", "30", "50", "70", "90", "100"]],
    ["prefetch-enabled", "Forward gather schedule"],
    ["update-owners", "Logical owners of the same reduced gradient"],
    ["framework-shift", "Who shifts the next-token labels"],
    ["rollout-lag", "Allowed policy-version lag"],
    ["ratio-current", "Current-policy probability π; behavior probability stays fixed"],
    ["ft-count", "Calls inside the timer boundary"],
    ["quant-scale", "Quantization scale s", ["5", "10", "25", "50", "100"], "[data-quant-scale-value]"],
    ["weight-group", "Weights sharing one quantization scale"],
    ["tree-query", "Tree query and its visible ancestors"],
    ["depth-mode", "Draft execution schedule"],
    ["sr-interval", "Arrival interval (ms); service time stays fixed"],
    ["sr-buffer", "Client receipt / buffering scenario"],
    ["pd-emission", "First-token emission boundary"],
    ["pd-d-workers", "Decode replicas; prefill and link stay fixed", ["1", "2", "4", "8"]],
    ["moe-token", "Follow token through packing and weighted combination"],
    ["moe-capacity", "Per-expert capacity under the selected overflow rule"],
    ["moe-grad-token", "Token whose router and expert derivatives are inspected"],
    ["fw-reduction", "Classifier loss reduction; valid-target mask stays fixed"],
    ["fw-phase", "Execution situation in the selected framework"],
    ["fw-call", "Call ledger through this invocation"],
    ["framework-divisor", "Backward helper division; compensation preserves the objective"],
    ["framework-alpha", "Adapter scale", ["0", "0.5", "1", "2"], "[data-framework-alpha-value]"],
    ["serving-cache-case", "Prefix computation / identity scenario"],
  ];
  for (const [attribute, name, values, readout] of comparisons) {
    if (root.querySelector(`[data-${attribute}]`)) return sweep(root, `[data-${attribute}]`, name, values, readout);
  }
  if (root.querySelector("[data-nn-whole]")) return tour(root, () => all(root, "[data-nn-whole] .nn-node").map(node => ({ nodes: [node], note: label(node) })));
  if (root.closest("#network-embeddings")) return tour(root, () => [7, 2, 9, 4].map((id, row) => ({
    nodes: all(root, `rect[y="${53 + row * 39}"]`), note: `ID ${id} selects row ${id} of E → eight channels at token position ${row + 1}.`,
  })));
  if (root.matches(".architecture-figure")) return staticArchitecture(root);
  if (root.querySelector(".sft-alignment")) return tour(root, () => Array.from({ length: 5 }, (_, i) => {
    const cells = [...root.querySelector(".sft-alignment")!.children];
    return { nodes: [cells[i + 1], cells[i + 7], cells[i + 13]], note: `${label(cells[i + 1])} predicts ${label(cells[i + 7])} · loss mask ${label(cells[i + 13])}` };
  }));
  if (root.querySelector(".schedule-grid")) return tour(root, () => Array.from({ length: 6 }, (_, i) => {
    const cells = [...root.querySelector(".schedule-grid")!.children];
    const nodes = [0, 1, 2, 3, 4].map(row => cells[row * 7 + i + 1]);
    return { nodes, note: `Abstract stage ${i} · ${nodes.slice(1).map(label).filter(Boolean).join("; ")}` };
  }));
  if (root.matches(".parallel-mlp")) return tour(root, () => {
    const shared = all(root, ".parallel-shared"), ranks = all(root, ".parallel-local > div");
    return [
      { nodes: [shared[0]], note: "Replicate the input X to both tensor-parallel ranks." },
      { nodes: ranks, note: "Both ranks independently expand, activate and project their own hidden-channel shard." },
      { nodes: [shared[1]], note: "Sum the partial outputs, then add the output bias once." },
    ];
  });
  if (root.matches(".replica-lab")) return tour(root, () => [
    { nodes: all(root, ".replica-contract > div"), note: "Both replicas accumulate normalized contributions at the same parameter version." },
    ...all(root, ".replica-reduction > span, .replica-reduction > strong").map(node => ({ nodes: [node], note: label(node) })),
  ]);
  if (root.id === "framework-deployment-diagram") return tour(root, () => [
    { nodes: all(root, ".fw-router"), note: "The request router chooses one ready serving replica." },
    { nodes: all(root, ".fw-replica-row > div"), note: "The two replicas have independent schedulers and request KV state." },
    { nodes: all(root, ".fw-replica-row p"), note: "Within each replica, its two model ranks communicate to execute the request." },
  ]);
  // These are authored, ordered flows or side-by-side comparisons, not arbitrary text.
  for (const selector of [".manual-sequence > div", ".method-flow > li", ".cuda-pipeline > span", ".contract-comparison > div", ".fiber-path > div", ".request-flow > div", ".pd-route > div", ".fw-layers > li", ".framework-responsibility-flow > li"]) {
    if (root.querySelector(selector)) return tour(root, () => all(root, selector).map(node => ({ nodes: [node], note: label(node) })));
  }
  return null;
}
