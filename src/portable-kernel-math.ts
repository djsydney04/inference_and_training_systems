export type TileShape = { m: number; n: number; k: number };

/** Mathematical work and storage, never a latency or occupancy prediction. */
export function tilePlan(shape: TileShape, tile: TileShape) {
  for (const dimension of [...Object.values(shape), ...Object.values(tile)]) {
    if (!Number.isSafeInteger(dimension) || dimension < 1 || dimension > 8192)
      throw new RangeError("Dimensions must be integers from 1 through 8192");
  }
  const rows = Math.ceil(shape.m / tile.m), columns = Math.ceil(shape.n / tile.n);
  const reductions = Math.ceil(shape.k / tile.k);
  return {
    rows, columns, reductions,
    outputTiles: rows * columns,
    tileUpdates: rows * columns * reductions,
    usefulOutputs: shape.m * shape.n,
    paddedOutputs: rows * tile.m * columns * tile.n - shape.m * shape.n,
    operations: 2 * shape.m * shape.n * shape.k,
    operandBytes: 2 * (tile.m * tile.k + tile.k * tile.n),
    accumulatorBytes: 4 * tile.m * tile.n,
  };
}

export function tileBounds(shape: TileShape, tile: TileShape, row: number, column: number, step: number) {
  const plan = tilePlan(shape, tile);
  for (const [index, count] of [[row, plan.rows], [column, plan.columns], [step, plan.reductions]]) {
    if (!Number.isInteger(index) || index < 0 || index >= count) throw new RangeError("Tile index out of range");
  }
  return {
    rowStart: row * tile.m, rowEnd: Math.min((row + 1) * tile.m, shape.m),
    columnStart: column * tile.n, columnEnd: Math.min((column + 1) * tile.n, shape.n),
    kStart: step * tile.k, kEnd: Math.min((step + 1) * tile.k, shape.k),
  };
}
