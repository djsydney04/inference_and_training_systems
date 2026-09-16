export type Chapter = {
  id: string;
  title: string;
  intro: string;
  evidenceChecked?: string;
  part: string;
  outcome: string;
  requires: string[];
};

export const chapters: Chapter[] = [
  {
    id: "orientation",
    title: "Models, machines and systems",
    intro: "A model is a set of calculations. Learn how those calculations become programs, run on hardware, and respond to users.",
    part: "Foundations",
    outcome:
      "Locate the scarce resource and separate an algorithm from its implementation.",
    requires: [],
  },
  {
    id: "first-principles",
    title: "How LLMs work",
    intro: "A language model predicts the next token. Work through the numbers behind one prediction, then see how training changes them.",
    part: "Foundations",
    outcome: "Calculate a next-token probability and follow its derivative into a weight update.",
    requires: ["orientation"],
  },
  {
    id: "tensors",
    title: "Tensors and gradients",
    intro: "Tensors hold the numbers a model uses. Follow their shapes through a calculation and learn how gradients tell us which weights to change.",
    part: "Foundations",
    outcome:
      "Track shapes, derive a gradient, and implement a next-token loss.",
    requires: ["first-principles"],
  },
  {
    id: "transformer",
    title: "Inside a Transformer",
    intro: "A Transformer repeatedly mixes information between tokens and transforms it. Trace one decoder block from its input vectors to its updated token vectors.",
    part: "Foundations",
    outcome:
      "Reconstruct a decoder block and explain what forward and backward must preserve.",
    requires: ["tensors"],
  },
  {
    id: "attention",
    title: "Attention",
    intro: "Attention lets a token use information from other positions. Compare which positions it reads, what it stores, and how the calculation runs.",
    part: "Foundations",
    outcome:
      "Distinguish connectivity, cached state, recurrence, and memory-efficient kernels.",
    requires: ["transformer"],
  },
  {
    id: "programming",
    title: "C and memory",
    intro: "A program stores numbers at memory addresses. Use small C examples to understand types, pointers, array layouts and numerical errors.",
    part: "Foundations",
    outcome: "Compile a numerical program and reason about pointers, ownership, layouts and derivatives.",
    requires: ["tensors"],
  },
  {
    id: "data",
    title: "Training data",
    intro: "The training objective depends on which text arrives and how it is prepared. Build examples, pack sequences and keep track of the tokens that count toward the loss.",
    part: "Training",
    outcome:
      "Specify a versioned data mixture and an experiment whose result you can trust.",
    requires: ["tensors", "transformer"],
  },
  {
    id: "optimization",
    title: "Optimizers and precision",
    intro: "An optimizer turns gradients into weight updates. Compare update rules, stored state and the effects of limited numerical precision.",
    part: "Training",
    outcome:
      "Derive a stateful update and verify clipping, scaling and recomputation contracts.",
    requires: ["data", "attention"],
  },
  {
    id: "training",
    title: "Distributed training",
    intro: "Large training runs use many devices. Follow one update across them and account for memory, communication and recovery after a failure.",
    part: "Training",
    outcome:
      "Reconcile global loss, memory, communication, and recovery across workers.",
    requires: ["optimization"],
  },
  {
    id: "parallel-training",
    title: "Splitting work across GPUs",
    intro: "There are several ways to divide a model and its data. Work through what each device owns, computes and sends to the others.",
    part: "Training",
    outcome:
      "Verify a sharded layer, trace pipeline activation lifetimes and reconcile rank ownership.",
    requires: ["training"],
  },
  {
    id: "post-training",
    title: "Post-training",
    intro: "A trained base model can learn from demonstrations and preferences. Follow the objectives, the data they need and the evaluations that test the result.",
    part: "Training",
    outcome:
      "Implement response masking and preference objectives; audit a rollout pipeline.",
    requires: ["parallel-training"],
  },
  {
    id: "digital-logic",
    title: "Digital logic",
    intro: "Computers represent numbers as bits and update stored state at clock edges. Build from gates and arithmetic to a small working pipeline.",
    part: "Hardware",
    outcome: "Derive signed arithmetic, trace clocked state and preserve transactions under backpressure.",
    requires: ["programming"],
  },
  {
    id: "fpga-asic",
    title: "Verilog, FPGAs and ASICs",
    intro: "Verilog describes hardware that operates concurrently. Simulate a small design, then follow the steps needed to turn it into a working circuit.",
    part: "Hardware",
    outcome: "Simulate a pipelined datapath, map its resources and reason about timing and physical implementation.",
    requires: ["digital-logic"],
  },
  {
    id: "machine",
    title: "CPUs and GPUs",
    intro: "A processor must fetch data, schedule work and execute instructions. Follow a value through a CPU core and a GPU to see why they behave differently.",
    part: "Hardware",
    outcome:
      "Trace an operand through memory, registers, scheduling and execution.",
    requires: ["tensors"],
  },
  {
    id: "gpu-resources",
    title: "GPU resource limits",
    intro: "A GPU has limited registers, shared memory and execution slots. Calculate which blocks can run together and where a resource limit causes waiting.",
    part: "Hardware",
    outcome:
      "Calculate resource cliffs, distinguish byte boundaries, and trace asynchronous buffer lifetimes.",
    requires: ["machine"],
  },
  {
    id: "cuda-kernels",
    title: "Writing CUDA kernels",
    intro: "A CUDA kernel is a function run by many GPU threads. Start with array indexing, then build reductions and normalization operations with checked gradients.",
    part: "Hardware",
    outcome: "Implement reductions and normalization kernels, verify gradients and diagnose memory and synchronization costs.",
    requires: ["programming", "gpu-resources"],
  },
  {
    id: "rack",
    title: "Connecting accelerators",
    intro: "Multiple accelerators need to exchange data. Follow the links inside a server, across a rack and between racks.",
    part: "Hardware",
    outcome:
      "Map collectives onto scale-up and scale-out communication domains.",
    requires: ["machine", "training"],
  },
  {
    id: "collectives",
    title: "Collective communication",
    intro: "Training devices often need the same sum or different pieces of a tensor. Trace those values through the communication steps that produce them.",
    part: "Hardware",
    outcome:
      "Trace exact partial sums through a ring and map logical ranks onto physical fabrics.",
    requires: ["rack"],
  },
  {
    id: "lpu",
    title: "LPUs and dataflow",
    intro: "A scheduled processor moves data according to a plan made by its compiler. Use the Groq architecture to understand that tradeoff.",
    part: "Hardware",
    outcome:
      "Explain software-addressed SRAM and compiler-scheduled tensor movement.",
    requires: ["machine", "attention"],
  },
  {
    id: "accelerator-atlas",
    evidenceChecked: "September 14, 2026",
    title: "Comparing accelerators",
    intro: "A chip’s peak arithmetic rate is only part of its behavior. Compare memory, data movement, execution and software support against the same workload.",
    part: "Hardware",
    outcome: "Compare accelerator memory, execution, interconnect and compiler contracts against a workload.",
    requires: ["machine"],
  },
  {
    id: "performance",
    title: "Profiling",
    intro: "A profiler records where time is spent. Read a trace, find the work that delays completion and test a specific improvement.",
    part: "Hardware",
    outcome:
      "Use a trace to distinguish busy work from the exposed critical path.",
    requires: ["gpu-resources"],
  },
  {
    id: "inference",
    title: "Running an LLM",
    intro: "Generation processes a prompt and then produces tokens one at a time. Follow the cached state and the scheduler that shares a device between requests.",
    part: "Inference",
    outcome:
      "Account for prefill, decode, KV state and dynamic request scheduling.",
    requires: ["attention", "machine"],
  },
  {
    id: "decoding",
    title: "Choosing the next token",
    intro: "Scores become tokens through a decoding rule. Compare sampling choices and work through why speculative decoding can preserve the same distribution.",
    part: "Inference",
    outcome:
      "Preserve the sampling distribution and reconcile provisional state before claiming a speedup.",
    requires: ["inference"],
  },
  {
    id: "serving-lab",
    title: "Serving under load",
    intro: "A fast single request does not tell you how a service behaves under load. Measure user latency and total throughput while controlling the workload.",
    part: "Inference",
    outcome:
      "Design a load test, read latency distributions, and define sustainable capacity.",
    requires: ["decoding", "performance"],
  },
  {
    id: "frontier",
    evidenceChecked: "September 14, 2026",
    title: "Frontier research",
    intro: "New architectures change what is computed, stored or moved. Derive the main mechanisms and read reported results with their dates, assumptions and limitations.",
    part: "Inference",
    outcome: "Derive the mechanisms behind MLA, MoE, hybrids, low precision and disaggregated serving, with versioned evidence.",
    requires: ["attention", "post-training", "inference", "accelerator-atlas"],
  },
  {
    id: "end-to-end",
    title: "Train and serve a small model",
    intro: "Put the pieces together in a runnable byte-level decoder. Train it, verify its checkpoint and cache, then profile and serve its output.",
    part: "Practice",
    outcome: "Train a decoder, prove exact restart and cached equivalence, serve it and collect a real operator trace.",
    requires: ["programming", "optimization", "inference"],
  },
  {
    id: "projects",
    title: "Projects",
    intro: "Build an artifact that demonstrates what you understand. Each project defines a useful result and the evidence needed to check it.",
    part: "Practice",
    outcome:
      "Produce reproducible artifacts that demonstrate systems reasoning.",
    requires: [],
  },
  {
    id: "glossary",
    title: "Glossary",
    intro: "Look up a term, then follow its link back to the lesson where it is used.",
    part: "Reference",
    outcome: "Look up the vocabulary, then return to its worked context.",
    requires: [],
  },
  {
    id: "sources",
    title: "Sources",
    intro: "Find the papers and official documentation behind the lessons. Follow the source link to inspect the original claim and its context.",
    part: "Reference",
    outcome:
      "Trace claims to papers, official documentation and versioned releases.",
    requires: [],
  },
];

