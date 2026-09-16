import test from "node:test";
import assert from "node:assert/strict";
import { acceptanceSurvival, committedTreeSlots, compareSpeculationDepths, draftTreeLayout, survivalFromHistogram } from "../src/speculation-frontier-math.ts";

const parents = [null, null, 0, 0, 1, 2, 4];
const close = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 1e-12, `${actual} != ${expected}`);

test("tree attention scores match separate causal paths and exclude siblings", () => {
  const tree = draftTreeLayout(parents, 4);
  assert.deepEqual(tree.positions, [4, 4, 5, 5, 5, 6, 6]);
  assert.deepEqual(tree.storageSlots, [4, 5, 6, 7, 8, 9, 10]);
  // A real scalar attention calculation: masked packed execution must equal path execution.
  const keys = [0.2, -0.5, 1.3, 0.1, -1.1, 0.7, 2.1, -0.3, 0.6, 1.6, -0.8];
  const values = keys.map((_, index) => 3 * index - 7);
  const attend = (slots: number[], query: number, v: number[]) => {
    const scores = slots.map(index => Math.exp(query * keys[index]));
    return scores.reduce((sum, score, i) => sum + score * v[slots[i]], 0) / scores.reduce((sum, score) => sum + score, 0);
  };
  for (let i = 0; i < parents.length; i++) {
    const expectedPath: number[] = [];
    let node: number | null = i;
    while (node !== null) { expectedPath.unshift(4 + node); node = parents[node]; }
    const packed = [0, 1, 2, 3, ...tree.mask[i].flatMap((visible, index) => visible ? [4 + index] : [])];
    close(attend(packed, 0.1 + i, values), attend([0, 1, 2, 3, ...expectedPath], 0.1 + i, values));
  }
  // Alter sibling B's value drastically. F (A→C→F) must remain unchanged.
  const fSlots = [0, 1, 2, 3, 4, 6, 9];
  const perturbed = [...values]; perturbed[5] = 1e9;
  close(attend(fSlots, 0.8, values), attend(fSlots, 0.8, perturbed));
  assert.equal(tree.mask[5][1], false);
  assert.equal(tree.mask[5][3], false);
});

test("commit gathers ancestry in causal order even when storage is interleaved", () => {
  assert.deepEqual(committedTreeSlots(parents, 4, 5), [4, 6, 9]);
  assert.deepEqual(committedTreeSlots(parents, 4, 6), [5, 8, 10]);
  assert.deepEqual(committedTreeSlots(parents, 4, 1), [5]);
});

test("tail-sum expectation agrees with enumeration of every first-rejection outcome", () => {
  const alpha = [0.9, 0.75, 0.4, 0.2];
  const survival = acceptanceSurvival(alpha);
  let reach = 1, explicitMean = 0, totalMass = 0;
  for (let a = 0; a < alpha.length; a++) {
    const probability = reach * (1 - alpha[a]);
    explicitMean += probability * (a + 1); totalMass += probability; reach *= alpha[a];
  }
  explicitMean += reach * (alpha.length + 1); totalMass += reach;
  close(totalMass, 1);
  close(1 + survival.reduce((sum, value) => sum + value, 0), explicitMean);
  const histogram = [2, 3, 1, 4];
  const observed = survivalFromHistogram(histogram);
  assert.deepEqual(observed, [0.8, 0.5, 0.4]);
  close(1 + observed.reduce((sum, value) => sum + value, 0), histogram.reduce((sum, count, accepted) => sum + count * (accepted + 1), 0) / 10);
});

test("extra depth can increase tokens per round while making time per token worse", () => {
  const rows = compareSpeculationDepths([1, 0.9, 0.05], [
    {draftMs: 1, verifyMs: 8, overheadMs: 0.5},
    {draftMs: 2, verifyMs: 8.3, overheadMs: 0.5},
    {draftMs: 3, verifyMs: 9, overheadMs: 0.5},
  ], 8);
  assert.ok(rows[2].expectedTokens > rows[1].expectedTokens);
  assert.ok(rows[2].msPerToken > rows[1].msPerToken);
  assert.ok(rows[1].msPerToken < rows[0].msPerToken);
  const zero = compareSpeculationDepths([0, 1], [
    {draftMs: 1, verifyMs: 8, overheadMs: 0}, {draftMs: 2, verifyMs: 8, overheadMs: 0},
  ], 8);
  assert.deepEqual(zero.map(row => row.expectedTokens), [1, 1]);
  assert.ok(zero.every(row => row.ratio < 1));
});

test("malformed trees, probabilities, timings and censuses fail visibly", () => {
  for (const invalid of [[0], [1, null], [null, -1], [null, 0.5]]) assert.throws(() => draftTreeLayout(invalid, 4));
  assert.throws(() => draftTreeLayout([], 4));
  assert.throws(() => draftTreeLayout(parents, 0));
  assert.throws(() => committedTreeSlots(parents, 4, 7));
  assert.throws(() => acceptanceSurvival([NaN]));
  assert.throws(() => acceptanceSurvival([1.1]));
  assert.throws(() => survivalFromHistogram([0, 0]));
  assert.throws(() => survivalFromHistogram([1, -2]));
  assert.throws(() => compareSpeculationDepths([0.5], [], 8));
  assert.throws(() => compareSpeculationDepths([0.5], [{draftMs: 1, verifyMs: 0, overheadMs: 1}], 8));
});
