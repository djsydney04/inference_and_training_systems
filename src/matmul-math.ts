export type Matrix = number[][];
export type MatmulConfig = {
  m: number;
  n: number;
  k: number;
  tile: number;
  row: number;
  col: number;
};
export const matmulPhases = ["load", "ready", "accumulate", "release"] as const;
export type MatmulPhase = "start" | (typeof matmulPhases)[number] | "store";

export function validateMatmul(config: MatmulConfig) {
  const { m, n, k, tile, row, col } = config;
  if (
    ![m, n, k, tile].every((v) => Number.isInteger(v) && v > 0 && v <= 32) ||
    !Number.isInteger(row) ||
    !Number.isInteger(col) ||
    row < 0 ||
    row >= m ||
    col < 0 ||
    col >= n
  )
    throw new Error(
      "Use positive dimensions up to 32 and an in-bounds output cell.",
    );
}

/** Small signed integer operands keep every displayed partial sum inspectable. */
export function matmulOperands(config: MatmulConfig) {
  validateMatmul(config);
  return {
    a: Array.from({ length: config.m }, (_, r) =>
      Array.from({ length: config.k }, (_, c) => ((r * 3 + c * 2) % 7) - 3),
    ),
    b: Array.from({ length: config.k }, (_, r) =>
      Array.from({ length: config.n }, (_, c) => ((r * 2 + c * 3 + 1) % 5) - 2),
    ),
  };
}

export function matmulReference(a: Matrix, b: Matrix): Matrix {
  if (
    !a.length ||
    !b.length ||
    !b[0]?.length ||
    a.some((r) => r.length !== b.length) ||
    b.some((r) => r.length !== b[0].length)
  )
    throw new Error("Matrix dimensions must agree.");
  return a.map((row) =>
    b[0].map((_, c) => row.reduce((sum, value, k) => sum + value * b[k][c], 0)),
  );
}

/** Reconstruct one block's state from a step number; no renderer-owned math. */
export function matmulFrame(config: MatmulConfig, step: number) {
  validateMatmul(config);
  const { m, n, k, tile, row, col } = config;
  const chunks = Math.ceil(k / tile),
    totalSteps = chunks * 4 + 1;
  if (!Number.isInteger(step) || step < 0 || step > totalSteps)
    throw new Error("Step outside this tile schedule.");
  const { a, b } = matmulOperands(config);
  const rowStart = Math.floor(row / tile) * tile,
    colStart = Math.floor(col / tile) * tile;
  const stored = step === totalSteps;
  const chunk =
    step === 0 ? 0 : stored ? chunks - 1 : Math.floor((step - 1) / 4);
  const phase: MatmulPhase =
    step === 0 ? "start" : stored ? "store" : matmulPhases[(step - 1) % 4];
  const completedChunks = stored
    ? chunks
    : step === 0
      ? 0
      : chunk + (phase === "accumulate" || phase === "release" ? 1 : 0);
  const completedK = Math.min(k, completedChunks * tile),
    kStart = chunk * tile;
  const sharedA = Array.from({ length: tile }, (_, r) =>
    Array.from({ length: tile }, (_, c) => a[rowStart + r]?.[kStart + c] ?? 0),
  );
  const sharedB = Array.from({ length: tile }, (_, r) =>
    Array.from({ length: tile }, (_, c) => b[kStart + r]?.[colStart + c] ?? 0),
  );
  const accumulators = Array.from({ length: tile }, (_, r) =>
    Array.from({ length: tile }, (_, c) =>
      Array.from(
        { length: completedK },
        (_, p) => (a[rowStart + r]?.[p] ?? 0) * (b[p]?.[colStart + c] ?? 0),
      ).reduce((sum, v) => sum + v, 0),
    ),
  );
  const terms = Array.from(
    { length: Math.min(tile, k - kStart) },
    (_, offset) => ({
      a: a[row][kStart + offset],
      b: b[kStart + offset][col],
      k: kStart + offset,
    }),
  );
  const validRows = Math.min(tile, m - rowStart),
    validCols = Math.min(tile, n - colStart);
  const loadedChunks = step === 0 ? 0 : chunk + 1,
    loadedK = Math.min(k, loadedChunks * tile);
  const stagedReads = (validRows + validCols) * loadedK;
  const naiveReads = 2 * validRows * validCols * k;
  const fullStagedReads = (validRows + validCols) * k;
  return {
    a,
    b,
    phase,
    chunk,
    chunks,
    totalSteps,
    rowStart,
    colStart,
    kStart,
    completedK,
    sharedA,
    sharedB,
    accumulators,
    terms,
    validRows,
    validCols,
    stagedReads,
    naiveReads,
    fullStagedReads,
    reuseFactor: naiveReads / fullStagedReads,
    scheduledFlops: 2 * tile ** 3 * completedChunks,
    usefulFlops: 2 * validRows * validCols * completedK,
    stores: stored ? validRows * validCols : 0,
    selectedValue: accumulators[row - rowStart][col - colStart],
    selectedReference: matmulReference(a, b)[row][col],
  };
}
export type MatmulFrame = ReturnType<typeof matmulFrame>;
