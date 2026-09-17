import { kvTransferBudget, handoffTiming, pdCapacity } from "./disaggregation-math";

const n = (value: number, digits = 2) => value.toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: digits });
const read = (root: Element, selector: string) => Number(root.querySelector<HTMLInputElement | HTMLSelectElement>(selector)!.value);

export function initializeDisaggregationLabs() {
  const transfer = document.querySelector<HTMLElement>("#pd-transfer-lab");
  if (!transfer) return;
  const renderTransfer = () => {
    const tokens = read(transfer, "[data-pd-tokens]");
    const budget = kvTransferBudget({ layers: 32, kvHeads: read(transfer, "[data-pd-heads]"), headDim: 128,
      bytesPerElement: 2, tokens, cachedTokens: tokens * read(transfer, "[data-pd-cached]"), blockTokens: 16,
      linkGBps: read(transfer, "[data-pd-bandwidth]"), setupMs: 2, overlapMs: read(transfer, "[data-pd-overlap]") });
    const timing = handoffTiming({ prefillQueueMs: 10, prefillMs: 400, exposedTransferMs: budget.exposedMs,
      decodeQueueMs: 30, decodeMs: 20, outputTokens: 101,
      emitFromPrefill: transfer.querySelector<HTMLSelectElement>("[data-pd-emission]")!.value === "early" });
    transfer.querySelector("[data-pd-transfer-results]")!.innerHTML = `<dl class="pd-metrics">
      <div><dt>Wire payload</dt><dd>${n(budget.wireBytes / 2 ** 20)} MiB</dd></div>
      <div><dt>Exposed handoff</dt><dd>${n(budget.exposedMs)} ms</dd></div>
      <div><dt>First token · TTFT</dt><dd>${n(timing.firstTokenMs)} ms</dd></div>
      <div><dt>First → second gap</dt><dd>${n(timing.firstGapMs)} ms</dd></div>
      <div><dt>Average TPOT</dt><dd>${n(timing.tpotMs)} ms</dd></div>
      <div><dt>Answer complete</dt><dd>${n(timing.lastTokenMs)} ms</dd></div></dl>
      <p>${n(budget.bytesPerToken / 1024, 0)} KiB per position; ${n(budget.missingTokens, 0)} positions to move.
      Payload time ${n(budget.payloadMs)} ms, hidden allowance ${n(budget.hiddenMs)} ms; serial overhead remains 2 ms.</p>`;
    transfer.querySelector("[data-pd-transfer-timeline]")!.innerHTML = `<div class="pd-timing-heading"><strong>Through the second token</strong><span>0–${n(timing.secondTokenMs)} ms</span></div>` +
      timing.segments.map((segment, i) => `<div class="pd-timing-row"><span>${segment.label}</span><div class="pd-timing-track"><i class="pd-phase-${i}" style="left:${100 * segment.start / timing.secondTokenMs}%;width:${100 * segment.duration / timing.secondTokenMs}%"></i></div><span>${n(segment.duration)} ms</span></div>`).join("");
  };
  transfer.addEventListener("change", renderTransfer); renderTransfer();

  const stages = [
    ["Reserve and identify", "The destination reserves four token slots and checks the request attempt, weights, layout and prefix.", "Pinned", "Reserved, unreadable", "Not scheduled"],
    ["Receive positions 2–3", "A later range arrives first. Positions 0–1 are still missing. Receiving this range cannot publish the cache.", "Pinned", "2 / 4 positions received", "Not scheduled"],
    ["Receive positions 0–1", "All four positions are present. The receiving engine still establishes device-visible completion before allowing a read.", "Pinned", "4 / 4 received; not published", "Not scheduled"],
    ["Publish readiness", "D can now consume the pending first output token at position 4. The prompt cache itself still contains exactly four positions.", "Pinned until acknowledgement", "4 positions ready", "May consume y₀"],
    ["Acknowledge and release", "P may release its transfer reservation for this attempt. Any independent prefix-cache reference can continue to retain the source blocks.", "Transfer pin released", "Receiver owns its copy", "Generates y₁; adds position-4 KV"],
  ];
  const state = document.querySelector<HTMLElement>("[data-pd-handoff-state]")!;
  const host = state.closest("figure")!;
  const back = host.querySelector<HTMLButtonElement>("[data-pd-handoff-back]")!;
  const next = host.querySelector<HTMLButtonElement>("[data-pd-handoff-next]")!;
  let step = 0;
  const renderHandoff = () => {
    const [title, description, source, destination, decode] = stages[step];
    state.innerHTML = `<p class="pd-event">Event ${step + 1} of ${stages.length}</p><strong class="pd-state-title">${title}</strong><p>${description}</p><dl class="pd-metrics"><div><dt>Source buffers</dt><dd>${source}</dd></div><div><dt>Destination state</dt><dd>${destination}</dd></div><div><dt>Decoder</dt><dd>${decode}</dd></div></dl>`;
    back.disabled = step === 0; next.disabled = step === stages.length - 1;
  };
  back.addEventListener("click", () => { step = Math.max(0, step - 1); renderHandoff(); });
  next.addEventListener("click", () => { step = Math.min(stages.length - 1, step + 1); renderHandoff(); });
  host.querySelector("[data-pd-handoff-reset]")!.addEventListener("click", () => { step = 0; renderHandoff(); });
  renderHandoff();

  const capacity = document.querySelector<HTMLElement>("#pd-capacity-lab")!;
  const renderCapacity = () => {
    const prefillWorkers = read(capacity, "[data-pd-p-workers]"), decodeWorkers = read(capacity, "[data-pd-d-workers]");
    const arrivals = read(capacity, "[data-pd-arrivals]");
    capacity.querySelector("[data-pd-p-value]")!.textContent = String(prefillWorkers);
    capacity.querySelector("[data-pd-d-value]")!.textContent = String(decodeWorkers);
    capacity.querySelector("[data-pd-arrivals-value]")!.textContent = String(arrivals);
    const result = pdCapacity({ prefillWorkers, decodeWorkers, arrivalsPerSecond: arrivals, promptTokens: 8000,
      outputTokens: 401, prefillTokensPerSecond: 40000, decodeTokensPerSecond: 1600,
      transferBytes: 1e9, linkGBps: read(capacity, "[data-pd-capacity-link]") });
    capacity.querySelector("[data-pd-capacity-results]")!.innerHTML = `<div class="method-table"><table><caption>Required work relative to each stage's capacity</caption><thead><tr><th scope="col">Stage</th><th scope="col">Capacity</th><th scope="col">Offered load / capacity</th></tr></thead><tbody>${result.stages.map(stage => `<tr><th scope="row">${stage.label}${stage.limiting ? " · limiting" : ""}</th><td>${n(stage.capacity)} requests/s</td><td>${n(stage.utilization * 100, 1)}%</td></tr>`).join("")}</tbody></table></div><p class="pd-capacity-summary"><strong>${n(result.limit)} requests/s capacity bound.</strong> ${result.hasHeadroom ? "This average-rate screen has headroom; burst and tail-latency constraints still need measurement." : result.backlogPerSecond > 0 ? `Without rejection, unfinished work grows by at least ${n(result.backlogPerSecond)} requests/s under these assumptions.` : "Arrival rate equals the bound: there is no margin for service variability."}</p>`;
  };
  capacity.addEventListener("input", renderCapacity); capacity.addEventListener("change", renderCapacity); renderCapacity();
}
