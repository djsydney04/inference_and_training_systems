import test from "node:test";
import assert from "node:assert/strict";
import { policyRatio, rolloutAcceleration, rolloutSchedule } from "../src/rollout-training-math.ts";

const base = { batches: 6, prefillSeconds: 1, decodeSeconds: 6, rewardSeconds: 1,
  trainSeconds: 4, publishSeconds: 1, decodeSpeedup: 1, maxLag: 1 };

test("zero lag serializes generation and training against each new published snapshot", () => {
  const r = rolloutSchedule({ ...base, maxLag: 0 });
  assert.equal(r.elapsed, 78);
  assert.equal(r.overlapSpeedup, 1);
  assert.equal(r.maxObservedLag, 0);
  assert.deepEqual(r.batches.map((b) => b.behaviorVersion), [0, 1, 2, 3, 4, 5]);
});

test("one-step overlap reaches the two-stage bound for identical jobs", () => {
  const r = rolloutSchedule(base);
  assert.equal(r.elapsed, 53);
  assert.equal(r.idealPipelineSeconds, 53);
  assert.deepEqual(r.batches.map((b) => b.actorStart), [0, 8, 16, 24, 32, 40]);
  assert.deepEqual(r.batches.map((b) => b.lag), [0, 1, 1, 1, 1, 1]);
  assert.equal(r.actorUtilization, 48 / 53);
  assert.equal(r.learnerUtilization, 30 / 53);
});

test("accelerating decode moves the bottleneck and does not multiply pipeline speedups", () => {
  const r = rolloutSchedule({ ...base, decodeSpeedup: 3 });
  assert.equal(r.actorSeconds, 4);
  assert.equal(r.learnerSeconds, 5);
  assert.equal(r.elapsed, 34);
  assert.deepEqual(r.batches.map((b) => b.actorStart), [0, 4, 9, 14, 19, 24]);
  assert.equal(rolloutSchedule(base).elapsed / r.elapsed, 53 / 34);
  assert.equal(rolloutAcceleration(6, 7, 3).speedup, 13 / 9);
  assert.equal(rolloutAcceleration(6, 7, 3, 5).speedup, 13 / 14);
});

test("more queued work can increase policy lag without improving a saturated pipeline", () => {
  const tight = rolloutSchedule({ ...base, decodeSpeedup: 3 });
  const loose = rolloutSchedule({ ...base, decodeSpeedup: 3, maxLag: 4 });
  assert.equal(tight.elapsed, loose.elapsed);
  assert.ok(loose.maxObservedLag > tight.maxObservedLag);
});

test("all schedules preserve FIFO, snapshot freshness, bounded lag and lane exclusion", () => {
  for (const decodeSeconds of [0, 1, 6, 17]) for (const trainSeconds of [0, 2, 20]) for (const maxLag of [0, 1, 3, 10]) {
    const r = rolloutSchedule({ ...base, batches: 10, decodeSeconds, trainSeconds, maxLag });
    assert.ok(r.elapsed + 1e-9 >= r.idealPipelineSeconds);
    assert.ok(r.elapsed <= r.synchronousSeconds + 1e-9);
    for (const [i, b] of r.batches.entries()) {
      assert.ok(b.lag >= 0 && b.lag <= maxLag);
      assert.equal(b.learnerVersion, i);
      assert.ok(b.learnerStart >= b.actorEnd);
      if (i > 0) {
        assert.ok(b.actorStart >= r.batches[i - 1].actorEnd);
        assert.ok(b.learnerStart >= r.batches[i - 1].publishEnd);
      }
      if (b.behaviorVersion > 0) assert.ok(r.batches[b.behaviorVersion - 1].publishEnd <= b.actorStart);
      if (b.behaviorVersion < i) assert.ok(r.batches[b.behaviorVersion].publishEnd > b.actorStart);
    }
  }
});

test("PPO clipped surrogate handles both signs of advantage", () => {
  const positive = policyRatio(0.2, 0.3, 2, 0.2);
  assert.ok(Math.abs(positive.ratio - 1.5) < 1e-12);
  assert.equal(positive.objective, 2.4);
  assert.ok(Math.abs(policyRatio(0.2, 0.3, -2, 0.2).objective + 3) < 1e-12);
  assert.equal(policyRatio(0.4, 0.2, -2, 0.2).objective, -1.6);
  assert.equal(policyRatio(0.4, 0.2, 2, 0.2).objective, 1);
});

test("invalid timing, probability and version inputs are rejected", () => {
  for (const change of [{ batches: 0 }, { batches: 1.5 }, { maxLag: -1 }, { maxLag: 2.5 },
    { trainSeconds: Infinity }, { publishSeconds: -1 }, { decodeSpeedup: 0 }])
    assert.throws(() => rolloutSchedule({ ...base, ...change }), RangeError);
  assert.throws(() => policyRatio(0, 0.5, 1, 0.2), RangeError);
  assert.throws(() => policyRatio(0.5, 1.5, 1, 0.2), RangeError);
  assert.throws(() => policyRatio(0.5, 0.5, NaN, 0.2), RangeError);
  assert.throws(() => policyRatio(0.5, 0.5, 1, 1), RangeError);
  assert.throws(() => rolloutAcceleration(1, 2, 0), RangeError);
  assert.throws(() => rolloutAcceleration(0, 0, 1), RangeError);
});
