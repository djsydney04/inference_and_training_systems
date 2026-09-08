import assert from "node:assert/strict";
import test from "node:test";
import { mergeSoftmaxTile, coalescedSectors, initialCache, appendCacheToken, releaseCacheRequest, cacheOwners } from "../src/lesson-math.ts";

test("online attention agrees with a direct softmax despite a late large maximum", () => {
  const scores = [-10, 2, 3, 1000, 999, -500];
  const values = [2, 4, 1, 9, 3, 8];
  let state = { maximum: -Infinity, denominator: 0, numerator: 0 };
  for (let i = 0; i < scores.length; i += 2) state = mergeSoftmaxTile(state, scores.slice(i, i + 2), values.slice(i, i + 2));
  const weights = scores.map((s) => Math.exp(s - Math.max(...scores)));
  const direct = weights.reduce((sum, w, i) => sum + w * values[i], 0) / weights.reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(state.numerator / state.denominator - direct) < 1e-12);
});
test("coalescing counts sectors, not just useful payload", () => {
  assert.equal(coalescedSectors(1).transferredBytes, 128);
  assert.equal(coalescedSectors(8).transferredBytes, 1024);
});
test("decode allocates at the boundary and finishing preserves shared prefixes", () => {
  let state = initialCache();
  state = appendCacheToken(appendCacheToken(state, "A"), "A");
  assert.equal(state.requests[0].blocks.length, 3);
  state = appendCacheToken(state, "A");
  assert.equal(state.requests[0].blocks.length, 4);
  state = releaseCacheRequest(state, "A");
  assert.deepEqual(cacheOwners(state, 2), ["B"]);
  assert.deepEqual(cacheOwners(state, 0), []);
});
test("copy-on-write leaves the other request's partial block intact", () => {
  const shared = { capacity: 3, blockSize: 4, requests: [
    { name: "A", tokens: 3, blocks: [0] }, { name: "B", tokens: 3, blocks: [0] },
  ] };
  const next = appendCacheToken(shared, "B");
  assert.deepEqual(next.requests[0].blocks, [0]);
  assert.deepEqual(next.requests[1].blocks, [1]);
  assert.equal(shared.requests[1].tokens, 3);
});
