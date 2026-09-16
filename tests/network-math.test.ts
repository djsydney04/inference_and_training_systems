import { test } from "node:test";
import assert from "node:assert/strict";
import { networkExample, networkShapes, stableSoftmax, causalAttentionRow, rmsNormalize, swigluChannels } from "../src/network-math.ts";

test("prefill and cached decode preserve residual width and use the full key context", () => {
  const prefill = networkShapes(networkExample);
  const decode = networkShapes(networkExample, true);
  assert.deepEqual(prefill.residual, [1, 4, 8]);
  assert.deepEqual(prefill.scores, [1, 2, 4, 4]);
  assert.deepEqual(decode.residual, [1, 1, 8]);
  assert.deepEqual(decode.scores, [1, 2, 1, 5]);
  assert.deepEqual(decode.newKV, [1, 2, 1, 4]);
  assert.deepEqual(decode.cache, [1, 2, 5, 4]);
  assert.deepEqual(decode.logits, [1, 1, 32]);
  assert.equal(decode.cacheElements, 240);
});

test("sharing KV heads reduces cache and projections, not query heads or feed-forward parameters", () => {
  const mha = networkShapes(networkExample);
  const gqa = networkShapes({ ...networkExample, kvHeads: 1 });
  assert.deepEqual(gqa.query, mha.query);
  assert.deepEqual(gqa.scores, mha.scores);
  assert.equal(gqa.cacheElements, mha.cacheElements / 2);
  assert.equal(mha.attentionParameters, 256);
  assert.equal(gqa.attentionParameters, 192);
  assert.equal(gqa.feedForwardParameters, 576);
  for (const config of [{ ...networkExample, heads: 3 }, { ...networkExample, kvHeads: 3 }, { ...networkExample, tokens: 0 }])
    assert.throws(() => networkShapes(config), RangeError);
});

test("causal attention cannot read a future value even if its score is enormous", () => {
  const values = [[2, 0], [0, 2], [100, 100]];
  const row = causalAttentionRow([0, 0, 1e6], values, 1);
  assert.deepEqual(row.weights, [.5, .5, 0]);
  assert.deepEqual(row.output, [1, 1]);
  assert.deepEqual(causalAttentionRow([0, 0, -1e6], [[2, 0], [0, 2], [-900, 300]], 1), row);
  assert.deepEqual(causalAttentionRow([0, 1, 2], values, 0).output, values[0]);
  assert.throws(() => causalAttentionRow([1], [[1]], 1), RangeError);
});

test("softmax stays normalized at large offsets and RMSNorm does not center its input", () => {
  assert.deepEqual(stableSoftmax([1000, 1000]), [.5, .5]);
  assert.deepEqual(stableSoftmax([1001, 1002]), stableSoftmax([1, 2]));
  const normalized = rmsNormalize([3, 4], [1, 1]);
  assert.ok(normalized.every(x => x > 0));
  assert.ok(Math.abs(normalized.reduce((sum, x) => sum + x * x, 0) / 2 - 1) < 1e-6);
  assert.deepEqual(rmsNormalize([0, 0], [1, 1]), [0, 0]);
  assert.throws(() => stableSoftmax([]), RangeError);
});

test("SwiGLU gates are signed real activations rather than probabilities", () => {
  const result = swigluChannels([-1, 0, 2], [2, 99, 3]);
  assert.ok(result.activated[0] < 0);
  assert.equal(result.product[1], 0);
  assert.ok(result.activated[2] > 1);
  assert.ok(Math.abs(result.product[2] - 5.284782467867294) < 1e-12);
  assert.throws(() => swigluChannels([1], [1, 2]), RangeError);
});
