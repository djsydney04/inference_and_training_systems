import test from "node:test";
import assert from "node:assert/strict";
import { groupedMoe, routeTokens, limitCapacity, moeBackward, expertTraffic, switchBalance,
  moeExampleInputs as x, moeExampleExperts as w, moeExampleLogits as z } from "../src/moe-execution-math.ts";

const close = (a: number, b: number, tolerance = 1e-10) => assert.ok(Math.abs(a - b) < tolerance, `${a} != ${b}`);
const compare = (a: number[][], b: number[][]) => a.forEach((row, i) => row.forEach((value, j) => close(value, b[i][j])));
// Independent dense reference evaluates every expert for every token, then masks.
function dense(inputs: number[][], weights: number[][][], logits: number[][], k = 2, normalize = true) {
  return inputs.map((row, t) => {
    const ids = logits[t].map((_, e) => e).sort((a, b) => logits[t][b] - logits[t][a] || a - b).slice(0, k);
    const exps = logits[t].map(value => Math.exp(value - Math.max(...logits[t])));
    const denominator = (normalize ? ids.map(e => exps[e]) : exps).reduce((a, b) => a + b, 0);
    const all = weights.map(expert => expert[0].map((_, j) => row.reduce((sum, value, i) => sum + value * expert[i][j], 0)));
    return all[0].map((_, j) => ids.reduce((sum, e) => sum + exps[e] / denominator * all[e][j], 0));
  });
}

test("MoE pack/group/inverse combine matches hand calculation and independent dense execution", () => {
  const plan = routeTokens(z, 2), result = groupedMoe(x, w, plan.routes);
  assert.deepEqual(plan.counts, [2, 4, 2]);
  assert.deepEqual(result.packed.map(r => r.token), [0, 3, 0, 1, 2, 3, 1, 2]);
  compare(result.outputs, [[4/3, 2], [23/8, 11/8], [1/3, -5/9], [13/9, -1]]);
  compare(result.outputs, dense(x, w, z));
  compare(groupedMoe(x, w, [...plan.routes].reverse()).outputs, result.outputs);
  for (const order of [[3, 2, 0, 1], [1, 0, 3, 2]]) {
    compare(groupedMoe(order.map(i => x[i]), w, routeTokens(order.map(i => z[i]), 2).routes).outputs, order.map(i => result.outputs[i]));
  }
});

test("capacity admission is explicit and survivor renormalization changes the output", () => {
  const plan = routeTokens(z, 2), limited = limitCapacity(plan, 2, false), renormalized = limitCapacity(plan, 2, true);
  assert.deepEqual(limited.counts, [2, 2, 2]);
  assert.deepEqual(limited.dropped.map(r => [r.token, r.expert]), [[2, 1], [3, 1]]);
  compare(groupedMoe(x, w, limited.routes).outputs.slice(2), [[7/9, -7/9], [5/9, -5/9]]);
  compare(groupedMoe(x, w, renormalized.routes).outputs.slice(2), [[1, -1], [1, -1]]);
  const skew = routeTokens(x.map(() => [2, 1, 0]), 1), empty = limitCapacity(skew, 2, true);
  assert.deepEqual(empty.emptyTokens, [2, 3]);
  compare(groupedMoe(x, w, empty.routes).outputs.slice(2), [[0, 0], [0, 0]]);
  assert.deepEqual(limitCapacity(plan, 0, true).routes, []);
});

test("expert placement changes traffic but not expert functions or inverse gather", () => {
  const routes = routeTokens(z, 2).routes;
  const original = expertTraffic(routes, [0, 0, 1, 1], [0, 1, 0], 2, 4);
  const moved = expertTraffic(routes, [0, 0, 1, 1], [0, 0, 1], 2, 4);
  assert.deepEqual(original.counts, [[2, 2], [2, 2]]);
  assert.equal(original.oneWayBytes, 32);
  assert.deepEqual(moved.counts, [[3, 1], [3, 1]]);
  assert.equal(moved.oneWayBytes, 32); // Same total, but the busiest destination changes.
});

test("backward scatter-add and router derivatives match dense finite differences", () => {
  const u = [[.4, -.2], [.1, .8], [-.3, .7], [1.1, -.6]], epsilon = 1e-5;
  const loss = (a: number[][], b: number[][][], c: number[][], normalize: boolean) =>
    dense(a, b, c, 2, normalize).reduce((sum, row, t) => sum + row.reduce((v, y, j) => v + y*u[t][j], 0), 0);
  for (const normalize of [true, false]) {
    const result = moeBackward(x, w, routeTokens(z, 2, normalize), u);
    for (let t = 0; t < x.length; t++) for (let d = 0; d < x[0].length; d++) {
      const plus = structuredClone(x), minus = structuredClone(x); plus[t][d] += epsilon; minus[t][d] -= epsilon;
      close((loss(plus, w, z, normalize)-loss(minus, w, z, normalize))/(2*epsilon), result.dInputs[t][d], 1e-8);
    }
    for (let e = 0; e < w.length; e++) for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      const plus = structuredClone(w), minus = structuredClone(w); plus[e][i][j] += epsilon; minus[e][i][j] -= epsilon;
      close((loss(x, plus, z, normalize)-loss(x, minus, z, normalize))/(2*epsilon), result.dExperts[e][i][j], 1e-8);
    }
    for (let t = 0; t < z.length; t++) for (let e = 0; e < z[0].length; e++) {
      const plus = structuredClone(z), minus = structuredClone(z); plus[t][e] += epsilon; minus[t][e] -= epsilon;
      close((loss(x, w, plus, normalize)-loss(x, w, minus, normalize))/(2*epsilon), result.dLogits[t][e], 1e-8);
    }
  }
});

test("selected-normalized top-one gate has zero task derivative, full-softmax gate does not", () => {
  const upstream = x.map(() => [1, 1]);
  assert.ok(moeBackward(x, w, routeTokens(z, 1, true), upstream).dLogits.flat().every(v => v === 0));
  assert.ok(moeBackward(x, w, routeTokens(z, 1, false), upstream).dLogits.flat().some(v => Math.abs(v) > .1));
});

test("Switch auxiliary derivative matches fixed-assignment finite differences", () => {
  const logits = [[2, 1, 0], [3, .5, -.2], [.2, 1, 0], [1, 0, -.5]], result = switchBalance(logits), eps = 1e-5;
  assert.deepEqual(result.fractions, [.75, .25, 0]);
  for (let t = 0; t < 4; t++) for (let e = 0; e < 3; e++) {
    const plus = structuredClone(logits), minus = structuredClone(logits); plus[t][e] += eps; minus[t][e] -= eps;
    close((switchBalance(plus).loss-switchBalance(minus).loss)/(2*eps), result.dLogits[t][e], 1e-8);
  }
});

test("invalid shapes, routes, k, capacities and owners fail visibly; ties are deterministic", () => {
  assert.deepEqual(routeTokens([[0, 0, 0]], 2).routes.map(r => r.expert), [0, 1]);
  assert.throws(() => routeTokens([[NaN, 0]], 1));
  assert.throws(() => routeTokens([[0, 1], [2]], 1));
  assert.throws(() => routeTokens(z, 4));
  assert.throws(() => limitCapacity(routeTokens(z, 2), -1, true));
  const routes = routeTokens(z, 2).routes;
  assert.throws(() => groupedMoe(x, w, [routes[0], routes[0]]));
  assert.throws(() => expertTraffic(routes, [0], [0, 1, 0], 2, 4));
});
