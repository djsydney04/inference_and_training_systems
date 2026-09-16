import { residency, transferEstimate } from "./accelerator-math";
export function initializeAcceleratorLabs() {
  const host = document.getElementById("accelerator-capacity-lab");
  if (!host) return;
  const read = (name: string) => Number(host.querySelector<HTMLSelectElement>(`[data-capacity-${name}]`)!.value);
  const render = () => {
    const r = residency({ parameters: 70e9, bitsPerWeight: read("bits"), blockElements: 32,
      scaleBytes: read("bits") < 16 ? 1 : 0, capacityGiB: read("memory"), reservedGiB: 8,
      layers: 80, kvHeads: 8, headDimension: 128, context: read("context"), kvBytes: read("kv"), batch: read("batch") });
    const gib = (bytes: number) => (bytes / 2 ** 30).toFixed(2);
    host.querySelector("[data-capacity-result]")!.innerHTML = `<strong>${r.fits ? "Fits the declared budget" : "Exceeds the declared budget"}</strong><p>${gib(r.usedBytes)} GiB required / ${gib(r.capacityBytes)} GiB capacity. ${r.maxSequences} sequences fit after weights and the fixed reserve.</p>`;
    host.querySelector("[data-capacity-bars]")!.innerHTML = [
      ["Weights + scales", r.weightBytes], ["KV state", r.kvTotal], ["Runtime reserve", r.reservedBytes],
    ].map(([label, bytes]) => `<div><span>${label}</span><meter aria-label="${label}" aria-valuetext="${gib(Number(bytes))} GiB" min="0" max="${Math.max(r.usedBytes, r.capacityBytes)}" value="${bytes}">${gib(Number(bytes))} GiB</meter><strong>${gib(Number(bytes))} GiB</strong></div>`).join("");
    const transfer = transferEstimate(r.kvPerSequence, 400, 0.7);
    host.querySelector("[data-capacity-transfer]")!.textContent = `One sequence holds ${gib(r.kvPerSequence)} GiB of KV state. Its payload alone takes ${(transfer.seconds * 1000).toFixed(1)} ms over a 400 Gb/s link at 70% useful bandwidth; no allocation, packing or queue delay is included.`;
  };
  host.querySelectorAll("select").forEach((element) => element.addEventListener("change", render));
  render();
}
