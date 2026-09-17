import { test } from "node:test";
import assert from "node:assert/strict";
import { arrivalTrace, deliveryMetrics, goodputReport, scheduleRequests } from "../src/serving-runtime-math.ts";
import type { SchedulerConfig, ServingRequest } from "../src/serving-runtime-math.ts";
const config: SchedulerConfig = { budget: 8, chunk: 4, blocks: 4, blockSize: 4, reserve: "growing", priority: "decode-first" };

test("prefill emits the first output without caching that output; complete requests release only after execution", () => {
  const r = scheduleRequests([{ id: "A", prompt: 4, outputs: 2, arrival: 0 }], config);
  assert.equal(r.steps[0].states[0].cached, 4); assert.equal(r.steps[0].states[0].generated, 1);
  assert.equal(r.steps[1].states[0].cached, 5); assert.equal(r.steps[1].states[0].generated, 2);
  assert.equal(r.steps[1].peakBlocks, 2); assert.equal(r.steps[1].heldBlocks, 0);
});
test("growing admission can strand every decode while maximum reservation completes the same cohort", () => {
  const requests = ["A", "B"].map(id => ({ id, prompt: 4, outputs: 6, arrival: 0 }));
  const growing = scheduleRequests(requests, config);
  assert.equal(growing.stalled, true); assert.equal(growing.steps.at(-1)!.heldBlocks, 4);
  assert.deepEqual(growing.states.map(s => [s.cached, s.generated]), [[8, 5], [8, 5]]);
  const reserved = scheduleRequests(requests, { ...config, reserve: "maximum" });
  assert.equal(reserved.stalled, false); assert.ok(reserved.states.every(s => s.status === "complete"));
});
test("cancellation can unblock retained state, and no request executes twice in an iteration", () => {
  const r = scheduleRequests([{ id: "A", prompt: 4, outputs: 6, arrival: 0, cancelAt: 6 }, { id: "B", prompt: 4, outputs: 6, arrival: 0 }], config);
  assert.deepEqual(r.states.map(s => s.status), ["cancelled", "complete"]);
  assert.equal(r.stalled, false);
  for (const step of r.steps) assert.equal(new Set(step.operations.map(o => o.id)).size, step.operations.length);
});
test("work, memory, cached positions and emitted outputs conserve across varied schedules", () => {
  for (const reserve of ["maximum", "growing"] as const) for (const priority of ["decode-first", "prefill-first"] as const)
    for (const budget of [1, 3, 8]) for (const chunk of [1, 4, 8]) {
      const requests: ServingRequest[] = [{ id: "A", prompt: 5, outputs: 3, arrival: 0 }, { id: "B", prompt: 2, outputs: 1, arrival: 1 }, { id: "C", prompt: 7, outputs: 4, arrival: 2 }];
      const result = scheduleRequests(requests, { ...config, blocks: 16, budget, chunk, reserve, priority });
      assert.ok(!result.stalled && !result.truncated);
      for (const step of result.steps) {
        assert.ok(step.operations.reduce((n, o) => n + o.tokens, 0) <= budget);
        assert.ok(step.peakBlocks <= 16 && step.heldBlocks <= step.peakBlocks);
        for (const s of step.states) {
          assert.ok(s.generated <= s.outputs);
          if (s.generated) assert.equal(s.cached, s.prompt + s.generated - 1);
          if (s.allocated) assert.ok(s.allocated * config.blockSize >= s.cached);
        }
      }
      assert.ok(result.states.every(s => s.status === "complete" && s.allocated === 0));
    }
});
test("open-loop overload exposes waiting that a one-client closed loop does not offer", () => {
  const open = arrivalTrace(8, 100, 200, "open"), closed = arrivalTrace(8, 100, 200, "closed");
  assert.deepEqual(open.map(r => r.wait), [0, 100, 200, 300, 400, 500, 600, 700]);
  assert.deepEqual(closed.map(r => r.arrival), [0, 200, 400, 600, 800, 1000, 1200, 1400]);
  assert.ok(closed.every(r => r.latency === 200)); assert.equal(open.at(-1)!.latency, 900);
});
test("same TPOT can hide different worst gaps; terminal trailers and client waiting stay separate", () => {
  const objective = { ttftMs: 150, maxGapMs: 40, completionMs: 300 };
  const base = { id: "A", arrival: 0, sent: 20, tokens: [100, 120, 140, 160, 180, 200], end: 250, status: "complete" as const };
  const smooth = deliveryMetrics(base, objective), burst = deliveryMetrics({ ...base, tokens: [100, 105, 110, 115, 120, 200] }, objective);
  assert.equal(smooth.tpot, 20); assert.equal(burst.tpot, 20); assert.equal(burst.maxGap, 80);
  assert.equal(smooth.completion, 250); assert.equal(smooth.clientQueue, 20);
  assert.equal(smooth.compliant, true); assert.equal(burst.compliant, false);
  assert.equal(deliveryMetrics({ ...base, tokens: [100] }, objective).tpot, null);
});
test("failed and cancelled attempts never enter compliant completions or disappear from attainment", () => {
  const objective = { ttftMs: 150, maxGapMs: 40, completionMs: 300 };
  const base = { id: "A", arrival: 0, sent: 0, tokens: [100, 120], end: 130, status: "complete" as const };
  const r = goodputReport([base, { ...base, id: "B", status: "failed" }, { ...base, id: "C", status: "cancelled" }], objective, 0, 1000);
  assert.equal(r.throughput, 1); assert.equal(r.goodput, 1); assert.equal(r.attainment, 1 / 3);
  assert.equal(r.offered, 3); assert.equal(r.failed, 1); assert.equal(r.cancelled, 1);
});
test("invalid ownership, timestamps and observation windows are rejected", () => {
  const a = { id: "A", prompt: 4, outputs: 2, arrival: 0 };
  assert.throws(() => scheduleRequests([a, a], config)); assert.throws(() => scheduleRequests([a], { ...config, blockSize: 0 }));
  const t = { id: "A", arrival: 0, sent: 10, tokens: [20, 15], end: 30, status: "complete" as const };
  const slo = { ttftMs: 20, maxGapMs: 20, completionMs: 40 };
  assert.throws(() => deliveryMetrics(t, slo)); assert.throws(() => goodputReport([{ ...t, tokens: [20] }], slo, 0, 25));
});
