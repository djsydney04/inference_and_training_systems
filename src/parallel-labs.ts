import {
  pipelineSchedule,
  parallelGroups,
  type PipelineMethod,
} from "./pipeline-math";
export function initializeParallelLabs() {
  const host = document.getElementById("pipeline-lab");
  if (!host) return;
  const find = <T extends Element = HTMLElement>(s: string) =>
    host.querySelector<T>(s)!;
  const method = find<HTMLSelectElement>("[data-pipe-method]"),
    stages = find<HTMLSelectElement>("[data-pipe-stages]"),
    micro = find<HTMLSelectElement>("[data-pipe-microbatches]"),
    selected = find<HTMLSelectElement>("[data-pipe-selected]"),
    time = find<HTMLInputElement>("[data-pipe-time]");
  let tick = 0,
    highlight = 0;
  const render = () => {
    const f = pipelineSchedule(
      +stages.value,
      +micro.value,
      method.value as PipelineMethod,
    );
    tick = Math.min(tick, f.ticks);
    highlight = Math.min(highlight, f.microbatches - 1);
    selected.innerHTML = Array.from(
      { length: f.microbatches },
      (_, i) =>
        `<option value="${i}" ${i === highlight ? "selected" : ""}>${i}</option>`,
    ).join("");
    time.max = String(f.ticks);
    time.value = String(tick);
    find("[data-pipe-progress]").textContent = `${tick} / ${f.ticks}`;
    find<HTMLButtonElement>("[data-pipe-next]").disabled = tick === f.ticks;
    const pitch = 32,
      row = 51,
      left = 78,
      top = 34,
      width = left + pitch * f.ticks + 15,
      height = top + f.stages * row + 47;
    const svg = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Pipeline execution timeline. A numerical schedule table follows.">${Array.from({ length: f.ticks + 1 }, (_, t) => `<text x="${left + t * pitch}" y="20" text-anchor="middle">${t}</text>`).join("")}${Array.from({ length: f.stages }, (_, r) => `<text x="4" y="${top + r * row + 25}">Stage ${r}</text><path d="M${left} ${top + r * row + 42}h${pitch * f.ticks}" stroke="#d3d9ce"/>`).join("")}${f.operations.map((o) => `<g opacity="${o.end <= tick ? 1 : 0.27}"><rect x="${left + o.start * pitch + 2}" y="${top + o.stage * row}" width="${pitch - 4}" height="37" fill="${o.kind === "F" ? "#2559d6" : "#61745f"}" ${o.microbatch === highlight ? 'stroke="#222a22" stroke-width="2"' : ""}/><text x="${left + (o.start + 0.5) * pitch}" y="${top + o.stage * row + 15}" text-anchor="middle" fill="white">${o.kind}</text><text x="${left + (o.start + 0.5) * pitch}" y="${top + o.stage * row + 29}" text-anchor="middle" fill="white">${o.microbatch}</text></g>`).join("")}<path d="M${left + tick * pitch} ${top - 5}v${f.stages * row}" stroke="#202a22" stroke-width="2"/><text x="${left}" y="${height - 10}">Future operations are faded · outlined cells belong to microbatch ${highlight}</text></svg>`;
    find("[data-pipe-chart]").innerHTML = svg;
    find("[data-pipe-result]").innerHTML =
      `<p><strong>${f.ticks} time units</strong><span>${(f.bubbleFraction * 100).toFixed(2)}% idle stage-slots · ${f.busy} useful / ${f.slots} allocated</span></p><div>${f.liveHistory[tick].map((count, r) => `<span>Stage ${r}<strong>${count} live</strong><small>peak ${f.peak[r]}</small></span>`).join("")}</div>`;
    find("[data-pipe-table]").innerHTML =
      `<details><summary>Numerical schedule for microbatch ${highlight}</summary><table><caption>Each operation occupies [start, end); bundles release after backward.</caption><thead><tr><th scope="col">Stage</th><th scope="col">Forward</th><th scope="col">Backward</th><th scope="col">Saved-state interval</th></tr></thead><tbody>${Array.from(
        { length: f.stages },
        (_, r) => {
          const forward = f.operations.find(
              (o) =>
                o.stage === r && o.microbatch === highlight && o.kind === "F",
            )!,
            backward = f.operations.find(
              (o) =>
                o.stage === r && o.microbatch === highlight && o.kind === "B",
            )!;
          return `<tr><th scope="row">${r}</th><td>${forward.start} → ${forward.end}</td><td>${backward.start} → ${backward.end}</td><td>${forward.end} → ${backward.end}</td></tr>`;
        },
      ).join("")}</tbody></table></details>`;
  };
  [method, stages, micro].forEach((el) =>
    el.addEventListener("change", () => {
      tick = 0;
      render();
    }),
  );
  selected.addEventListener("change", () => {
    highlight = +selected.value;
    render();
  });
  time.addEventListener("input", () => {
    tick = +time.value;
    render();
  });
  find("[data-pipe-next]").addEventListener("click", () => {
    tick++;
    render();
  });
  find("[data-pipe-reset]").addEventListener("click", () => {
    tick = 0;
    render();
  });
  render();
  const grid = parallelGroups(2, 2, 2);
  document.querySelector("[data-parallel-groups]")!.innerHTML =
    `<table><caption>Eight logical ranks; no physical-placement assumption</caption><thead><tr><th scope="col">Group kind</th><th scope="col">Member sets</th><th scope="col">Shared contract</th></tr></thead><tbody>${[
      ["Tensor", grid.tensor, "one layer operation"],
      ["Pipeline", grid.pipeline, "one model replica through depth"],
      ["Data", grid.data, "same parameter shard, distinct data"],
    ]
      .map(
        ([label, groups, meaning]) =>
          `<tr><th scope="row">${label}</th><td><code>${(groups as number[][]).map((g) => `[${g.join(", ")}]`).join(" ")}</code></td><td>${meaning}</td></tr>`,
      )
      .join("")}</tbody></table>`;
}
