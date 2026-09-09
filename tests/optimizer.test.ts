import test from "node:test";
import assert from "node:assert/strict";
import { initialOptimizerState, optimizerStep, quadraticLoss, clipVector, clippingOrder, warmupCosine } from "../src/optimizer-math.ts";
const close = (a: number, b: number) => assert.ok(Math.abs(a-b) < 1e-8, `${a} != ${b}`);

test("SGD follows the gradient and does not mutate its input state", () => {
  const state = initialOptimizerState();
  const next = optimizerStep(state, "sgd", .08);
  close(next.weight[0], 1.84); close(next.weight[1], .04);
  assert.deepEqual(state, initialOptimizerState());
  assert.ok(next.loss < quadraticLoss(state.weight));
});
test("momentum carries a previous direction through a sign change", () => {
  const first = optimizerStep(initialOptimizerState(), "momentum", .08);
  const second = optimizerStep(first, "momentum", .08);
  close(second.first[1], 11.28);
  assert.ok(second.weight[1] < 0);
});
test("Adam bias correction and decoupled decay have separate effects", () => {
  const plain = optimizerStep(initialOptimizerState(), "adamw", .08);
  const decay = optimizerStep(initialOptimizerState(), "adamw", .08, .1);
  close(plain.weight[0], 1.92); close(plain.weight[1], .92);
  close(plain.weight[0] - decay.weight[0], .016);
  assert.deepEqual(plain.first, decay.first); assert.deepEqual(plain.second, decay.second);
});
test("global norm clipping preserves direction, and local clipping does not commute with summation", () => {
  const clipped = clipVector([3,4], 1);
  close(clipped.norm, 5); close(clipped.values[0], .6); close(clipped.values[1], .8);
  assert.deepEqual(clipVector([0,0],1).values,[0,0]);
  const order = clippingOrder(1);
  close(order.global[0], Math.SQRT1_2); close(order.global[1], Math.SQRT1_2);
  assert.notDeepEqual(order.local, order.global);
});
test("a token-count cosine schedule is continuous at warmup and stays at its floor", () => {
  close(warmupCosine(0,10,100,1,.1),0);
  close(warmupCosine(10,10,100,1,.1),1);
  close(warmupCosine(55,10,100,1,.1),.55);
  close(warmupCosine(1000,10,100,1,.1),.1);
  assert.throws(()=>warmupCosine(1,100,10,1,0));
  assert.throws(()=>optimizerStep(initialOptimizerState(),"sgd",NaN));
  assert.throws(()=>clipVector([Infinity],1));
});
