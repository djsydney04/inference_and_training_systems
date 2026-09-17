import test from "node:test";
import assert from "node:assert/strict";
import { matvec, meanSquaredError, quantizeGroupedWeights, quantizeScalar, roundTiesToEven, scalarAttention } from "../src/quantization-math.ts";

const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-11, `${a} != ${b}`);

test("nearest-even rounds signed ties before adding an odd zero point", () => {
  assert.deepEqual([-3.5, -2.5, -1.5, -0.5, 0.5, 1.5, 2.5, 3.5].map(roundTiesToEven), [-4, -2, -2, 0, 0, 2, 2, 4]);
  const format = {scale: 0.5, zeroPoint: 3, qmin: 0, qmax: 7};
  assert.equal(quantizeScalar(0.25, format).code, 3);
  assert.equal(quantizeScalar(0.75, format).code, 5);
  assert.equal(quantizeScalar(0, format).reconstructed, 0);
});

test("scalar quantization agrees with exhaustive nearest-code search, including clipping", () => {
  for (const zeroPoint of [0, 3, 7]) for (const scale of [0.125, 0.5, 2]) for (let n = -160; n <= 160; n++) {
    const value = n / 16, format = {scale, zeroPoint, qmin: 0, qmax: 7};
    const ranked = Array.from({length: 8}, (_, code) => ({ code, distance: Math.abs(value - scale * (code - zeroPoint)), parity: Math.abs((code - zeroPoint) % 2) }))
      .sort((a, b) => a.distance - b.distance || a.parity - b.parity);
    const actual = quantizeScalar(value, format);
    assert.equal(actual.code, ranked[0].code);
    if (!actual.clipped) assert.ok(Math.abs(actual.error) <= scale / 2);
  }
  assert.equal(quantizeScalar(1e300, {scale: 1e-100, zeroPoint: 0, qmin: -7, qmax: 7}).code, 7);
});

test("grouped reconstruction retains group ownership, tail groups and zero groups", () => {
  const result = quantizeGroupedWeights([[1, 2, 7, 0, 0]], 4, 2);
  assert.deepEqual(result.codes, [[4, 7, 7, 0, 0]]);
  assert.deepEqual(result.scales, [[2 / 7, 1, 1]]);
  close(result.reconstructed[0][0], 8 / 7);
  assert.equal(result.payloadBytes, 3); assert.equal(result.scaleBytes, 12);
  assert.deepEqual(quantizeGroupedWeights([[0, 0]], 4, 2).reconstructed, [[0, 0]]);
  const single = quantizeGroupedWeights([[0.3, -12, 0.07]], 4, 1);
  single.reconstructed[0].forEach((value, i) => close(value, [0.3, -12, 0.07][i]));
});

test("less weight MSE can produce nine times more squared output error", () => {
  const w = [0.49, 1.04];
  const a = w.map(value => quantizeScalar(value, {scale: 0.5, zeroPoint: 0, qmin: -7, qmax: 7}).reconstructed);
  const b = w.map(value => quantizeScalar(value, {scale: 0.52, zeroPoint: 0, qmin: -7, qmax: 7}).reconstructed);
  assert.ok(meanSquaredError(w, b) < meanSquaredError(w, a));
  const y = matvec([w], [1, 0]);
  close(meanSquaredError(y, matvec([b], [1, 0])), 9 * meanSquaredError(y, matvec([a], [1, 0])));
});

test("channel scaling is exact before quantization and must be undone in the activation path", () => {
  const w = [[0.49, 1.04, 0.11, 4.2], [-0.31, 0.77, -0.52, -3.6]], x = [8, 0.1, 0.1, 0.1], s = [8, 1, 1, 1];
  const result = quantizeGroupedWeights(w, 3, 4, s);
  const original = matvec(w, x), transformed = matvec(result.transformed, x.map((value, i) => value / s[i]));
  transformed.forEach((value, i) => close(value, original[i]));
  const stored = result.codes.map((row, i) => row.map(value => value * result.scales[i][0]));
  matvec(stored, x.map((value, i) => value / s[i])).forEach((value, i) => close(value, matvec(result.reconstructed, x)[i]));
  const raw = quantizeGroupedWeights(w, 3, 4);
  assert.ok(meanSquaredError(original, matvec(result.reconstructed, x)) < meanSquaredError(original, matvec(raw.reconstructed, x)));
});

test("K error changes attention probabilities; V error need not", () => {
  const full = scalarAttention(1, [0, 1], [0, 10]);
  const k = scalarAttention(1, [0, 0], [0, 10]);
  const v = scalarAttention(1, [0, 1], [0, 8]);
  close(full.output, 10 * Math.E / (1 + Math.E)); close(k.output, 5);
  assert.deepEqual(v.probabilities, full.probabilities);
  assert.notDeepEqual(k.probabilities, full.probabilities);
  close(v.output, full.output * 0.8);
});

test("invalid scales, shapes and nonfinite inputs fail explicitly", () => {
  assert.throws(() => quantizeScalar(0, {scale: 0, zeroPoint: 0, qmin: -7, qmax: 7}));
  assert.throws(() => quantizeScalar(0, {scale: 1, zeroPoint: 8, qmin: 0, qmax: 7}));
  assert.throws(() => quantizeGroupedWeights([[1], [1, 2]], 4, 1));
  assert.throws(() => quantizeGroupedWeights([[1, 2]], 1, 1));
  assert.throws(() => matvec([[1, 2]], [1]));
  assert.throws(() => scalarAttention(1, [], []));
  assert.throws(() => meanSquaredError([NaN], [0]));
});
