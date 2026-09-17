import { frameworkTiming } from "./framework-timing-math";

export function initializeFrameworkTimingLab() {
  const host = document.querySelector<HTMLElement>("#framework-timing-lab");
  if (!host) return;
  const number = (selector: string) => Number(host.querySelector<HTMLSelectElement>(selector)!.value);
  const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 4 });
  const render = () => {
    const config = { iterations: number("[data-ft-count]"), preparationMs: number("[data-ft-cold]"), priorDeviceMs: number("[data-ft-prior]"), launchMs: number("[data-ft-launch]"), kernelMs: 4 };
    const trace = frameworkTiming(config);
    host.querySelector("[data-ft-result]")!.innerHTML = `<span>Same work, different boundaries</span><p><strong>${fmt(trace.hostReturnMs)} ms</strong> until the host loop returns; <strong>${fmt(trace.completeMs)} ms</strong> until all results are ready.</p><p>${fmt(trace.amortizedMs)} ms per call amortized; first result at ${fmt(trace.firstResultMs)} ms. New device service totals ${fmt(trace.serviceMs)} ms.</p>`;
    const bar = (start: number, duration: number, kind: string) => `<i class="fw-time-${kind}" style="left:${100 * start / trace.completeMs}%;width:${100 * duration / trace.completeMs}%"></i>`;
    host.querySelector("[data-ft-table]")!.innerHTML = `<table><caption>All times in ms; each timeline spans 0–${fmt(trace.completeMs)} ms</caption><thead><tr><th>Call</th><th>Host return</th><th>Device start</th><th>Result ready</th><th>Timeline</th></tr></thead><tbody>${trace.calls.map(call => `<tr><th scope="row">${call.index + 1}</th><td>${fmt(call.enqueued)}</td><td>${fmt(call.start)}</td><td>${fmt(call.finish)}</td><td><div class="fw-time-track" aria-hidden="true">${bar(call.launchStart, config.launchMs, "host")}${bar(call.start, config.kernelMs, "device")}</div></td></tr>`).join("")}</tbody></table><p class="fw-time-note">${config.preparationMs ? `Host preparation occupies 0–${config.preparationMs} ms. ` : ""}${config.priorDeviceMs ? `Earlier device work occupies 0–${config.priorDeviceMs} ms. ` : ""}Preparation and earlier work are outside the per-call bars.</p>`;
  };
  host.addEventListener("change", render);
  render();
}
