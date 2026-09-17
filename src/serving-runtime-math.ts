const natural = (name: string, value: number, allowZero = false) => {
  if (!Number.isSafeInteger(value) || value < (allowZero ? 0 : 1)) throw new Error(`Invalid ${name}`);
};
const finite = (name: string, value: number, allowZero = true) => {
  if (!Number.isFinite(value) || value < 0 || (!allowZero && value === 0)) throw new Error(`Invalid ${name}`);
};

export interface ServingRequest { id: string; prompt: number; outputs: number; arrival: number; cancelAt?: number }
export interface SchedulerConfig {
  budget: number; chunk: number; blocks: number; blockSize: number;
  reserve: "maximum" | "growing"; priority: "decode-first" | "prefill-first";
}
type Status = "waiting" | "prefill" | "decode" | "complete" | "cancelled" | "rejected";
export interface RequestState extends ServingRequest { cached: number; generated: number; allocated: number; status: Status }
export interface SchedulerStep {
  iteration: number; operations: { id: string; kind: "prefill" | "decode"; tokens: number; emits: number }[];
  events: string[]; peakBlocks: number; heldBlocks: number; states: RequestState[];
}
/** Deliberately synchronous, no prefix sharing, eviction, speculation, or latency model. */
export function scheduleRequests(requests: ServingRequest[], config: SchedulerConfig) {
  for (const key of ["budget", "chunk", "blocks", "blockSize"] as const) natural(key, config[key]);
  if (!["maximum", "growing"].includes(config.reserve) || !["decode-first", "prefill-first"].includes(config.priority))
    throw new Error("Unknown scheduling policy");
  const names = new Set<string>();
  const states = requests.map<RequestState>(request => {
    if (!/^[A-Za-z0-9_-]+$/.test(request.id) || names.has(request.id)) throw new Error("Request IDs must be unique safe labels");
    names.add(request.id);
    natural("prompt", request.prompt); natural("outputs", request.outputs); natural("arrival", request.arrival, true);
    if (request.cancelAt !== undefined) { natural("cancelAt", request.cancelAt, true); if (request.cancelAt < request.arrival) throw new Error("Cancellation precedes arrival"); }
    return { ...request, cached: 0, generated: 0, allocated: 0, status: "waiting" };
  }).sort((a, b) => a.arrival - b.arrival);
  const steps: SchedulerStep[] = [];
  const terminal = (s: RequestState) => ["complete", "cancelled", "rejected"].includes(s.status);
  const held = () => states.reduce((sum, s) => sum + s.allocated, 0);
  let stalled = false;
  // A finite trace protects the interactive page from unbounded user workloads.
  for (let iteration = 0; iteration < 256 && states.some(s => !terminal(s)); iteration++) {
    const events: string[] = [];
    for (const s of states) {
      if (s.arrival === iteration) events.push(`${s.id} arrives`);
      if (!terminal(s) && s.cancelAt === iteration) {
        events.push(`${s.id} cancels; release ${s.allocated} blocks at this completed-iteration boundary`);
        s.allocated = 0; s.status = "cancelled";
      }
    }
    const eligible = states.filter(s => s.arrival <= iteration && !terminal(s));
    const decode = eligible.filter(s => s.status === "decode");
    const prefill = eligible.filter(s => s.status !== "decode");
    const ordered = config.priority === "decode-first" ? [...decode, ...prefill] : [...prefill, ...decode];
    const operations: SchedulerStep["operations"] = [];
    let budget = config.budget;
    for (const s of ordered) {
      const kind = s.status === "decode" ? "decode" : "prefill";
      const tokens = kind === "decode" ? 1 : Math.min(config.chunk, s.prompt - s.cached, budget);
      if (!budget || !tokens) { events.push(`${s.id} waits for token budget`); continue; }
      const required = Math.ceil((config.reserve === "maximum" ? s.prompt + s.outputs - 1 : s.cached + tokens) / config.blockSize);
      if (required > config.blocks && !s.allocated) {
        s.status = "rejected"; events.push(`${s.id} rejected: requested reservation exceeds the pool`); continue;
      }
      if (held() + required - s.allocated > config.blocks) { events.push(`${s.id} waits for KV blocks`); continue; }
      s.allocated = required; s.cached += tokens; budget -= tokens;
      const emits = kind === "decode" || s.cached === s.prompt ? 1 : 0;
      s.generated += emits;
      s.status = s.generated >= s.outputs ? "complete" : s.cached < s.prompt ? "prefill" : "decode";
      operations.push({ id: s.id, kind, tokens, emits });
    }
    const peakBlocks = held(); // Terminal buffers cannot be reused inside the same iteration.
    for (const s of states) if (s.status === "complete" && s.allocated) {
      events.push(`${s.id} completes; release ${s.allocated} blocks after execution`); s.allocated = 0;
    }
    steps.push({ iteration, operations, events, peakBlocks, heldBlocks: held(), states: states.map(s => ({ ...s })) });
    if (!operations.length && states.some(s => !terminal(s)) && !states.some(s => !terminal(s) && (s.arrival > iteration || (s.cancelAt ?? -1) > iteration))) {
      stalled = true; break;
    }
  }
  return { steps, states, stalled, truncated: !stalled && states.some(s => !terminal(s)) };
}

