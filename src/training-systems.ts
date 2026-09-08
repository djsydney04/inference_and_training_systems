import { calculateTrainingLedger, type ShardingStage } from "./training-math";

const gib = 1024 ** 3;

const getInput = (selector: string) => document.querySelector<HTMLInputElement>(selector);

function formatBytes(bytes: number) {
  if (bytes >= 1024 ** 4) return `${(bytes / 1024 ** 4).toFixed(2)} TiB`;
  return `${(bytes / gib).toFixed(2)} GiB`;
}

function formatLargeInteger(value: number) {
  return Math.ceil(value).toLocaleString("en-US");
}

export function initializeTrainingSystems() {
  const paramsInput = getInput("[data-train-params]");
  const ranksInput = getInput("[data-train-ranks]");
  const zeroInput = document.querySelector<HTMLSelectElement>("[data-train-zero]");
  const microbatchInput = getInput("[data-train-microbatch]");
  const sequenceInput = getInput("[data-train-sequence]");
  const accumulationInput = getInput("[data-train-accum]");
  const targetInput = getInput("[data-train-target]");
  if (!paramsInput || !ranksInput || !zeroInput || !microbatchInput || !sequenceInput || !accumulationInput || !targetInput) return;

  const perRankOutput = document.querySelector<HTMLElement>("[data-train-per-rank]");
  const clusterOutput = document.querySelector<HTMLElement>("[data-train-cluster]");
  const tokensOutput = document.querySelector<HTMLElement>("[data-train-global-tokens]");
  const stepsOutput = document.querySelector<HTMLElement>("[data-train-steps]");
  const flopsOutput = document.querySelector<HTMLElement>("[data-train-flops]");
  const explanation = document.querySelector<HTMLElement>("[data-train-explanation]");
  const weightBar = document.querySelector<HTMLElement>("[data-state-weights]");
  const gradientBar = document.querySelector<HTMLElement>("[data-state-gradients]");
  const optimizerBar = document.querySelector<HTMLElement>("[data-state-optimizer]");

  const render = () => {
    const ranks = Math.max(1, Math.floor(Number(ranksInput.value)));
    const stage = Number(zeroInput.value) as ShardingStage;
    const ledger = calculateTrainingLedger({
      parametersBillions: Number(paramsInput.value),
      ranks,
      stage,
      sequencesPerRank: Number(microbatchInput.value),
      sequenceLength: Number(sequenceInput.value),
      accumulationSteps: Number(accumulationInput.value),
      targetTrillionTokens: Number(targetInput.value),
    });

    if (perRankOutput) perRankOutput.textContent = formatBytes(ledger.modelStateBytesPerRank);
    if (clusterOutput) clusterOutput.textContent = formatBytes(ledger.modelStateBytesCluster);
    if (tokensOutput) tokensOutput.textContent = ledger.tokensPerUpdate.toLocaleString("en-US");
    if (stepsOutput) stepsOutput.textContent = formatLargeInteger(ledger.updatesToTarget);
    if (flopsOutput) {
      const precision = ledger.exaflopDays < 10 ? 2 : ledger.exaflopDays < 100 ? 1 : 0;
      flopsOutput.textContent = `${ledger.exaflopDays.toFixed(precision)} exaFLOP-days`;
    }

    const total = Math.max(
      0.001,
      ledger.weightBytesPerParameterPerRank
        + ledger.gradientBytesPerParameterPerRank
        + ledger.optimizerBytesPerParameterPerRank,
    );
    if (weightBar) weightBar.style.flexGrow = String(ledger.weightBytesPerParameterPerRank / total);
    if (gradientBar) gradientBar.style.flexGrow = String(ledger.gradientBytesPerParameterPerRank / total);
    if (optimizerBar) optimizerBar.style.flexGrow = String(ledger.optimizerBytesPerParameterPerRank / total);

    const explanations = [
      `All model state is replicated. ${ranks} ranks allocate ${ranks} complete copies.`,
      `Parameters and gradients stay replicated; FP32 master weights and Adam moments are divided across ${ranks} ranks.`,
      `Parameters stay replicated; gradients and optimizer state are divided across ${ranks} ranks.`,
      `Parameters, gradients, and optimizer state are divided across ${ranks} ranks and materialized around computation.`,
    ];
    if (explanation) explanation.textContent = explanations[stage] ?? explanations[0];
  };

  [paramsInput, ranksInput, zeroInput, microbatchInput, sequenceInput, accumulationInput, targetInput]
    .forEach((input) => input.addEventListener("input", render));
  render();
}
