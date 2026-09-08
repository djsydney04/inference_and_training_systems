export type Chapter = {
  id: string;
  title: string;
  part: string;
  outcome: string;
  requires: string[];
};

export const chapters: Chapter[] = [
  {
    id: "orientation",
    title: "The systems perspective",
    part: "Foundations",
    outcome:
      "Locate the scarce resource and separate an algorithm from its implementation.",
    requires: [],
  },
  {
    id: "tensors",
    title: "Tensors & gradients",
    part: "Foundations",
    outcome:
      "Track shapes, derive a gradient, and implement a next-token loss.",
    requires: ["orientation"],
  },
  {
    id: "transformer",
    title: "The Transformer",
    part: "Foundations",
    outcome:
      "Reconstruct a decoder block and explain what forward and backward must preserve.",
    requires: ["tensors"],
  },
  {
    id: "attention",
    title: "Attention architectures",
    part: "Foundations",
    outcome:
      "Distinguish connectivity, cached state, recurrence, and memory-efficient kernels.",
    requires: ["transformer"],
  },
  {
    id: "data",
    title: "Data & pre-training design",
    part: "Training",
    outcome:
      "Specify a versioned data mixture and an experiment whose result you can trust.",
    requires: ["tensors", "transformer"],
  },
  {
    id: "training",
    title: "Distributed training",
    part: "Training",
    outcome:
      "Reconcile global loss, memory, communication, and recovery across workers.",
    requires: ["data", "attention"],
  },
  {
    id: "post-training",
    title: "Post-training & evaluation",
    part: "Training",
    outcome:
      "Implement response masking and preference objectives; audit a rollout pipeline.",
    requires: ["training"],
  },
  {
    id: "machine",
    title: "CPU & GPU architecture",
    part: "Hardware",
    outcome:
      "Trace an operand through memory, registers, scheduling and execution.",
    requires: ["tensors"],
  },
  {
    id: "rack",
    title: "Racks & interconnects",
    part: "Hardware",
    outcome:
      "Map collectives onto scale-up and scale-out communication domains.",
    requires: ["machine", "training"],
  },
  {
    id: "lpu",
    title: "LPU & scheduled dataflow",
    part: "Hardware",
    outcome:
      "Explain software-addressed SRAM and compiler-scheduled tensor movement.",
    requires: ["machine", "attention"],
  },
  {
    id: "performance",
    title: "Profiling & kernel reasoning",
    part: "Hardware",
    outcome:
      "Use a trace to distinguish busy work from the exposed critical path.",
    requires: ["machine"],
  },
  {
    id: "inference",
    title: "Inference engines",
    part: "Inference",
    outcome:
      "Account for prefill, decode, KV state and dynamic request scheduling.",
    requires: ["attention", "machine"],
  },
  {
    id: "serving-lab",
    title: "Serving under load",
    part: "Inference",
    outcome:
      "Design a load test, read latency distributions, and define sustainable capacity.",
    requires: ["inference", "performance"],
  },
  {
    id: "projects",
    title: "Engineering projects",
    part: "Practice",
    outcome:
      "Produce reproducible artifacts that demonstrate systems reasoning.",
    requires: [],
  },
  {
    id: "glossary",
    title: "Glossary",
    part: "Reference",
    outcome: "Look up the vocabulary, then return to its worked context.",
    requires: [],
  },
  {
    id: "sources",
    title: "Papers & sources",
    part: "Reference",
    outcome:
      "Trace claims to papers, official documentation and versioned releases.",
    requires: [],
  },
];

export const learningPaths = [
  {
    id: "complete",
    title: "The full curriculum",
    description:
      "Build the model, understand the machine, then operate the system.",
    route: [
      "orientation",
      "tensors",
      "transformer",
      "attention",
      "data",
      "training",
      "post-training",
      "machine",
      "rack",
      "lpu",
      "performance",
      "inference",
      "serving-lab",
      "projects",
    ],
  },
  {
    id: "training",
    title: "Pre-training & post-training",
    description:
      "Data contracts, distributed optimization, reproducibility, and evaluation.",
    route: [
      "orientation",
      "tensors",
      "transformer",
      "attention",
      "data",
      "training",
      "post-training",
      "machine",
      "rack",
      "performance",
      "projects",
    ],
  },
  {
    id: "hardware",
    title: "Hardware & kernels",
    description:
      "Execution, memory hierarchy, fabrics, and measured performance.",
    route: [
      "orientation",
      "tensors",
      "machine",
      "transformer",
      "attention",
      "data",
      "training",
      "rack",
      "lpu",
      "performance",
      "inference",
      "projects",
    ],
  },
  {
    id: "inference",
    title: "Inference & compute clouds",
    description:
      "State management, scheduling, latency, reliability, and economics.",
    route: [
      "orientation",
      "tensors",
      "transformer",
      "attention",
      "machine",
      "inference",
      "lpu",
      "performance",
      "serving-lab",
      "projects",
    ],
  },
];

export function chapterForTarget(
  id: string,
  ancestors: Record<string, string> = {},
) {
  return chapters.find((chapter) => chapter.id === (ancestors[id] ?? id));
}

export function adjacentChapters(id: string) {
  const index = chapters.findIndex((chapter) => chapter.id === id);
  if (index < 0) return {};
  return { previous: chapters[index - 1], next: chapters[index + 1] };
}
