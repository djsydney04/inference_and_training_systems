import { initialOptimizerState, optimizerStep, quadraticLoss, type OptimizerKind, type OptimizerState } from "./optimizer-math";
import { optimizerLandscape, optimizerLossChart } from "./optimizer-diagram";

export function initializeMethodLabs() {
  const host = document.getElementById("optimizer-lab");
  if (!host) return;
  const find = <T extends Element = HTMLElement>(selector: string) => host.querySelector<T>(selector)!;
  let history: OptimizerState[] = [initialOptimizerState()];
  const fmt = (v: number) => v.toFixed(5), vector = (v: number[]) => `(${v.map(fmt).join(", ")})`;
  const landscape = find<HTMLElement>("[data-optimizer-plot]"), lossChart = find<HTMLElement>("[data-optimizer-loss]");
  const renderCharts = () => {
    if (!landscape.clientWidth || !lossChart.clientWidth) return;
    landscape.innerHTML = optimizerLandscape(history, landscape.clientWidth);
    lossChart.innerHTML = optimizerLossChart(history, lossChart.clientWidth);
  };
  const render = () => {
    const state = history.at(-1)!;
    renderCharts();
    find("[data-optimizer-state]").innerHTML = `<div><span>Update</span><strong>${state.step} / 20</strong></div><div><span>Loss</span><strong>${fmt(quadraticLoss(state.weight))}</strong></div><div><span>Parameters (x, y)</span><strong class="optimizer-coordinates">${vector(state.weight)}</strong></div>`;
    find("[data-optimizer-moments]").innerHTML = `<div><dt>Direction buffer / first moment</dt><dd>${vector(state.first)}</dd></div><div><dt>Second moment</dt><dd>${vector(state.second)}</dd></div>`;
    find<HTMLButtonElement>("[data-optimizer-next]").disabled = state.step >= 20;
    find("[data-optimizer-history]").innerHTML = `<table><caption>Optimizer states after each update</caption><thead><tr><th scope="col">Step</th><th scope="col">x</th><th scope="col">y</th><th scope="col">Loss</th></tr></thead><tbody>${history.map(s=>`<tr><th scope="row">${s.step}</th><td>${fmt(s.weight[0])}</td><td>${fmt(s.weight[1])}</td><td>${fmt(quadraticLoss(s.weight))}</td></tr>`).join("")}</tbody></table>`;
  };
  const reset = () => { history = [initialOptimizerState()]; render(); };
  host.querySelectorAll("select").forEach(el => el.addEventListener("change", reset));
  find("[data-optimizer-reset]").addEventListener("click", reset);
  find("[data-optimizer-next]").addEventListener("click", () => {
    if (history.length > 20) return;
    history.push(optimizerStep(history.at(-1)!, find<HTMLSelectElement>("[data-optimizer-kind]").value as OptimizerKind,
      Number(find<HTMLSelectElement>("[data-optimizer-rate]").value), Number(find<HTMLSelectElement>("[data-optimizer-decay]").value)));
    render();
  });
  let chartWidths = "";
  const resize = new ResizeObserver(() => {
    const widths = `${landscape.clientWidth}:${lossChart.clientWidth}`;
    if (widths === chartWidths) return;
    chartWidths = widths;
    requestAnimationFrame(renderCharts);
  });
  resize.observe(landscape);
  resize.observe(lossChart);
  render();
}
