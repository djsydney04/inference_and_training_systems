import assert from "node:assert/strict";
import test from "node:test";

import { calculateTrainingLedger, type ShardingStage } from "../src/training-math.ts";

const base = {
  parametersBillions: 7,
  ranks: 8,
  sequencesPerRank: 2,
  sequenceLength: 4096,
  accumulationSteps: 8,
  targetTrillionTokens: 1,
};

test("classic mixed-precision AdamW uses 16 bytes per parameter at ZeRO-0", () => {
  const result = calculateTrainingLedger({ ...base, stage: 0 });
  assert.equal(result.modelStateBytesPerRank, 112e9);
  assert.equal(result.modelStateBytesCluster, 896e9);
});

test("ZeRO stages progressively shard optimizer, gradient, and parameter state", () => {
  const expectedBytesPerParameter = [16, 5.5, 3.75, 2];
  expectedBytesPerParameter.forEach((expected, stage) => {
    const result = calculateTrainingLedger({ ...base, stage: stage as ShardingStage });
    assert.equal(result.modelStateBytesPerRank, 7e9 * expected);
  });
});

test("global token and dense-decoder compute units reconcile", () => {
  const result = calculateTrainingLedger({ ...base, stage: 3 });
  assert.equal(result.tokensPerUpdate, 524_288);
  assert.equal(result.updatesToTarget, 1_907_349);
  assert.ok(Math.abs(result.exaflopDays - 0.4861111111) < 1e-9);
});

