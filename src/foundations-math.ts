export function tokenPrediction(logits: number[], target: number) {
  if (!logits.length || logits.some((x) => !Number.isFinite(x)) ||
      !Number.isInteger(target) || target < 0 || target >= logits.length)
    throw new RangeError("Finite logits and a valid target are required");
  const maximum = Math.max(...logits);
  const exponentials = logits.map((x) => Math.exp(x - maximum));
  const sum = exponentials.reduce((a, b) => a + b, 0);
  const probabilities = exponentials.map((x) => x / sum);
  const loss = Math.log(sum) + maximum - logits[target];
  return { probabilities, loss, gradient: probabilities.map((p, i) => p - Number(i === target)) };
}

export function projectionStep(weights: number[][], features: number[], target: number, rate: number) {
  if (!Number.isFinite(rate) || rate < 0 || !features.length ||
      features.some((x) => !Number.isFinite(x)) || !weights.length ||
      weights.some((row) => row.length !== features.length || row.some((x) => !Number.isFinite(x))))
    throw new RangeError("Invalid projection shape or learning rate");
  const logits = weights.map((row) => row.reduce((s, w, j) => s + w * features[j], 0));
  const prediction = tokenPrediction(logits, target);
  const gradient = weights.map((row, i) => row.map((_, j) => prediction.gradient[i] * features[j]));
  const nextWeights = weights.map((row, i) => row.map((w, j) => w - rate * gradient[i][j]));
  return { ...prediction, logits, gradient, nextWeights };
}

export function kvStorage(layers: number, heads: number, dim: number, tokens: number, bytes: number, batch = 1) {
  if ([layers, heads, dim, tokens, bytes, batch].some((n) => !Number.isInteger(n) || n <= 0))
    throw new RangeError("KV dimensions must be positive integers");
  return 2 * layers * heads * dim * tokens * bytes * batch;
}