/** Finite, single-server FCFS comparison. Times are declared, not measured. */
export function arrivalTrace(count: number, intervalMs: number, serviceMs: number, mode: "open" | "closed") {
  natural("count", count); finite("intervalMs", intervalMs, false); finite("serviceMs", serviceMs, false);
  if (count > 10000 || !["open", "closed"].includes(mode)) throw new Error("Invalid trace configuration");
  let available = 0;
  return Array.from({ length: count }, (_, i) => {
    const arrival = mode === "open" ? i * intervalMs : available;
    const start = Math.max(arrival, available), finish = start + serviceMs;
    available = finish;
    return { id: i, arrival, start, finish, wait: start - arrival, latency: finish - arrival };
  });
}

export interface DeliveryTrace { id: string; arrival: number; sent: number; tokens: number[]; end: number; status: "complete" | "failed" | "cancelled" }
export interface ServiceObjective { ttftMs: number; maxGapMs: number; completionMs: number }
/** Each timestamp must identify one known output token; network chunks are insufficient. */
export function deliveryMetrics(trace: DeliveryTrace, objective: ServiceObjective) {
  for (const [name, value] of Object.entries(objective)) finite(name, value);
  for (const [name, value] of [["arrival", trace.arrival], ["sent", trace.sent], ["end", trace.end]] as const) finite(name, value);
  if (trace.sent < trace.arrival || trace.end < trace.sent) throw new Error("Invalid request boundaries");
  let previous = trace.sent;
  for (const time of trace.tokens) { finite("token timestamp", time); if (time < previous || time > trace.end) throw new Error("Invalid token order"); previous = time; }
  if (!["complete", "failed", "cancelled"].includes(trace.status)) throw new Error("Unknown terminal status");
  if (trace.status === "complete" && !trace.tokens.length) throw new Error("This completion contract requires at least one output token");
  const ttft = trace.tokens.length ? trace.tokens[0] - trace.arrival : null;
  const gaps = trace.tokens.slice(1).map((time, i) => time - trace.tokens[i]);
  const tpot = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : null;
  const maxGap = gaps.length ? Math.max(...gaps) : null;
  const completion = trace.end - trace.arrival;
  const compliant = trace.status === "complete" && ttft !== null && ttft <= objective.ttftMs &&
    (maxGap === null || maxGap <= objective.maxGapMs) && completion <= objective.completionMs;
  return { ttft, gaps, tpot, maxGap, completion, clientQueue: trace.sent - trace.arrival, compliant };
}
export function goodputReport(traces: DeliveryTrace[], objective: ServiceObjective, start: number, end: number) {
  finite("start", start); finite("end", end);
  if (end <= start || new Set(traces.map(t => t.id)).size !== traces.length) throw new Error("Invalid observation window or duplicate attempt");
  if (traces.some(t => t.arrival < start || t.end > end)) throw new Error("Finite cohort must fit the declared window");
  const metrics = traces.map(t => deliveryMetrics(t, objective));
  const completed = traces.filter(t => t.status === "complete").length;
  const compliant = metrics.filter(m => m.compliant).length;
  const seconds = (end - start) / 1000;
  return { offered: traces.length, completed, failed: traces.filter(t => t.status === "failed").length,
    cancelled: traces.filter(t => t.status === "cancelled").length, compliant,
    throughput: completed / seconds, goodput: compliant / seconds,
    attainment: traces.length ? compliant / traces.length : null, metrics };
}
