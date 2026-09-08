import { trainingTrace } from "./trace-math";
export function initializeSystemsLabs() {
  const comm = document.querySelector<HTMLInputElement>(
    "[data-trace-communication]",
  )!;
  const overlap = document.querySelector<HTMLInputElement>(
    "[data-trace-overlap]",
  )!;
  const write = (selector: string, text: string) => {
    document.querySelector(selector)!.textContent = text;
  };
  const render = () => {
    const t = trainingTrace(Number(comm.value), Number(overlap.value));
    const extent = 22;
    const bar = (start: number, duration: number, label: string) =>
      `<div class="trace-bar" style="left:${(100 * start) / extent}%;width:${(100 * duration) / extent}%" title="${label}: ${start}–${start + duration} ms">${label}</div>`;
    document.querySelector("[data-critical-trace]")!.innerHTML =
      `<div class="trace-axis"><span>0 ms</span><span>11 ms</span><span>22 ms</span></div><div class="trace-lane"><span>Input / host</span><div>${bar(0, 2, "Input")}</div></div><div class="trace-lane"><span>GPU compute</span><div>${bar(2, 8, "Compute")}</div></div><div class="trace-lane"><span>Collective</span><div>${bar(t.communicationStart, t.communication, "Comm")}</div></div><p class="trace-conclusion">Update ready at <strong>${t.step} ms</strong>. ${t.overlapped} ms of communication is overlapped; ${t.exposed} ms remains exposed.</p>`;
    write("[data-trace-communication-value]", `${comm.value} ms`);
    write("[data-trace-overlap-value]", `${overlap.value} ms`);
    write("[data-trace-step]", `${t.step} ms`);
    write("[data-trace-exposed]", `${t.exposed} ms`);
    write("[data-trace-speedup]", `${t.speedup.toFixed(2)}×`);
  };
  comm.addEventListener("input", render);
  overlap.addEventListener("input", render);
  render();
}
