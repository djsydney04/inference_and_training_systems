import { test } from "node:test";
import assert from "node:assert/strict";
import { frameworkTiming } from "../src/framework-timing-math.ts";
const base = { iterations: 8, launchMs: 0.5, kernelMs: 4, preparationMs: 0, priorDeviceMs: 0 };

test("a queued batch overlaps host dispatch without reducing device service", () => {
  const result = frameworkTiming(base);
  assert.equal(result.hostReturnMs, 4);
  assert.equal(result.completeMs, 32.5);
  assert.equal(result.serviceMs, 32);
  assert.equal(result.firstResultMs, 4.5);
  assert.equal(result.amortizedMs, 4.0625);
  assert.equal(frameworkTiming({ ...base, iterations: 1 }).completeMs, 4.5);
});
test("cold preparation overlaps previous independent device work", () => {
  assert.equal(frameworkTiming({ ...base, preparationMs: 80, priorDeviceMs: 12 }).completeMs, 112.5);
  assert.equal(frameworkTiming({ ...base, priorDeviceMs: 12 }).completeMs, 44);
  assert.equal(frameworkTiming({ ...base, preparationMs: 5, priorDeviceMs: 12 }).completeMs, 44);
});
test("slow dispatch leaves device gaps and controls the completion boundary", () => {
  const result = frameworkTiming({ ...base, launchMs: 6 });
  assert.equal(result.hostReturnMs, 48);
  assert.equal(result.completeMs, 52);
  assert.equal(result.idleMs, 20);
  assert.equal(result.calls[1].start - result.calls[0].finish, 2);
});
test("every call follows both its enqueue and predecessor across boundary cases", () => {
  for (const n of [1, 2, 17]) for (const h of [0, 0.5, 12]) for (const k of [0, 4, 20])
    for (const p of [0, 5, 80]) for (const b of [0, 12]) {
      const trace = frameworkTiming({ iterations: n, launchMs: h, kernelMs: k, preparationMs: p, priorDeviceMs: b });
      assert.equal(trace.completeMs, Math.max(b + n * k, p + h + k + (n - 1) * Math.max(h, k)));
      trace.calls.forEach((c, i) => {
        assert.ok(c.start >= c.enqueued);
        assert.ok(c.start >= (i ? trace.calls[i - 1].finish : b));
        assert.equal(c.finish - c.start, k);
      });
    }
});
test("invalid schedules cannot turn missing work into zero latency", () => {
  for (const iterations of [0, -1, 0.5, NaN, Infinity, 10001]) assert.throws(() => frameworkTiming({ ...base, iterations }));
  for (const field of ["launchMs", "kernelMs", "preparationMs", "priorDeviceMs"])
    for (const value of [-1, NaN, Infinity]) assert.throws(() => frameworkTiming({ ...base, [field]: value }));
});