// A focused path always includes its prerequisites, once, before the target.
export function prerequisiteRoute(targets: string[]): string[] {
  const route: string[] = [];
  const visiting = new Set<string>();
  const add = (id: string) => {
    if (route.includes(id)) return;
    const chapter = chapters.find(c => c.id === id);
    if (!chapter) throw new Error(`Unknown chapter: ${id}`);
    if (visiting.has(id)) throw new Error(`Prerequisite cycle: ${id}`);
    visiting.add(id);
    chapter.requires.forEach(add);
    visiting.delete(id);
    route.push(id);
  };
  targets.forEach(add);
  return route;
}

export const learningPaths = [
  {
    id: "complete", title: "Full book",
    description: "From next-token prediction to training, C/CUDA, digital logic, FPGA/ASIC design and efficient serving.",
    route: prerequisiteRoute(chapters.filter(c => c.part !== "Reference").map(c => c.id)),
  },
  {
    id: "training", title: "Training",
    description: "Data, derivatives, optimizer state, distributed execution and a reproducible model experiment.",
    route: prerequisiteRoute(["post-training", "end-to-end", "projects"]),
  },
  {
    id: "hardware", title: "Hardware and CUDA",
    description: "C and memory, logic gates and RTL, GPU kernels, accelerator architectures and physical fabrics.",
    route: prerequisiteRoute(["fpga-asic", "cuda-kernels", "collectives", "lpu", "accelerator-atlas", "performance", "projects"]),
  },
  {
    id: "inference", title: "Inference and serving",
    description: "Cache correctness, decoding, request scheduling, profiling and capacity under load.",
    route: prerequisiteRoute(["serving-lab", "accelerator-atlas", "end-to-end", "frontier", "projects"]),
  },
  {
    id: "circuits", title: "Circuits and accelerators",
    description: "Start with numbers and memory; build clocked circuits, simulate Verilog and follow data through silicon.",
    route: prerequisiteRoute(["fpga-asic", "machine", "lpu", "accelerator-atlas", "projects"]),
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
