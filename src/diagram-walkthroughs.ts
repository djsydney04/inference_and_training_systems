/** Adapters advance the existing lessons. They never follow links or open dialogs. */
export interface DiagramWalkthrough {
  kind: "flow" | "simulation";
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
function selections(root: HTMLElement, selector: string): DiagramWalkthrough {
  return { kind: "flow", advance() {
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

export const diagramHostSelector = "figure, .textbook-lab, .three-lab, .architecture-figure, .wide-figure, [data-spec-lab]";

export function diagramWalkthrough(root: HTMLElement): DiagramWalkthrough | null {
  // The entrance drawing is a quiet, manually explored preview.
  if (root.closest(".atlas-landing")) return null;
  // Static is the default. Component maps, architecture drawings, and parameter
  // comparisons remain manually explorable without timers or playback controls.
  if (root.matches(".book-study, .notebook-figure, .lesson-visual, [data-nn-inspector], .chip-explorer, .system-buildout")) return null;
  if (root.matches(".portable-kernel-lab")) {
    let stage = -1;
    return { kind: "flow", advance() {
      stage = (stage + 1) % 4;
      if (stage === 0) {
        const k = root.querySelector<HTMLInputElement>("[data-pk-step]")!;
        if (Number(k.value) === Number(k.max)) {
          setValue(k, k.min);
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
    ["cpu-issue", "next", "reset"], ["cpu-cache", "next", "reset"], ["cpu-branch", "next", "reset"],
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
  for (const selector of ["[data-sequence-step]", "[data-step]", "[data-training-stage]", "[data-cpu-stage]"]) {
    if (root.querySelector(selector)) return selections(root, selector);
  }
  if (root.querySelector("[data-inference-step]")) return { kind: "flow", advance() {
    click(root.querySelector("[data-inference-step]")); return label(root.querySelector("[data-phase-readout] strong")!);
  } };

  // New figures need no animation adapter. Add one only when changing state
  // or following execution is necessary to explain the subject.
  return null;
}
