import { chapters, learningPaths } from "./curriculum";

import { studyImage } from "./book-illustrations";
import { galleryStudies } from "./illustration-catalog";

const glyph = (kind: string) => studyImage(galleryStudies[kind] ?? "model", true);

export const galleryItems = [
  { kind: "cpu", id: "cpu-issue-lab", title: "Which instruction can run now?", scope: "Dependencies → issue → completion → retirement", type: "CPU scheduling lab", copy: "Compare ordered and ready issue without changing operation latencies or in-order retirement." },
  { kind: "cache", id: "cpu-cache-lab", title: "Why did this address miss?", scope: "Address → set → tag → replacement", type: "CPU cache lab", copy: "Keep capacity fixed and inspect cold misses, conflicts and exact LRU replacement." },
  { kind: "cpu", id: "cpu-branch-lab", title: "Can this predictor learn the pattern?", scope: "Predict → resolve → update", type: "Branch prediction lab", copy: "Follow every state of a two-bit counter through loop exits, alternating outcomes and a change of phase." },
  {
    kind: "network", id: "network-map", title: "Open the whole neural network",
    scope: "Embeddings → attention → feed-forward → prediction", type: "Clickable architecture",
    copy: "Dive into every stage of a decoder, follow tensor shapes, and inspect attention and feed-forward arithmetic.",
  },
  {
    kind: "network", id: "framework-roles", title: "Where does each framework fit?",
    scope: "Model → training or serving → execution", type: "Framework responsibility map",
    copy: "Trace six concrete software stacks and identify the first correctness check at each boundary.",
  },
  {
    kind: "trace", id: "framework-benchmark-boundary", title: "When is the result actually ready?",
    scope: "Host dispatch → queued device work → completion", type: "Framework timing lab",
    copy: "Separate cold start, warm latency and amortized time in a dependency timeline.",
  },
  {
    kind: "cache", id: "pd-transfer-budget", title: "Where does the handoff delay go?",
    scope: "Prompt KV → transfer → first output gap", type: "Disaggregated serving lab",
    copy: "Vary cache reuse, head count and link rate; reconcile wire bytes, TTFT and the second token's arrival.",
  },
  {
    kind: "mask", id: "speculative-tree-attention", title: "Which branch may this token read?",
    scope: "Tree ancestry → attention mask → cache ownership", type: "Speculative decoding lab",
    copy: "Inspect a packed draft tree and separate logical positions from provisional cache slots.",
  },
  {
    kind: "training", id: "rollout-pipeline", title: "When does faster generation stop helping?",
    scope: "Actor → reward → learner → new weights", type: "Training pipeline lab",
    copy: "Change decode speed and policy lag; follow six rollout groups through an overlapping training schedule.",
  },
  {
    kind: "gradient", id: "first-weight-update", title: "Watch six weights learn",
    scope: "Scores → probabilities → loss → derivatives", type: "First-principles lab",
    copy: "Calculate one next-token prediction, inspect every gradient and apply an update yourself.",
  },
  {
    kind: "circuit", id: "digital-logic", title: "What happens at the next clock edge?",
    scope: "Bits → gates → registers → transactions", type: "Digital logic workbenches",
    copy: "Trace carry bits, setup slack and ready/valid backpressure through clocked state.",
  },
  {
    kind: "matmul", id: "fpga-asic", title: "Build the datapath",
    scope: "Verilog → simulation → FPGA → ASIC", type: "RTL and systolic-array labs",
    copy: "Write a pipelined multiply-accumulate unit and follow operands across a systolic array.",
  },
  {
    kind: "occupancy", id: "cuda-kernels", title: "From an address to a CUDA kernel",
    scope: "Threads → memory → reductions → backward", type: "Kernel programming labs",
    copy: "Connect executable C and CUDA to layout, synchronization and numerical correctness.",
  },
  {
    kind: "matmul", id: "portable-kernel-workbench", title: "One operation, four backends",
    scope: "H100 · MI300X · TPU · Trainium", type: "Cross-platform programming lab",
    copy: "Inspect tile ownership, memory staging and partial sums, then open each platform’s worked example.",
  },
  {
    kind: "cache", id: "accelerator-capacity", title: "Will the model and its state fit?",
    scope: "Weight precision → cache capacity → transfer time", type: "Accelerator capacity workbench",
    copy: "Change precision and context length; reconcile the full declared memory budget and KV transfer cost.",
  },
  {
    kind: "trace", id: "capstone-profile", title: "Trace a model you trained",
    scope: "Training → checkpoint → cached decode → HTTP", type: "End-to-end executable project",
    copy: "Prove restart and cache equivalence, then collect an actual CPU operator trace and serve generated tokens.",
  },
  {
    kind: "trace",
    id: "pipeline-schedules",
    title: "Why does a pipeline keep activations?",
    scope: "Microbatch → dependencies → storage lifetime",
    copy: "Compare two training schedules, follow a microbatch, and separate memory savings from idealized idle time.",
    type: "Training schedule lab",
  },
  {
    kind: "ring",
    id: "ring-allreduce",
    title: "Where did this gradient come from?",
    scope: "Local values → reduced shards → complete sum",
    copy: "Step through six collective sends, inspect every rank's buffers, and account for each original contribution exactly once.",
    type: "Interactive 2D workbench",
  },
  {
    kind: "occupancy",
    id: "occupancy-contract",
    title: "Can the next block become resident?",
    scope: "Registers + shared memory + thread slots",
    copy: "Expose resource-allocation cliffs without confusing warp residency with measured performance.",
    type: "GPU resource lab",
  },
  {
    kind: "probability",
    id: "speculative-exactness",
    title: "Account for every proposed token",
    scope: "Proposal → acceptance → corrected distribution",
    copy: "Change proposal quality and trace the probability mass that exact speculative sampling accepts or repairs.",
    type: "Inference methods lab",
  },
  {
    kind: "training",
    id: "optimizer-state",
    title: "One loss, three optimizers",
    scope: "Gradient → history → parameter update",
    copy: "Compare SGD, momentum and AdamW on a shared objective; inspect every update and its stored state.",
    type: "Training methods lab",
  },
  {
    kind: "matmul",
    id: "tiled-matmul",
    title: "Inside a matrix multiplication",
    scope: "Global loads → shared tiles → partial sums",
    copy: "Inspect actual operands, step through both barriers, and test the ragged edge of a matrix.",
    type: "Interactive 2D workbench",
  },
  {
    kind: "replicas",
    id: "replica-update",
    title: "Do the replicas agree?",
    scope: "Targets → gradients → one update",
    copy: "Run a real two-replica TensorFlow experiment and compare it with an unpartitioned reference.",
    type: "Verified runtime lesson",
  },
  {
    kind: "training",
    id: "training-state",
    title: "Where does training memory go?",
    scope: "Parameters → gradients → optimizer",
    copy: "Change the ZeRO stage and reconcile model-state memory with a global token budget.",
    type: "Training calculator",
  },
  {
    kind: "training", id: "fsdp-live-memory", title: "What makes a sharded run peak in memory?",
    scope: "Persistent shards → gathered weights → temporary gradients",
    copy: "Follow live allocations through forward, backward and reduce-scatter; compare prefetch and resharding.",
    type: "Training memory lab",
  },
  {
    kind: "matmul", id: "calibration-and-output-error", title: "Which weight error changes the output?",
    scope: "Integer codes → reconstruction → activation-weighted error",
    copy: "Change group size and input distribution, then compare weight error with actual layer-output error.",
    type: "Quantization lab",
  },
  {
    kind: "network", id: "moe-route-pack-combine", title: "Where does each expert contribution return?",
    scope: "Route → pack by expert → weighted inverse gather",
    copy: "Trace token assignments, grouped computation and the exact output values after recombination.",
    type: "MoE execution lab",
  },
  {
    kind: "trace", id: "scheduler-iteration", title: "What fits in the next serving iteration?",
    scope: "Arrivals → token budget → cache growth → completion",
    copy: "Step through mixed prefill and decode work, then expose a cache-allocation policy that cannot make progress.",
    type: "Serving scheduler lab",
  },
  {
    kind: "mask",
    id: "post-training-loss",
    title: "Which tokens change the policy?",
    scope: "Prompt → response mask → objective",
    copy: "Connect demonstrations and preferences to the exact likelihoods being optimized.",
    type: "Post-training worked lesson",
  },
  {
    kind: "cpu",
    id: "cpu-execution",
    title: "A core can work out of order",
    scope: "Rename → ready work → retirement",
    copy: "Step through CPU execution and distinguish logical state from speculative work.",
    type: "CPU mechanism lab",
  },
  {
    kind: "gpu",
    id: "gpu",
    title: "Inside H100 and MI300X",
    scope: "GH100 → SM · MI300X chiplets",
    copy: "Compare published GPU organization, enabled compute units and on-package memory.",
    type: "Hardware drawing",
  },
  {
    kind: "rack",
    id: "system-buildout",
    title: "Build out the whole system",
    scope: "System → rack → tray → facility",
    copy: "Open each level, inspect components and separate compute, storage, management, power and cooling paths.",
    type: "Layered system atlas",
  },
  {
    kind: "rack",
    id: "rack-model",
    title: "The NVL72 rack, front to back",
    scope: "Front elevation → compute tray",
    copy: "Connect compute, communication, power and cooling at rack scale.",
    type: "Hardware drawing",
  },
  {
    kind: "lpu",
    id: "lpu",
    title: "Scheduled tensor streams",
    scope: "SRAM → matrix → vector",
    copy: "Step through the compiler-owned path of an activation tile.",
    type: "Hardware drawing",
  },
  {
    kind: "attention",
    id: "flashattention",
    title: "Attention without storing every score",
    scope: "HBM → running statistics",
    copy: "Watch an online softmax preserve the result across tiles.",
    type: "Numerical lab",
  },
  {
    kind: "cache",
    id: "paged-kv",
    title: "Who owns these KV blocks?",
    scope: "Logical → physical memory",
    copy: "Grow two requests and see how shared prefixes survive reclamation.",
    type: "Stateful lab",
  },
  {
    kind: "trace",
    id: "performance",
    title: "Find the exposed bottleneck",
    scope: "CPU → GPU → network",
    copy: "Change overlap in an illustrative training trace and inspect step time.",
    type: "Performance lab",
  },
];

