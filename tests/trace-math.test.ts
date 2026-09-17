import test from "node:test";
import assert from "node:assert/strict";
import { trainingTrace } from "../src/trace-math.ts";

test("a collective starts when its producer is ready, even if it finishes before compute", () => {
  const short = trainingTrace(1, 8);
  assert.equal(short.communicationStart, 2);
  assert.equal(short.communicationStart + short.communication, 3);
  assert.equal(short.step, 10);
  assert.equal(short.exposed, 0);
  const long = trainingTrace(12, 8);
  assert.equal(long.communicationStart, short.communicationStart);
  assert.equal(long.step, 14);
  assert.equal(long.exposed, 4);
  for (const duration of [0, 1, 4, 12]) {
    for (const independent of [0, 3, 8, 20]) {
      const trace = trainingTrace(duration, independent);
      assert.equal(trace.step, Math.max(10, trace.communicationStart + duration));
      assert.equal(trace.overlapped + trace.exposed, duration);
    }
  }
});
