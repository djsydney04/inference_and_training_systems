/** Original conceptual drawings; live labs own all numerical results. */
export const studies = {
  model: { title: "Tokens to predictions", alt: "Token vectors enter a causal attention matrix and flow toward a prediction. Hatching marks future positions; blue highlights selected values." },
  silicon: { title: "Inside the accelerator", alt: "A top-down accelerator study with repeated compute tiles, memory banks, and fine interconnect traces. Blue follows data between them." },
  systems: { title: "Connected machines", alt: "Eight compute nodes joined by fine communication paths. A blue route traces data between machines." },
  tensor: { title: "Shapes and storage", alt: "Stacked tensor planes connect to rows of stored values. A selected row and its storage positions are blue." },
  gradient: { title: "Following the gradient", alt: "Nested contour lines surround a low-loss region. A blue trajectory connects a sequence of illustrative optimizer steps." },
  data: { title: "Text becomes training data", alt: "Source documents become token sequences and packed batches. Blue follows one example; hatching marks unused space." },
  logic: { title: "Between clock edges", alt: "Combinational gates connect two registers above a clock waveform. Blue highlights a path through the logic." },
  memory: { title: "The memory hierarchy", alt: "Narrow local storage connects to progressively wider memory layers. A blue access passes through their banks." },
  tiling: { title: "Work one tile at a time", alt: "Three matrix fields surround a small local tile. Blue highlights operand and output regions involved in the computation." },
  compiler: { title: "A program becomes a plan", alt: "Source lines become a connected operation graph and scheduled work. Blue marks a selected transformation." },
  pipeline: { title: "Work across space and time", alt: "Six rows of staggered work form a pipeline. Hatched slots are idle; blue connects dependent work between stages." },
  cache: { title: "Pages behind the context", alt: "Three request block lists point into physical memory pages. Two requests share the blue page while other paths reach separate pages." },
  decoding: { title: "Choosing a continuation", alt: "Possible token continuations branch into a tree. One selected path is blue; the other branches remain visible." },
  serving: { title: "Requests become running work", alt: "Incoming requests enter a central queue, pass to three worker groups, and join a response path. Blue traces selected work." },
  collective: { title: "A sum across the ranks", alt: "Eight logical ranks pass chunks around a directed ring. Blue marks selected chunks and transfers." },
  execution: { title: "Inside an execution engine", alt: "Instructions enter a scheduler, fan into execution units, and join retirement state. Blue follows selected work." },
} as const;
export type Study = keyof typeof studies;

export const chapterStudies: Record<string, Study> = {
  "mathematical-foundations": "tensor",
  "runtime-foundations": "execution",
  orientation: "systems", "first-principles": "model", tensors: "tensor", transformer: "model", attention: "model", programming: "memory",
  data: "data", optimization: "gradient", training: "collective", "parallel-training": "pipeline", "post-training": "decoding",
  "digital-logic": "logic", "fpga-asic": "logic", cpu: "execution", machine: "execution", "gpu-resources": "memory", rack: "systems", collectives: "collective", lpu: "compiler", "accelerator-atlas": "silicon",
  "cuda-kernels": "tiling", "portable-kernels": "compiler", performance: "pipeline", inference: "cache", decoding: "decoding", "serving-lab": "serving", frontier: "model", "end-to-end": "data", projects: "serving",
  glossary: "tensor", sources: "data",
};
export const partStudies: Record<string, Study> = {
  Foundations: "tensor", Training: "gradient", Hardware: "silicon", Programming: "tiling", Inference: "cache", Practice: "serving",
};
export const galleryStudies: Record<string, Study> = {
  network: "model", circuit: "logic", gradient: "gradient", occupancy: "memory", ring: "collective", probability: "decoding", matmul: "tiling", replicas: "collective", training: "gradient", mask: "data", cpu: "execution", gpu: "silicon", rack: "systems", lpu: "compiler", cache: "cache", trace: "pipeline", attention: "model",
};

