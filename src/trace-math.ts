export function trainingTrace(
  communication: number,
  independentCompute: number,
) {
  if (
    !Number.isFinite(communication) ||
    !Number.isFinite(independentCompute) ||
    communication < 0 ||
    independentCompute < 0
  )
    throw new Error("Durations must be finite and nonnegative");
  const input = 2,
    compute = 8;
  const overlapped = Math.min(compute, communication, independentCompute);
  const exposed = communication - overlapped;
  return {
    input,
    compute,
    communication,
    overlapped,
    exposed,
    communicationStart: input + compute - overlapped,
    step: input + compute + exposed,
    speedup: (input + compute + communication) / (input + compute + exposed),
  };
}
