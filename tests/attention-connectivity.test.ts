import test from "node:test";
import assert from "node:assert/strict";
import { canReadPosition, teachingWindow } from "../src/attention-connectivity.ts";

const pairs = (mode: "causal" | "sliding" | "sparse", n: number) => {
  let count = 0;
  for (let q = 0; q < n; q++) for (let k = 0; k < n; k++) count += Number(canReadPosition(mode, q, k));
  return count;
};
test("the dense and fixed-window diagrams count their declared causal pairs", () => {
  for (const n of [8, 16, 40]) {
    assert.equal(pairs("causal", n), n * (n + 1) / 2);
    assert.equal(pairs("sliding", n), teachingWindow * n - teachingWindow * (teachingWindow - 1) / 2);
  }
  assert.equal(pairs("sliding", 40) - pairs("sliding", 16), 24 * teachingWindow);
});
test("the fixed sparse example has at most four keys per query and never reads the future", () => {
  for (let q = 0; q < 100; q++) {
    let count = 0;
    for (let k = 0; k < 100; k++) {
      if (canReadPosition("sparse", q, k)) { assert.ok(k <= q); count++; }
    }
    assert.ok(count >= 1 && count <= 4);
    assert.ok(canReadPosition("sparse", q, q));
  }
});
