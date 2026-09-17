import { policyRatio, rolloutSchedule } from "./rollout-training-math";

export function initializeRolloutTrainingLabs() {
  const timelineHost = document.getElementById("rollout-schedule-lab");
  if (timelineHost) {
    const read = (name: string) => Number(timelineHost.querySelector<HTMLSelectElement>(`[data-rollout-${name}]`)!.value);
    const render = () => {
      const input = { batches: 6, prefillSeconds: 1, decodeSeconds: 6, rewardSeconds: 1,
        trainSeconds: read("train"), publishSeconds: 1, decodeSpeedup: read("speed"), maxLag: read("lag") };
      const result = rolloutSchedule(input);
      const original = rolloutSchedule({ ...input, decodeSpeedup: 1 });
      const fmt = (n: number) => n.toFixed(1);
      timelineHost.querySelector("[data-rollout-result]")!.innerHTML = `<strong>${fmt(result.elapsed)} seconds for six updates</strong><p>Synchronous with these stage times: ${fmt(result.synchronousSeconds)} seconds (${result.overlapSpeedup.toFixed(2)}× from overlap). Maximum observed lag: ${result.maxObservedLag}.</p>${input.decodeSpeedup === 1 ? "" : `<p>With the same lag setting, decode acceleration changes ${fmt(original.elapsed)} to ${fmt(result.elapsed)} seconds: ${(original.elapsed / result.elapsed).toFixed(2)}×.</p>`}<p>Actor lane busy ${(100 * result.actorUtilization).toFixed(0)}% · learner/publication lane busy ${(100 * result.learnerUtilization).toFixed(0)}%. Scheduled occupancy, not measured GPU utilization.</p>`;
      const x = (time: number) => 120 + time / result.elapsed * 688;
      const bar = (start: number, end: number, y: number, kind: string, label: string) => `<g><rect class="rollout-${kind}" x="${x(start)}" y="${y}" width="${Math.max(0, x(end) - x(start))}" height="36"><title>${label}: ${fmt(start)}–${fmt(end)} seconds</title></rect>${x(end) - x(start) > 35 ? `<text class="rollout-bar-label" x="${(x(start) + x(end)) / 2}" y="${y + 22}" text-anchor="middle">${label}</text>` : ""}</g>`;
      const ticks = Array.from({ length: 5 }, (_, i) => {
        const time = result.elapsed * i / 4;
        return `<path d="M${x(time)} 39V168" stroke="currentColor" opacity="0.15"/><text x="${x(time)}" y="190" text-anchor="middle">${fmt(time)}s</text>`;
      }).join("");
      timelineHost.querySelector("[data-rollout-timeline]")!.innerHTML = `<svg class="rollout-timeline" viewBox="0 0 840 214" role="img" aria-labelledby="rollout-timeline-title rollout-timeline-desc"><title id="rollout-timeline-title">Six-group actor and learner timeline</title><desc id="rollout-timeline-desc">${fmt(result.elapsed)} seconds total. Maximum lag ${result.maxObservedLag}. The expandable timestamp table gives exact phase boundaries and policy versions for every group.</desc>${ticks}<text x="12" y="69">Actor + reward</text><text x="12" y="129">Learner + publish</text>${result.batches.map((b) => bar(b.actorStart, b.actorEnd, 47, "actor", `G${b.batch} v${b.behaviorVersion}`) + bar(b.learnerStart, b.trainEnd, 107, "learner", `U${b.batch}`) + bar(b.trainEnd, b.publishEnd, 107, "publish", `v${b.batch + 1}`)).join("")}</svg>`;
      timelineHost.querySelector("[data-rollout-table]")!.innerHTML = `<table><caption>Exact timestamps in seconds for this schedule</caption><thead><tr><th scope="col">Group</th><th scope="col">Behavior version</th><th scope="col">Generate + score</th><th scope="col">Train</th><th scope="col">Publish</th><th scope="col">Lag</th></tr></thead><tbody>${result.batches.map((b) => `<tr><th scope="row">G${b.batch}</th><td>v${b.behaviorVersion}</td><td>${fmt(b.actorStart)}–${fmt(b.actorEnd)}</td><td>${fmt(b.learnerStart)}–${fmt(b.trainEnd)}</td><td>${fmt(b.trainEnd)}–${fmt(b.publishEnd)}</td><td>${b.lag}</td></tr>`).join("")}</tbody></table>`;
    };
    timelineHost.querySelectorAll("select").forEach((input) => input.addEventListener("change", render));
    render();
  }
  const ratioHost = document.getElementById("rollout-ratio-lab");
  if (ratioHost) {
    const read = (name: string) => Number(ratioHost.querySelector<HTMLSelectElement>(`[data-ratio-${name}]`)!.value);
    const render = () => {
      const r = policyRatio(read("behavior"), read("current"), read("advantage"), 0.2);
      ratioHost.querySelector("[data-ratio-result]")!.innerHTML = `<strong>Ratio ${r.ratio.toFixed(3)} · clipped surrogate ${r.objective.toFixed(3)}</strong><p>log π − log μ = ${r.logRatio.toFixed(3)}. Unclipped rA = ${r.raw.toFixed(3)}; clipped candidate = ${r.clipped.toFixed(3)}. The smaller contribution is ${r.objective.toFixed(3)}. ${r.raw > r.clipped ? "Clipping limits this incentive to move farther in the advantage's direction." : "The unclipped term determines this contribution, even if the ratio lies outside the clip interval."}</p>`;
    };
    ratioHost.querySelectorAll("select").forEach((input) => input.addEventListener("change", render));
    render();
  }
}
