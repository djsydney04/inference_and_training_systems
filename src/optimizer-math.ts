export type Vector = [number, number];
export type OptimizerKind = "sgd" | "momentum" | "adamw";
export type OptimizerState = { weight: Vector; first: Vector; second: Vector; step: number };
export const initialOptimizerState = (): OptimizerState => ({ weight: [2, 1], first: [0, 0], second: [0, 0], step: 0 });
export const quadraticLoss = ([x, y]: Vector) => (x * x + 12 * y * y) / 2;
export const quadraticGradient = ([x, y]: Vector): Vector => [x, 12 * y];

/** A declared optimizer convention, not a claim of bitwise framework equivalence. */
export function optimizerStep(state: OptimizerState, kind: OptimizerKind, rate: number, decay = 0) {
  if (!["sgd", "momentum", "adamw"].includes(kind) || !Number.isFinite(rate) || rate <= 0 || rate > .15 || !Number.isFinite(decay) || decay < 0 || decay > 1)
    throw new Error("Invalid optimizer or hyperparameter");
  if (!Number.isInteger(state.step) || state.step < 0 || ![...state.weight, ...state.first, ...state.second].every(Number.isFinite) || state.second.some(v => v < 0))
    throw new Error("Invalid optimizer state");
  const gradient = quadraticGradient(state.weight), step = state.step + 1;
  const first = gradient.map((g, i) => kind === "sgd" ? g : .9 * state.first[i] + (kind === "momentum" ? g : .1 * g)) as Vector;
  const second = gradient.map((g, i) => kind === "adamw" ? .999 * state.second[i] + .001 * g * g : 0) as Vector;
  const direction = first.map((m, i) => kind === "adamw" ? (m / (1 - .9 ** step)) / (Math.sqrt(second[i] / (1 - .999 ** step)) + 1e-8) : m) as Vector;
  const weight = state.weight.map((w, i) => w * (1 - rate * decay) - rate * direction[i]) as Vector;
  return { weight, first, second, step, gradient, direction, loss: quadraticLoss(weight) };
}

export function clipVector(values: number[], threshold: number) {
  if (!values.length || values.some(v => !Number.isFinite(v)) || !Number.isFinite(threshold) || threshold <= 0)
    throw new Error("Clipping needs finite values and a positive threshold");
  const norm = Math.hypot(...values), scale = norm > threshold ? threshold / norm : 1;
  return { norm, scale, values: values.map(v => v * scale) };
}

/** Expose the order-of-operations counterexample, using summed contributions. */
export function clippingOrder(threshold: number) {
  const a = [8, 0], b = [-6, 2];
  const combined = a.map((v, i) => v + b[i]);
  const local = a.map((_, i) => clipVector(a, threshold).values[i] + clipVector(b, threshold).values[i]);
  return { a, b, combined, global: clipVector(combined, threshold).values, local };
}

export function warmupCosine(tokens: number, warmup: number, total: number, peak: number, floor: number) {
  if (![tokens, warmup, total, peak, floor].every(Number.isFinite) || tokens < 0 || warmup <= 0 || total <= warmup || floor < 0 || peak < floor)
    throw new Error("Invalid token schedule");
  if (tokens < warmup) return peak * tokens / warmup;
  const progress = Math.min(1, (tokens - warmup) / (total - warmup));
  return floor + (peak - floor) * (1 + Math.cos(Math.PI * progress)) / 2;
}
