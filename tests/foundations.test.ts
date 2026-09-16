import { test } from "node:test";
import assert from "node:assert/strict";
import { tokenPrediction, projectionStep, kvStorage } from "../src/foundations-math.ts";

test("stable next-token loss and derivative survive extreme logit shifts", () => {
  const a = tokenPrediction([1, 2, 3], 2);
  const b = tokenPrediction([1001, 1002, 1003], 2);
  a.probabilities.forEach((p, i) => assert.equal(p, b.probabilities[i]));
  assert.ok(Math.abs(a.loss-b.loss) < 1e-12);
  assert.ok(Math.abs(a.gradient.reduce((s, x) => s+x, 0)) < 1e-14);
  assert.ok(Number.isFinite(tokenPrediction([1000, -1000], 1).loss));
});
test("projection weight derivatives agree with independent central differences", () => {
  const weights = [[0.5, -0.2], [0.1, 0.3], [-0.4, 0.2]], x = [1, 2];
  const step = projectionStep(weights, x, 1, 0.1), epsilon = 1e-5;
  for (let i=0; i<3; i++) for (let j=0; j<2; j++) {
    const plus = weights.map((r) => [...r]), minus = weights.map((r) => [...r]);
    plus[i][j] += epsilon; minus[i][j] -= epsilon;
    const numeric = (projectionStep(plus, x, 1, 0).loss-projectionStep(minus, x, 1, 0).loss)/(2*epsilon);
    assert.ok(Math.abs(numeric-step.gradient[i][j]) < 1e-9);
  }
  assert.ok(projectionStep(step.nextWeights, x, 1, 0).loss < step.loss);
});
test("KV accounting uses KV heads, both tensors and batch", () => {
  assert.equal(kvStorage(32, 8, 128, 8192, 2), 1073741824);
  assert.equal(kvStorage(32, 8, 128, 8192, 2, 4), 4294967296);
  assert.throws(() => tokenPrediction([NaN], 0));
  assert.throws(() => kvStorage(32, 0, 128, 1, 2));
});
