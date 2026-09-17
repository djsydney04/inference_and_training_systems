import { matvec, meanSquaredError, quantizeGroupedWeights, quantizeScalar } from "./quantization-math";

const concise = (value: number) => Number(value.toPrecision(5)).toString();
const weights = [[0.49, 1.04, 0.11, 4.2], [-0.31, 0.77, -0.52, -3.6]];
const inputs: Record<string, number[]> = { balanced: [1, 1, 1, 1], first: [8, 0.1, 0.1, 0.1], last: [0.1, 0.1, 0.1, 8] };

export function initializeQuantizationLabs() {
  const scalar = document.getElementById("quantization-scale-lab");
  if (scalar && !scalar.dataset.initialized) {
    scalar.dataset.initialized = "true";
    const find = <T extends HTMLElement>(selector: string) => scalar.querySelector<T>(selector)!;
    const samples = [-0.75, -0.25, 0, 0.25, 0.75, 3];
    const render = () => {
      const bits = Number(find<HTMLSelectElement>("[data-quant-bits]").value);
      const qmax = 2 ** bits - 1, scale = Number(find<HTMLInputElement>("[data-quant-scale]").value) / 100;
      const zero = find<HTMLInputElement>("[data-quant-zero]");
      zero.max = String(qmax); zero.value = String(Math.min(qmax, Number(zero.value)));
      const zeroPoint = Number(zero.value), mode = find<HTMLSelectElement>("[data-quant-frequency]").value;
      const counts = samples.map((_, i) => mode === "central" ? (i === 5 ? 1 : 20) : mode === "outlier" ? (i === 5 ? 20 : 1) : 1);
      const values = samples.map(value => quantizeScalar(value, {scale, zeroPoint, qmin: 0, qmax}));
      const low = -scale * zeroPoint, high = scale * (qmax - zeroPoint);
      const observed = counts.reduce((sum, value) => sum + value, 0);
      const mse = values.reduce((sum, value, i) => sum + counts[i] * value.error ** 2, 0) / observed;
      const clipped = values.reduce((sum, value, i) => sum + (value.clipped ? counts[i] : 0), 0);
      find<HTMLOutputElement>("[data-quant-scale-value]").value = `${scale.toFixed(2)} units/code`;
      find<HTMLOutputElement>("[data-quant-zero-value]").value = `code ${zeroPoint} represents 0`;
      find("[data-quant-result]").textContent = `${bits} bits provide ${qmax + 1} unsigned codes. Reconstructed range: ${concise(low)} to ${concise(high)}. Weighted MSE: ${concise(mse)}; ${clipped} of ${observed} observations lie outside that range. Non-clipped rounding error is at most ${concise(scale / 2)} units.`;
      const minimum = Math.min(low, ...samples) - 0.2, maximum = Math.max(high, ...samples) + 0.2;
      const px = (value: number) => 125 + 530 * (value - minimum) / (maximum - minimum);
      find("[data-quant-chart]").innerHTML = `<svg viewBox="0 0 690 282" role="img" aria-label="Each row connects an original input to its reconstructed value. Full values and errors follow in the table."><text x="12" y="27">Stored code q</text><text x="12" y="49">Decoded value</text>${Array.from({length: qmax + 1}, (_, code) => {const value = scale * (code - zeroPoint); return `<line x1="${px(value)}" x2="${px(value)}" y1="60" y2="243" class="quant-grid"/><text x="${px(value)}" y="27" text-anchor="middle">${code}</text><text x="${px(value)}" y="49" text-anchor="middle" class="quant-small">${concise(value)}</text>`;}).join("")}${samples.map((value, i) => { const y = 83 + i * 29; return `<text x="12" y="${y + 4}">x = ${value}</text><line x1="${px(value)}" y1="${y}" x2="${px(values[i].reconstructed)}" y2="${y}" class="${values[i].clipped ? "quant-clipped" : "quant-error"}"/><circle cx="${px(value)}" cy="${y}" r="5" class="quant-original"/><circle cx="${px(values[i].reconstructed)}" cy="${y}" r="3" class="quant-reconstructed"/>`; }).join("")}<circle cx="17" cy="266" r="5" class="quant-original"/><text x="30" y="270">Original input</text><circle cx="210" cy="266" r="3" class="quant-reconstructed"/><text x="222" y="270">Reconstructed</text><line x1="415" x2="440" y1="266" y2="266" class="quant-clipped"/><text x="449" y="270">Outside range</text></svg>`;
      find("[data-quant-values]").innerHTML = `<table><caption>Rounding occurs on x / s before adding z; error is reconstructed minus original.</caption><thead><tr><th scope="col">Input x</th><th scope="col">Count</th><th scope="col">Code q</th><th scope="col">Decoded x̂</th><th scope="col">Error</th><th scope="col">Range</th></tr></thead><tbody>${values.map((value, i) => `<tr><th scope="row">${samples[i]}</th><td>${counts[i]}</td><td>${value.code}</td><td>${concise(value.reconstructed)}</td><td>${concise(value.error)}</td><td>${value.clipped ? "Clipped" : "Inside"}</td></tr>`).join("")}</tbody></table>`;
    };
    scalar.querySelectorAll("input").forEach(input => input.addEventListener("input", render));
    scalar.querySelectorAll("select").forEach(select => select.addEventListener("change", render));
    render();
  }

  const matrix = document.getElementById("quantization-matrix-lab");
  if (matrix && !matrix.dataset.initialized) {
    matrix.dataset.initialized = "true";
    const find = <T extends HTMLElement>(selector: string) => matrix.querySelector<T>(selector)!;
    const render = () => {
      const bits = Number(find<HTMLSelectElement>("[data-weight-bits]").value), group = Number(find<HTMLSelectElement>("[data-weight-group]").value);
      const factor = Number(find<HTMLInputElement>("[data-weight-factor]").value), x = inputs[find<HTMLSelectElement>("[data-weight-input]").value];
      const result = quantizeGroupedWeights(weights, bits, group, [factor, 1, 1, 1]);
      const baseline = matvec(weights, x), approximate = matvec(result.reconstructed, x);
      find<HTMLOutputElement>("[data-weight-factor-value]").value = `${factor}× weight column 1; input 1 ÷ ${factor}`;
      find("[data-weight-result]").textContent = `Input x = [${x.join(", ")}]. Weight MSE in original coordinates: ${concise(meanSquaredError(weights.flat(), result.reconstructed.flat()))}; output MSE for this input: ${concise(meanSquaredError(baseline, approximate))}. ${result.scales.flat().length} groups: ${result.payloadBytes} payload bytes + ${result.scaleBytes} scale bytes in the illustrative FP32-scale storage estimate, before layout and alignment.`;
      find("[data-weight-matrix]").innerHTML = `<table class="quant-weight-matrix"><caption>W[output,input] · each cell shows original weight, stored integer code, then reconstructed effective weight after undoing channel scaling. Vertical borders separate groups.</caption><thead><tr><th scope="col">Output</th>${[1, 2, 3, 4].map(i => `<th scope="col">Input ${i}</th>`).join("")}</tr></thead><tbody>${weights.map((row, i) => `<tr><th scope="row">${i + 1}</th>${row.map((value, j) => `<td class="${j % group === 0 ? "quant-group-start" : ""}"><span>${value}</span><strong>q = ${result.codes[i][j]}</strong><span>→ ${concise(result.reconstructed[i][j])}</span></td>`).join("")}</tr>`).join("")}</tbody></table><p class="quant-scale-list">${result.scales.map((row, i) => `Output ${i + 1} group scales: [${row.map(concise).join(", ")}]`).join("<br>")}</p>`;
      find("[data-weight-output]").innerHTML = `<table><caption>Dot products with the same input; bias omitted.</caption><thead><tr><th scope="col">Output</th><th scope="col">Reference Wx</th><th scope="col">Quantized Ŵx</th><th scope="col">Difference</th></tr></thead><tbody>${baseline.map((value, i) => `<tr><th scope="row">${i + 1}</th><td>${concise(value)}</td><td>${concise(approximate[i])}</td><td>${concise(approximate[i] - value)}</td></tr>`).join("")}</tbody></table><p class="quant-dot-product">Output 1: ${result.reconstructed[0].map((value, j) => `(${concise(value)} × ${x[j]})`).join(" + ")} = ${concise(approximate[0])}</p>`;
    };
    matrix.querySelectorAll("select").forEach(select => select.addEventListener("change", render));
    matrix.querySelector("input")!.addEventListener("input", render); render();
  }
}
