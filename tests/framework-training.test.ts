import assert from "node:assert/strict";
import test from "node:test";
import { frameworkCausalLoss, frameworkExampleLogits, frameworkIdentityDifferences, frameworkLabels,
  frameworkLora, frameworkReduction, frameworkTokens } from "../src/framework-training-math.ts";

test("aligned labels preserve EOS targets even when EOS also supplies padding IDs", () => {
  const labels = frameworkLabels(frameworkTokens, "assistant");
  assert.deepEqual(labels, [-100,-100,-100,-100,4,5,-100,-100]);
  const result = frameworkCausalLoss(frameworkExampleLogits(), labels);
  assert.deepEqual(result.pairs.map(p => [p.position, p.target]), [[3,4],[4,5]]);
  assert.equal(result.count, 2);
  assert.ok(Math.abs(result.mean! - .6) < 1e-12);
  const broken = frameworkCausalLoss(frameworkExampleLogits(), frameworkLabels(frameworkTokens, "token-id"));
  assert.equal(broken.count, 1);
  assert.ok(Math.abs(broken.mean! - .4) < 1e-12);
});

test("double shifting changes which context predicts an answer; full-token masking changes the denominator", () => {
  const wrong = frameworkCausalLoss(frameworkExampleLogits(), frameworkLabels(frameworkTokens, "assistant", true));
  assert.deepEqual(wrong.pairs.map(p => [p.position, p.target]), [[2,4],[3,5]]);
  assert.ok(wrong.mean! > 2);
  assert.equal(frameworkCausalLoss(frameworkExampleLogits(), frameworkLabels(frameworkTokens, "all")).count, 5);
  const truncated = frameworkTokens.slice(0,4);
  const empty = frameworkCausalLoss(frameworkExampleLogits(4), frameworkLabels(truncated, "assistant"));
  assert.equal(empty.mean, null);
  assert.equal(empty.count, 0);
});

test("causal cross entropy is invariant to a constant logit offset and ignores only declared labels", () => {
  const labels = frameworkLabels(frameworkTokens, "assistant"), logits = frameworkExampleLogits();
  const ref = frameworkCausalLoss(logits, labels);
  const shifted = frameworkCausalLoss(logits.map(row => row.map(z => z + 1000)), labels);
  assert.ok(Math.abs(ref.mean! - shifted.mean!) < 1e-12);
  const changed = structuredClone(logits); changed[0] = [100, -100, 0, 0, 0, 0];
  assert.equal(frameworkCausalLoss(changed, labels).mean, ref.mean);
});

test("explicit wrapper divisions recover the same gradient with unequal token counts and an empty local microbatch", () => {
  for (const reducer of ["sum", "mean"] as const) for (const divisor of [1,2,4]) {
    const result = frameworkReduction([[1,5],[0,15]], [[1,2],[0,3]], reducer, divisor);
    assert.equal(result.totalCount, 6);
    assert.equal(result.reduced, 3.5);
    assert.equal(result.direct, 3.5);
    assert.equal(result.scale, (reducer === "mean" ? 2 : 1) * divisor / 6);
  }
});

test("LoRA merging matches the separate path for nonsquare matrices at rank two", () => {
  const w = [[1,2,-1],[-2,.5,3]], a = [[1,0,2],[-1,2,.5]], b = [[2,-1],[.25,3]];
  for (const alpha of [0,.5,1,4]) for (const x of [[1,2,3],[-2,0,.5],[0,0,0]]) {
    const result = frameworkLora(w,a,b,alpha,x);
    // Independent expanded contraction includes both rank terms before adding the base.
    const expected = w.map((row, o) => row.reduce((sum, weight, i) => sum + x[i] *
      (weight + alpha / 2 * (b[o][0] * a[0][i] + b[o][1] * a[1][i])), 0));
    result.separate.forEach((value,i) => assert.ok(Math.abs(value - expected[i]) < 1e-12));
    result.merged.forEach((value,i) => assert.ok(Math.abs(value - expected[i]) < 1e-12));
  }
});

test("matching adapter shapes do not establish base, tokenizer, template or target identity", () => {
  const expected = {baseRevision:"base-commit-a",tokenizerDigest:"vocab-a",templateDigest:"template-a",targetModule:"layer.0.q_proj"};
  assert.deepEqual(frameworkIdentityDifferences(expected, {...expected}), []);
  for (const key of Object.keys(expected)) assert.deepEqual(frameworkIdentityDifferences(expected, {...expected,[key]:"changed"}), [key]);
  const good = frameworkLora([[1,2],[-1,.5]],[[1,-1]],[[.5],[1]],1,[2,1]);
  const wrong = frameworkLora([[1.25,2],[-1,.5]],[[1,-1]],[[.5],[1]],1,[2,1]);
  assert.deepEqual(good.separate,[4.5,-.5]);
  assert.deepEqual(wrong.separate,[5,-.5]);
});

test("invalid objectives, vocabulary IDs, adapter shapes and empty global updates fail explicitly", () => {
  assert.throws(() => frameworkCausalLoss([[0,0],[0,0]],[0,2]), RangeError);
  assert.throws(() => frameworkCausalLoss([[0,NaN],[0,0]],[0,1]), RangeError);
  assert.throws(() => frameworkReduction([[0]],[[0]],"sum",1), RangeError);
  assert.throws(() => frameworkReduction([[1]],[[0]],"sum",1), RangeError);
  assert.throws(() => frameworkReduction([[1,2]],[[1]],"mean",1), RangeError);
  assert.throws(() => frameworkLora([[1,2]],[[1]],[[1]],1,[1,2]), RangeError);
});
