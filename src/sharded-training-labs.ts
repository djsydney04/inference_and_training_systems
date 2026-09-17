import { prefetchPass, reducedGradientShards, shardedMemoryTrace } from "./sharded-training-math";
import type { ShardedMemoryPoint } from "./sharded-training-math";

const MiB = 2 ** 20;
const memoryKinds: { key: keyof Pick<ShardedMemoryPoint, "parameterShards" | "optimizerShards" | "fullWeights" | "fullGradient" | "gradientShards" | "activations">; label: string; color: string }[] = [
  { key: "parameterShards", label: "Original weight shards", color: "#334657" },
  { key: "optimizerShards", label: "Adam moment shards", color: "#627888" },
  { key: "gradientShards", label: "Reduced gradient shards", color: "#806445" },
  { key: "fullWeights", label: "Gathered compute weights", color: "#27649a" },
  { key: "fullGradient", label: "Full gradient input", color: "#b14d2c" },
  { key: "activations", label: "Saved activations", color: "#4d8063" },
];

export function initializeShardedTrainingLabs() {
  const memory = document.getElementById("sharded-memory-lab");
  if (memory) {
    const get = (name: string) => memory.querySelector<HTMLSelectElement>(`[data-sharded-${name}]`)!.value;
    const phaseControl = memory.querySelector<HTMLInputElement>("[data-sharded-phase]")!;
    const render = () => {
      const result = shardedMemoryTrace({ groups: 4, parametersPerGroup: 2 ** 25, ranks: Number(get("ranks")),
        activationBytesPerGroup: 32 * MiB, reshardAfterForward: get("reshard") === "yes", prefetch: get("prefetch") === "yes" });
      phaseControl.max = String(result.points.length - 1);
      const selected = Math.min(Number(phaseControl.value), result.points.length - 1);
      const point = result.points[selected];
      memory.querySelector("[data-sharded-summary]")!.innerHTML = `<strong>Persistent: ${(result.persistentBytes / MiB).toFixed(0)} MiB · peak: ${(result.peakBytes / MiB).toFixed(0)} MiB per rank</strong><p>Peak phases: ${result.peakIndices.map((i) => result.points[i].phase).join(", ")}. Gradient shards, gathered weights and activations are additional live allocations.</p>`;
      memory.querySelector("[data-sharded-phase-name]")!.textContent = point.phase;
      phaseControl.setAttribute("aria-valuetext", `${point.phase}, ${(point.total / MiB).toFixed(0)} MiB`);
      memory.querySelector("[data-sharded-phase-result]")!.innerHTML = `<strong>${point.phase}: ${(point.total / MiB).toFixed(0)} MiB live</strong><p>${point.detail}</p><p>Materialized groups: ${point.materializedGroups.map((i) => `L${i}`).join(", ") || "none"}. Reduced-gradient groups: ${point.reducedGroups.map((i) => `L${i}`).join(", ") || "none"}.</p>`;
      const baseline = 247, plotHeight = 202, step = 47;
      const bars = result.points.map((p, index) => {
        let height = 0;
        const rects = memoryKinds.map(({ key, color }) => {
          const h = p[key] / result.peakBytes * plotHeight;
          const rect = `<rect x="${65 + index * step}" y="${baseline - height - h}" width="33" height="${h}" fill="${color}"/>`;
          height += h;
          return rect;
        }).join("");
        return `<g><title>${p.phase}: ${(p.total / MiB).toFixed(0)} MiB</title>${rects}${index === selected ? `<rect x="${62 + index * step}" y="${baseline - height - 3}" width="39" height="${height + 6}" fill="none" stroke="currentColor" stroke-width="2"/>` : ""}<text x="${81.5 + index * step}" y="271" text-anchor="middle">${p.phase}</text></g>`;
      }).join("");
      memory.querySelector("[data-sharded-memory-chart]")!.innerHTML = `<svg class="sharded-memory-chart" viewBox="0 0 840 292" role="img" aria-labelledby="sharded-memory-title sharded-memory-desc"><title id="sharded-memory-title">Live memory by training phase</title><desc id="sharded-memory-desc">${result.points.length} phase samples, peak ${(result.peakBytes / MiB).toFixed(0)} MiB per rank. Use the phase slider and ledger for exact component values.</desc><text x="10" y="22">MiB / rank</text>${[0, 0.5, 1].map((fraction) => `<path d="M59 ${baseline - fraction * plotHeight}H824" stroke="currentColor" opacity="0.16"/><text x="52" y="${baseline - fraction * plotHeight + 4}" text-anchor="end">${(result.peakBytes / MiB * fraction).toFixed(0)}</text>`).join("")}${bars}</svg>`;
      memory.querySelector("[data-sharded-ledger]")!.innerHTML = `<table><caption>Live allocations at ${point.phase}; payload MiB per rank</caption><thead><tr><th scope="col">Allocation</th><th scope="col">MiB</th><th scope="col">Lifetime</th></tr></thead><tbody>${memoryKinds.map(({ key, label, color }) => `<tr><th scope="row"><span class="sharded-swatch" style="background:${color}" aria-hidden="true"></span>${label}</th><td>${(point[key] / MiB).toFixed(0)}</td><td>${key === "parameterShards" || key === "optimizerShards" ? "Across updates" : key === "gradientShards" ? "Reduction through update" : "Current phase dependencies"}</td></tr>`).join("")}</tbody></table>`;
    };
    memory.querySelectorAll("select").forEach((element) => element.addEventListener("change", render));
    phaseControl.addEventListener("input", render);
    render();
  }
  const prefetch = document.getElementById("sharded-prefetch-lab");
  if (prefetch) {
    const get = (name: string) => prefetch.querySelector<HTMLSelectElement>(`[data-prefetch-${name}]`)!.value;
    const render = () => {
      const gather = Number(get("gather")), compute = Number(get("compute"));
      const result = prefetchPass(4, gather, compute, get("enabled") === "yes");
      const serial = prefetchPass(4, gather, compute, false);
      prefetch.querySelector("[data-prefetch-result]")!.innerHTML = `<strong>${result.elapsedMs} ms total · ${result.exposedGatherMs} ms exposed gathering</strong><p>Without overlap: ${serial.elapsedMs} ms. Compute itself totals ${4 * compute} ms. All times are declared scheduling inputs.</p>`;
      const x = (ms: number) => 154 + ms / result.elapsedMs * 646;
      const bar = (start: number, end: number, y: number, color: string, label: string) => `<rect x="${x(start)}" y="${y}" width="${x(end) - x(start)}" height="37" fill="${color}"/><text class="sharded-inverse" x="${(x(start) + x(end)) / 2}" y="${y + 23}" text-anchor="middle">${label}</text>`;
      prefetch.querySelector("[data-prefetch-chart]")!.innerHTML = `<svg class="sharded-prefetch-chart" viewBox="0 0 840 205" role="img" aria-labelledby="sharded-prefetch-title sharded-prefetch-desc"><title id="sharded-prefetch-title">All-gather and compute overlap timeline</title><desc id="sharded-prefetch-desc">${result.elapsedMs} invented milliseconds; ${result.exposedGatherMs} milliseconds on the dependency path spent waiting for gathers.</desc><text x="12" y="66">All-gather lane</text><text x="12" y="123">Compute lane</text>${result.jobs.map((j) => `<g><title>L${j.group}: gather ${j.gatherStart}–${j.gatherEnd} ms; compute ${j.computeStart}–${j.computeEnd} ms</title>${bar(j.gatherStart, j.gatherEnd, 42, "#27649a", `AG${j.group}`)}${bar(j.computeStart, j.computeEnd, 100, "#334657", `F${j.group}`)}</g>`).join("")}<path d="M154 153H800" stroke="currentColor" opacity=".25"/>${[0, .25, .5, .75, 1].map((i) => `<text x="${x(i * result.elapsedMs)}" y="179" text-anchor="middle">${(i * result.elapsedMs).toFixed(1)} ms</text>`).join("")}</svg>`;
    };
    prefetch.querySelectorAll("select").forEach((element) => element.addEventListener("change", render));
    render();
  }
  const update = document.getElementById("sharded-update-lab");
  if (update) {
    const render = () => {
      const owners = Number(update.querySelector<HTMLSelectElement>("[data-update-owners]")!.value);
      const rate = Number(update.querySelector<HTMLSelectElement>("[data-update-rate]")!.value);
      const result = reducedGradientShards([[1, 0, 0, 0], [0, 2, 3, 4]], [1, 3], owners);
      const weights = [1, 2, 3, 4].map((w, i) => w - rate * result.gradient[i]);
      const colors = ["#27649a", "#806445", "#4d8063", "#725991"];
      const row = (values: number[], y: number, label: string, owned = false) => `<text x="12" y="${y + 27}">${label}</text>${values.map((value, i) => `<rect x="${228 + i * 140}" y="${y}" width="127" height="42" fill="${owned ? colors[Math.floor(i / (4 / owners))] : "#edf0f2"}"/><text ${owned ? 'class="sharded-inverse"' : ""} x="${291.5 + i * 140}" y="${y + 27}" text-anchor="middle">${value.toFixed(owned ? 3 : 0)}</text>`).join("")}`;
      update.querySelector("[data-update-chart]")!.innerHTML = `<svg class="sharded-update-chart" viewBox="0 0 840 302" role="img" aria-labelledby="sharded-update-title sharded-update-desc"><title id="sharded-update-title">Gradient contribution and owner matrix</title><desc id="sharded-update-desc">Rank zero contributes 1,0,0,0; rank one contributes 0,2,3,4. Divide their sum by four examples to obtain 0.25,0.5,0.75,1, then distribute coordinates among ${owners} update owners.</desc>${[0, 1, 2, 3].map((i) => `<text x="${291.5 + i * 140}" y="25" text-anchor="middle">coordinate ${i}</text>`).join("")}${row([1, 0, 0, 0], 43, "Rank 0 · 1 example")}${row([0, 2, 3, 4], 99, "Rank 1 · 3 examples")}${row(result.gradient, 167, "Global mean gradient", true)}${row(weights, 225, "After local SGD update", true)}</svg>`;
      update.querySelector("[data-update-result]")!.innerHTML = `<strong>Updated weights: [${weights.map((w) => w.toFixed(3)).join(", ")}]</strong><p>${owners} owner${owners > 1 ? "s" : ""}; each coordinate updated once using its globally normalized gradient.</p>`;
      update.querySelector("[data-update-table]")!.innerHTML = `<table><caption>Update ownership after reducing the same four-coordinate gradient</caption><thead><tr><th scope="col">Owner</th><th scope="col">Coordinates</th><th scope="col">Gradient shard</th><th scope="col">Updated weights</th></tr></thead><tbody>${result.shards.map((shard, rank) => `<tr><th scope="row"><span class="sharded-swatch" style="background:${colors[rank]}" aria-hidden="true"></span>Rank ${rank}</th><td>[${rank * 4 / owners}, ${(rank + 1) * 4 / owners})</td><td>${shard.map((v) => v.toFixed(3)).join(", ")}</td><td>${weights.slice(rank * 4 / owners, (rank + 1) * 4 / owners).map((v) => v.toFixed(3)).join(", ")}</td></tr>`).join("")}</tbody></table>`;
    };
    update.querySelectorAll("select").forEach((element) => element.addEventListener("change", render));
    render();
  }
}
