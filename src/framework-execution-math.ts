/** Numerical contracts and an explicit cache model; neither executes a framework. */
export interface ClassifierContract {
  inputs: number[][]; weights: number[][]; bias: number[];
  targets: number[]; mask: number[]; learningRate: number; reduction: "mean" | "sum";
}
function rectangular(value: number[][], name: string) {
  if (!value.length || !value[0].length || value.some(row => row.length !== value[0].length || row.some(x => !Number.isFinite(x))))
    throw new RangeError(`${name} must be a nonempty finite rectangular matrix`);
}
/** Stable masked cross entropy, explicit valid-target normalization, one plain SGD update. */
export function classifierContract(input: ClassifierContract) {
  const {inputs: x, weights: w, bias: b, targets, mask, learningRate, reduction} = input;
  rectangular(x, "inputs"); rectangular(w, "weights");
  const classes = w[0].length;
  if (w.length !== x[0].length || classes < 2 || b.length !== classes || b.some(v => !Number.isFinite(v))) throw new RangeError("classifier shapes disagree");
  if (targets.length !== x.length || mask.length !== x.length
    || targets.some(t => !Number.isSafeInteger(t) || t < 0 || t >= classes)
    || mask.some(m => m !== 0 && m !== 1)) throw new RangeError("valid target IDs and a binary mask are required for every row");
  if (!Number.isFinite(learningRate) || learningRate < 0 || !["mean", "sum"].includes(reduction)) throw new RangeError("invalid update convention");
  const valid = mask.reduce((sum, m) => sum + m, 0);
  if (valid === 0) throw new RangeError("an empty valid-target batch has no mean loss; skip the update explicitly");
  const denominator = reduction === "mean" ? valid : 1;
  const logits = x.map(row => b.map((bias, c) => bias + row.reduce((sum, v, d) => sum + v * w[d][c], 0)));
  const probabilities = logits.map(row => {
    const max = Math.max(...row), exps = row.map(v => Math.exp(v - max)), sum = exps.reduce((a, b) => a + b, 0);
    return exps.map(v => v / sum);
  });
  const losses = logits.map((row, t) => {
    const max = Math.max(...row);
    return Math.log(row.reduce((sum, v) => sum + Math.exp(v - max), 0)) + (max - row[targets[t]]);
  });
  const dLogits = probabilities.map((row, t) => row.map((p, c) => mask[t] * (p - Number(c === targets[t])) / denominator));
  const dWeights = w.map((row, d) => row.map((_, c) => x.reduce((sum, xt, t) => sum + xt[d] * dLogits[t][c], 0)));
  const dBias = b.map((_, c) => dLogits.reduce((sum, row) => sum + row[c], 0));
  const loss = losses.reduce((sum, value, t) => sum + mask[t] * value, 0) / denominator;
  return {logits, probabilities, losses, valid, denominator, loss, dLogits, dWeights, dBias,
    nextWeights: w.map((row, d) => row.map((v, c) => v - learningRate * dWeights[d][c])),
    nextBias: b.map((v, c) => v - learningRate * dBias[c])};
}

export interface SignatureCall {batch: number; width: number; dtype: "float32" | "float64"; training: boolean; values: string}
/** Deliberately declared signature policy, not a prediction of any engine's cache. */
export function traceSignatureCalls(calls: readonly SignatureCall[], variableBatch: boolean) {
  const cache = new Map<string, number>();
  return calls.map((call, index) => {
    if (!Number.isSafeInteger(call.batch) || call.batch < 1 || !Number.isSafeInteger(call.width) || call.width < 1
      || !["float32", "float64"].includes(call.dtype) || typeof call.training !== "boolean") throw new RangeError("invalid call signature");
    const signature = `[${variableBatch ? "B" : call.batch},${call.width}] ${call.dtype} training=${call.training}`;
    const existing = cache.get(signature), traced = existing === undefined;
    const graph = existing ?? cache.size + 1;
    if (traced) cache.set(signature, graph);
    return {call: index + 1, signature, graph, traced, totalGraphs: cache.size, values: call.values};
  });
}

export const frameworkExample: ClassifierContract = {
  inputs: [[1, 2], [2, -1], [-1, 1]], weights: [[.2, -.3], [.4, .1]], bias: [.1, -.2],
  targets: [0, 1, 0], mask: [1, 1, 0], learningRate: .125, reduction: "mean",
};
export const frameworkCalls: SignatureCall[] = [
  {batch: 3, width: 2, dtype: "float64", training: true, values: "Original inputs"},
  {batch: 3, width: 2, dtype: "float64", training: true, values: "Different values; same signature"},
  {batch: 6, width: 2, dtype: "float64", training: true, values: "Larger batch"},
  {batch: 3, width: 2, dtype: "float32", training: true, values: "Different dtype"},
  {batch: 3, width: 2, dtype: "float64", training: false, values: "Different static mode"},
  {batch: 3, width: 2, dtype: "float64", training: true, values: "Original signature again"},
];
