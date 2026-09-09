import { test } from "node:test";
import assert from "node:assert/strict";
import { pipelineSchedule, parallelGroups } from "../src/pipeline-math.ts";

test("pipeline schedules execute each forward/backward once with valid causal dependencies", () => {
  for (const method of ["gpipe", "1f1b"] as const)
    for (const p of [1, 2, 3, 4, 8])
      for (const m of [1, 2, 4, 8, 16]) {
        const f = pipelineSchedule(p, m, method),
          key = (r: number, b: number, k: string) => `${r}:${b}:${k}`;
        const ops = new Map(
          f.operations.map((o) => [key(o.stage, o.microbatch, o.kind), o]),
        );
        assert.equal(ops.size, p * m * 2);
        const occupied = new Set<string>();
        for (const o of f.operations) {
          const slot = `${o.stage}:${o.start}`;
          assert.ok(!occupied.has(slot));
          occupied.add(slot);
          const dependency = (r: number, k: string) =>
            assert.ok(ops.get(key(r, o.microbatch, k))!.end <= o.start);
          if (o.kind === "F" && o.stage > 0) dependency(o.stage - 1, "F");
          if (o.kind === "B") {
            dependency(o.stage, "F");
            if (o.stage < p - 1) dependency(o.stage + 1, "B");
          }
        }
        assert.deepEqual(f.liveHistory.at(-1), Array(p).fill(0));
        assert.ok(
          f.liveHistory.every((row) => row.every((v) => v >= 0 && v <= m)),
        );
      }
});
test("balanced unit stages have the expected fill/drain bubble, not zero cost", () => {
  for (const method of ["gpipe", "1f1b"] as const)
    for (const p of [1, 2, 4, 8])
      for (const m of [1, 2, 4, 8, 16]) {
        const f = pipelineSchedule(p, m, method);
        assert.equal(f.ticks, 2 * (p + m - 1));
        assert.ok(Math.abs(f.bubbleFraction - (p - 1) / (p + m - 1)) < 1e-12);
      }
});
test("1F1B shortens saved-activation lifetimes without claiming a better ideal bubble", () => {
  const g = pipelineSchedule(4, 8, "gpipe"),
    one = pipelineSchedule(4, 8, "1f1b");
  assert.deepEqual(g.peak, [8, 8, 8, 8]);
  assert.deepEqual(one.peak, [4, 3, 2, 1]);
  assert.equal(g.ticks, one.ticks);
  assert.equal(one.ticks, 22);
  assert.equal(
    one.operations.filter(
      (o) =>
        o.kind === "F" &&
        o.end <= one.operations.find((o) => o.kind === "B")!.start,
    ).length < 32,
    true,
  );
});
test("dense rank groups fix the other axes and cover each rank exactly once per group kind", () => {
  const f = parallelGroups(2, 2, 2);
  assert.equal(f.world, 8);
  assert.deepEqual(f.tensor, [
    [0, 1],
    [2, 3],
    [4, 5],
    [6, 7],
  ]);
  assert.deepEqual(f.pipeline, [
    [0, 2],
    [1, 3],
    [4, 6],
    [5, 7],
  ]);
  assert.deepEqual(f.data, [
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
  ]);
  for (const groups of [f.tensor, f.pipeline, f.data])
    assert.deepEqual(
      groups.flat().sort((a, b) => a - b),
      [0, 1, 2, 3, 4, 5, 6, 7],
    );
});
test("pipeline and rank-grid boundaries reject unsupported inputs", () => {
  for (const args of [
    [0, 4],
    [4, 0],
    [2, 2.5],
    [9, 2],
    [2, 33],
  ])
    assert.throws(() => pipelineSchedule(args[0], args[1], "gpipe"));
  assert.throws(() => parallelGroups(1, 0, 2));
  assert.throws(() => parallelGroups(NaN, 2, 2));
});
