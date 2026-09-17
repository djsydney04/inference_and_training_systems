import test from "node:test";
import assert from "node:assert/strict";
import { DiagramClock } from "../src/diagram-clock.ts";

test("visible diagrams begin once, then give each frame a full reading interval", () => {
  const clock = new DiagramClock(6000);
  assert.equal(clock.tick(0, false), false);
  assert.equal(clock.tick(2000, true), true);
  assert.equal(clock.tick(5000, true), false);
  assert.equal(clock.tick(8000, true), true);
});

test("offscreen, paused and background time never accumulate steps", () => {
  const clock = new DiagramClock(6000);
  clock.tick(0, true);
  assert.equal(clock.tick(5000, false), false);
  assert.equal(clock.tick(600000, false), false);
  assert.equal(clock.tick(600001, true), false);
  assert.equal(clock.tick(606000, true), false);
  assert.equal(clock.tick(606001, true), true);
});

test("a delayed timer advances one frame without a catch-up burst", () => {
  const clock = new DiagramClock(6000);
  clock.tick(0, true);
  assert.equal(clock.tick(600000, true), true);
  assert.equal(clock.tick(600001, true), false);
  assert.equal(clock.tick(606000, true), true);
});

test("resetting a paused diagram gives its current step a full interval", () => {
  const clock = new DiagramClock();
  clock.tick(0, true);
  clock.reset();
  assert.equal(clock.tick(3000, true), false);
  assert.equal(clock.tick(8999, true), false);
  assert.equal(clock.tick(9000, true), true);
});
