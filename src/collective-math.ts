export type Chunk = { values: number[]; contributors: number[] };
export type RingTransfer = {
  from: number;
  to: number;
  chunk: number;
  values: number[];
  contributors: number[];
};
const mod = (a: number, n: number) => ((a % n) + n) % n;
export function ringInputs(ranks: number, chunkSize = 2) {
  if (
    !Number.isInteger(ranks) ||
    ranks < 2 ||
    ranks > 8 ||
    !Number.isInteger(chunkSize) ||
    chunkSize < 1 ||
    chunkSize > 8
  )
    throw new Error("Use 2–8 ranks and 1–8 values per chunk");
  return Array.from({ length: ranks }, (_, r) =>
    Array.from({ length: ranks }, (_, c) =>
      Array.from(
        { length: chunkSize },
        (_, i) => r * ranks * chunkSize + c * chunkSize + i + 1,
      ),
    ),
  );
}
/** Synchronous logical ring: reduce-scatter, then all-gather. No transport timing. */
export function ringFrame(ranks: number, step: number, chunkSize = 2) {
  const input = ringInputs(ranks, chunkSize),
    totalSteps = 2 * (ranks - 1);
  if (!Number.isInteger(step) || step < 0 || step > totalSteps)
    throw new Error("Invalid collective step");
  const buffers: Chunk[][] = input.map((rank, r) =>
    rank.map((values) => ({ values: [...values], contributors: [r] })),
  );
  let transfers: RingTransfer[] = [];
  for (let tick = 0; tick < step; tick++) {
    const reduce = tick < ranks - 1,
      local = reduce ? tick : tick - (ranks - 1);
    transfers = Array.from({ length: ranks }, (_, r) => {
      const chunk = mod(reduce ? r - local : r - local + 1, ranks),
        value = buffers[r][chunk];
      return {
        from: r,
        to: mod(r + 1, ranks),
        chunk,
        values: [...value.values],
        contributors: [...value.contributors],
      };
    });
    // Snapshot all sends before applying receives: no within-step causal shortcut.
    for (const transfer of transfers) {
      const dest = buffers[transfer.to][transfer.chunk];
      if (reduce) {
        if (transfer.contributors.some((r) => dest.contributors.includes(r)))
          throw new Error("Contribution counted twice");
        dest.values = dest.values.map((v, i) => v + transfer.values[i]);
        dest.contributors = [
          ...dest.contributors,
          ...transfer.contributors,
        ].sort((a, b) => a - b);
      } else {
        if (transfer.contributors.length !== ranks)
          throw new Error("All-gather sent an incomplete reduction");
        dest.values = [...transfer.values];
        dest.contributors = [...transfer.contributors];
      }
    }
  }
  const expected = Array.from({ length: ranks }, (_, c) =>
    Array.from({ length: chunkSize }, (_, i) =>
      input.reduce((s, rank) => s + rank[c][i], 0),
    ),
  );
  return {
    input,
    buffers,
    transfers,
    expected,
    totalSteps,
    step,
    phase:
      step === 0
        ? "start"
        : step <= ranks - 1
          ? "reduce-scatter"
          : "all-gather",
    bytesPerRank: step * chunkSize * 4,
    fullVectorBytes: ranks * chunkSize * 4,
    allRanksSentBytes: step * ranks * chunkSize * 4,
    complete: step === totalSteps,
  };
}
export function ringTime(
  ranks: number,
  payloadBytes: number,
  linkBytesPerSecond: number,
  stepLatencySeconds: number,
) {
  if (
    !Number.isInteger(ranks) ||
    ranks < 2 ||
    ![payloadBytes, linkBytesPerSecond, stepLatencySeconds].every(
      Number.isFinite,
    ) ||
    payloadBytes <= 0 ||
    linkBytesPerSecond <= 0 ||
    stepLatencySeconds < 0
  )
    throw new Error("Invalid ring cost inputs");
  const sentBytes = ((2 * (ranks - 1)) / ranks) * payloadBytes;
  return {
    sentBytes,
    seconds:
      2 * (ranks - 1) * stepLatencySeconds + sentBytes / linkBytesPerSecond,
  };
}
