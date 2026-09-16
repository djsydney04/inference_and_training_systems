/** Small, deterministic teaching models. These count addresses, not device traffic. */
function integer(value: number, name: string, min = 0, max = 1_000_000) {
  if (!Number.isSafeInteger(value) || value < min || value > max) throw new Error(`${name} is out of range.`);
}

export function tensorAddress(rows: number, cols: number, rowStride: number, colStride: number, row: number, col: number, elementBytes = 4) {
  integer(rows, "Rows", 1, 64); integer(cols, "Columns", 1, 64);
  integer(rowStride, "Row stride"); integer(colStride, "Column stride");
  integer(row, "Row", 0, rows - 1); integer(col, "Column", 0, cols - 1);
  integer(elementBytes, "Element size", 1, 16);
  const offset = row * rowStride + col * colStride;
  return { offset, byteOffset: offset * elementBytes, allocationElements: (rows - 1) * rowStride + (cols - 1) * colStride + 1 };
}

export function warpAccess(stride: number, offset: number, activeLanes = 32) {
  integer(stride, "Stride", 0, 64); integer(offset, "Offset", 0, 128); integer(activeLanes, "Active lanes", 1, 32);
  // One aligned FP32 word per active lane; sectors are 32 bytes. No cache model.
  const lanes = Array.from({ length: activeLanes }, (_, lane) => {
    const word = offset + stride * lane, byte = word * 4;
    return { lane, word, byte, sector: Math.floor(byte / 32), bank: word % 32 };
  });
  const sectors = [...new Set(lanes.map(l => l.sector))];
  const distinctWords = new Set(lanes.map(l => l.word)).size;
  const banks = Array.from({ length: 32 }, (_, bank) => [...new Set(lanes.filter(l => l.bank === bank).map(l => l.word))]);
  return { lanes, sectors, distinctWords, sectorBytes: sectors.length * 32, usefulBytes: distinctWords * 4,
    utilization: distinctWords * 4 / (sectors.length * 32), bankConflictDegree: Math.max(...banks.map(b => b.length)), banks };
}

export function reductionStages(values: readonly number[], width = 8) {
  integer(width, "Reduction width", 1, 1024);
  if ((width & (width - 1)) !== 0 || values.length > width || values.some(v => !Number.isFinite(v))) throw new Error("Use a power-of-two width and finite values that fit.");
  const stages = [{ stride: 0, values: Array.from({ length: width }, (_, i) => values[i] ?? 0), active: width }];
  for (let stride = width / 2; stride >= 1; stride /= 2) {
    const previous = stages.at(-1)!.values;
    stages.push({ stride, values: previous.map((v, i) => i < stride ? v + previous[i + stride] : v), active: stride });
  }
  return stages;
}

function finiteVector(x: readonly number[], name: string) {
  if (!x.length || x.some(v => !Number.isFinite(v))) throw new Error(`${name} must be nonempty and finite.`);
}
export function stableSoftmax(x: readonly number[]) {
  finiteVector(x, "Logits");
  const max = Math.max(...x), exp = x.map(v => Math.exp(v - max)), sum = exp.reduce((s, v) => s + v, 0);
  return exp.map(v => v / sum);
}
export function softmaxBackward(y: readonly number[], dy: readonly number[]) {
  finiteVector(y, "Probabilities"); finiteVector(dy, "Upstream gradient");
  if (y.length !== dy.length) throw new Error("Gradient shape must agree.");
  const dot = y.reduce((s, v, i) => s + v * dy[i], 0);
  return y.map((v, i) => v * (dy[i] - dot));
}
export function rmsNorm(x: readonly number[], weight: readonly number[], epsilon = 1e-5) {
  finiteVector(x, "Input"); finiteVector(weight, "Weight");
  if (x.length !== weight.length || !Number.isFinite(epsilon) || epsilon <= 0) throw new Error("RMSNorm requires matching shapes and positive epsilon.");
  const inv = 1 / Math.sqrt(x.reduce((s, v) => s + v * v, 0) / x.length + epsilon);
  return { inv, y: x.map((v, i) => v * inv * weight[i]) };
}
export function rmsNormBackward(x: readonly number[], weight: readonly number[], dy: readonly number[], epsilon = 1e-5) {
  finiteVector(dy, "Upstream gradient");
  if (x.length !== dy.length) throw new Error("Gradient shape must agree.");
  const { inv } = rmsNorm(x, weight, epsilon), dot = x.reduce((s, v, i) => s + v * dy[i] * weight[i], 0);
  return { dx: x.map((v, i) => inv * dy[i] * weight[i] - v * inv ** 3 * dot / x.length), dw: x.map((v, i) => dy[i] * v * inv) };
}
