/** Small, explicit teaching machines. These are not timing models of a product. */
export type IssueMode = "ordered" | "ready";
export const cpuOperations = [
  { name: "Load A", unit: "load", deps: [] as number[], latency: 6 },
  { name: "A + 1", unit: "alu", deps: [0], latency: 1 },
  { name: "B + C", unit: "alu", deps: [], latency: 1 },
  { name: "Double sum", unit: "alu", deps: [2], latency: 1 },
  { name: "Load D", unit: "load", deps: [], latency: 6 },
  { name: "Combine", unit: "alu", deps: [1, 3, 4], latency: 1 },
] as const;
export type IssueFrame = { cycle: number; issued: number[]; retired: number[]; status: ("waiting" | "running" | "complete" | "retired")[] };
export function issueSchedule(mode: IssueMode) {
  if (mode !== "ordered" && mode !== "ready") throw new RangeError("Unknown issue policy");
  const starts = cpuOperations.map(() => -1), finishes = cpuOperations.map(() => Infinity), retireTimes = cpuOperations.map(() => Infinity);
  const frames: IssueFrame[] = [];
  let head = 0;
  for (let cycle = 0; head < cpuOperations.length; cycle++) {
    const retired: number[] = [], issued: number[] = [];
    while (head < cpuOperations.length && finishes[head] <= cycle && retired.length < 2) {
      retireTimes[head] = cycle; retired.push(head++);
    }
    const units = new Set<string>();
    for (let i = 0; i < cpuOperations.length; i++) {
      if (starts[i] >= 0) continue;
      const op = cpuOperations[i];
      const ready = op.deps.every(dep => finishes[dep] <= cycle) && !units.has(op.unit);
      if (!ready) { if (mode === "ordered") break; else continue; }
      starts[i] = cycle; finishes[i] = cycle + op.latency; units.add(op.unit); issued.push(i);
    }
    frames.push({ cycle, issued, retired, status: starts.map((start, i) => retireTimes[i] <= cycle ? "retired" : finishes[i] <= cycle ? "complete" : start >= 0 ? "running" : "waiting") });
    if (cycle > 100) throw new Error("Teaching schedule failed to make progress");
  }
  return { starts, finishes, retireTimes, frames, cycles: frames.at(-1)!.cycle };
}

export type CachePattern = "sequential" | "conflict" | "capacity";
export const cacheAddresses = (pattern: CachePattern): number[] => {
  if (pattern === "sequential") return Array.from({ length: 16 }, (_, i) => i * 4);
  if (pattern === "conflict") return Array.from({ length: 12 }, (_, i) => i % 2 * 256);
  if (pattern === "capacity") return Array.from({ length: 15 }, (_, i) => i % 5 * 64);
  throw new RangeError("Unknown address pattern");
};
export type CacheAccess = { address: number; line: number; set: number; tag: number; offset: number; hit: boolean; evicted: number | null };
export function cacheTrace(addresses: readonly number[], ways: number, count = addresses.length) {
  if (![1, 2, 4].includes(ways)) throw new RangeError("Use one, two or four ways");
  if (!Number.isInteger(count) || count < 0 || count > addresses.length || addresses.some(a => !Number.isSafeInteger(a) || a < 0)) throw new RangeError("Invalid access trace");
  const sets: number[][] = Array.from({ length: 4 / ways }, () => []);
  const accesses: CacheAccess[] = [];
  for (const address of addresses.slice(0, count)) {
    const line = Math.floor(address / 64), set = line % sets.length, tag = Math.floor(line / sets.length), offset = address % 64;
    const entries = sets[set], found = entries.indexOf(line), hit = found >= 0;
    const evicted = !hit && entries.length === ways ? entries[0] : null;
    if (hit) entries.splice(found, 1); else if (evicted !== null) entries.shift();
    entries.push(line);
    accesses.push({ address, line, set, tag, offset, hit, evicted });
  }
  const hits = accesses.filter(a => a.hit).length;
  return { sets, accesses, hits, misses: accesses.length - hits, bytesFetched: (accesses.length - hits) * 64 };
}

export type BranchPattern = "loop" | "alternating" | "phases";
export const branchOutcomes = (pattern: BranchPattern): boolean[] => {
  if (pattern === "loop") return Array.from({ length: 16 }, (_, i) => i % 8 !== 7);
  if (pattern === "alternating") return Array.from({ length: 16 }, (_, i) => i % 2 === 0);
  if (pattern === "phases") return Array.from({ length: 16 }, (_, i) => i < 8);
  throw new RangeError("Unknown branch pattern");
};
export function branchTrace(outcomes: readonly boolean[], initial = 1) {
  if (!Number.isInteger(initial) || initial < 0 || initial > 3) throw new RangeError("A two-bit state is 0..3");
  let state = initial;
  return outcomes.map(taken => {
    const before = state, predicted = state >= 2;
    state = Math.max(0, Math.min(3, state + (taken ? 1 : -1)));
    return { before, predicted, taken, after: state, correct: predicted === taken };
  });
}
