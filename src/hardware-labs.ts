import { occupancy, teachingSM } from "./resource-math";
import { ringFrame } from "./collective-math";

let step = 0,
  rank = 0,
  renderRing = () => {};
export const getRingState = () => ({ rank, frame: ringFrame(4, step) });
export type RingState = ReturnType<typeof getRingState>;
export function selectRingRank(next: number) {
  if (!Number.isInteger(next) || next < 0 || next > 3) return;
  rank = next;
  renderRing();
}
export function initializeHardwareLabs() {
  const host = document.getElementById("occupancy-lab");
  if (host) {
    const threads =
      host.querySelector<HTMLSelectElement>("[data-occ-threads]")!;
    const regs = host.querySelector<HTMLSelectElement>("[data-occ-registers]")!;
    const shared = host.querySelector<HTMLSelectElement>("[data-occ-shared]")!;
    const render = () => {
      const f = occupancy(+threads.value, +regs.value, +shared.value * 1024);
      host.querySelector("[data-occ-result]")!.innerHTML =
        `<strong>${(f.occupancy * 100).toFixed(1)}% occupancy</strong><span>${f.blocks} resident blocks · ${f.warps} / 64 warps · limited by ${f.boundBy.join(" + ")}${!f.blocks ? " · launch cannot fit" : ""}</span>`;
      const grid = host.querySelector("[data-occ-warp-grid]")!;
      grid.setAttribute(
        "aria-label",
        `${f.warps} resident warp slots out of 64; ${f.blocks} blocks`,
      );
      grid.innerHTML = Array.from(
        { length: 64 },
        (_, i) =>
          `<span class="${i < f.warps ? "is-resident" : ""}" style="--warp-tone:${Math.floor(i / f.warpsPerBlock) % 2}" title="Warp slot ${i}: ${i < f.warps ? `block ${Math.floor(i / f.warpsPerBlock)}` : "not resident"}">${i < f.warps ? Math.floor(i / f.warpsPerBlock) : "·"}</span>`,
      ).join("");
      const rows = [
        [
          "Registers",
          `${f.registersPerBlock.toLocaleString()} per block`,
          `${f.usedRegisters.toLocaleString()} / ${teachingSM.registers.toLocaleString()}`,
          f.limits.registers,
        ],
        [
          "Shared memory",
          `${f.sharedPerBlock / 1024} KiB per block`,
          `${f.usedShared / 1024} / 100 KiB`,
          Number.isFinite(f.limits.shared) ? f.limits.shared : "no use",
        ],
        [
          "Threads",
          `${threads.value} per block`,
          `${f.blocks * +threads.value} / 2,048`,
          f.limits.threads,
        ],
        [
          "Block slots",
          "1 slot per block",
          `${f.blocks} / 32`,
          f.limits.blocks,
        ],
      ];
      host.querySelector("[data-occ-table]")!.innerHTML =
        `<table><caption>Independent resource limits; the smallest block limit wins</caption><thead><tr><th scope="col">Resource</th><th scope="col">Allocation</th><th scope="col">Resident use</th><th scope="col">Blocks allowed</th></tr></thead><tbody>${rows.map((r) => `<tr>${r.map((v, i) => (i ? `<td>${v}</td>` : `<th scope="row">${v}</th>`)).join("")}</tr>`).join("")}</tbody></table>`;
    };
    [threads, regs, shared].forEach((el) =>
      el.addEventListener("change", render),
    );
    render();
  }
  const ring = document.getElementById("ring-workbench");
  if (!ring) return;
  const find = <T extends Element = HTMLElement>(s: string) =>
    ring.querySelector<T>(s)!;
  renderRing = () => {
    const state = getRingState(),
      f = state.frame;
    const received = f.transfers.find((t) => t.to === rank),
      sent = f.transfers.find((t) => t.from === rank);
    const complete = f.buffers[rank].filter(
      (c) => c.contributors.length === 4,
    ).length;
    find<HTMLSelectElement>("[data-ring-rank]").value = String(rank);
    find<HTMLButtonElement>("[data-ring-back]").disabled = step === 0;
    find<HTMLButtonElement>("[data-ring-next]").disabled =
      step === f.totalSteps;
    const title =
      step === 0
        ? "Local contributions only"
        : f.complete
          ? "All ranks have the complete sum"
          : step === 3
            ? "Reduced shards have owners"
            : f.phase === "reduce-scatter"
              ? "Add the arriving contribution"
              : "Copy a complete reduced chunk";
    find("#ring-inspector").innerHTML =
      `<span>Step ${step} / ${f.totalSteps} · ${f.phase}</span><h3>Rank ${rank}</h3><p>${title}.</p>${received ? `<div class="matmul-arithmetic"><span>Last receive from rank ${received.from}</span><code>chunk ${received.chunk}: [${received.values.join(", ")}]</code><span>Contributors: ${received.contributors.join(", ")}</span></div><p>Rank ${rank} ${f.phase === "reduce-scatter" ? "adds this payload to" : "replaces the old partial value with"} its chunk ${received.chunk}. Result: <code>[${f.buffers[rank][received.chunk].values.join(", ")}]</code>.</p>` : "<p>Chunk values begin with this rank's own input. No messages have been sent.</p>"}<dl><div><dt>Complete reduced chunks</dt><dd>${complete} / 4</dd></div><div><dt>Last send</dt><dd>${sent ? `chunk ${sent.chunk} → rank ${sent.to}` : "none"}</dd></div><div><dt>Sent payload / rank</dt><dd>${f.bytesPerRank} bytes</dd></div><div><dt>Sent payload / whole ring</dt><dd>${f.allRanksSentBytes} bytes</dd></div></dl>`;
    find("[data-ring-table]").innerHTML =
      `<table class="ring-buffer-table"><caption>Buffers after step ${step}. Each cell lists values, then contributing ranks.</caption><thead><tr><th scope="col">Owner</th>${[0, 1, 2, 3].map((c) => `<th scope="col">Chunk ${c}</th>`).join("")}</tr></thead><tbody>${f.buffers.map((chunks, r) => `<tr class="${r === rank ? "is-selected" : ""}"><th scope="row">Rank ${r}</th>${chunks.map((c) => `<td class="${c.contributors.length === 4 ? "is-complete" : ""}"><code>[${c.values.join(", ")}]</code><small>from ${c.contributors.join(" + ")}</small></td>`).join("")}</tr>`).join("")}</tbody></table>`;
    document.dispatchEvent(
      new CustomEvent<RingState>("atlas:ringchange", { detail: state }),
    );
  };
  find("[data-ring-next]").addEventListener("click", () => {
    step = Math.min(6, step + 1);
    renderRing();
  });
  find("[data-ring-back]").addEventListener("click", () => {
    step = Math.max(0, step - 1);
    renderRing();
  });
  find("[data-ring-reset]").addEventListener("click", () => {
    step = 0;
    renderRing();
  });
  find<HTMLSelectElement>("[data-ring-rank]").addEventListener("change", (e) =>
    selectRingRank(+(e.target as HTMLSelectElement).value),
  );
  renderRing();
}
