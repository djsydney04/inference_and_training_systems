/** Original Float64 teaching references. No tokenizer, trainer or device runtime is simulated. */
export const frameworkIgnore = -100;
export type FrameworkToken = { name: string; id: number; role: "context" | "assistant" | "end" | "padding" };
export const frameworkTokens: FrameworkToken[] = [
  { name: "BOS", id: 0, role: "context" }, { name: "user", id: 1, role: "context" },
  { name: "question", id: 2, role: "context" }, { name: "assistant", id: 3, role: "context" },
  { name: "answer", id: 4, role: "assistant" }, { name: "EOS", id: 5, role: "end" },
  { name: "PAD", id: 5, role: "padding" }, { name: "PAD", id: 5, role: "padding" },
];
export type FrameworkMask = "assistant" | "all" | "token-id";
export function frameworkLabels(tokens: FrameworkToken[], mask: FrameworkMask, preShift = false) {
  if (!["assistant", "all", "token-id"].includes(mask) || tokens.length < 2
    || tokens.some(t => !Number.isSafeInteger(t.id) || t.id < 0)) throw new RangeError("valid tokens and mask required");
  const labels = tokens.map(t => t.role !== "padding" && (mask === "all" || t.role === "assistant" || t.role === "end")
    && !(mask === "token-id" && t.id === 5) ? t.id : frameworkIgnore);
  return preShift ? [...labels.slice(1), frameworkIgnore] : labels;
}

/** Model-owned causal shift: logit row i predicts aligned label i+1. */
export function frameworkCausalLoss(logits: number[][], labels: number[]) {
  const vocabulary = logits[0]?.length;
  if (!vocabulary || logits.length !== labels.length || logits.length < 2
    || logits.some(row => row.length !== vocabulary || row.some(x => !Number.isFinite(x)))
    || labels.some(y => y !== frameworkIgnore && (!Number.isSafeInteger(y) || y < 0 || y >= vocabulary)))
    throw new RangeError("aligned finite logits and vocabulary labels required");
  const pairs = logits.slice(0, -1).flatMap((row, position) => {
    const target = labels[position + 1];
    if (target === frameworkIgnore) return [];
    const max = Math.max(...row), logSum = Math.log(row.reduce((s, z) => s + Math.exp(z - max), 0));
    const loss = logSum + max - row[target];
    return [{ position, labelPosition: position + 1, target, loss, probability: Math.exp(-loss) }];
  });
  const lossSum = pairs.reduce((s, pair) => s + pair.loss, 0);
  return { pairs, count: pairs.length, lossSum, mean: pairs.length ? lossSum / pairs.length : null };
}

export function frameworkExampleLogits(length = 8) {
  if (!Number.isSafeInteger(length) || length < 2 || length > frameworkTokens.length) throw new RangeError("length must be 2 through 8");
  const probabilities = [.2, .25, .5, Math.exp(-.4), Math.exp(-.8), .1, .1, .1];
  return frameworkTokens.slice(0, length).map((_, i) => {
    const target = frameworkTokens[Math.min(i + 1, frameworkTokens.length - 1)].id, p = probabilities[i];
    return Array.from({length: 6}, (_, j) => Math.log(j === target ? p : (1 - p) / 5));
  });
}

/** Each number is a local SUM of derivatives. Automatic divisions are explicit inputs. */
export function frameworkReduction(sums: number[][], counts: number[][], reducer: "sum" | "mean", backwardDivisor: number) {
  const microsteps = sums[0]?.length, ranks = sums.length;
  if (!microsteps || counts.length !== ranks || !["sum", "mean"].includes(reducer)
    || !Number.isSafeInteger(backwardDivisor) || backwardDivisor < 1
    || sums.some((row, r) => row.length !== microsteps || counts[r]?.length !== microsteps
      || row.some((value, m) => !Number.isFinite(value) || !Number.isSafeInteger(counts[r][m]) || counts[r][m] < 0
        || (counts[r][m] === 0 && value !== 0)))) throw new RangeError("rectangular local sums/counts and positive divisor required");
  const totalCount = counts.flat().reduce((a, b) => a + b, 0);
  if (!totalCount) throw new RangeError("the global update has no valid targets");
  const rankDivisor = reducer === "mean" ? ranks : 1;
  const scale = rankDivisor * backwardDivisor / totalCount;
  const submitted = sums.map(row => row.map(x => x * scale));
  const afterBackward = submitted.map(row => row.reduce((a, b) => a + b, 0) / backwardDivisor);
  const reduced = afterBackward.reduce((a, b) => a + b, 0) / rankDivisor;
  return { totalCount, scale, submitted, afterBackward, reduced, rankDivisor,
    direct: sums.flat().reduce((a, b) => a + b, 0) / totalCount };
}

function rectangular(value: number[][]) {
  if (!value.length || !value[0].length || value.some(row => row.length !== value[0].length || row.some(x => !Number.isFinite(x))))
    throw new RangeError("nonempty finite matrix required");
}
export function frameworkMatvec(w: number[][], x: number[]) {
  rectangular(w);
  if (w[0].length !== x.length || x.some(v => !Number.isFinite(v))) throw new RangeError("matrix/vector shape mismatch");
  return w.map(row => row.reduce((sum, value, i) => sum + value * x[i], 0));
}

/** nn.Linear orientation: W[out,in], A[rank,in], B[out,rank], column x. */
export function frameworkLora(w: number[][], a: number[][], b: number[][], alpha: number, x: number[]) {
  rectangular(w); rectangular(a); rectangular(b);
  const rank = a.length;
  if (!Number.isFinite(alpha) || a[0].length !== w[0].length || b.length !== w.length || b[0].length !== rank)
    throw new RangeError("LoRA matrix shape or alpha mismatch");
  const scale = alpha / rank;
  const delta = b.map(row => a[0].map((_, j) => scale * row.reduce((sum, value, k) => sum + value * a[k][j], 0)));
  const mergedWeights = w.map((row, i) => row.map((value, j) => value + delta[i][j]));
  const base = frameworkMatvec(w, x), adapter = frameworkMatvec(b, frameworkMatvec(a, x)).map(value => scale * value);
  return { rank, scale, delta, mergedWeights, base, adapter,
    separate: base.map((value, i) => value + adapter[i]), merged: frameworkMatvec(mergedWeights, x) };
}

/** Plain teaching manifest, not the PEFT file schema or a content-integrity verifier. */
export type FrameworkArtifactIdentity = {
  baseRevision: string; tokenizerDigest: string; templateDigest: string; targetModule: string;
};
export function frameworkIdentityDifferences(expected: FrameworkArtifactIdentity, actual: FrameworkArtifactIdentity) {
  const keys = ["baseRevision", "tokenizerDigest", "templateDigest", "targetModule"] as const;
  if (keys.some(key => !expected[key]?.trim() || !actual[key]?.trim())) throw new RangeError("complete artifact identity required");
  return keys.filter(key => expected[key] !== actual[key]);
}
