import test from "node:test";
import assert from "node:assert/strict";
import { residency, transferEstimate, disaggregationBreakEven } from "../src/accelerator-math.ts";
const sample = { parameters: 70_000_000_000, bitsPerWeight: 4, blockElements: 32, scaleBytes: 1, capacityGiB: 80, reservedGiB: 8, layers: 80, kvHeads: 8, headDimension: 128, context: 32768, kvBytes: 2, batch: 4 };
test("capacity counts scale metadata and the GQA KV state separately", () => {
  const r = residency(sample);
  assert.equal(r.weightBytes, 37_187_500_000);
  assert.equal(r.kvPerSequence, 10 * 2 ** 30);
  assert.equal(r.maxSequences, 3);
  assert.equal(r.fits, false);
  assert.equal(residency({ ...sample, batch: 3 }).fits, true);
});
test("partial quantization blocks still need a full scale entry", () => {
  const r = residency({ ...sample, parameters: 33, bitsPerWeight: 4 });
  assert.equal(r.weightBytes, 19);
});
test("halving KV precision doubles capacity per sequence only for KV, not weights", () => {
  const a = residency(sample), b = residency({ ...sample, kvBytes: 1 });
  assert.equal(a.weightBytes, b.weightBytes);
  assert.equal(b.kvPerSequence * 2, a.kvPerSequence);
  assert.equal(b.maxSequences, 7);
});
test("network conversions distinguish bits, bytes, decimal GB and binary GiB", () => {
  const r = transferEstimate(10 * 2 ** 30, 400, 0.7);
  assert.equal(r.usableBytesPerSecond, 35e9);
  assert.ok(Math.abs(r.seconds - 0.3067833782857143) < 1e-12);
  assert.equal(disaggregationBreakEven(r.seconds, 0.010, 0.006), 77);
  assert.equal(disaggregationBreakEven(0.1, 0.006, 0.010), null);
  assert.equal(disaggregationBreakEven(0.1, 0.006, 0.006), null);
});
test("invalid capacity and transfer inputs fail rather than display misleading numbers", () => {
  for (const input of [{ ...sample, batch: 0 }, { ...sample, kvHeads: 1.5 }, { ...sample, context: Infinity }])
    assert.throws(() => residency(input), RangeError);
  assert.throws(() => transferEstimate(10, 400, 1.1), RangeError);
  assert.throws(() => transferEstimate(-1, 400, 0.7), RangeError);
});
