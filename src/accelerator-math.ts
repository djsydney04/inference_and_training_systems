/** Declared teaching estimates. Capacities use GiB; throughput uses decimal bytes/s. */
const positive = (value: number, name: string, allowZero = false) => {
  if (!Number.isFinite(value) || (allowZero ? value < 0 : value <= 0))
    throw new RangeError(`${name} must be finite and ${allowZero ? "nonnegative" : "positive"}`);
};
export interface ResidencyInput {
  parameters: number;
  bitsPerWeight: number;
  blockElements: number;
  scaleBytes: number;
  capacityGiB: number;
  reservedGiB: number;
  layers: number;
  kvHeads: number;
  headDimension: number;
  context: number;
  kvBytes: number;
  batch: number;
}
export function residency(input: ResidencyInput) {
  for (const [key, value] of Object.entries(input))
    positive(value, key, key === "scaleBytes" || key === "reservedGiB");
  for (const key of ["parameters", "blockElements", "layers", "kvHeads", "headDimension", "context", "batch"] as const)
    if (!Number.isSafeInteger(input[key])) throw new RangeError(`${key} must be a safe integer`);
  const weightBytes = Math.ceil(input.parameters * input.bitsPerWeight / 8)
    + Math.ceil(input.parameters / input.blockElements) * input.scaleBytes;
  const kvPerSequence = 2 * input.layers * input.kvHeads * input.headDimension * input.context * input.kvBytes;
  const kvTotal = input.batch * kvPerSequence;
  const capacityBytes = input.capacityGiB * 2 ** 30;
  const reservedBytes = input.reservedGiB * 2 ** 30;
  const usedBytes = weightBytes + kvTotal + reservedBytes;
  return {
    weightBytes, kvPerSequence, kvTotal, capacityBytes, reservedBytes, usedBytes,
    fits: usedBytes <= capacityBytes,
    headroomBytes: capacityBytes - usedBytes,
    maxSequences: Math.max(0, Math.floor((capacityBytes - reservedBytes - weightBytes) / kvPerSequence)),
  };
}
export function transferEstimate(bytes: number, gigabitsPerSecond: number, efficiency: number) {
  positive(bytes, "bytes", true);
  positive(gigabitsPerSecond, "gigabitsPerSecond");
  positive(efficiency, "efficiency");
  if (efficiency > 1) throw new RangeError("efficiency must be at most one");
  const usableBytesPerSecond = gigabitsPerSecond * 1e9 / 8 * efficiency;
  return { usableBytesPerSecond, seconds: bytes / usableBytesPerSecond };
}
export function disaggregationBreakEven(transferSeconds: number, colocatedTokenSeconds: number, splitTokenSeconds: number) {
  positive(transferSeconds, "transferSeconds", true);
  positive(colocatedTokenSeconds, "colocatedTokenSeconds");
  positive(splitTokenSeconds, "splitTokenSeconds");
  const saving = colocatedTokenSeconds - splitTokenSeconds;
  return saving > 0 ? Math.floor(transferSeconds / saving) + 1 : null;
}
