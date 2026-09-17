import test from "node:test";
import assert from "node:assert/strict";
import { kvTransferBudget } from "../src/disaggregation-math.ts";

const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-10, `${a} != ${b}`);
const dot = (a: number[], b: number[]) => a.reduce((sum, value, i) => sum + value * b[i], 0);
const mv = (w: number[][], x: number[]) => w.map(row => dot(row, x));
const transpose = (w: number[][]) => w[0].map((_, column) => w.map(row => row[column]));
const weighted = (rows: number[][], weights: number[]) => rows[0].map((_, j) => rows.reduce((sum, row, i) => sum + weights[i] * row[j], 0));

test("MLA teaching absorption matches separately expanded keys and values for rectangular projections", () => {
  const wk = [[1, 0], [0, 1], [1, 1]], wv = [[2, 6]];
  for (const cache of [[[1, 0], [0, 1]], [[2, -1], [-3, 4], [0.5, 2]]]) {
    for (const q of [[Math.log(3), 0, 0], [2, -1, 0.5]]) {
      const expandedScores = cache.map(c => dot(q, mv(wk, c)));
      const latentScores = cache.map(c => dot(mv(transpose(wk), q), c));
      expandedScores.forEach((score, i) => close(score, latentScores[i]));
      const exp = expandedScores.map(score => Math.exp(score - Math.max(...expandedScores)));
      const p = exp.map(value => value / exp.reduce((a, b) => a + b, 0));
      const expanded = weighted(cache.map(c => mv(wv, c)), p);
      const absorbed = mv(wv, weighted(cache, p));
      expanded.forEach((value, i) => close(value, absorbed[i]));
      if (cache.length === 2 && q[1] === 0) close(absorbed[0], 3);
    }
  }
});

test("normalized recurrent accumulation equals explicit similarity-weighted history and exposes collisions", () => {
  const keys = [[1, 0], [0, 1], [0.5, 0.5]], values = [[2, -1], [6, 3], [4, 2]];
  let state = [[0, 0], [0, 0]], normalizer = [0, 0];
  keys.forEach((key, t) => {
    state = state.map((row, j) => row.map((value, k) => value + values[t][j] * key[k]));
    normalizer = normalizer.map((value, k) => value + key[k]);
    for (const query of [[1, 0], [1, 1]]) {
      const weights = keys.slice(0, t + 1).map(k => dot(k, query));
      const total = weights.reduce((a, b) => a + b, 0);
      const explicit = weighted(values.slice(0, t + 1), weights.map(w => w / total));
      mv(state, query).forEach((value, j) => close(value / dot(normalizer, query), explicit[j]));
    }
  });
  // Both histories have the same fixed summary for one shared address.
  const readSharedAddress = (history: number[]) => history.reduce((a, b) => a + b, 0) / history.length;
  close(readSharedAddress([2, 6]), 4);
  close(readSharedAddress([3, 5]), 4);
});

test("a delta write overwrites a unit key only under the declared write strength", () => {
  const state = [[2, 6], [-1, 3]], key = [1, 0], value = [9, 4];
  const update = (beta: number) => state.map((row, j) => row.map((old, k) => old + beta * (value[j] - dot(row, key)) * key[k]));
  mv(update(1), key).forEach((v, i) => close(v, value[i]));
  assert.deepEqual(mv(update(1), [0, 1]), mv(state, [0, 1]));
  mv(update(0.5), key).forEach((v, i) => close(v, (mv(state, key)[i] + value[i]) / 2));
  assert.notDeepEqual(mv(update(1), [1, 1]), mv(state, [1, 1]));
});

test("frontier payload examples retain both K/V, hybrid state and scale metadata", () => {
  const expanded = 2 * 32 * 32768 * 64 * 128 * 2;
  const latent = 32 * 32768 * (512 + 64) * 2;
  assert.equal(expanded / 2 ** 30, 32);
  assert.equal(latent / 2 ** 30, 1.125);
  assert.equal(24 * 16 * 128 ** 2 * 4 / 2 ** 20, 24);
  assert.equal(2 * 8 * 8 * 128 * 32768 * 2 / 2 ** 30, 1);
  assert.equal(4096 ** 2 / 2 + 4096 ** 2 / 128 * 4, 8.5 * 2 ** 20);
  assert.equal(1024 ** 2 / 2 + 1024 ** 2 / 16 + 4, 589828);
});

test("handoff amortization counts decode intervals after the prefill-produced first token", () => {
  const transfer = kvTransferBudget({layers: 80, kvHeads: 8, headDim: 128, bytesPerElement: 2,
    tokens: 32768, cachedTokens: 0, blockTokens: 16, linkGBps: 35, setupMs: 0, overlapMs: 0});
  close(transfer.wireBytes / 2 ** 30, 10);
  const saved = (outputs: number) => (outputs - 1) * (10 - 6);
  assert.ok(saved(77) < transfer.payloadMs);
  assert.ok(saved(78) > transfer.payloadMs);
});
