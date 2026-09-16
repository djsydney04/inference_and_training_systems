import { projectionStep } from "./foundations-math";

export function initializeFoundationsLabs() {
  const lab = document.querySelector<HTMLElement>("[data-first-update]");
  if (!lab) return;
  const initial = [[0.5, -0.2], [0.1, 0.3], [-0.4, 0.2]];
  let weights = initial.map((row) => [...row]), updates = 0;
  const target = lab.querySelector<HTMLSelectElement>("[data-first-target]")!;
  const rate = lab.querySelector<HTMLSelectElement>("[data-first-rate]")!;
  const labels = ["cat", "sat", "ran"];
  const render = () => {
    const result = projectionStep(weights, [1, 2], +target.value, +rate.value);
    lab.querySelector("[data-first-bars]")!.innerHTML = `<svg viewBox="0 0 640 215" role="img" aria-label="Next-token probabilities: ${labels.map((t, i) => `${t} ${(result.probabilities[i]*100).toFixed(1)} percent`).join(", ")}"><path d="M95 30v140h500" fill="none" stroke="#59625b"/>${result.probabilities.map((p, i) => `<text x="78" y="${58+i*48}" text-anchor="end">${labels[i]}</text><rect x="96" y="${36+i*48}" width="${p*420}" height="30" fill="${i === +target.value ? "#2559d6" : "#87978a"}"/><text x="${110+p*420}" y="${57+i*48}">${(p*100).toFixed(1)}%</text>`).join("")}<text x="96" y="202">${updates} updates · loss ${result.loss.toFixed(5)} nats</text></svg>`;
    lab.querySelector("[data-first-table]")!.innerHTML = `<table><caption>Features x = [1, 2]; rows of W correspond to candidate tokens</caption><thead><tr><th>Token</th><th>Weights</th><th>Logit</th><th>Probability</th><th>∂L/∂W row</th></tr></thead><tbody>${labels.map((t,i) => `<tr><th scope="row">${t}${i===+target.value ? " (target)" : ""}</th><td>[${weights[i].map(x=>x.toFixed(3)).join(", ")}]</td><td>${result.logits[i].toFixed(3)}</td><td>${result.probabilities[i].toFixed(4)}</td><td>[${result.gradient[i].map(x=>x.toFixed(3)).join(", ")}]</td></tr>`).join("")}</tbody></table>`;
    lab.querySelector("[data-first-status]")!.textContent = `After ${updates} updates, probability of “${labels[+target.value]}” is ${(result.probabilities[+target.value]*100).toFixed(1)}%; loss ${result.loss.toFixed(5)} nats. The table shows the gradient for the next update.`;
  };
  lab.querySelector("[data-first-step]")!.addEventListener("click", () => {
    weights = projectionStep(weights, [1, 2], +target.value, +rate.value).nextWeights;
    updates++; render();
  });
  lab.querySelector("[data-first-reset]")!.addEventListener("click", () => { weights=initial.map(r=>[...r]); updates=0; render(); });
  target.addEventListener("change", render); rate.addEventListener("change", render); render();
}
