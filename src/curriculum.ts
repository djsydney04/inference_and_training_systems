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
    id: "mathematical-foundations",
    title: "Mathematics for model building",
    intro: "Read sums and shapes, calculate sequence probabilities, and derive gradients through shared computations. Worked examples connect the notation to a trainable model.",
    part: "Foundations",
    outcome: "Derive a sequence likelihood and a matrix gradient, and explain what averaging and finite precision change.",
    requires: ["first-principles"],
  },
  {
    id: "tensors",
    title: "Tensors and gradients",
    intro: "Tensors hold the numbers a model uses. Follow their shapes through a calculation and learn how gradients tell us which weights to change.",
    part: "Foundations",
    outcome:
      "Track shapes, derive a gradient, and implement a next-token loss.",
    requires: ["mathematical-foundations"],
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
    intro: "There are several ways to divide a model and its data. Follow what each device owns, how temporary tensors change peak memory, and how shards become a complete update.",
    part: "Training",
    outcome:
      "Verify sharded layers and optimizer updates, trace materialization and pipeline lifetimes, and reconstruct checkpoint ownership.",
    requires: ["training"],
  },
  {
    id: "post-training",
    title: "Post-training",
    intro: "A trained model can learn from demonstrations, preferences and rewards. Follow how generated responses become updates, and what must stay consistent as the policy changes.",
    part: "Training",
    outcome:
      "Implement response masking and preference objectives; trace rollout overlap, policy lag and behavior probabilities.",
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
    id: "runtime-foundations",
    title: "Processes, memory and execution",
    intro: "Follow a program into processes, virtual memory and device queues. Work through buffer lifetimes and scaling limits before reading a performance trace.",
    part: "Hardware",
    outcome: "Distinguish address translation from data movement, order a device pipeline and derive its performance limits.",
    requires: ["programming", "machine"],
  },
  {
    id: "gpu-resources",
    title: "GPU resource limits",
    intro: "A GPU has limited registers, shared memory and execution slots. Calculate which blocks can run together and where a resource limit causes waiting.",
    part: "Hardware",
    outcome:
      "Calculate resource cliffs, distinguish byte boundaries, and trace asynchronous buffer lifetimes.",
    requires: ["runtime-foundations"],
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
    id: "cuda-kernels",
    title: "Writing CUDA kernels",
    intro: "A CUDA kernel is a function run by many GPU threads. Start with array indexing, then build reductions and normalization operations with checked gradients.",
    part: "Programming",
    outcome: "Implement reductions and normalization kernels, verify gradients and diagnose memory and synchronization costs.",
    requires: ["programming", "gpu-resources"],
  },
  {
    id: "portable-kernels",
    title: "Programming across accelerators",
    intro: "Keep the matrix operation fixed while changing its execution. Work through H100, AMD MI300X, Google TPU and AWS Trainium examples, with concrete layouts and correctness checks.",
    evidenceChecked: "September 16, 2026",
    part: "Programming",
    outcome: "Port a numerical contract, explain backend-specific tile ownership and verify edge cases before profiling.",
    requires: ["cuda-kernels", "accelerator-atlas"],
  },
  {
    id: "performance",
    title: "Profiling",
    intro: "A profiler records where time is spent. Read a trace, find the work that delays completion and test a specific improvement.",
    part: "Programming",
    outcome:
      "Use a trace to distinguish busy work from the exposed critical path.",
    requires: ["gpu-resources"],
  },
  {
    id: "inference",
    title: "Running an LLM",
    intro: "Generation processes a prompt and then produces tokens. Follow the cached state, then work through how lower-precision weights and activations change storage and numerical error.",
    part: "Inference",
    outcome:
      "Account for prefill and decode state; calculate quantized codes, grouping overhead and activation-dependent output error.",
    requires: ["attention", "runtime-foundations"],
  },
  {
    id: "decoding",
    title: "Choosing the next token",
    intro: "Scores become tokens through a decoding rule. Learn how modern drafters propose several tokens, how the target verifies them, and when that extra work pays off.",
    part: "Inference",
    outcome:
      "Preserve the sampling distribution, train compatible proposals, reconcile tree state and measure acceptance by depth.",
    requires: ["inference"],
  },
  {
    id: "serving-lab",
    title: "Serving under load",
    intro: "A service manages queues, caches and many requests. Build an iteration, admit work that can finish, then follow prefill/decode separation and measure complete answers under load.",
    part: "Inference",
    outcome:
      "Trace scheduling and cache pressure, design arrival and measurement contracts, budget handoffs and distinguish capacity from goodput.",
    requires: ["decoding", "performance"],
  },
  {
    id: "frontier",
    evidenceChecked: "September 14, 2026",
    title: "Frontier research",
    intro: "New architectures change what is computed, stored or moved. Derive the main mechanisms and read reported results with their dates, assumptions and limitations.",
    part: "Inference",
    outcome: "Derive MLA, hybrids and low-precision mechanisms; execute MoE routing, ownership, capacity and gradients with versioned evidence.",
    requires: ["attention", "post-training", "inference", "accelerator-atlas"],
  },
  {
    id: "frameworks",
    title: "Popular frameworks",
    intro: "Find where the major tools fit. Compare tensor execution, training libraries and serving engines, then trace the contracts that must survive a change of framework.",
    evidenceChecked: "September 16, 2026",
    part: "Practice",
    outcome: "Match numerical updates across frameworks, choose tools by responsibility, and verify labels, model artifacts, cache identity and timing.",
    requires: ["programming", "optimization", "inference"],
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
    route: prerequisiteRoute(["post-training", "frameworks", "end-to-end", "projects"]),
  },
  {
    id: "hardware", title: "Hardware and systems",
    description: "Logic gates, RTL, processor resources, accelerator architectures and physical fabrics.",
    route: prerequisiteRoute(["fpga-asic", "gpu-resources", "collectives", "lpu", "accelerator-atlas", "projects"]),
  },
  {
    id: "kernels", title: "Kernel programming",
    description: "C and memory, CUDA and HIP kernels, TPU and Trainium tile programs, and evidence from profiling.",
    route: prerequisiteRoute(["portable-kernels", "performance", "projects"]),
  },
  {
    id: "inference", title: "Inference and serving",
    description: "Cache correctness, decoding, request scheduling, profiling and capacity under load.",
    route: prerequisiteRoute(["serving-lab", "accelerator-atlas", "frameworks", "end-to-end", "frontier", "projects"]),
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
