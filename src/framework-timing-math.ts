export type TimingConfig = { iterations: number; launchMs: number; kernelMs: number; preparationMs: number; priorDeviceMs: number };

/** One host producer, one FIFO device stream, zero synchronization overhead. */
export function frameworkTiming(config: TimingConfig) {
  const { iterations, launchMs, kernelMs, preparationMs, priorDeviceMs } = config;
  if (!Number.isSafeInteger(iterations) || iterations < 1 || iterations > 10000)
    throw new Error("Choose 1–10000 iterations");
  for (const value of [launchMs, kernelMs, preparationMs, priorDeviceMs])
    if (!Number.isFinite(value) || value < 0) throw new Error("Durations must be finite and nonnegative");
  let host = preparationMs, device = priorDeviceMs;
  const calls = Array.from({ length: iterations }, (_, index) => {
    const launchStart = host;
    host += launchMs;
    const start = Math.max(host, device);
    device = start + kernelMs;
    return { index, launchStart, enqueued: host, start, finish: device };
  });
  return { calls, hostReturnMs: host, completeMs: device, serviceMs: iterations * kernelMs,
    amortizedMs: device / iterations, firstResultMs: calls[0].finish,
    // Idle in the interval starting at t=0; excludes prior device work.
    idleMs: device - priorDeviceMs - iterations * kernelMs };
}
