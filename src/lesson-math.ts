export type SoftmaxState = { maximum: number; denominator: number; numerator: number };

/** One scalar output channel, with the same rescaling used for every value channel. */
export function mergeSoftmaxTile(state: SoftmaxState, scores: number[], values: number[]): SoftmaxState {
  if (!scores.length || scores.length !== values.length) throw new Error("A tile needs matching, nonempty scores and values");
  const maximum = Math.max(state.maximum, ...scores);
  const correction = Math.exp(state.maximum - maximum);
  const weights = scores.map((score) => Math.exp(score - maximum));
  return {
    maximum,
    denominator: correction * state.denominator + weights.reduce((a, b) => a + b, 0),
    numerator: correction * state.numerator + weights.reduce((sum, w, i) => sum + w * values[i], 0),
  };
}

/** Ideal aligned 32-byte sectors touched by 32 lanes, each loading one FP32 value. */
export function coalescedSectors(stride: number) {
  const addresses = Array.from({ length: 32 }, (_, lane) => lane * stride * 4);
  const sectors = [...new Set(addresses.map((address) => Math.floor(address / 32)))];
  return { addresses, sectors, usefulBytes: 128, transferredBytes: sectors.length * 32 };
}

export type CacheRequest = { name: string; blocks: number[]; tokens: number };
export type CacheState = { requests: CacheRequest[]; capacity: number; blockSize: number };

export function initialCache(): CacheState {
  return { capacity: 12, blockSize: 4, requests: [
    { name: "A", blocks: [2, 7, 0], tokens: 10 },
    { name: "B", blocks: [2, 7, 5], tokens: 9 },
  ] };
}

export function cacheOwners(state: CacheState, block: number) {
  return state.requests.filter((request) => request.blocks.includes(block)).map((request) => request.name);
}

/** Allocate before mutating; a failed append leaves the old state intact. */
export function appendCacheToken(state: CacheState, name: string): CacheState {
  const next = { ...state, requests: state.requests.map((r) => ({ ...r, blocks: [...r.blocks] })) };
  const request = next.requests.find((r) => r.name === name);
  if (!request) return state;
  const last = request.blocks.at(-1);
  const needsNew = request.tokens % state.blockSize === 0;
  const needsCopy = !needsNew && last !== undefined && cacheOwners(state, last).length > 1;
  if (needsNew || needsCopy) {
    const free = Array.from({ length: state.capacity }, (_, i) => i).find((i) => !cacheOwners(state, i).length);
    if (free === undefined) throw new Error("No free blocks: finish a request or reset the lab.");
    if (needsNew) request.blocks.push(free);
    else request.blocks[request.blocks.length - 1] = free;
  }
  request.tokens += 1;
  return next;
}

export function releaseCacheRequest(state: CacheState, name: string): CacheState {
  return { ...state, requests: state.requests.filter((request) => request.name !== name) };
}
