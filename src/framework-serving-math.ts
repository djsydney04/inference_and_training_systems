/** Original serving-contract reference. No model, engine or network is simulated. */
export interface StopUpdate {
  emitted: string;
  pending: string;
  stopped: boolean;
  matched: string | null;
}

/**
 * Exclude the first stop to COMPLETE in the character stream. If several
 * complete at once, prefer the longest. Hold any suffix that could become a
 * stop; chunk boundaries never change this policy. Input is decoded text.
 */
export class TextStopFilter {
  private readonly stops: string[];
  private pending = "";
  private terminal = false;
  private matched: string | null = null;

  constructor(stops: readonly string[]) {
    if (stops.some(stop => stop.length === 0)) throw new RangeError("Stop strings must be nonempty");
    this.stops = [...new Set(stops)].sort((a, b) => b.length - a.length);
  }

  push(chunk: string): StopUpdate {
    let emitted = "";
    if (!this.terminal) for (const character of chunk) {
      this.pending += character;
      const match = this.stops.find(stop => this.pending.endsWith(stop));
      if (match !== undefined) {
        emitted += this.pending.slice(0, -match.length);
        this.pending = "";
        this.matched = match;
        this.terminal = true;
        break;
      }
      let hold = 0;
      for (const stop of this.stops) {
        for (let length = 1; length < stop.length && length <= this.pending.length; length++) {
          if (this.pending.endsWith(stop.slice(0, length))) hold = Math.max(hold, length);
        }
      }
      emitted += this.pending.slice(0, this.pending.length - hold);
      this.pending = this.pending.slice(this.pending.length - hold);
    }
    return {emitted, pending: this.pending, stopped: this.terminal, matched: this.matched};
  }

  /** Normal end-of-input releases an incomplete delimiter. A matched stop does not. */
  finish(): StopUpdate {
    const emitted = this.terminal ? "" : this.pending;
    this.pending = "";
    this.terminal = true;
    return {emitted, pending: "", stopped: true, matched: this.matched};
  }
}

export interface ServingCacheContext {
  weightsRevision: string;
  adapterRevision: string;
  attentionConfig: string;
  cacheFormat: string;
  cacheNamespace: string;
}

export interface ServingPrefix {
  tokenIds: readonly number[];
  positions: readonly number[];
  context: ServingCacheContext;
}

/** Same-engine, dense causal, text-only full-block reuse model. No partial blocks. */
export function reusableServingPrefix(cached: ServingPrefix, incoming: ServingPrefix, blockSize: number) {
  if (!Number.isSafeInteger(blockSize) || blockSize < 1) throw new RangeError("Block size must be a positive integer");
  const fields: (keyof ServingCacheContext)[] = ["weightsRevision", "adapterRevision", "attentionConfig", "cacheFormat", "cacheNamespace"];
  for (const prefix of [cached, incoming]) {
    if (prefix.tokenIds.length !== prefix.positions.length) throw new RangeError("Every token needs a position");
    if (prefix.tokenIds.some(id => !Number.isSafeInteger(id) || id < 0) || prefix.positions.some(position => !Number.isSafeInteger(position) || position < 0)) {
      throw new RangeError("Token IDs and positions must be nonnegative integers");
    }
    if (fields.some(field => typeof prefix.context[field] !== "string" || !prefix.context[field])) throw new RangeError("Context fields must be explicit");
  }
  const mismatches = fields.filter(field => cached.context[field] !== incoming.context[field]);
  let commonTokens = 0;
  while (commonTokens < Math.min(cached.tokenIds.length, incoming.tokenIds.length)
    && cached.tokenIds[commonTokens] === incoming.tokenIds[commonTokens]
    && cached.positions[commonTokens] === incoming.positions[commonTokens]) commonTokens++;
  const reusableTokens = mismatches.length ? 0 : Math.floor(commonTokens / blockSize) * blockSize;
  return {commonTokens, reusableTokens, reusableBlocks: reusableTokens / blockSize, mismatches};
}
