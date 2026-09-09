import { initialOptimizerState, optimizerStep, quadraticLoss, type OptimizerKind, type OptimizerState } from "./optimizer-math";

export function initializeMethodLabs() {
  const host = document.getElementById("optimizer-lab");
  if (!host) return;
  const find = <T extends Element = HTMLElement>(selector: string) => host.querySelector<T>(selector)!;
  let history: OptimizerState[] = [initialOptimizerState()];
  const fmt = (v: number) => v.toFixed(5), vector = (v: number[]) => `(${v.map(fmt).join(", ")})`;
  const render = () => {
    const state = history.at(-1)!;
    const points = history.map(({ weight: [x,y] }) => `${280 + x*90},${160 - y*90}`).join(" ");
    find("[data-optimizer-plot]").innerHTML = `<svg viewBox="0 0 580 330" role="img" aria-label="Optimizer trajectory on a two-dimensional quadratic. Exact coordinates are in the update history."><path d="M30 160H550M280 25V305" stroke="#c8ccc0"/>${[.5,1,1.5,2,2.5].map(r=>`<ellipse cx="280" cy="160" rx="${r*90}" ry="${r*90/Math.sqrt(12)}" fill="none" stroke="#d5d9cd"/>`).join("")}<polyline points="${points}" stroke="#2559d6" stroke-width="2" fill="none"/>${history.map(({weight:[x,y]},i)=>`<circle cx="${280+x*90}" cy="${160-y*90}" r="${i===history.length-1?6:2.5}" fill="#2559d6"/>`).join("")}<circle cx="280" cy="160" r="4" fill="#242925"/><text x="290" y="181">optimum</text><text x="543" y="151">x</text><text x="290" y="28">y</text><text x="30" y="319">Equal-loss contours / both axes use the same scale</text></svg>`;
    find("[data-optimizer-state]").innerHTML = `<span>Update ${state.step} / 20</span><h4>Loss ${fmt(quadraticLoss(state.weight))}</h4><dl><div><dt>Parameters (x,y)</dt><dd>${vector(state.weight)}</dd></div><div><dt>Direction buffer / first moment</dt><dd>${vector(state.first)}</dd></div><div><dt>Second moment</dt><dd>${vector(state.second)}</dd></div></dl>`;
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
  render();
}
