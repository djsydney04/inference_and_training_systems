export interface UniformQuantizer {
  scale: number;
  zeroPoint: number;
  qmin: number;
  qmax: number;
}

/** Nearest integer, exact half-way cases to even; unlike JavaScript Math.round. */
export function roundTiesToEven(value: number): number {
  if (!Number.isFinite(value)) throw new Error("Rounding requires a finite value");
  const lower = Math.floor(value), fraction = value - lower;
  const result = fraction < 0.5 ? lower : fraction > 0.5 ? lower + 1 : lower % 2 === 0 ? lower : lower + 1;
  return result === 0 ? 0 : result;
}

export function quantizeScalar(value: number, format: UniformQuantizer) {
  const { scale, zeroPoint, qmin, qmax } = format;
  if (!Number.isFinite(value) || !Number.isFinite(scale) || scale <= 0
    || ![zeroPoint, qmin, qmax].every(Number.isSafeInteger) || qmin >= qmax
    || qmin < -65536 || qmax > 65535 || zeroPoint < qmin || zeroPoint > qmax)
    throw new Error("Invalid scalar or quantization format");
  const low = scale * (qmin - zeroPoint), high = scale * (qmax - zeroPoint);
  if (![low, high].every(Number.isFinite)) throw new Error("The representable endpoints must be finite");
  // Saturate before division outside the grid, avoiding overflow for huge finite inputs.
  const code = value < low ? qmin : value > high ? qmax
    : Math.min(qmax, Math.max(qmin, roundTiesToEven(value / scale) + zeroPoint));
  const reconstructed = scale * (code - zeroPoint);
  return { code, reconstructed, error: reconstructed - value, clipped: value < low || value > high };
}

function matrixShape(matrix: readonly (readonly number[])[]) {
  const columns = matrix[0]?.length;
  if (!matrix.length || !columns || matrix.some(row => row.length !== columns || row.some(value => !Number.isFinite(value))))
    throw new Error("Expected a nonempty, finite rectangular matrix");
  return { rows: matrix.length, columns };
}

/** W[out,in], groups across input columns, symmetric narrow range with one unused code. */
export function quantizeGroupedWeights(
  weights: readonly (readonly number[])[], bits: number, groupSize: number,
  channelScales: readonly number[] = Array(weights[0]?.length ?? 0).fill(1),
) {
  const { rows, columns } = matrixShape(weights);
  if (!Number.isInteger(bits) || bits < 2 || bits > 8 || !Number.isInteger(groupSize) || groupSize < 1 || groupSize > columns
    || channelScales.length !== columns || channelScales.some(scale => !Number.isFinite(scale) || scale <= 0))
    throw new Error("Invalid width, group size or channel transform");
  const limit = 2 ** (bits - 1) - 1;
  const transformed = weights.map(row => row.map((weight, j) => weight * channelScales[j]));
  if (transformed.flat().some(value => !Number.isFinite(value))) throw new Error("Channel scaling overflowed");
  const codes: number[][] = [], scales: number[][] = [], reconstructed: number[][] = [];
  for (const row of transformed) {
    const rowCodes: number[] = [], rowScales: number[] = [], rowReconstructed: number[] = [];
    for (let start = 0; start < columns; start += groupSize) {
      const group = row.slice(start, start + groupSize);
      const max = Math.max(...group.map(Math.abs));
      const scale = max === 0 ? 1 : max / limit;
      rowScales.push(scale);
      group.forEach((value, offset) => {
        const quantized = quantizeScalar(value, { scale, zeroPoint: 0, qmin: -limit, qmax: limit });
        rowCodes.push(quantized.code);
        rowReconstructed.push(quantized.reconstructed / channelScales[start + offset]);
      });
    }
    codes.push(rowCodes); scales.push(rowScales); reconstructed.push(rowReconstructed);
  }
  return { codes, scales, reconstructed, transformed,
    payloadBytes: Math.ceil(rows * columns * bits / 8),
    // Storage estimate only: four-byte scales. Arithmetic above uses JS float64.
    scaleBytes: rows * Math.ceil(columns / groupSize) * 4,
  };
}

export function matvec(weights: readonly (readonly number[])[], input: readonly number[]) {
  const { columns } = matrixShape(weights);
  if (input.length !== columns || input.some(value => !Number.isFinite(value))) throw new Error("Input shape or values do not match W");
  return weights.map(row => row.reduce((sum, value, j) => sum + value * input[j], 0));
}

export function meanSquaredError(reference: readonly number[], candidate: readonly number[]) {
  if (!reference.length || reference.length !== candidate.length || [...reference, ...candidate].some(value => !Number.isFinite(value)))
    throw new Error("MSE requires equally sized finite, nonempty vectors");
  return reference.reduce((sum, value, i) => sum + (candidate[i] - value) ** 2, 0) / reference.length;
}

/** Scalar one-head attention, d=1, no masking. Isolates K and V error pathways. */
export function scalarAttention(query: number, keys: readonly number[], values: readonly number[]) {
  if (!Number.isFinite(query) || !keys.length || keys.length !== values.length || [...keys, ...values].some(value => !Number.isFinite(value)))
    throw new Error("Invalid scalar attention inputs");
  const scores = keys.map(key => key * query);
  if (scores.some(score => !Number.isFinite(score))) throw new Error("Attention scores overflowed");
  const max = Math.max(...scores), unnormalized = scores.map(score => Math.exp(score - max));
  const sum = unnormalized.reduce((total, value) => total + value, 0);
  const probabilities = unnormalized.map(value => value / sum);
  return { probabilities, output: probabilities.reduce((total, p, i) => total + p * values[i], 0) };
}
