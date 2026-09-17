import { arrivalTrace, deliveryMetrics, goodputReport, scheduleRequests } from "./serving-runtime-math";
import type { DeliveryTrace, SchedulerConfig, ServingRequest } from "./serving-runtime-math";

const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });
const number = (host: Element, selector: string) => Number(host.querySelector<HTMLInputElement>(selector)!.value);
const choose = (host: Element, selector: string) => host.querySelector<HTMLSelectElement>(selector)!.value;
const requests: ServingRequest[] = [
  { id: "A", prompt: 2, outputs: 5, arrival: 0 },
  { id: "B", prompt: 8, outputs: 3, arrival: 1 },
  { id: "C", prompt: 2, outputs: 2, arrival: 2 },
];
function schedulerLab(host: HTMLElement, memory: boolean) {
  let selected = 0;
  const back = host.querySelector<HTMLButtonElement>("[data-sr-back]")!;
  const next = host.querySelector<HTMLButtonElement>("[data-sr-next]")!;
  const render = () => {
    const config: SchedulerConfig = { budget: memory ? 8 : number(host, "[data-sr-budget]"),
      chunk: memory ? 4 : number(host, "[data-sr-chunk]"), blocks: memory ? number(host, "[data-sr-blocks]") : 16,
      blockSize: 4, reserve: memory ? choose(host, "[data-sr-reserve]") as SchedulerConfig["reserve"] : "growing",
      priority: memory ? "decode-first" : choose(host, "[data-sr-priority]") as SchedulerConfig["priority"] };
    const cohort = memory ? ["A", "B"].map(id => ({ id, prompt: 4, outputs: 6, arrival: 0,
      ...(id === "A" && choose(host, "[data-sr-cancel]") === "yes" ? { cancelAt: 6 } : {}) })) : requests;
    const result = scheduleRequests(cohort, config);
    selected = Math.min(selected, result.steps.length - 1);
    const step = result.steps[selected];
    host.querySelector("[data-sr-position]")!.textContent = `Iteration ${selected} of ${result.steps.length - 1}`;
    back.disabled = selected === 0; next.disabled = selected === result.steps.length - 1;
    host.querySelector("[data-sr-state]")!.innerHTML = `<div class="sr-readout"><strong>${step.operations.length ? step.operations.map(o => `${o.id}: ${o.kind === "prefill" ? "prefill" : "decode"} ${o.tokens}`).join("; ") : "No model work is scheduled"}</strong><p>${step.operations.reduce((n, o) => n + o.tokens, 0)} / ${config.budget} new positions; ${step.peakBlocks} / ${config.blocks} block credits at execution; ${step.heldBlocks} held afterward.</p></div>
      <div class="sr-scroll" tabindex="0" aria-label="Per-request state; scroll horizontally if needed"><table><caption>State after this iteration</caption><thead><tr><th>Request</th><th>Phase</th><th>Cached positions</th><th>Outputs emitted</th><th>Held blocks</th></tr></thead><tbody>${step.states.map(s => `<tr><th scope="row">${s.id}</th><td>${s.arrival > selected ? "not arrived" : s.status}</td><td>${s.cached}</td><td>${s.generated} / ${s.outputs}</td><td>${s.allocated}</td></tr>`).join("")}</tbody></table></div>
      <p class="sr-events">${step.events.length ? step.events.join(". ") + "." : "No arrivals, releases or waiting requests in this iteration."}</p>`;
    host.querySelector("[data-sr-schedule]")!.innerHTML = `<table><caption>Complete computed schedule · P = prefill positions, D = one decode input</caption><thead><tr><th>Request / iteration</th>${result.steps.map(s => `<th class="${s.iteration === selected ? "sr-current" : ""}">${s.iteration}</th>`).join("")}</tr></thead><tbody>${cohort.map(request => `<tr><th scope="row">${request.id}</th>${result.steps.map(s => { const op = s.operations.find(o => o.id === request.id); return `<td class="${s.iteration === selected ? "sr-current " : ""}${op ? `sr-${op.kind}` : ""}">${op ? `${op.kind === "prefill" ? "P" : "D"}${op.tokens}` : "—"}</td>`; }).join("")}</tr>`).join("")}</tbody></table>`;
    host.querySelector("[data-sr-outcome]")!.textContent = result.stalled
      ? "This policy is stuck: no runnable request can acquire its next blocks. The model stops here because it implements no eviction or recomputation."
      : `Final state: ${result.states.filter(s => s.status === "complete").length} complete, ${result.states.filter(s => s.status === "cancelled").length} cancelled, ${result.states.filter(s => s.status === "rejected").length} rejected. Iteration count is not elapsed time.`;
  };
  back.addEventListener("click", () => { selected--; render(); });
  next.addEventListener("click", () => { selected++; render(); });
  host.querySelector("[data-sr-reset]")!.addEventListener("click", () => { selected = 0; render(); });
  host.addEventListener("change", () => { selected = 0; render(); });
  render();
}