export const galleryMarkup = `<section id="gallery" class="atlas-gallery" aria-labelledby="gallery-title"><header><h1 id="gallery-title">Diagrams and labs</h1><p>Open a working example and follow the lesson around it.</p></header><div class="gallery-list">${galleryItems.map((item) => `<a class="gallery-entry" href="#${item.id}"><div class="gallery-preview">${glyph(item.kind)}</div><div><span>${item.type}</span><h2>${item.title}</h2><p>${item.copy}</p><small>${item.scope}</small></div><b aria-hidden="true">→</b></a>`).join("")}</div></section>`;

export const homeMarkup = `<section id="top" class="atlas-home" aria-labelledby="home-title">
  <header class="home-intro"><p class="home-kicker">An interactive textbook</p><h1 id="home-title">Machine learning systems</h1><p class="home-description">Learn how an LLM works, write its computations, understand the hardware, and train and serve a small model.</p><div class="home-actions"><a class="primary-action" href="#orientation">Start learning</a><a class="text-action" href="#gallery">Explore diagrams and labs</a></div></header>
  <section class="curriculum-map" aria-label="How the material connects"><div class="map-lifecycle"><a href="#first-principles"><span>Understand</span><strong>Models and math</strong><small>tokens, tensors, attention</small></a><i aria-hidden="true">→</i><a href="#data"><span>Train</span><strong>Data and updates</strong><small>loss, gradients, optimization</small></a><i aria-hidden="true">→</i><a href="#inference"><span>Serve</span><strong>Requests and tokens</strong><small>cache, batching, latency</small></a></div><a class="map-hardware" href="#programming"><span>How the work runs</span><strong>C and CUDA <i aria-hidden="true">→</i> processors and circuits <i aria-hidden="true">→</i> connected systems</strong></a></section>
  <section class="path-section" id="learning-paths"><div><h2>Choose a path</h2><p>Pick a focus. Each path includes the foundations it needs.</p></div><div class="path-picker"><div role="group" aria-label="Learning path">${learningPaths.map((path, i) => `<button data-learning-path="${path.id}" aria-pressed="${i === 0}" class="${i === 0 ? "is-active" : ""}">${path.title}</button>`).join("")}</div><p data-path-description>${learningPaths[0].description}</p><details class="path-outline"><summary>Chapters in this path</summary><ol data-path-route>${learningPaths[0].route.map((id) => `<li><a href="#${id}">${chapters.find((c) => c.id === id)?.title}</a></li>`).join("")}</ol></details></div></section>
  <section class="home-feature"><div class="home-machine-plate">${glyph("gpu")}</div><div><h2>See the hardware</h2><p>Open a GPU, follow a value from memory to execution, and connect what you see to a profiler trace.</p><a href="#gpu">Open the GPU drawing</a></div></section>
  <section class="home-standard"><h2>Practice as you read</h2><p>Predict a result before running an example. Use the checks to explain what happened, then change one assumption and try again.</p><a href="#projects">Choose a project</a></section>
</section>`;
