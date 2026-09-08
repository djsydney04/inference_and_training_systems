export type ShardingStage = 0 | 1 | 2 | 3;

export type TrainingLedgerInputs = {
  parametersBillions: number;
  ranks: number;
  stage: ShardingStage;
  sequencesPerRank: number;
  sequenceLength: number;
  accumulationSteps: number;
  targetTrillionTokens: number;
};

export type TrainingLedger = {
  weightBytesPerParameterPerRank: number;
  gradientBytesPerParameterPerRank: number;
  optimizerBytesPerParameterPerRank: number;
  modelStateBytesPerRank: number;
  modelStateBytesCluster: number;
  tokensPerUpdate: number;
  updatesToTarget: number;
  exaflopDays: number;
};

/**
 * Estimate a dense decoder trained with classic mixed-precision AdamW.
 *
 * Per logical parameter: 2-byte working weight, 2-byte gradient, 4-byte FP32
 * master weight, and two 4-byte Adam moments. ZeRO stages progressively shard
 * the 12-byte optimizer state, 2-byte gradient, then 2-byte working weight.
 */
export function calculateTrainingLedger(input: TrainingLedgerInputs): TrainingLedger {
  const parameters = Math.max(0.1, input.parametersBillions) * 1e9;
  const ranks = Math.max(1, Math.floor(input.ranks));
  const stage = Math.min(3, Math.max(0, Math.floor(input.stage))) as ShardingStage;
  const sequencesPerRank = Math.max(1, Math.floor(input.sequencesPerRank));
  const sequenceLength = Math.max(1, Math.floor(input.sequenceLength));
  const accumulationSteps = Math.max(1, Math.floor(input.accumulationSteps));
  const targetTokens = Math.max(1e6, input.targetTrillionTokens * 1e12);

  const weightBytesPerParameterPerRank = stage >= 3 ? 2 / ranks : 2;
  const gradientBytesPerParameterPerRank = stage >= 2 ? 2 / ranks : 2;
  const optimizerBytesPerParameterPerRank = stage >= 1 ? 12 / ranks : 12;
  const bytesPerParameterPerRank =
    weightBytesPerParameterPerRank
    + gradientBytesPerParameterPerRank
    + optimizerBytesPerParameterPerRank;

  const tokensPerUpdate = ranks * sequencesPerRank * sequenceLength * accumulationSteps;
  const trainingFlops = 6 * parameters * targetTokens;

  return {
    weightBytesPerParameterPerRank,
    gradientBytesPerParameterPerRank,
    optimizerBytesPerParameterPerRank,
    modelStateBytesPerRank: parameters * bytesPerParameterPerRank,
    modelStateBytesCluster: parameters * bytesPerParameterPerRank * ranks,
    tokensPerUpdate,
    updatesToTarget: Math.ceil(targetTokens / tokensPerUpdate),
    exaflopDays: trainingFlops / 1e18 / 86_400,
  };
}