export const lessonStudies: { target: string; study: Study; title: string; note: string }[] = [
  { target: "tokens-and-bytes", study: "data", title: "Text enters as a sequence", note: "Tokenization turns text into IDs. Embedding lookup then gives each position a vector; the original document and its boundaries still matter." },
  { target: "first-weight-update", study: "gradient", title: "A weight update is a step", note: "The gradient describes local sensitivity. The optimizer turns that information into a change in parameters; a step need not lower the loss on every example." },
  { target: "autodiff", study: "gradient", title: "Trace sensitivity back to the weights", note: "Local derivatives connect an output loss to the parameters that produced it. The drawing suggests a landscape; the calculation keeps track of the actual derivatives." },
  { target: "network-attention", study: "model", title: "Positions exchange information", note: "A query reads the keys it is allowed to see. The resulting weights mix their value vectors into a new representation for that position." },
  { target: "attention-primitives", study: "tiling", title: "The same contraction, in smaller pieces", note: "Attention is built from contractions and normalization. Tiling changes where values live and when they move, while the numerical contract must stay intact." },
  { target: "tensor-strides", study: "tensor", title: "A shape is a view of storage", note: "Dimensions and strides turn an index into an address. Different tensor views can interpret the same underlying storage without copying every value." },
  { target: "packing-loss", study: "data", title: "Keep the example boundaries", note: "Packing puts useful tokens close together. Attention boundaries and loss eligibility still belong to the examples, even when they share a physical row." },
  { target: "optimizer-state", study: "gradient", title: "The path depends on the optimizer", note: "A gradient is one ingredient of an update. Momentum and adaptive methods carry state from earlier steps, so the same current gradient can produce a different move." },
  { target: "training-state", study: "memory", title: "A training run stores more than weights", note: "Parameters, gradients, optimizer state, and saved activations have different owners and lifetimes. Count each allocation before deciding what fits." },
  { target: "pipeline-schedules", study: "pipeline", title: "A schedule has empty space", note: "Different stages can work on different microbatches. Dependencies still create waiting, and saved activations remain live until backward consumes them." },
  { target: "post-training-loss", study: "decoding", title: "Learning from a continuation", note: "A response is a sequence of token decisions. Supervision and preference objectives must identify the positions and policy probabilities that contribute to the loss." },
  { target: "digital-abstraction", study: "logic", title: "Computation between two edges", note: "Combinational logic transforms the current inputs. Registers capture state at clock edges, giving the next calculation a stable starting point." },
  { target: "fpga-memory-banking", study: "memory", title: "Storage also has a port budget", note: "Having enough capacity does not guarantee enough simultaneous reads. Banking and placement determine which operands can reach the datapath together." },
  { target: "cpu-execution", study: "execution", title: "Instructions take different paths", note: "A core tracks dependencies while ready operations use available execution units. Architectural results still have to respect the program’s required behavior." },
  { target: "async-execution", study: "pipeline", title: "Overlap needs independent work", note: "A transfer and a calculation can overlap only when their dependencies allow it. Buffers must remain valid until every operation using them has completed." },
  { target: "network-budget", study: "systems", title: "The link is part of the computation", note: "A distributed operation includes the bytes that cross between machines. Placement, shared links, and exposed communication shape the time it takes to finish." },
  { target: "collective-contracts", study: "collective", title: "A shared result has many owners", note: "A collective defines what every rank contributes and receives. The logical ring is one possible schedule; the physical network can have a different shape." },
  { target: "lpu-schedule", study: "compiler", title: "Put movement on the timetable", note: "A scheduled dataflow machine relies on the compiler to arrange when values arrive and where operations run. The program’s memory movement becomes part of its plan." },
  { target: "accelerator-programming-models", study: "compiler", title: "Different machines, different plans", note: "The mathematical operation can stay the same while ownership, local storage, and scheduling change. Porting requires preserving the contract across those choices." },
  { target: "cuda-gemm-hierarchy", study: "tiling", title: "Keep useful values close", note: "A tile lets many multiply-adds reuse values already brought near the execution units. Its shape affects storage, parallelism, and the work left at the edges." },
  { target: "portable-matmul-contract", study: "tiling", title: "Carry the operation across backends", note: "Operands, output shape, accumulation, and edge handling form the contract. Threads or tile programs are different ways to implement it." },
  { target: "critical-path", study: "pipeline", title: "Find the work that remains exposed", note: "A faster stage only helps when it shortens the completion path. The trace must distinguish useful overlap from time that still delays the result." },
  { target: "paged-kv", study: "cache", title: "A request sees a sequence, not a heap", note: "Logical blocks map a sequence onto physical KV pages. Shared prefixes need explicit ownership so releasing one request does not invalidate another." },
  { target: "sampling-contract", study: "decoding", title: "One token changes what comes next", note: "Sampling chooses a continuation from the current distribution. The chosen token becomes context for the next prediction, changing every later decision." },
  { target: "load-test", study: "serving", title: "The queue changes the experience", note: "A request can wait before useful work begins. Arrival rate, batching, memory pressure, and scheduling all contribute to the latency a user sees." },
  { target: "frontier-moe", study: "systems", title: "Route tokens to their parameter owners", note: "An expert router can send unequal work to different owners. Dispatch and combination become part of the layer, alongside the expert calculations." },
  { target: "capstone-forward", study: "model", title: "Make the complete path inspectable", note: "Tokens, intermediate tensors, logits, and a loss belong to one reproducible computation. Small examples let you check the contract at each boundary." },
  { target: "capstone-http", study: "serving", title: "A model becomes a service", note: "An HTTP boundary adds request validation, queueing, cancellation, and a response contract around the model’s calculation." },
  { target: "engineering-report", study: "pipeline", title: "Turn a trace into an explanation", note: "Connect the result to the work that produced it. State the workload, measure the relevant boundaries, and explain which dependency or resource limits progress." },
];
