import { test } from "node:test";
import assert from "node:assert/strict";
import { RenderBudget } from "../src/render-budget.ts";
test("a static scene renders once, then only after invalidation", () => {
  const b = new RenderBudget();
  assert.equal(b.consume(0, true), true);
  assert.equal(b.consume(16, true), false);
  b.invalidate(20);
  assert.equal(b.consume(32, true), true);
  assert.equal(b.consume(48, true), false);
});
test("hidden scenes retain pending state and bounded animations stop", () => {
  const b = new RenderBudget();
  b.invalidate(100, 1400);
  assert.equal(b.consume(200, false), false);
  assert.equal(b.consume(300, true), true);
  assert.equal(b.consume(1499, true), true);
  assert.equal(b.consume(1500, true), false);
  b.invalidate(1600);
  assert.equal(b.consume(1700, false), false);
  assert.equal(b.consume(1800, true), true);
});
test("a later ordinary state change does not shorten an animation deadline", () => {
  const b = new RenderBudget();
  b.invalidate(0, 3000);
  b.invalidate(500);
  b.consume(600, true);
  assert.equal(b.consume(2999, true), true);
  assert.equal(b.consume(3000, true), false);
  assert.throws(() => b.invalidate(1, -1));
  assert.throws(() => b.invalidate(NaN));
});
