/** Explicit logical storage, not PyTorch allocator telemetry. */
const positiveInteger = (n: number, name: string) => {
  if (!Number.isSafeInteger(n) || n <= 0) throw new RangeError(`${name} must be a positive safe integer`);
};
const nonnegative = (n: number, name: string) => {
  if (!Number.isFinite(n) || n < 0) throw new RangeError(`${name} must be finite and nonnegative`);
};

export interface ShardedMemoryInput {
  groups: number;
  parametersPerGroup: number;
  ranks: number;
  activationBytesPerGroup: number;
  reshardAfterForward: boolean;
  prefetch: boolean;
}
export interface ShardedMemoryPoint {
  phase: string;
  detail: string;
  parameterShards: number;
  optimizerShards: number;
  fullWeights: number;
  fullGradient: number;
  gradientShards: number;
  activations: number;
  materializedGroups: number[];
  reducedGroups: number[];
  total: number;
}

/**
 * FP32 persistent weights and Adam moments, BF16 gathered compute weights,
 * FP32 gradients. An entire group's gradient buffer is counted while its saved
 * activations and full weights remain live; reduce-scatter adds a separate
 * output shard, then frees the input. This is a declared conservative ordering.
 * Snapshots describe live bytes by phase; they are not a measured time axis.
 */
export function shardedMemoryTrace(input: ShardedMemoryInput) {
  positiveInteger(input.groups, "groups");
  positiveInteger(input.parametersPerGroup, "parametersPerGroup");
  positiveInteger(input.ranks, "ranks");
  nonnegative(input.activationBytesPerGroup, "activationBytesPerGroup");
  if (input.groups > 64 || input.ranks > input.parametersPerGroup || input.parametersPerGroup % input.ranks !== 0)
    throw new RangeError("use at most 64 equal groups, each evenly divisible among ranks");
  const parameters = input.groups * input.parametersPerGroup;
  if (!Number.isSafeInteger(parameters * 32)) throw new RangeError("byte totals exceed exact integer range");
  const parameterShards = parameters * 4 / input.ranks;
  const optimizerShards = parameters * 8 / input.ranks;
  const fullWeights = new Set<number>();
  const activations = new Set<number>();
  const reduced = new Set<number>();
  const points: ShardedMemoryPoint[] = [];
  const sample = (phase: string, detail: string, gradient = false) => {
    const point = {
      phase, detail, parameterShards, optimizerShards,
      fullWeights: fullWeights.size * input.parametersPerGroup * 2,
      fullGradient: gradient ? input.parametersPerGroup * 4 : 0,
      gradientShards: reduced.size * input.parametersPerGroup * 4 / input.ranks,
      activations: activations.size * input.activationBytesPerGroup,
      materializedGroups: [...fullWeights].sort((a, b) => a - b),
      reducedGroups: [...reduced].sort((a, b) => a - b),
      total: 0,
    };
    point.total = point.parameterShards + point.optimizerShards + point.fullWeights
      + point.fullGradient + point.gradientShards + point.activations;
    points.push(point);
  };
  sample("Start", "Only original weight shards and initialized Adam moments are resident.");
  for (let group = 0; group < input.groups; group++) {
    fullWeights.add(group);
    if (input.prefetch && group + 1 < input.groups) fullWeights.add(group + 1);
    activations.add(group);
    sample(`F${group}`, `Forward group ${group}: saved activations and gathered compute weights coexist.`);
    if (input.reshardAfterForward) fullWeights.delete(group);
  }
  sample("F done", input.reshardAfterForward ? "Gathered weights released; saved activations remain for backward."
    : "Gathered weights retained through the forward/backward boundary.");
  for (let group = input.groups - 1; group >= 0; group--) {
    fullWeights.add(group);
    if (input.prefetch && group > 0) fullWeights.add(group - 1);
    sample(`B${group}`, `Backward group ${group}: count its full gradient before releasing its weights and activations.`, true);
    fullWeights.delete(group);
    activations.delete(group);
    reduced.add(group);
    sample(`RS${group}`, `Reduce-scatter group ${group}: full input gradient and owned output shard coexist.`, true);
  }
  sample("Update", "All reduced gradient shards are available; each owner updates its original weights and Adam moments.");
  reduced.clear();
  sample("Cleared", "Gradient storage released for the next step; allocator reservations may remain higher.");
  const peak = Math.max(...points.map((p) => p.total));
  return { points, persistentBytes: parameterShards + optimizerShards, peakBytes: peak,
    peakIndices: points.flatMap((p, i) => p.total === peak ? [i] : []), parameters };
}

