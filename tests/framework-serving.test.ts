import test from "node:test";
import assert from "node:assert/strict";
import { TextStopFilter, reusableServingPrefix, type ServingPrefix } from "../src/framework-serving-math.ts";

function partitions(text: string): string[][] {
  if (!text.length) return [[]];
  const result: string[][] = [];
  for (let mask = 0; mask < 2 ** (text.length - 1); mask++) {
    const chunks: string[] = []; let start = 0;
    for (let index = 0; index < text.length - 1; index++) if (mask & (1 << index)) {
      chunks.push(text.slice(start, index + 1)); start = index + 1;
    }
    chunks.push(text.slice(start)); result.push(chunks);
  }
  return result;
}

test("single-stop output agrees with whole-string reference across every chunk partition", () => {
  for (const input of ["ab<END>x", "x<EN", "<END>", "a🙂!b", "plain"]) {
    const stop = input.includes("🙂") ? "🙂!" : "<END>";
    const index = input.indexOf(stop), expected = index < 0 ? input : input.slice(0, index);
    for (const chunks of partitions(input)) {
      const filter = new TextStopFilter([stop]);
      const output = chunks.map(chunk => filter.push(chunk).emitted).join("") + filter.finish().emitted;
      assert.equal(output, expected, JSON.stringify(chunks));
    }
  }
});

test("partial delimiter never leaks, and unmatched suffix flushes exactly once", () => {
  const filter = new TextStopFilter(["<END>"]);
  assert.deepEqual(filter.push("hello <EN"), {emitted: "hello ", pending: "<EN", stopped: false, matched: null});
  assert.deepEqual(filter.push("D>x"), {emitted: "", pending: "", stopped: true, matched: "<END>"});
  assert.equal(filter.push("later").emitted, "");
  assert.equal(filter.finish().emitted, "");
  const incomplete = new TextStopFilter(["<END>"]);
  assert.equal(incomplete.push("<EN").emitted, "");
  assert.equal(incomplete.finish().emitted, "<EN");
  assert.equal(incomplete.finish().emitted, "");
  assert.equal(incomplete.push("D>").emitted, "");
});

test("overlapping stops have an explicit first-completion policy independent of partition", () => {
  for (const [input, stops, expected] of [
    ["zabcd", ["abcd", "bc"], "za"],
    ["zabc", ["ab", "abc"], "z"],
    ["zabc", ["abc", "bc"], "z"],
    ["aaaaab", ["aaab"], "aa"],
  ] as [string, string[], string][]) for (const chunks of partitions(input)) {
    const filter = new TextStopFilter(stops);
    assert.equal(chunks.map(chunk => filter.push(chunk).emitted).join("") + filter.finish().emitted, expected);
  }
  const pass = new TextStopFilter([]);
  assert.equal(pass.push("anything").emitted, "anything");
  assert.throws(() => new TextStopFilter([""]), RangeError);
});

const baseline: ServingPrefix = {
  tokenIds: [1, 8, 9, 4, 5, 6, 7, 2], positions: [0, 1, 2, 3, 4, 5, 6, 7],
  context: {weightsRevision: "w1", adapterRevision: "none", attentionConfig: "causal-rope1", cacheFormat: "fp16-layout1", cacheNamespace: "tenant1"},
};

test("reusable blocks are exactly the consecutive complete matching blocks, including a tail", () => {
  for (let changed = 0; changed <= baseline.tokenIds.length; changed++) for (const block of [1, 2, 3, 4]) {
    const tokens = [...baseline.tokenIds]; if (changed < tokens.length) tokens[changed] = 99;
    const incoming = {...baseline, tokenIds: tokens};
    const result = reusableServingPrefix(baseline, incoming, block);
    // Independent block-by-block oracle: stop at first incomplete or unequal block.
    let expected = 0;
    for (let start = 0; start + block <= tokens.length; start += block) {
      if (tokens.slice(start, start + block).some((value, i) => value !== baseline.tokenIds[start + i])) break;
      expected += block;
    }
    assert.equal(result.reusableTokens, expected);
  }
  const shorter = {...baseline, tokenIds: baseline.tokenIds.slice(0, 5), positions: baseline.positions.slice(0, 5)};
  assert.equal(reusableServingPrefix(baseline, shorter, 4).reusableTokens, 4);
});

test("matching token IDs do not authorize reuse across weights, adapter, positions or cache domains", () => {
  for (const key of Object.keys(baseline.context) as (keyof typeof baseline.context)[]) {
    const changed = {...baseline, context: {...baseline.context, [key]: "changed"}};
    const result = reusableServingPrefix(baseline, changed, 2);
    assert.equal(result.commonTokens, 8); assert.equal(result.reusableTokens, 0);
    assert.deepEqual(result.mismatches, [key]);
  }
  const shifted = {...baseline, positions: baseline.positions.map(value => value + 1)};
  assert.equal(reusableServingPrefix(baseline, shifted, 2).reusableTokens, 0);
  const suffixMatch = {...baseline, tokenIds: [99, ...baseline.tokenIds.slice(1)]};
  assert.equal(reusableServingPrefix(baseline, suffixMatch, 2).reusableTokens, 0);
});

test("cache reference rejects malformed inputs instead of claiming reuse", () => {
  assert.throws(() => reusableServingPrefix(baseline, baseline, 0), RangeError);
  assert.throws(() => reusableServingPrefix(baseline, {...baseline, positions: []}, 2), RangeError);
  assert.throws(() => reusableServingPrefix(baseline, {...baseline, tokenIds: [-1, ...baseline.tokenIds.slice(1)]}, 2), RangeError);
  assert.throws(() => reusableServingPrefix(baseline, {...baseline, context: {...baseline.context, weightsRevision: ""}}, 2), RangeError);
});
