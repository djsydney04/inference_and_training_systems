import { kernelBackends } from "./portable-kernel-data.ts";
import type { LessonVisual } from "./lesson-visual-data.ts";

const examples: Record<string,string> = {
  h100: "A 64 × 128 × 32 update stages 12 KiB of BF16 A/B values and keeps 32 KiB of FP32 accumulators. Those bytes live in different storage resources.",
  mi300x: "A 256-thread workgroup contains four 64-lane CDNA 3 wavefronts. Keep the output ownership explicit when redesigning a reduction written for 32 lanes.",
  tpu: "A [256,256] × [256,256] product with 128-sized tiles has four output tiles, each accumulated over two K steps: eight tile updates in total.",
  trainium: "If A has shape [128,256], its stationary representation has shape [256,128]. Split that K dimension into two 128-element steps while preserving one output accumulator.",
};
export const portableVisuals: LessonVisual[] = kernelBackends.map(backend=>({
  id: backend.lesson, kind: "flow", title: `${backend.name}: follow the matrix operands`,
  relationship: backend.software,
  steps: backend.stages,
  invariant: backend.boundary,
  example: examples[backend.id],
}));
