const positive = (name: string, value: number, zero = false) => {
  if (!Number.isFinite(value) || value < 0 || (!zero && value === 0)) throw new Error(`Invalid ${name}`);
};
const integer = (name: string, value: number, zero = false) => {
  positive(name, value, zero);
  if (!Number.isSafeInteger(value)) throw new Error(`Invalid ${name}`);
};

export interface TransferInput {
  layers: number; kvHeads: number; headDim: number; bytesPerElement: number;
  tokens: number; cachedTokens: number; blockTokens: number;
  linkGBps: number; setupMs: number; overlapMs: number;
}

/** One request, all layers, both K and V. Full blocks cross one effective link. */
export function kvTransferBudget(input: TransferInput) {
  for (const key of ["layers", "kvHeads", "headDim", "bytesPerElement", "tokens", "blockTokens"] as const)
    integer(key, input[key]);
  integer("cachedTokens", input.cachedTokens, true);
  if (input.cachedTokens > input.tokens || input.cachedTokens % input.blockTokens !== 0)
    throw new Error("Reused prefix must be complete compatible blocks within the prompt");
  positive("linkGBps", input.linkGBps);
  positive("setupMs", input.setupMs, true); positive("overlapMs", input.overlapMs, true);
  const bytesPerToken = 2 * input.layers * input.kvHeads * input.headDim * input.bytesPerElement;
  const missingTokens = input.tokens - input.cachedTokens;
  const payloadBytes = missingTokens * bytesPerToken;
  const wireBytes = Math.ceil(missingTokens / input.blockTokens) * input.blockTokens * bytesPerToken;
  if (!Number.isSafeInteger(wireBytes) || !Number.isSafeInteger(bytesPerToken)) throw new Error("Byte count exceeds exact integer range");
  const payloadMs = wireBytes / (input.linkGBps * 1e6); // decimal GB/s -> bytes/ms
  const hiddenMs = Math.min(payloadMs, input.overlapMs);
  return { bytesPerToken, missingTokens, payloadBytes, wireBytes, paddingBytes: wireBytes - payloadBytes,
    payloadMs, hiddenMs, exposedMs: input.setupMs + payloadMs - hiddenMs };
}

export interface HandoffTiming {
  prefillQueueMs: number; prefillMs: number; exposedTransferMs: number;
  decodeQueueMs: number; decodeMs: number; outputTokens: number; emitFromPrefill: boolean;
}
export function handoffTiming(input: HandoffTiming) {
  for (const key of ["prefillQueueMs", "prefillMs", "exposedTransferMs", "decodeQueueMs", "decodeMs"] as const)
    positive(key, input[key], key !== "decodeMs");
  integer("outputTokens", input.outputTokens);
  if (input.outputTokens < 2) throw new Error("This handoff model requires at least two output tokens");
  const prefillEnd = input.prefillQueueMs + input.prefillMs;
  const transferEnd = prefillEnd + input.exposedTransferMs;
  const decodeStart = transferEnd + input.decodeQueueMs;
  const firstTokenMs = input.emitFromPrefill ? prefillEnd : decodeStart;
  const secondTokenMs = decodeStart + input.decodeMs;
  const lastTokenMs = decodeStart + (input.outputTokens - 1) * input.decodeMs;
  return { prefillEnd, transferEnd, decodeStart, firstTokenMs, secondTokenMs, lastTokenMs,
    firstGapMs: secondTokenMs - firstTokenMs,
    tpotMs: (lastTokenMs - firstTokenMs) / (input.outputTokens - 1),
    segments: [
      { label: "Prefill queue", start: 0, duration: input.prefillQueueMs },
      { label: "Prefill", start: input.prefillQueueMs, duration: input.prefillMs },
      { label: "Exposed handoff", start: prefillEnd, duration: input.exposedTransferMs },
      { label: "Decode queue", start: transferEnd, duration: input.decodeQueueMs },
      { label: "Generate token 2", start: decodeStart, duration: input.decodeMs },
    ] };
}

export interface CapacityInput {
  prefillWorkers: number; decodeWorkers: number; promptTokens: number; outputTokens: number;
  prefillTokensPerSecond: number; decodeTokensPerSecond: number;
  transferBytes: number; linkGBps: number; arrivalsPerSecond: number;
}
/** Fluid capacity bound, not a queue simulation or a latency/SLO predictor. */
export function pdCapacity(input: CapacityInput) {
  for (const key of ["prefillWorkers", "decodeWorkers", "promptTokens", "outputTokens"] as const) integer(key, input[key]);
  if (input.outputTokens < 2) throw new Error("Decode needs at least one post-prefill token");
  for (const key of ["prefillTokensPerSecond", "decodeTokensPerSecond", "linkGBps"] as const) positive(key, input[key]);
  integer("transferBytes", input.transferBytes, true); positive("arrivalsPerSecond", input.arrivalsPerSecond, true);
  const prefill = input.prefillWorkers * input.prefillTokensPerSecond / input.promptTokens;
  const decode = input.decodeWorkers * input.decodeTokensPerSecond / (input.outputTokens - 1);
  const fabric = input.transferBytes ? input.linkGBps * 1e9 / input.transferBytes : Infinity;
  const limit = Math.min(prefill, decode, fabric);
  const stages = [
    { label: "Prefill", capacity: prefill }, { label: "Decode", capacity: decode }, { label: "Fabric", capacity: fabric },
  ].map(stage => ({ ...stage, utilization: input.arrivalsPerSecond / stage.capacity, limiting: stage.capacity === limit }));
  return { stages, limit, backlogPerSecond: Math.max(0, input.arrivalsPerSecond - limit), hasHeadroom: input.arrivalsPerSecond < limit };
}
