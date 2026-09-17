import test from "node:test";
import assert from "node:assert/strict";
import { kvTransferBudget, handoffTiming, pdCapacity } from "../src/disaggregation-math.ts";

const transfer = { layers: 32, kvHeads: 8, headDim: 128, bytesPerElement: 2, tokens: 8192,
  cachedTokens: 0, blockTokens: 16, linkGBps: 25, setupMs: 2, overlapMs: 0 };
const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);

test("KV accounting distinguishes both tensors, logical payload and allocated blocks", () => {
  const full = kvTransferBudget(transfer);
  assert.equal(full.bytesPerToken, 131072);
  assert.equal(full.wireBytes, 1073741824);
  close(full.payloadMs, 42.94967296);
  const partial = kvTransferBudget({ ...transfer, tokens: 17, cachedTokens: 16 });
  assert.equal(partial.payloadBytes, 131072);
  assert.equal(partial.wireBytes, 2097152);
  assert.equal(partial.paddingBytes, 15 * 131072);
});
test("prefix reuse and GQA reduce bytes; overlap cannot erase serial setup", () => {
  for (const heads of [1, 2, 8, 32]) {
    const amount = kvTransferBudget({ ...transfer, kvHeads: heads });
    assert.equal(amount.wireBytes, 1073741824 * heads / 8);
    close(kvTransferBudget({ ...transfer, kvHeads: heads, linkGBps: 50 }).payloadMs, amount.payloadMs / 2);
  }
  const half = kvTransferBudget({ ...transfer, cachedTokens: 4096 });
  assert.equal(half.wireBytes, 536870912);
  assert.equal(kvTransferBudget({ ...transfer, overlapMs: 1000 }).exposedMs, 2);
  assert.equal(kvTransferBudget({ ...transfer, cachedTokens: 8192 }).wireBytes, 0);
});
test("streaming token one earlier moves handoff delay into the first gap, not out of completion time", () => {
  const input = { prefillQueueMs: 10, prefillMs: 400, exposedTransferMs: 45, decodeQueueMs: 30,
    decodeMs: 20, outputTokens: 101, emitFromPrefill: true };
  const early = handoffTiming(input), late = handoffTiming({ ...input, emitFromPrefill: false });
  assert.equal(early.firstTokenMs, 410); assert.equal(late.firstTokenMs, 485);
  assert.equal(early.firstGapMs, 95); assert.equal(late.firstGapMs, 20);
  assert.equal(early.lastTokenMs, late.lastTokenMs);
  assert.equal(early.lastTokenMs, 2485); close(early.tpotMs, 20.75);
  for (const run of [early, late]) {
    for (let i = 1; i < run.segments.length; i++)
      close(run.segments[i].start, run.segments[i - 1].start + run.segments[i - 1].duration);
  }
});
test("fleet capacity keeps phase work, generated token boundary and shared fabric separate", () => {
  const input = { prefillWorkers: 2, decodeWorkers: 2, promptTokens: 8000, outputTokens: 401,
    prefillTokensPerSecond: 40000, decodeTokensPerSecond: 1600,
    transferBytes: 1000000000, linkGBps: 25, arrivalsPerSecond: 9 };
  const base = pdCapacity(input);
  assert.deepEqual(base.stages.map(s => s.capacity), [10, 8, 25]);
  assert.equal(base.limit, 8); assert.equal(base.backlogPerSecond, 1); assert.equal(base.hasHeadroom, false);
  assert.equal(pdCapacity({ ...input, prefillWorkers: 8 }).limit, 8);
  assert.equal(pdCapacity({ ...input, decodeWorkers: 3 }).limit, 10);
  assert.equal(pdCapacity({ ...input, linkGBps: 3 }).limit, 3);
  assert.equal(pdCapacity({ ...input, transferBytes: 0 }).stages[2].capacity, Infinity);
});
test("invalid cache layouts and timings fail rather than display plausible numbers", () => {
  assert.throws(() => kvTransferBudget({ ...transfer, cachedTokens: 1 }));
  assert.throws(() => kvTransferBudget({ ...transfer, cachedTokens: 9008 }));
  assert.throws(() => kvTransferBudget({ ...transfer, linkGBps: 0 }));
  assert.throws(() => kvTransferBudget({ ...transfer, tokens: Number.MAX_SAFE_INTEGER }));
  assert.throws(() => handoffTiming({ prefillQueueMs: 0, prefillMs: 1, exposedTransferMs: -1,
    decodeQueueMs: 0, decodeMs: 1, outputTokens: 2, emitFromPrefill: true }));
  assert.throws(() => pdCapacity({ prefillWorkers: 1, decodeWorkers: 1, promptTokens: 1, outputTokens: 1,
    prefillTokensPerSecond: 1, decodeTokensPerSecond: 1, transferBytes: 0, linkGBps: 1, arrivalsPerSecond: 0 }));
});
