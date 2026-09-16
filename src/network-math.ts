/** Shape contracts for the illustrated dense, pre-normalized decoder. */
export interface NetworkConfig {
  batch: number;
  tokens: number;
  width: number;
  heads: number;
  kvHeads: number;
  hidden: number;
  vocabulary: number;
  layers: number;
}

export const networkExample: NetworkConfig = {
  batch: 1, tokens: 4, width: 8, heads: 2, kvHeads: 2,
  hidden: 24, vocabulary: 32, layers: 3,
};

export function networkShapes(config: NetworkConfig, decode = false) {
  for (const [name, value] of Object.entries(config)) {
    if (!Number.isSafeInteger(value) || value <= 0)
      throw new RangeError(`${name} must be a positive integer`);
  }
  if (config.width % config.heads || config.heads % config.kvHeads)
    throw new RangeError("Width must divide into heads, and query heads into KV groups");
  const { batch: b, tokens: t, width: d, heads: h, kvHeads: k, hidden: f, vocabulary: v } = config;
  const q = decode ? 1 : t;
  const context = decode ? t + 1 : t;
  const headWidth = d / h;
  return {
    ids: [b, q], residual: [b, q, d], query: [b, h, q, headWidth],
    newKV: [b, k, q, headWidth], cache: [b, k, context, headWidth],
    scores: [b, h, q, context], hidden: [b, q, f], logits: [b, q, v],
    headWidth, queryTokens: q, context,
    attentionParameters: 2 * d * d + 2 * d * k * headWidth,
    feedForwardParameters: 3 * d * f,
    cacheElements: 2 * config.layers * b * k * context * headWidth,
  };
}

export function stableSoftmax(scores: readonly number[]): number[] {
  if (!scores.length || scores.some(x => !Number.isFinite(x)))
    throw new RangeError("Softmax needs finite scores");
  const maximum = Math.max(...scores);
  const weights = scores.map(x => Math.exp(x - maximum));
  const total = weights.reduce((sum, x) => sum + x, 0);
  return weights.map(x => x / total);
}

/** One illustrative head; scores already include scaling and position handling. */
export function causalAttentionRow(scores: readonly number[], values: readonly (readonly number[])[], position: number) {
  if (!Number.isInteger(position) || position < 0 || position >= scores.length ||
      values.length !== scores.length || !values[0]?.length ||
      values.some(row => row.length !== values[0].length || row.some(x => !Number.isFinite(x))))
    throw new RangeError("Attention requires matching rows and a valid query position");
  const allowed = stableSoftmax(scores.slice(0, position + 1));
  const weights = scores.map((_, i) => allowed[i] ?? 0);
  const output = values[0].map((_, channel) =>
    weights.reduce((sum, weight, i) => sum + weight * values[i][channel], 0));
  return { weights, output };
}

export function rmsNormalize(input: readonly number[], gain: readonly number[], epsilon = 1e-6) {
  if (!input.length || input.length !== gain.length || !Number.isFinite(epsilon) || epsilon <= 0 ||
      [...input, ...gain].some(x => !Number.isFinite(x)))
    throw new RangeError("RMSNorm requires finite matching vectors and positive epsilon");
  const rms = Math.sqrt(input.reduce((sum, x) => sum + x * x, 0) / input.length + epsilon);
  return input.map((x, i) => x / rms * gain[i]);
}

export function swigluChannels(gate: readonly number[], up: readonly number[]) {
  if (!gate.length || gate.length !== up.length || [...gate, ...up].some(x => !Number.isFinite(x)))
    throw new RangeError("SwiGLU branches must have equal, finite channels");
  const activated = gate.map(x => x / (1 + Math.exp(-x)));
  return { activated, product: activated.map((x, i) => x * up[i]) };
}