export function initializeServingRuntimeLabs() {
  schedulerLab(document.querySelector<HTMLElement>("#scheduler-iteration-lab")!, false);
  schedulerLab(document.querySelector<HTMLElement>("#kv-admission-lab")!, true);
  const arrival = document.querySelector<HTMLElement>("#arrival-pressure-lab")!;
  const renderArrival = () => {
    const service = number(arrival, "[data-sr-service]"), interval = number(arrival, "[data-sr-interval]");
    const mode = choose(arrival, "[data-sr-arrival-mode]") as "open" | "closed";
    const rows = arrivalTrace(8, interval, service, mode), end = rows.at(-1)!.finish;
    arrival.querySelector("[data-sr-arrivals]")!.innerHTML = `<div class="sr-readout"><strong>${mode === "open" ? `${fmt(1000 / interval)} scheduled arrivals/s` : `${fmt(1000 / service)} requests/s from this one closed-loop client`}</strong><p>Service capacity ${fmt(1000 / service)} requests/s. Last request waits ${fmt(rows.at(-1)!.wait)} ms; its response takes ${fmt(rows.at(-1)!.latency)} ms. All eight finish at ${fmt(end)} ms.</p></div>
      <div class="sr-scroll" tabindex="0" aria-label="Arrival and service trace; scroll horizontally if needed"><table><caption>One server, FIFO, no batching or rejection · all times in ms</caption><thead><tr><th>Request</th><th>Arrival</th><th>Wait</th><th>Start</th><th>Finish</th><th>Response</th><th>Timeline</th></tr></thead><tbody>${rows.map(r => `<tr><th scope="row">${r.id + 1}</th><td>${fmt(r.arrival)}</td><td>${fmt(r.wait)}</td><td>${fmt(r.start)}</td><td>${fmt(r.finish)}</td><td>${fmt(r.latency)}</td><td><div class="sr-arrival-track"><i class="sr-wait" style="left:${100 * r.arrival / end}%;width:${100 * r.wait / end}%"></i><i class="sr-service" style="left:${100 * r.start / end}%;width:${100 * service / end}%"></i></div></td></tr>`).join("")}</tbody></table></div><p class="sr-events">Gray = waiting; blue = service. Timeline scale: 0–${fmt(end)} ms. These are assumed durations, not an engine benchmark.</p>`;
  };
  arrival.addEventListener("change", renderArrival); renderArrival();
  const delivery = document.querySelector<HTMLElement>("#delivery-metrics-lab")!;
  const renderDelivery = () => {
    const traces: DeliveryTrace[] = [
      { id: "A", arrival: 0, sent: 20, tokens: [100, 120, 140, 160, 180, 200], end: 250, status: "complete" },
      { id: "B", arrival: 0, sent: 0, tokens: choose(delivery, "[data-sr-buffer]") === "yes" ? [180, 184, 188, 192, 196, 200] : [100, 105, 110, 115, 120, 200], end: 250, status: "complete" },
      { id: "C", arrival: 0, sent: 0, tokens: [100], end: 130, status: "complete" },
      { id: "D", arrival: 0, sent: 0, tokens: [90, 120], end: 140, status: "failed" },
    ];
    const objective = { ttftMs: number(delivery, "[data-sr-ttft]"), maxGapMs: number(delivery, "[data-sr-gap]"), completionMs: 300 };
    const result = goodputReport(traces, objective, 0, 1000);
    const ms = (n: number | null) => n === null ? "N/A" : fmt(n);
    delivery.querySelector("[data-sr-metrics]")!.innerHTML = `<div class="sr-readout"><strong>${fmt(result.goodput)} compliant requests/s; ${fmt(100 * result.attainment!)}% of offered attempts meet the full objective</strong><p>${result.completed} successful, ${result.failed} failed, ${result.cancelled} cancelled in the fixed 0–1,000 ms observation window. Completion throughput: ${fmt(result.throughput)} requests/s.</p></div>
      <div class="sr-scroll" tabindex="0" aria-label="Per-request delivery metrics; scroll horizontally if needed"><table><caption>Client token receipt timestamps · metrics in ms</caption><thead><tr><th>Request</th><th>TTFT</th><th>TPOT</th><th>Worst gap</th><th>Terminal completion</th><th>Result</th></tr></thead><tbody>${traces.map(t => { const m = deliveryMetrics(t, objective); return `<tr><th scope="row">${t.id}</th><td>${ms(m.ttft)}</td><td>${ms(m.tpot)}</td><td>${ms(m.maxGap)}</td><td>${fmt(m.completion)}</td><td>${t.status !== "complete" ? t.status : m.compliant ? "meets all" : "misses objective"}</td></tr>`; }).join("")}</tbody></table></div>
      <div class="sr-token-traces">${traces.map(t => `<p><strong>${t.id}</strong><span>${t.tokens.map(fmt).join(" → ")} ms; ${t.status} at ${t.end} ms</span></p>`).join("")}</div>`;
  };
  delivery.addEventListener("change", renderDelivery); renderDelivery();
}
