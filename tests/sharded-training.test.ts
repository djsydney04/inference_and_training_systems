import test from "node:test";
import assert from "node:assert/strict";
import { adamwCoordinate, prefetchPass, reducedGradientShards, shardedMemoryTrace } from "../src/sharded-training-math.ts";
const MiB = 2 ** 20;
const base = { groups: 4, parametersPerGroup: 2 ** 25, ranks: 4, activationBytesPerGroup: 32 * MiB, reshardAfterForward: true, prefetch: false };

test("declared persistent state, gradient shards, and transient peak are different ledgers", () => {
  const trace = shardedMemoryTrace(base);
  assert.equal(trace.persistentBytes / MiB, 384);
  assert.equal(trace.peakBytes / MiB, 704);
  assert.equal(trace.points.find((p) => p.phase === "F done")!.total / MiB, 512);
  assert.equal(trace.points.find((p) => p.phase === "Update")!.total / MiB, 512);
  assert.equal(trace.points.at(-1)!.total / MiB, 384);
});

test("one-group prefetch raises the peak, while retaining all weights avoids backward gathers", () => {
  assert.equal(shardedMemoryTrace({ ...base, prefetch: true }).peakBytes / MiB, 768);
  const kept = shardedMemoryTrace({ ...base, reshardAfterForward: false });
  assert.equal(kept.peakBytes / MiB, 896);
  assert.deepEqual(kept.points.find((p) => p.phase === "F done")!.materializedGroups, [0, 1, 2, 3]);
});

test("more data-parallel ranks shrink owned state but not a complete compute group", () => {
  const four = shardedMemoryTrace(base), eight = shardedMemoryTrace({ ...base, ranks: 8 });
  assert.equal(eight.persistentBytes * 2, four.persistentBytes);
  assert.equal(eight.points[1].fullWeights, four.points[1].fullWeights);
  assert.equal(eight.points[1].activations, four.points[1].activations);
  assert.ok(eight.peakBytes > four.peakBytes / 2);
});

test("reduce-scatter input and newly owned gradient output coexist in the accounting", () => {
  const point = shardedMemoryTrace(base).points.find((p) => p.phase === "RS3")!;
  assert.equal(point.fullGradient / MiB, 128);
  assert.equal(point.gradientShards / MiB, 32);
  assert.equal(point.fullWeights, 0);
  assert.equal(point.activations / MiB, 96);
});

test("all sampled phases reconcile and end with no transient state", () => {
  for (const ranks of [1, 2, 4, 8]) for (const prefetch of [false, true]) for (const reshardAfterForward of [false, true]) {
    const trace = shardedMemoryTrace({ ...base, ranks, prefetch, reshardAfterForward });
    for (const p of trace.points) {
      assert.equal(p.total, p.parameterShards + p.optimizerShards + p.fullWeights + p.fullGradient + p.gradientShards + p.activations);
      assert.ok(p.total >= trace.persistentBytes);
    }
    const last = trace.points.at(-1)!;
    assert.equal(last.fullWeights + last.fullGradient + last.gradientShards + last.activations, 0);
  }
});

test("prefetch overlaps separate lanes and still exposes the first gather", () => {
  assert.equal(prefetchPass(4, 2, 4, false).elapsedMs, 24);
  const overlap = prefetchPass(4, 2, 4, true);
  assert.equal(overlap.elapsedMs, 18);
  assert.equal(overlap.exposedGatherMs, 2);
  assert.equal(prefetchPass(4, 6, 4, true).elapsedMs, 28);
  assert.equal(prefetchPass(4, 6, 4, true).exposedGatherMs, 12);
  for (const gather of [0, 1, 2, 9]) for (const compute of [0, 1, 4, 12]) {
    if (!gather && !compute) continue;
    const r = prefetchPass(5, gather, compute, true);
    assert.equal(r.elapsedMs, gather + compute + 4 * Math.max(gather, compute));
    r.jobs.slice(1).forEach((job, i) => {
      assert.ok(job.gatherStart >= r.jobs[i].gatherEnd);
      assert.ok(job.computeStart >= r.jobs[i].computeEnd);
      assert.ok(job.computeStart >= job.gatherEnd);
    });
  }
});

test("unequal example counts reduce sums before normalization and owner slicing", () => {
  const r = reducedGradientShards([[1, 0, 0, 0], [0, 2, 3, 4]], [1, 3], 2);
  assert.deepEqual(r.gradient, [0.25, 0.5, 0.75, 1]);
  assert.deepEqual(r.shards, [[0.25, 0.5], [0.75, 1]]);
  assert.notDeepEqual(r.gradient, [0.5, 1 / 3, 0.5, 2 / 3]);
  assert.deepEqual(reducedGradientShards([[1, 0, 0, 0], [0, 2, 3, 4]], [1, 3], 4).shards.flat(), r.gradient);
});

test("the worked AdamW coordinate includes moment correction and decoupled decay", () => {
  const r = adamwCoordinate(1, 0.25, 0, 0, 1);
  assert.ok(Math.abs(r.m - 0.025) < 1e-14);
  assert.ok(Math.abs(r.v - 0.000625) < 1e-14);
  assert.ok(Math.abs(r.weight - (0.99 - 0.025 / 0.26)) < 1e-14);
  assert.ok(Math.abs(r.mHat - 0.25) < 1e-14);
  assert.ok(Math.abs(r.vHat - 0.0625) < 1e-14);
});

test("invalid storage, collective and optimizer inputs fail explicitly", () => {
  for (const edit of [{ ranks: 3 }, { groups: 0 }, { activationBytesPerGroup: -1 }, { parametersPerGroup: Infinity }])
    assert.throws(() => shardedMemoryTrace({ ...base, ...edit }), RangeError);
  assert.throws(() => prefetchPass(4, -1, 4, true), RangeError);
  assert.throws(() => reducedGradientShards([[1, 2]], [0], 2), RangeError);
  assert.throws(() => reducedGradientShards([[1, 2], [3]], [1, 1], 2), RangeError);
  assert.throws(() => adamwCoordinate(1, 1, 0, -1, 1), RangeError);
});