/** One communication lane and one compute lane; at most one future group issued. */
export function prefetchPass(groups: number, gatherMs: number, computeMs: number, prefetch: boolean) {
  positiveInteger(groups, "groups");
  if (groups > 64) throw new RangeError("at most 64 groups");
  nonnegative(gatherMs, "gatherMs"); nonnegative(computeMs, "computeMs");
  if (gatherMs + computeMs <= 0) throw new RangeError("a pass must contain work");
  const jobs: { group: number; gatherStart: number; gatherEnd: number; computeStart: number; computeEnd: number }[] = [];
  for (let group = 0; group < groups; group++) {
    const prior = jobs[group - 1];
    const gatherStart = prior ? Math.max(prior.gatherEnd, prefetch ? prior.computeStart : prior.computeEnd) : 0;
    const gatherEnd = gatherStart + gatherMs;
    const computeStart = Math.max(gatherEnd, prior?.computeEnd ?? 0);
    jobs.push({ group, gatherStart, gatherEnd, computeStart, computeEnd: computeStart + computeMs });
  }
  const elapsedMs = jobs.at(-1)!.computeEnd;
  return { jobs, elapsedMs, exposedGatherMs: elapsedMs - groups * computeMs };
}

/** Local rows contain SUMS of per-example gradients; divide by total examples once. */
export function reducedGradientShards(localGradientSums: number[][], localExampleCounts: number[], owners: number) {
  positiveInteger(owners, "owners");
  if (localGradientSums.length === 0 || localGradientSums.length !== localExampleCounts.length)
    throw new RangeError("provide one count per contributing rank");
  const width = localGradientSums[0].length;
  if (width === 0 || width % owners !== 0) throw new RangeError("gradient width must divide evenly among owners");
  localExampleCounts.forEach((n) => positiveInteger(n, "local example count"));
  for (const row of localGradientSums)
    if (row.length !== width || row.some((v) => !Number.isFinite(v))) throw new RangeError("finite equal-width gradient rows required");
  const count = localExampleCounts.reduce((a, b) => a + b, 0);
  const gradient = Array.from({ length: width }, (_, i) => localGradientSums.reduce((sum, row) => sum + row[i], 0) / count);
  const shardSize = width / owners;
  return { gradient, shards: Array.from({ length: owners }, (_, rank) => gradient.slice(rank * shardSize, (rank + 1) * shardSize)) };
}

export function adamwCoordinate(weight: number, gradient: number, m: number, v: number, step: number,
  learningRate = 0.1, beta1 = 0.9, beta2 = 0.99, epsilon = 0.01, decay = 0.1) {
  if (![weight, gradient, m, v].every(Number.isFinite) || v < 0) throw new RangeError("finite optimizer state required");
  positiveInteger(step, "step");
  for (const [value, name] of [[learningRate, "learning rate"], [epsilon, "epsilon"], [decay, "decay"]] as const)
    nonnegative(value, name);
  if (epsilon === 0 || ![beta1, beta2].every((b) => Number.isFinite(b) && b >= 0 && b < 1))
    throw new RangeError("positive epsilon and beta values in [0,1) required");
  const nextM = beta1 * m + (1 - beta1) * gradient;
  const nextV = beta2 * v + (1 - beta2) * gradient * gradient;
  const mHat = nextM / (1 - beta1 ** step);
  const vHat = nextV / (1 - beta2 ** step);
  return { weight: weight * (1 - learningRate * decay) - learningRate * mHat / (Math.sqrt(vHat) + epsilon),
    m: nextM, v: nextV, mHat, vHat };
}
