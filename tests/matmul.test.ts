import { test } from "node:test";
import assert from "node:assert/strict";
import {
  matmulFrame,
  matmulReference,
  matmulOperands,
  type MatmulConfig,
} from "../src/matmul-math.ts";

test("every tiled output matches direct multiplication, including masked edges", () => {
  for (const [m, n, k] of [
    [4, 4, 6],
    [3, 3, 5],
    [1, 5, 1],
    [5, 2, 7],
  ])
    for (const tile of [2, 4]) {
      const base = { m, n, k, tile, row: 0, col: 0 };
      const { a, b } = matmulOperands(base),
        expected = matmulReference(a, b);
      for (let row = 0; row < m; row++)
        for (let col = 0; col < n; col++) {
          const config = { ...base, row, col };
          assert.equal(
            matmulFrame(config, Math.ceil(k / tile) * 4 + 1).selectedValue,
            expected[row][col],
          );
        }
    }
});
test("loads and barriers leave sums unchanged; accumulation advances only one K tile", () => {
  const config: MatmulConfig = { m: 4, n: 4, k: 6, tile: 2, row: 0, col: 0 };
  const start = matmulFrame(config, 0),
    load = matmulFrame(config, 1),
    barrier = matmulFrame(config, 2),
    compute = matmulFrame(config, 3),
    release = matmulFrame(config, 4);
  assert.equal(start.stagedReads, 0);
  assert.equal(load.stagedReads, 8);
  assert.equal(load.selectedValue, 0);
  assert.equal(barrier.selectedValue, 0);
  assert.equal(compute.completedK, 2);
  assert.equal(release.selectedValue, compute.selectedValue);
  assert.equal(
    compute.selectedValue,
    compute.terms.reduce((s, t) => s + t.a * t.b, 0),
  );
  assert.equal(matmulFrame(config, 5).selectedValue, compute.selectedValue);
  assert.equal(matmulFrame(config, 13).stores, 4);
});
test("tail tiles zero fill invalid operands and mask stores, without pretending padded work is useful", () => {
  const config: MatmulConfig = { m: 3, n: 3, k: 5, tile: 2, row: 2, col: 2 };
  const last = matmulFrame(config, 13);
  assert.equal(last.sharedA[0][1], 0);
  assert.deepEqual(last.sharedA[1], [0, 0]);
  assert.deepEqual(last.sharedB[1], [0, 0]);
  assert.equal(last.sharedB[0][1], 0);
  assert.equal(last.stores, 1);
  assert.equal(last.stagedReads, 10);
  assert.equal(last.usefulFlops, 10);
  assert.equal(last.scheduledFlops, 48);
  assert.equal(last.reuseFactor, 1);
});
test("a full 2x2 output tile halves logical input loads, excluding caches and output stores", () => {
  const frame = matmulFrame({ m: 4, n: 4, k: 6, tile: 2, row: 1, col: 1 }, 13);
  assert.equal(frame.naiveReads, 48);
  assert.equal(frame.fullStagedReads, 24);
  assert.equal(frame.reuseFactor, 2);
});
test("matrix lesson rejects invalid shapes, output coordinates and steps", () => {
  const config = { m: 4, n: 4, k: 6, tile: 2, row: 0, col: 0 };
  assert.throws(() => matmulFrame({ ...config, row: 4 }, 0));
  assert.throws(() => matmulFrame({ ...config, tile: 0 }, 0));
  assert.throws(() => matmulFrame(config, 14));
  assert.throws(() => matmulFrame(config, -1));
  assert.throws(() => matmulReference([[1, 2]], [[1]]));
});
