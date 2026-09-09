export const teachingSM = {
  registers: 65536,
  sharedBytes: 100 * 1024,
  threads: 2048,
  warps: 64,
  blocks: 32,
  registerQuantum: 256,
  sharedQuantum: 256,
} as const;
export function occupancy(
  threads: number,
  registersPerThread: number,
  sharedBytes: number,
) {
  if (
    !Number.isInteger(threads) ||
    threads < 32 ||
    threads > 1024 ||
    threads % 32 ||
    !Number.isInteger(registersPerThread) ||
    registersPerThread < 1 ||
    registersPerThread > 255 ||
    !Number.isInteger(sharedBytes) ||
    sharedBytes < 0 ||
    sharedBytes > 256 * 1024
  )
    throw new Error("Invalid teaching-SM launch configuration");
  const warpsPerBlock = threads / 32;
  const registersPerWarp =
    Math.ceil((registersPerThread * 32) / teachingSM.registerQuantum) *
    teachingSM.registerQuantum;
  const registersPerBlock = registersPerWarp * warpsPerBlock;
  const sharedPerBlock =
    Math.ceil(sharedBytes / teachingSM.sharedQuantum) *
    teachingSM.sharedQuantum;
  const limits = {
    registers: Math.floor(teachingSM.registers / registersPerBlock),
    shared: sharedPerBlock
      ? Math.floor(teachingSM.sharedBytes / sharedPerBlock)
      : Infinity,
    threads: Math.floor(teachingSM.threads / threads),
    blocks: teachingSM.blocks,
  };
  const blocks = Math.min(...Object.values(limits)),
    warps = blocks * warpsPerBlock;
  return {
    limits,
    blocks,
    warps,
    warpsPerBlock,
    registersPerWarp,
    registersPerBlock,
    sharedPerBlock,
    occupancy: warps / teachingSM.warps,
    boundBy: Object.entries(limits)
      .filter(([, v]) => v === blocks)
      .map(([k]) => k),
    usedRegisters: blocks * registersPerBlock,
    usedShared: blocks * sharedPerBlock,
  };
}
export function roofline(
  flops: number,
  bytes: number,
  computePerSecond: number,
  bytesPerSecond: number,
) {
  if (
    ![flops, bytes, computePerSecond, bytesPerSecond].every(
      (v) => Number.isFinite(v) && v > 0,
    )
  )
    throw new Error("Roofline inputs must be finite and positive");
  const intensity = flops / bytes,
    computeSeconds = flops / computePerSecond,
    memorySeconds = bytes / bytesPerSecond;
  return {
    intensity,
    computeSeconds,
    memorySeconds,
    lowerBoundSeconds: Math.max(computeSeconds, memorySeconds),
    upperBoundFlops: Math.min(computePerSecond, intensity * bytesPerSecond),
    ridge: computePerSecond / bytesPerSecond,
  };
}
