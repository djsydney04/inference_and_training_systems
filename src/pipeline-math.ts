export type PipelineMethod = "gpipe" | "1f1b";
export type PipelineOp = {
  stage: number;
  microbatch: number;
  kind: "F" | "B";
  start: number;
  end: number;
};
const key = (stage: number, microbatch: number, kind: string) =>
  `${stage}:${microbatch}:${kind}`;
/** Unit-duration stages, zero transfer cost, synchronous parameter version. */
export function pipelineSchedule(
  stages: number,
  microbatches: number,
  method: PipelineMethod,
) {
  if (
    !Number.isInteger(stages) ||
    stages < 1 ||
    stages > 8 ||
    !Number.isInteger(microbatches) ||
    microbatches < 1 ||
    microbatches > 32 ||
    !["gpipe", "1f1b"].includes(method)
  )
    throw new Error("Invalid teaching pipeline");
  const queues = Array.from({ length: stages }, (_, stage) => {
    const ops: Omit<PipelineOp, "start" | "end">[] = [];
    const add = (microbatch: number, kind: "F" | "B") =>
      ops.push({ stage, microbatch, kind });
    if (method === "gpipe") {
      for (let m = 0; m < microbatches; m++) add(m, "F");
      for (let m = microbatches - 1; m >= 0; m--) add(m, "B");
    } else {
      const warmup = Math.min(stages - stage - 1, microbatches);
      for (let m = 0; m < warmup; m++) add(m, "F");
      for (let m = 0; m < microbatches - warmup; m++) {
        add(m + warmup, "F");
        add(m, "B");
      }
      for (let m = microbatches - warmup; m < microbatches; m++) add(m, "B");
    }
    return ops;
  });
  const completed = new Set<string>(),
    operations: PipelineOp[] = [],
    cursor = Array(stages).fill(0),
    live = Array(stages).fill(0),
    peak = Array(stages).fill(0),
    liveHistory: number[][] = [live.slice()];
  let tick = 0;
  while (completed.size < stages * microbatches * 2) {
    const ready = queues
      .map((queue, r) => queue[cursor[r]])
      .filter((op) => {
        if (!op) return false;
        const { stage: r, microbatch: m, kind } = op;
        if (kind === "F") return r === 0 || completed.has(key(r - 1, m, "F"));
        return (
          completed.has(key(r, m, "F")) &&
          (r === stages - 1 || completed.has(key(r + 1, m, "B"))) &&
          (method !== "gpipe" ||
            completed.has(key(stages - 1, microbatches - 1, "F")))
        );
      });
    if (!ready.length) throw new Error("Pipeline deadlock");
    for (const op of ready) {
      operations.push({ ...op, start: tick, end: tick + 1 });
      completed.add(key(op.stage, op.microbatch, op.kind));
      cursor[op.stage]++;
      live[op.stage] += op.kind === "F" ? 1 : -1;
      if (live[op.stage] < 0)
        throw new Error("Backward released missing activation");
      peak[op.stage] = Math.max(peak[op.stage], live[op.stage]);
    }
    tick++;
    liveHistory.push(live.slice());
  }
  const busy = 2 * microbatches * stages,
    slots = tick * stages;
  return {
    operations,
    ticks: tick,
    stages,
    microbatches,
    method,
    peak,
    liveHistory,
    busy,
    slots,
    bubbleFraction: 1 - busy / slots,
  };
}

/** Dense DP × PP × TP grid only. Expert parallelism is deliberately not another multiplier. */
export function parallelGroups(dp: number, pp: number, tp: number) {
  if (![dp, pp, tp].every((v) => Number.isInteger(v) && v > 0 && v <= 16))
    throw new Error("Invalid dense rank grid");
  const rank = (d: number, p: number, t: number) => (d * pp + p) * tp + t;
  return {
    world: dp * pp * tp,
    tensor: Array.from({ length: dp * pp }, (_, i) =>
      Array.from({ length: tp }, (_, t) => rank(Math.floor(i / pp), i % pp, t)),
    ),
    pipeline: Array.from({ length: dp * tp }, (_, i) =>
      Array.from({ length: pp }, (_, p) => rank(Math.floor(i / tp), p, i % tp)),
    ),
    data: Array.from({ length: pp * tp }, (_, i) =>
      Array.from({ length: dp }, (_, d) => rank(d, Math.floor(i / tp), i % tp)),
    ),
  };
}
