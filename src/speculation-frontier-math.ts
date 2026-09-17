/** Topologically ordered speculative nodes. null means a child of the committed prefix. */
export function draftTreeLayout(parents: readonly (number | null)[], prefixLength: number) {
  if (!Number.isSafeInteger(prefixLength) || prefixLength < 1 || prefixLength > 1_000_000)
    throw new Error("Prefix length must be an integer from 1 to 1,000,000");
  if (parents.length < 1 || parents.length > 256) throw new Error("Use 1 to 256 draft nodes");
  const paths: number[][] = [];
  for (let i = 0; i < parents.length; i++) {
    const parent = parents[i];
    if (parent !== null && (!Number.isInteger(parent) || parent < 0 || parent >= i))
      throw new Error("Every parent must precede its child");
    paths.push(parent === null ? [i] : [...paths[parent], i]);
  }
  return {
    paths,
    depths: paths.map(path => path.length),
    // Siblings share a logical position, but each owns a distinct provisional slot.
    positions: paths.map(path => prefixLength + path.length - 1),
    storageSlots: parents.map((_, index) => prefixLength + index),
    // All prefix keys are visible too; this matrix contains only draft columns.
    mask: paths.map(path => parents.map((_, index) => path.includes(index))),
  };
}

/** Gather only the selected ancestry. A correction/bonus without KV is intentionally absent. */
export function committedTreeSlots(parents: readonly (number | null)[], prefixLength: number, leaf: number) {
  const tree = draftTreeLayout(parents, prefixLength);
  if (!Number.isInteger(leaf) || leaf < 0 || leaf >= parents.length) throw new Error("Invalid selected node");
  return tree.paths[leaf].map(index => tree.storageSlots[index]);
}

/** alpha[k] is conditional on all earlier proposals being accepted; independence is unnecessary. */
export function acceptanceSurvival(conditionalAcceptance: readonly number[]) {
  if (conditionalAcceptance.length > 64 || conditionalAcceptance.some(a => !Number.isFinite(a) || a < 0 || a > 1))
    throw new Error("Use up to 64 conditional probabilities between zero and one");
  let survival = 1;
  return conditionalAcceptance.map(alpha => (survival *= alpha));
}

export interface SpeculationTiming {
  draftMs: number;
  verifyMs: number;
  overheadMs: number;
}

/** Compare measured or hypothetical timings for each depth with one common acceptance curve. */
export function compareSpeculationDepths(
  conditionalAcceptance: readonly number[], timings: readonly SpeculationTiming[], baselineMs: number,
) {
  const survival = acceptanceSurvival(conditionalAcceptance);
  if (!Number.isFinite(baselineMs) || baselineMs <= 0 || timings.length !== survival.length)
    throw new Error("Supply a positive baseline and one timing per proposal depth");
  let expectedTokens = 1;
  return timings.map((timing, index) => {
    if (![timing.draftMs, timing.verifyMs, timing.overheadMs].every(Number.isFinite)
      || timing.draftMs < 0 || timing.verifyMs <= 0 || timing.overheadMs < 0)
      throw new Error("Invalid draft, verification or bookkeeping time");
    expectedTokens += survival[index];
    const roundMs = timing.draftMs + timing.verifyMs + timing.overheadMs;
    return {
      depth: index + 1, survival: survival[index], expectedTokens, roundMs,
      msPerToken: roundMs / expectedTokens,
      ratio: baselineMs * expectedTokens / roundMs,
    };
  });
}

/** Exact empirical survival from complete, uncensored rounds: histogram[a] counts A=a. */
export function survivalFromHistogram(histogram: readonly number[]) {
  if (histogram.length < 2 || histogram.length > 65
    || histogram.some(count => !Number.isSafeInteger(count) || count < 0))
    throw new Error("Supply counts for every accepted length, including zero");
  const rounds = histogram.reduce((sum, count) => sum + count, 0);
  if (!Number.isSafeInteger(rounds) || rounds === 0) throw new Error("At least one counted round is required");
  let remaining = rounds;
  return histogram.slice(0, -1).map(count => (remaining -= count) / rounds);
}
