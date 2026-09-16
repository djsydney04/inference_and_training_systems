import { test } from "node:test";
import assert from "node:assert/strict";
import { tensorAddress, warpAccess, reductionStages, stableSoftmax, softmaxBackward, rmsNorm, rmsNormBackward } from "../src/cuda-math.ts";

const close = (a: number, b: number, tolerance = 1e-7) => assert.ok(Math.abs(a - b) <= tolerance, `${a} != ${b}`);
test("tensor views preserve physical addresses through transpose and padding", () => {
  for (let row = 0; row < 3; row++) for (let col = 0; col < 5; col++) {
    assert.equal(tensorAddress(3, 5, 8, 1, row, col).offset, tensorAddress(5, 3, 1, 8, col, row).offset);
  }
  assert.deepEqual(tensorAddress(3, 5, 8, 1, 2, 4), { offset: 20, byteOffset: 80, allocationElements: 21 });
  assert.equal(tensorAddress(3, 5, 0, 1, 2, 4).offset, 4);
  assert.throws(() => tensorAddress(3, 5, 5, 1, 3, 0));
});
test("warp sectors distinguish alignment, stride, active masks and broadcast", () => {
  assert.equal(warpAccess(1, 0).sectors.length, 4);
  assert.equal(warpAccess(1, 1).sectors.length, 5);
  assert.equal(warpAccess(2, 0).utilization, 0.5);
  assert.equal(warpAccess(32, 0).sectors.length, 32);
  assert.equal(warpAccess(0, 0).distinctWords, 1);
  assert.equal(warpAccess(1, 0, 7).usefulBytes, 28);
});
test("shared bank conflict accounting recognizes same-word broadcast", () => {
  assert.equal(warpAccess(0, 0).bankConflictDegree, 1);
  assert.equal(warpAccess(1, 0).bankConflictDegree, 1);
  assert.equal(warpAccess(2, 0).bankConflictDegree, 2);
  assert.equal(warpAccess(32, 0).bankConflictDegree, 32);
  assert.equal(warpAccess(33, 0).bankConflictDegree, 1);
  assert.throws(() => warpAccess(1, 0, 33));
});
test("reduction every stage consumes the previous snapshot with zero padding", () => {
  const frames = reductionStages([1, 2, 3, 4, 5], 8);
  assert.deepEqual(frames[1].values.slice(0, 4), [6, 2, 3, 4]);
  assert.deepEqual(frames[2].values.slice(0, 2), [9, 6]);
  assert.equal(frames.at(-1)!.values[0], 15);
  for (let n = 0; n <= 16; n++) {
    const input = Array.from({ length: n }, (_, i) => i - 7);
    assert.equal(reductionStages(input, 16).at(-1)!.values[0], input.reduce((s, v) => s + v, 0));
  }
  assert.throws(() => reductionStages([1], 7));
  assert.throws(() => reductionStages([NaN], 8));
});
test("stable softmax preserves a large-logit translation and sums to one", () => {
  const a = stableSoftmax([1, 2, -3]), b = stableSoftmax([10001, 10002, 9997]);
  a.forEach((v, i) => close(v, b[i])); close(a.reduce((s, v) => s + v, 0), 1);
  assert.throws(() => stableSoftmax([-Infinity, -Infinity]));
  assert.deepEqual(stableSoftmax([42]), [1]);
  assert.deepEqual(softmaxBackward([1], [7]), [0]);
});
test("softmax vector-Jacobian product agrees with independent central differences", () => {
  const x = [0.2, -0.7, 2.1, 1.5, -3], dy = [1, -2, 0.3, 0.7, 1.2], dx = softmaxBackward(stableSoftmax(x), dy), h = 1e-5;
  const objective = (z: number[]) => stableSoftmax(z).reduce((s, v, i) => s + v * dy[i], 0);
  x.forEach((_, i) => { const a = [...x], b = [...x]; a[i] += h; b[i] -= h; close(dx[i], (objective(a) - objective(b)) / (2 * h)); });
  close(dx.reduce((s, v) => s + v, 0), 0);
});
test("RMSNorm input and weight derivatives agree with finite differences including zero input", () => {
  for (const x of [[0, 0, 0], [0.4, -1.2, 2.7]]) {
    const w = [1, 0.6, -0.4], dy = [-1, 0.2, 0.7], h = 1e-6, { dx, dw } = rmsNormBackward(x, w, dy);
    const objective = (a: number[], b: number[]) => rmsNorm(a, b).y.reduce((s, v, i) => s + v * dy[i], 0);
    x.forEach((_, i) => {
      const xp = [...x], xm = [...x], wp = [...w], wm = [...w]; xp[i] += h; xm[i] -= h; wp[i] += h; wm[i] -= h;
      close(dx[i], (objective(xp, w) - objective(xm, w)) / (2 * h), 1e-5);
      close(dw[i], (objective(x, wp) - objective(x, wm)) / (2 * h));
    });
  }
  assert.throws(() => rmsNorm([1], [1], 0));
  assert.throws(() => rmsNormBackward([1], [1], [1, 2]));
});
test("shared RMSNorm weight gradient sums all token-row contributions", () => {
  const rows = [[0.2, -0.7, 1.1], [2.3, 0.4, -1.8]], w = [0.6, 1.2, -0.4], dy = [[0.2, -0.1, 0.8], [1.3, -0.7, 0.3]], h = 1e-5;
  const sumDw = rows.map((x, row) => rmsNormBackward(x, w, dy[row]).dw).reduce((sum, contribution) => sum.map((v, i) => v + contribution[i]), [0, 0, 0]);
  const objective = (weight: number[]) => rows.reduce((total, x, row) => total + rmsNorm(x, weight).y.reduce((s, v, i) => s + v * dy[row][i], 0), 0);
  w.forEach((_, i) => { const a = [...w], b = [...w]; a[i] += h; b[i] -= h; close(sumDw[i], (objective(a) - objective(b)) / (2 * h)); });
});
