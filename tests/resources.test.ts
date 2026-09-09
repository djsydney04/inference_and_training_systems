import test from "node:test";
import assert from "node:assert/strict";
import { occupancy, roofline, teachingSM } from "../src/resource-math.ts";
import { ringFrame, ringTime } from "../src/collective-math.ts";
test("register allocation granularity creates a 64-to-65-register occupancy cliff", () => {
  const a = occupancy(256, 64, 0),
    b = occupancy(256, 65, 0);
  assert.equal(a.blocks, 4);
  assert.equal(a.occupancy, 0.5);
  assert.equal(b.registersPerWarp, 2304);
  assert.equal(b.blocks, 3);
  assert.equal(b.occupancy, 0.375);
});
test("shared memory and thread limits independently cap resident blocks", () => {
  assert.equal(occupancy(256, 16, 64 * 1024).blocks, 1);
  assert.equal(occupancy(256, 16, 128 * 1024).blocks, 0);
  assert.equal(occupancy(1024, 16, 0).blocks, 2);
  assert.equal(occupancy(256, 16, 1).sharedPerBlock, 256);
  for (const threads of [32, 64, 128, 256, 512, 1024])
    for (const regs of [16, 32, 64, 65, 128]) {
      const r = occupancy(threads, regs, 8192);
      assert.ok(r.usedRegisters <= teachingSM.registers);
      assert.ok(r.warps <= 64);
      assert.ok(r.usedShared <= teachingSM.sharedBytes);
    }
});
test("roofline separates lower-bound time from a throughput promise", () => {
  const result = roofline(2e12, 20e9, 100e12, 1e12);
  assert.equal(result.computeSeconds, 0.02);
  assert.equal(result.memorySeconds, 0.02);
  assert.equal(result.intensity, 100);
  assert.equal(roofline(2e12, 40e9, 100e12, 1e12).lowerBoundSeconds, 0.04);
  assert.throws(() => roofline(0, 1, 1, 1));
  assert.throws(() => occupancy(33, 32, 0));
});
test("every ring size ends with the same all-reduced vector on every rank", () => {
  for (let ranks = 2; ranks <= 8; ranks++)
    for (const chunk of [1, 2, 5]) {
      const frame = ringFrame(ranks, 2 * (ranks - 1), chunk);
      for (const rank of frame.buffers)
        for (let c = 0; c < ranks; c++) {
          assert.deepEqual(rank[c].values, frame.expected[c]);
          assert.equal(rank[c].contributors.length, ranks);
        }
      assert.equal(frame.bytesPerRank, 2 * (ranks - 1) * chunk * 4);
    }
});
test("reduce-scatter ends with exactly one fully reduced chunk per rank", () => {
  const ranks = 4,
    frame = ringFrame(ranks, ranks - 1);
  frame.buffers.forEach((chunks, r) => {
    const complete = chunks
      .map((c, i) => (c.contributors.length === ranks ? i : -1))
      .filter((i) => i >= 0);
    assert.deepEqual(complete, [(r + 1) % ranks]);
  });
});
test("each partial chunk equals the sum of exactly its recorded contributors", () => {
  for (let step = 0; step <= 6; step++) {
    const f = ringFrame(4, step);
    f.buffers.forEach((rank) =>
      rank.forEach((chunk, c) => {
        const expected = chunk.values.map((_, i) =>
          chunk.contributors.reduce((s, r) => s + f.input[r][c][i], 0),
        );
        assert.deepEqual(chunk.values, expected);
      }),
    );
  }
});
test("ring traffic counts sent payload once, rather than transmit plus receive twice", () => {
  const result = ringTime(4, 32, 1000, 0);
  assert.equal(result.sentBytes, 48);
  assert.equal(result.seconds, 0.048);
  assert.throws(() => ringFrame(4, 7));
  assert.throws(() => ringTime(1, 32, 1000, 0));
});
