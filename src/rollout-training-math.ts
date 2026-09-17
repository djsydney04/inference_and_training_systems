/** Deterministic teaching model, not a scheduler or a hardware benchmark. */
function nonnegative(value: number, name: string) {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`${name} must be finite and nonnegative`);
}
function whole(value: number, name: string, minimum: number, maximum: number) {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum)
    throw new RangeError(`${name} must be an integer in [${minimum}, ${maximum}]`);
}

export interface RolloutScheduleInput {
  batches: number;
  prefillSeconds: number;
  decodeSeconds: number;
  rewardSeconds: number;
  trainSeconds: number;
  publishSeconds: number;
  decodeSpeedup: number;
  maxLag: number;
}
export interface RolloutBatch {
  batch: number;
  behaviorVersion: number;
  learnerVersion: number;
  lag: number;
  actorStart: number;
  prefillEnd: number;
  decodeEnd: number;
  actorEnd: number;
  learnerStart: number;
  trainEnd: number;
  publishEnd: number;
}

/**
 * One actor lane, one learner lane, FIFO groups, one update per group.
 * A group uses one immutable weight snapshot. New groups may start only when
 * batchIndex - publishedVersion <= maxLag. Publication occupies the learner
 * lane and affects future group launches, without interrupting an active actor.
 * Actor/reward and update durations do not depend on backlog or overlap.
 */
export function rolloutSchedule(input: RolloutScheduleInput) {
  whole(input.batches, "batches", 1, 128);
  whole(input.maxLag, "maxLag", 0, 128);
  for (const key of ["prefillSeconds", "decodeSeconds", "rewardSeconds", "trainSeconds", "publishSeconds"] as const)
    nonnegative(input[key], key);
  if (!Number.isFinite(input.decodeSpeedup) || input.decodeSpeedup <= 0)
    throw new RangeError("decodeSpeedup must be finite and positive");
  const actorSeconds = input.prefillSeconds + input.decodeSeconds / input.decodeSpeedup + input.rewardSeconds;
  const learnerSeconds = input.trainSeconds + input.publishSeconds;
  if (actorSeconds <= 0 || learnerSeconds <= 0) throw new RangeError("both lanes need positive work");
  const publishedAt = [0];
  const batches: RolloutBatch[] = [];
  let actorReady = 0, learnerReady = 0;
  for (let k = 0; k < input.batches; k++) {
    const actorStart = Math.max(actorReady, publishedAt[Math.max(0, k - input.maxLag)]);
    let behaviorVersion = 0;
    for (let version = 1; version < publishedAt.length; version++)
      if (publishedAt[version] <= actorStart) behaviorVersion = version;
    const prefillEnd = actorStart + input.prefillSeconds;
    const decodeEnd = prefillEnd + input.decodeSeconds / input.decodeSpeedup;
    const actorEnd = decodeEnd + input.rewardSeconds;
    const learnerStart = Math.max(actorEnd, learnerReady);
    const trainEnd = learnerStart + input.trainSeconds;
    const publishEnd = trainEnd + input.publishSeconds;
    batches.push({ batch: k, behaviorVersion, learnerVersion: k, lag: k - behaviorVersion,
      actorStart, prefillEnd, decodeEnd, actorEnd, learnerStart, trainEnd, publishEnd });
    publishedAt.push(publishEnd);
    actorReady = actorEnd;
    learnerReady = publishEnd;
  }
  const elapsed = learnerReady;
  const synchronousSeconds = input.batches * (actorSeconds + learnerSeconds);
  return {
    batches, actorSeconds, learnerSeconds, elapsed, synchronousSeconds,
    overlapSpeedup: synchronousSeconds / elapsed,
    maxObservedLag: Math.max(...batches.map((batch) => batch.lag)),
    actorUtilization: input.batches * actorSeconds / elapsed,
    learnerUtilization: input.batches * learnerSeconds / elapsed,
    // Infinite-buffer, no-lag-constraint lower bound for these identical jobs.
    idealPipelineSeconds: actorSeconds + learnerSeconds + (input.batches - 1) * Math.max(actorSeconds, learnerSeconds),
  };
}

/** Serial critical-path accounting. Amdahl's law with declared added overhead. */
export function rolloutAcceleration(decodeSeconds: number, otherSeconds: number, speedup: number, overheadSeconds = 0) {
  nonnegative(decodeSeconds, "decodeSeconds");
  nonnegative(otherSeconds, "otherSeconds");
  nonnegative(overheadSeconds, "overheadSeconds");
  if (!Number.isFinite(speedup) || speedup <= 0 || decodeSeconds + otherSeconds <= 0)
    throw new RangeError("speedup and original total must be positive");
  const beforeSeconds = decodeSeconds + otherSeconds;
  const afterSeconds = decodeSeconds / speedup + otherSeconds + overheadSeconds;
  return { beforeSeconds, afterSeconds, speedup: beforeSeconds / afterSeconds,
    decodeFraction: decodeSeconds / beforeSeconds };
}

/** One observed action at one fixed context; not a sequence-level estimator. */
export function policyRatio(behaviorProbability: number, currentProbability: number, advantage: number, epsilon: number) {
  for (const [name, p] of [["behaviorProbability", behaviorProbability], ["currentProbability", currentProbability]] as const)
    if (!Number.isFinite(p) || p <= 0 || p > 1) throw new RangeError(`${name} must be in (0, 1]`);
  if (!Number.isFinite(advantage)) throw new RangeError("advantage must be finite");
  if (!Number.isFinite(epsilon) || epsilon < 0 || epsilon >= 1) throw new RangeError("epsilon must be in [0, 1)");
  const logRatio = Math.log(currentProbability) - Math.log(behaviorProbability);
  const ratio = currentProbability / behaviorProbability;
  if (!Number.isFinite(ratio)) throw new RangeError("ratio exceeds the teaching model's numeric range");
  const clippedRatio = Math.min(1 + epsilon, Math.max(1 - epsilon, ratio));
  const raw = ratio * advantage;
  const clipped = clippedRatio * advantage;
  return { logRatio, ratio, clippedRatio, raw, clipped, objective: Math.min(raw, clipped) };
}
