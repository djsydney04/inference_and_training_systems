/** Small, explicit digital models. No analog timing or vendor-device simulation. */
const integer = (value: number, min: number, max: number, label: string) => {
  if (!Number.isInteger(value) || value < min || value > max)
    throw new RangeError(`${label} must be an integer from ${min} to ${max}`);
};
const widthLimit = (width: number) => integer(width, 2, 24, "word width");
export function signedValue(word: number, width: number) {
  widthLimit(width);
  integer(word, 0, 2 ** width - 1, "encoded word");
  return word >= 2 ** (width - 1) ? word - 2 ** width : word;
}
export function encodeSigned(value: number, width: number) {
  widthLimit(width);
  integer(value, -(2 ** (width - 1)), 2 ** (width - 1) - 1, "signed value");
  return value < 0 ? value + 2 ** width : value;
}
export function addWord(a: number, b: number, width: number) {
  widthLimit(width);
  integer(a, 0, 2 ** width - 1, "a");
  integer(b, 0, 2 ** width - 1, "b");
  let carry = 0;
  const bits = Array.from({ length: width }, (_, index) => {
    const av = Math.floor(a / 2 ** index) % 2;
    const bv = Math.floor(b / 2 ** index) % 2;
    const carryIn = carry;
    const sum = (av + bv + carryIn) % 2;
    carry = Math.floor((av + bv + carryIn) / 2);
    return { index, a: av, b: bv, carryIn, sum, carryOut: carry };
  });
  const word = (a + b) % 2 ** width;
  const exactSigned = signedValue(a, width) + signedValue(b, width);
  return {
    bits, word, carryOut: carry,
    signed: signedValue(word, width), exactSigned,
    overflow: exactSigned < -(2 ** (width - 1)) || exactSigned >= 2 ** (width - 1),
  };
}
export function roundTiesEven(value: number) {
  if (!Number.isFinite(value)) throw new RangeError("finite value required");
  const floor = Math.floor(value), fraction = value - floor;
  return fraction < 0.5 ? floor : fraction > 0.5 ? floor + 1 : floor % 2 === 0 ? floor : floor + 1;
}
/** Signed W-bit word with F fractional bits, nearest/even rounding then saturation. */
export function fixedPoint(value: number, width: number, fractionBits: number) {
  widthLimit(width);
  integer(fractionBits, 0, width - 1, "fraction bits");
  if (!Number.isFinite(value)) throw new RangeError("finite value required");
  const scale = 2 ** fractionBits, min = -(2 ** (width - 1)), max = 2 ** (width - 1) - 1;
  const rounded = roundTiesEven(value * scale);
  const raw = Math.max(min, Math.min(max, rounded));
  return {
    raw, word: encodeSigned(raw, width), reconstructed: raw / scale,
    error: raw / scale - value, saturated: rounded < min || rounded > max,
    step: 1 / scale, min: min / scale, max: max / scale,
  };
}
export type TimingInputs = {
  period: number; clockQMax: number; clockQMin: number;
  logicMax: number; logicMin: number; setup: number; hold: number;
  skew: number; uncertainty: number;
};
export function timingBudget(p: TimingInputs) {
  for (const [key, value] of Object.entries(p)) {
    if (!Number.isFinite(value) || (key !== "skew" && value < 0))
      throw new RangeError(`${key} must be finite${key === "skew" ? "" : " and nonnegative"}`);
  }
  if (p.period <= 0 || p.logicMin > p.logicMax || p.clockQMin > p.clockQMax)
    throw new RangeError("positive period and ordered minimum/maximum delays required");
  const latestArrival = p.clockQMax + p.logicMax;
  const setupDeadline = p.period + p.skew - p.setup - p.uncertainty;
  const earliestArrival = p.clockQMin + p.logicMin;
  const holdDeadline = p.skew + p.hold + p.uncertainty;
  return {
    latestArrival, setupDeadline, earliestArrival, holdDeadline,
    setupSlack: setupDeadline - latestArrival,
    holdSlack: earliestArrival - holdDeadline,
    minPeriod: p.clockQMax + p.logicMax + p.setup + p.uncertainty - p.skew,
  };
}
export type MacToken = { id: number; a: number; b: number; c: number };
export type ProductToken = MacToken & { product: number };
export type ResultToken = ProductToken & { result: number };
export type ElasticState = { product: ProductToken | null; result: ResultToken | null };
export const emptyElastic = (): ElasticState => ({ product: null, result: null });
/** Both registers update from pre-edge values, matching nonblocking RTL. */
export function elasticEdge(state: ElasticState, input: MacToken | null, outReady: boolean) {
  const resultReady = state.result === null || outReady;
  const inputReady = state.product === null || resultReady;
  const accepted = input !== null && inputReady;
  const advanced = state.product !== null && resultReady;
  const consumed = outReady ? state.result : null;
  const next: ElasticState = {
    product: inputReady ? (input ? { ...input, product: input.a * input.b } : null) : state.product,
    result: resultReady ? (state.product ? { ...state.product, result: state.product.product + state.product.c } : null) : state.result,
  };
  return { next, inputReady, resultReady, accepted, advanced, consumed };
}
export const systolicA = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];
export const systolicB = [[2, 1, 0], [0, 2, 1], [1, 0, 2]];
/** Output-stationary array; one hop/cycle; A row i and B column j are skewed. */
export function systolicFrame(step: number) {
  integer(step, -1, 6, "systolic step");
  const cells = systolicA.flatMap((row, i) => systolicB[0].map((_, j) => {
    const k = step - i - j;
    const completed = Math.max(0, Math.min(3, k + 1));
    const partial = row.slice(0, completed).reduce((sum, a, kk) => sum + a * systolicB[kk][j], 0);
    const active = k >= 0 && k < 3;
    return { i, j, k, active, complete: completed === 3, partial,
      a: active ? row[k] : null, b: active ? systolicB[k][j] : null, completed };
  }));
  return { step, cells, active: cells.filter(c => c.active).length,
    accumulatedMacs: cells.reduce((sum, c) => sum + c.completed, 0),
    expected: systolicA.map(row => systolicB[0].map((_, j) => row.reduce((sum, a, k) => sum + a * systolicB[k][j], 0))) };
}
