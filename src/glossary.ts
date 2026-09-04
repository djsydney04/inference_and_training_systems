type GlossaryCategory = "hardware" | "cuda" | "performance" | "training" | "inference" | "network";

type GlossaryEntry = {
  term: string;
  category: GlossaryCategory;
  definition: string;
  why: string;
  aliases?: string;
};

const entries = ([
  { term: "Activation", category: "training", definition: "An intermediate tensor produced by a layer during the forward pass.", why: "Training may retain it for backward; checkpointing trades its storage for recomputation." },
  { term: "Activation checkpointing", category: "training", definition: "Saving selected forward tensors and recomputing the omitted ones during backward.", why: "It cuts activation memory at the cost of extra arithmetic." },
  { term: "Active cycle", category: "performance", definition: "A clock cycle in which a unit or multiprocessor is assigned work, whether or not every pipeline is productive.", why: "Active time is not the same as useful issue or peak utilization." },
  { term: "All-gather", category: "network", definition: "A collective in which every rank receives the shards contributed by all ranks.", why: "Tensor and parameter sharding use it to reconstruct a logical tensor where needed." },
  { term: "All-reduce", category: "network", definition: "A collective that reduces values across ranks and returns the complete result to every rank.", why: "Synchronous data parallelism commonly uses it to combine gradients." },
  { term: "All-to-all", category: "network", definition: "A collective in which every rank sends a distinct payload to every other rank.", why: "MoE token dispatch and some context-parallel layouts depend on it and expose network congestion." },
  { term: "Arithmetic bandwidth", category: "performance", definition: "The rate at which an execution unit can accept and complete arithmetic operations.", why: "It is the compute ceiling in a roofline-style model." },
  { term: "Arithmetic intensity", category: "performance", definition: "Useful arithmetic operations performed per byte moved from a chosen memory level.", why: "It predicts whether bandwidth or compute is more likely to limit a kernel." },
  { term: "Autodiff", category: "training", definition: "Automatic construction of derivatives from a recorded computation graph.", why: "Reverse-mode autodiff powers backpropagation and determines which intermediates must be available." },
  { term: "Backpropagation", category: "training", definition: "Reverse accumulation of derivatives from loss through the model operations.", why: "Its compute, activation reads, gradient writes, and collectives dominate a training step." },
  { term: "Batch", category: "training", definition: "A collection of examples or tokens processed together in one logical step.", why: "Larger batches improve parallel efficiency but alter memory use, optimization noise, and serving latency." },
  { term: "BF16", category: "hardware", definition: "A 16-bit floating-point format with FP32-like exponent range and reduced mantissa precision.", why: "It is a common training and inference dtype because it tolerates scale variation better than FP16." },
  { term: "Block", aliases: "thread block CTA cooperative thread array", category: "cuda", definition: "A group of CUDA threads scheduled together on one SM with access to shared memory and barriers.", why: "Block shape controls locality, residency, and the unit of hardware placement." },
  { term: "Branch efficiency", category: "performance", definition: "The fraction of issued branch paths that avoid lane divergence within a warp.", why: "Low branch efficiency means SIMD lanes spend cycles masked off." },
  { term: "CUDA", aliases: "software platform", category: "cuda", definition: "NVIDIA’s programming platform, runtime, driver interfaces, libraries, compiler toolchain, and execution model for its GPUs.", why: "It is the software contract between frameworks and NVIDIA accelerator hardware." },
  { term: "CUDA core", category: "hardware", definition: "NVIDIA’s name for per-lane scalar arithmetic datapaths inside an SM.", why: "They handle ordinary floating-point, integer, and address work around specialized tensor operations." },
  { term: "CUDA Driver API", aliases: "libcuda.so", category: "cuda", definition: "The lower-level host API for contexts, modules, memory, streams, and kernel launch, implemented by the installed driver.", why: "Runtimes and frameworks eventually cross this stable driver boundary." },
  { term: "CUDA Graph", category: "cuda", definition: "A captured graph of GPU operations that can be replayed with less host launch overhead.", why: "Decode loops use graphs to reduce CPU work and launch variance when shapes are stable." },
  { term: "CUDA Runtime API", aliases: "libcudart.so", category: "cuda", definition: "A higher-level host API layered over the driver, commonly used by CUDA C++ applications.", why: "It manages implicit initialization and ergonomic kernel/memory operations." },
  { term: "CUDA Tile", category: "cuda", definition: "A logical multidimensional region of data and participating threads described by newer tile-oriented programming abstractions.", why: "Tile vocabulary matches the units moved through memory and tensor-core pipelines." },
  { term: "CUDA C++", category: "cuda", definition: "C++ extended with device functions, kernel launch syntax, memory spaces, and GPU execution built-ins.", why: "It remains the reference low-level language for many custom NVIDIA kernels." },
  { term: "cuBLAS", category: "cuda", definition: "NVIDIA’s optimized dense linear-algebra library, including GEMM interfaces.", why: "Framework matrix multiplication frequently resolves to cuBLAS or cuBLASLt kernels." },
  { term: "cuDNN", category: "cuda", definition: "NVIDIA’s optimized library for deep-neural-network primitives and fused operation graphs.", why: "It supplies tuned attention, convolution, normalization, and related building blocks." },
  { term: "CUPTI", category: "cuda", definition: "The CUDA Profiling Tools Interface for activity traces, callbacks, events, and performance metrics.", why: "Profilers use it to attribute time, counters, and correlation data to GPU work." },
  { term: "CUTLASS", category: "cuda", definition: "An open C++ template library for composing high-performance CUDA tensor operations from reusable tiles and pipelines.", why: "It exposes how layouts, MMA instructions, and memory stages form a production GEMM." },
  { term: "CuTe", category: "cuda", definition: "CUTLASS’s algebra for expressing hierarchical tensor layouts and mappings.", why: "It lets kernel authors reason precisely about logical coordinates and physical memory/thread placement." },
  { term: "CuTe DSL", category: "cuda", definition: "A Python-hosted domain-specific language for generating CUDA kernels with CuTe layout concepts.", why: "It shortens the path from a tile algorithm to specialized device code." },
  { term: "Data parallelism", aliases: "DP", category: "training", definition: "Replicating computation across workers that consume different examples, then synchronizing model updates.", why: "It scales token throughput but duplicates unsharded model state." },
  { term: "Decode", category: "inference", definition: "The autoregressive phase that generates one new position per active sequence per model step.", why: "It is latency-sensitive and often limited by weight and KV-cache memory traffic." },
  { term: "Device", category: "cuda", definition: "In CUDA terminology, the GPU and its addressable memory/execution resources, contrasted with the host CPU.", why: "Every tensor operation must have an explicit or inferred device placement." },
  { term: "DPO", aliases: "direct preference optimization", category: "training", definition: "A preference objective that raises the relative likelihood of chosen responses over rejected ones against a reference policy.", why: "It performs offline preference optimization without an online reward-model sampling loop." },
  { term: "Expert parallelism", aliases: "EP", category: "training", definition: "Distributing mixture-of-experts sub-networks across ranks and routing tokens to their selected experts.", why: "It saves per-rank expert storage but introduces load balance and all-to-all communication problems." },
  { term: "FEC", aliases: "forward error correction", category: "network", definition: "Redundant encoding that lets a receiver detect and correct a bounded number of transmission errors.", why: "High-rate electrical and optical links trade some bandwidth and latency for reliable delivery." },
  { term: "FlashAttention", category: "performance", definition: "An exact attention algorithm tiled to reduce reads and writes between HBM and on-chip SRAM.", why: "It shows why IO complexity can matter more than the nominal count of arithmetic operations." },
  { term: "FLOP", category: "performance", definition: "One floating-point operation; conventions differ on whether a fused multiply-add counts as one or two.", why: "Comparisons are meaningless unless operation counting and dtype are stated." },
  { term: "FP8", category: "hardware", definition: "A family of 8-bit floating-point formats with small mantissas and limited dynamic range.", why: "It reduces storage and increases tensor throughput but needs careful scaling and accuracy validation." },
  { term: "FSDP", aliases: "fully sharded data parallel", category: "training", definition: "A data-parallel strategy that shards parameters, gradients, and optimizer states across ranks and materializes parameters around computation.", why: "It fits larger models by exchanging redundant memory for collectives." },
  { term: "Global memory", category: "cuda", definition: "CUDA’s device-wide address space, normally backed by GPU DRAM/HBM and cached by L2 and sometimes L1.", why: "It offers capacity and persistence but is far slower than registers or shared memory." },
  { term: "GPC", aliases: "graphics processing cluster", category: "hardware", definition: "A high-level NVIDIA GPU partition grouping raster/control resources and multiple texture-processing clusters or SM groups.", why: "It is one step in the physical hierarchy above an SM; exact composition varies by architecture." },
  { term: "Gradient accumulation", category: "training", definition: "Summing gradients across multiple microbatches before applying one optimizer update.", why: "It creates a larger global batch when a full batch does not fit in memory." },
  { term: "Gradient clipping", category: "training", definition: "Bounding gradient norm or values before an optimizer update.", why: "It can prevent rare spikes from destabilizing large distributed runs." },
  { term: "Grid", aliases: "thread block grid", category: "cuda", definition: "All thread blocks launched by one CUDA kernel invocation.", why: "The grid describes total parallel work; hardware schedules its blocks over available SMs." },
  { term: "Grouped-query attention", aliases: "GQA", category: "inference", definition: "Attention in which several query heads share each key/value head.", why: "It reduces KV-cache capacity and bandwidth relative to full multi-head attention." },
  { term: "GRPO", aliases: "group relative policy optimization", category: "training", definition: "A policy-optimization family that estimates relative advantages from groups of sampled responses.", why: "It is widely used for reasoning post-training, but exact objectives and stabilizers vary by implementation." },
  { term: "HBM", aliases: "high bandwidth memory GPU RAM device DRAM", category: "hardware", definition: "Stacked DRAM placed beside accelerator logic and connected through a very wide package interface.", why: "It holds most weights, activations, and KV cache; its capacity and bandwidth bound large models." },
  { term: "Host", category: "cuda", definition: "The CPU-side process, system memory, driver, and orchestration code controlling device work.", why: "Launch overhead, input preparation, and synchronization can leave an otherwise fast GPU idle." },
  { term: "InfiniBand", category: "network", definition: "A lossless-oriented high-performance network stack supporting RDMA and hardware collective acceleration.", why: "It is a common scale-out fabric for multi-node training and tightly coupled inference." },
  { term: "Issue efficiency", category: "performance", definition: "How consistently schedulers issue eligible instructions relative to their available issue opportunities.", why: "It separates lack of ready work from limitations in a specific arithmetic pipeline." },
  { term: "Kernel", category: "cuda", definition: "A function launched from the host or device to execute over a grid of GPU threads.", why: "Kernel boundaries affect launch overhead, fusion opportunities, synchronization, and memory traffic." },
  { term: "Kimi Delta Attention", aliases: "KDA", category: "inference", definition: "A gated delta-rule linear-attention mechanism with fine-grained decay and a matrix-valued recurrent state.", why: "It replaces a context-length KV history with fixed-size state in most layers of Kimi Linear-style hybrids." },
  { term: "KV cache", aliases: "key value cache", category: "inference", definition: "Stored attention keys and values from prior positions for every cached layer and sequence.", why: "It avoids recomputing the prompt during decode but consumes capacity and bandwidth proportional to context." },
  { term: "L1 data cache", category: "hardware", definition: "A small on-SM cache often sharing physical SRAM capacity with configurable shared memory.", why: "Its latency and hit behavior affect local/global loads not explicitly staged by the program." },
  { term: "L2 cache", category: "hardware", definition: "A GPU-wide cache between SMs, memory controllers, and other device engines.", why: "It captures cross-block reuse and can reduce HBM traffic for weights, KV blocks, and communication buffers." },
  { term: "Latency hiding", category: "performance", definition: "Issuing independent work while another operation waits, rather than shortening that operation itself.", why: "GPUs rely on ready warps and pipelined transfers to tolerate long memory latency." },
  { term: "Little’s Law", category: "performance", definition: "In steady state, concurrency equals throughput multiplied by time in the system.", why: "A high-latency pipeline needs enough independent in-flight work to reach its target throughput." },
  { term: "Load/store unit", aliases: "LSU", category: "hardware", definition: "Execution hardware that calculates addresses and issues memory operations.", why: "Address patterns, queue pressure, and coalescing determine how efficiently it uses memory bandwidth." },
  { term: "Loss scaling", category: "training", definition: "Multiplying a loss before backward and unscaling gradients later to keep small FP16 gradients representable.", why: "It prevents underflow in mixed-precision training; BF16 usually needs it less." },
  { term: "Memory bandwidth", category: "performance", definition: "Bytes transferred per second across a specified memory interface.", why: "Always identify the level, direction, access pattern, and useful-payload efficiency behind a bandwidth number." },
  { term: "Memory-bound", category: "performance", definition: "A regime in which data delivery limits performance before arithmetic units reach their peak rate.", why: "Optimization should first reduce traffic, improve coalescing, or increase reuse." },
  { term: "Memory coalescing", category: "performance", definition: "Combining nearby memory requests from lanes of a warp into fewer aligned transactions.", why: "Poor coalescing moves many unused bytes and can multiply transaction count." },
  { term: "Memory hierarchy", category: "hardware", definition: "The ordered storage levels from registers and on-chip SRAM through caches, HBM/DRAM, host memory, and storage.", why: "Capacity rises and access generally slows as data moves farther from execution." },
  { term: "Microbatch", category: "training", definition: "The subset of a global batch processed by one pipeline stage or gradient-accumulation step at a time.", why: "Its size affects utilization, activation memory, pipeline bubbles, and numerical normalization." },
  { term: "Mixed precision", category: "training", definition: "Using lower precision for most storage and compute while retaining selected accumulation or optimizer state at higher precision.", why: "It accelerates tensor operations and saves memory without accepting the full error of low precision everywhere." },
  { term: "MLA", aliases: "multi-head latent attention", category: "inference", definition: "An attention design that compresses keys and values into a learned low-rank latent representation.", why: "It reduces cached state, though efficient serving depends on how projections are algebraically absorbed into weights." },
  { term: "MoE", aliases: "mixture of experts", category: "training", definition: "A layer with many expert sub-networks where a router activates only a small subset per token.", why: "It grows parameter capacity without proportional per-token compute, but adds routing, balance, and communication costs." },
  { term: "Multi-head attention", aliases: "MHA", category: "inference", definition: "Attention with separate query, key, and value projections for multiple parallel heads.", why: "Each head can learn a different relation, but distinct K/V heads create the largest standard KV cache." },
  { term: "Multi-query attention", aliases: "MQA", category: "inference", definition: "Attention in which all query heads share one key head and one value head.", why: "It minimizes KV-cache size and traffic, with less K/V head diversity." },
  { term: "NCCL", category: "network", definition: "NVIDIA’s library of topology-aware collectives and point-to-point communication for GPU tensors.", why: "Distributed performance often depends on NCCL algorithm, protocol, topology detection, and overlap." },
  { term: "Nsight Compute", category: "cuda", definition: "NVIDIA’s kernel profiler for source-correlated metrics, instruction pipelines, memory behavior, and roofline analysis.", why: "It diagnoses why an individual kernel misses expected hardware throughput." },
  { term: "Nsight Systems", category: "cuda", definition: "NVIDIA’s system timeline profiler spanning CPU threads, CUDA launches, kernels, memory copies, and libraries.", why: "It reveals gaps, synchronization, overlap, and cross-process timing before kernel-level tuning." },
  { term: "nvcc", aliases: "CUDA compiler driver", category: "cuda", definition: "The compiler driver that separates host/device code and invokes the CUDA compilation toolchain.", why: "It produces device PTX or binary cubins plus the host integration code." },
  { term: "NVLink", category: "network", definition: "NVIDIA’s high-bandwidth scale-up link for load/store-style GPU and CPU memory communication.", why: "It is faster and more tightly coupled than the scale-out fabric, shaping tensor-parallel placement." },
  { term: "NVML", aliases: "NVIDIA Management Library libnvidia-ml.so", category: "cuda", definition: "A host library for querying and controlling GPU management and telemetry state.", why: "Monitoring agents use it for utilization, memory, clocks, power, temperatures, and errors." },
  { term: "NVRTC", aliases: "NVIDIA Runtime Compilation", category: "cuda", definition: "A library that compiles CUDA C++ source strings to PTX at runtime.", why: "Frameworks can specialize generated kernels without a separate offline build." },
  { term: "NVSwitch", category: "network", definition: "A switch ASIC that forwards NVLink traffic among GPUs in a scale-up domain.", why: "It provides high-radix all-to-all connectivity without forcing traffic through host CPUs." },
  { term: "Occupancy", category: "performance", definition: "Resident active warps on an SM as a fraction of the architecture’s maximum.", why: "Enough occupancy can hide latency; maximum occupancy is not automatically maximum performance." },
  { term: "Optimizer state", category: "training", definition: "Persistent tensors an optimizer keeps beyond weights and gradients, such as Adam’s first and second moments.", why: "This state can exceed model-weight memory and is a primary target for sharding." },
  { term: "Overhead", category: "performance", definition: "Time or work needed to arrange computation rather than perform its intended arithmetic.", why: "Launches, Python, synchronization, allocation, routing, padding, and communication can dominate small operations." },
  { term: "PagedAttention", category: "inference", definition: "vLLM’s attention/cache design that maps logical KV blocks to non-contiguous physical blocks.", why: "It reduces contiguous reservation and fragmentation while enabling block sharing and reclamation." },
  { term: "PAM4", category: "network", definition: "Four-level pulse-amplitude modulation encoding two bits in each symbol.", why: "It raises bits per symbol but reduces signal margin and increases equalization/FEC demands." },
  { term: "Peak rate", category: "performance", definition: "A theoretical maximum derived from unit count, operations per cycle, clock, and often a specific dtype/instruction.", why: "It is a ceiling under ideal assumptions, not a prediction for an application." },
  { term: "Perplexity", category: "training", definition: "Exponentiated average cross-entropy, interpretable as the model’s effective uncertainty over next tokens.", why: "It is useful for held-out language modeling but does not directly measure instruction usefulness or truthfulness." },
  { term: "Pipeline parallelism", aliases: "PP", category: "training", definition: "Placing consecutive groups of layers on different devices and streaming microbatches through them.", why: "It partitions parameters with point-to-point activation traffic, but idle pipeline bubbles must be managed." },
  { term: "Pipe utilization", category: "performance", definition: "The share of cycles in which a particular execution pipeline performs useful work.", why: "It identifies which unit is saturated and which units sit idle during a kernel." },
  { term: "Post-training", category: "training", definition: "Training after base pre-training to shape instructions, preferences, reasoning policy, tools, safety, or domain behavior.", why: "It converts a next-token model into a deployable assistant or task policy." },
  { term: "Prefill", category: "inference", definition: "The inference phase that processes all prompt positions and creates their cached attention state.", why: "It uses large parallel matrix operations and largely determines time to first token for long prompts." },
  { term: "Prefix caching", category: "inference", definition: "Reusing KV blocks produced by an identical prompt prefix across requests.", why: "It avoids repeated prefill work for system prompts, shared documents, and branching samples." },
  { term: "Pre-training", category: "training", definition: "Large-scale optimization on broad token streams, usually with a self-supervised next-token objective.", why: "It creates general representations and capabilities before behavioral specialization." },
  { term: "PTX", aliases: "parallel thread execution", category: "cuda", definition: "NVIDIA’s virtual instruction-set representation compiled onward for a concrete GPU architecture.", why: "It is a portable device-code boundary, not the exact instructions issued by an SM." },
  { term: "Quantization", category: "inference", definition: "Representing weights, activations, or cached state with fewer bits and explicit scale/zero-point rules.", why: "It reduces memory and may unlock faster units, but accuracy and kernel support determine the real outcome." },
  { term: "RDMA", aliases: "remote direct memory access", category: "network", definition: "A network mechanism that transfers data to or from registered remote memory with little CPU intervention.", why: "GPU-aware RDMA removes host copies from scale-out tensor movement." },
  { term: "Reduce-scatter", category: "network", definition: "A collective that reduces values across ranks and leaves each rank with one shard of the result.", why: "Sharded training composes it with all-gather to avoid fully replicated gradients or parameters." },
  { term: "Register", category: "hardware", definition: "The fastest programmer-visible per-thread storage, allocated from an SM register file.", why: "Register pressure controls residency and spills; register bandwidth feeds execution pipelines." },
  { term: "Register file", category: "hardware", definition: "The physical on-SM array from which logical thread registers are allocated.", why: "It must provide enormous bandwidth across resident warps and is a major area/power structure." },
  { term: "Residual stream", category: "training", definition: "The fixed-width per-token representation carried through successive Transformer blocks by residual additions.", why: "It is the stable interface through which attention and MLP sub-layers communicate." },
  { term: "Reward model", category: "training", definition: "A learned scorer trained to predict preference or desired behavior from prompts and outputs.", why: "RLHF uses it as a proxy objective, creating risks from bias and reward exploitation." },
  { term: "RLHF", aliases: "reinforcement learning from human feedback", category: "training", definition: "Post-training that learns a reward from human preferences and optimizes a policy against that reward.", why: "It aligns behavior beyond imitation but introduces online sampling and reward-model failure modes." },
  { term: "RLVR", aliases: "reinforcement learning with verifiable rewards", category: "training", definition: "Reinforcement learning in which outcomes are checked by rules, tests, or formal verifiers.", why: "It supplies lower-noise rewards for code, mathematics, and other objectively checkable tasks." },
  { term: "Roofline model", category: "performance", definition: "A performance bound defined by peak compute and memory bandwidth multiplied by arithmetic intensity.", why: "It tells you which ceiling a workload reaches before choosing an optimization." },
  { term: "RoPE", aliases: "rotary position embedding", category: "inference", definition: "A position-dependent rotation applied to query and key channel pairs so their dot product encodes relative displacement.", why: "Its frequencies and extrapolation behavior matter for long-context training and serving." },
  { term: "SASS", aliases: "streaming assembler", category: "cuda", definition: "Common name for the native machine instructions encoded for a specific NVIDIA GPU architecture.", why: "Disassembly reveals the instructions hardware actually executes after PTX lowering." },
  { term: "Scoreboard stall", category: "performance", definition: "A warp cannot issue because an input dependency is not yet ready according to the hardware scoreboard.", why: "It often points to memory latency or a long dependent instruction chain." },
  { term: "Sequence packing", category: "training", definition: "Combining multiple documents or examples into fixed-length training sequences with boundary-aware masking.", why: "It reduces padding waste and increases useful tokens per accelerator step." },
  { term: "SerDes", aliases: "serializer deserializer", category: "network", definition: "Circuitry that turns parallel on-chip data into high-rate serial symbols and reconstructs it at the receiver.", why: "It is the electrical boundary for PCIe, Ethernet, InfiniBand, and accelerator links." },
  { term: "Shared memory", category: "hardware", definition: "Programmer-managed on-SM SRAM shared by threads in one block.", why: "It stages reusable tiles and thread exchange, with bank layout and capacity affecting performance." },
  { term: "SFT", aliases: "supervised fine-tuning", category: "training", definition: "Training on curated input–target demonstrations with a supervised token loss.", why: "It teaches format, instruction response, tools, domains, and initial policy behavior." },
  { term: "SM", aliases: "streaming multiprocessor", category: "hardware", definition: "NVIDIA’s primary programmable GPU execution block containing warp scheduling, registers, shared memory, and arithmetic pipelines.", why: "Kernel occupancy, issue, and on-chip locality are accounted for at the SM." },
  { term: "SM utilization", category: "performance", definition: "A tool-dependent measure of how often SMs are active or issuing work.", why: "The exact metric must be read carefully; high activity can coexist with poor useful throughput." },
  { term: "Softmax", category: "inference", definition: "A normalization that exponentiates scores and divides by their sum to produce positive weights totaling one.", why: "Stable reductions and masking are central to attention and sampling kernels." },
  { term: "Special function unit", aliases: "SFU", category: "hardware", definition: "A pipeline for operations such as reciprocal, square root, trigonometric, or interpolation approximations.", why: "Nonlinear functions can become a bottleneck when surrounding matrix multiplication is extremely fast." },
  { term: "Speculative decoding", category: "inference", definition: "Using a cheaper draft to propose tokens that a target model verifies in parallel under a distribution-preserving rule.", why: "It can advance multiple tokens per serial target step when acceptance is high and verification is efficient." },
  { term: "Tensor", category: "training", definition: "A multidimensional array plus dtype, layout, device, and axis meaning.", why: "Model architecture and system communication are both expressed as transformations of tensors." },
  { term: "Tensor core", category: "hardware", definition: "A specialized GPU pipeline for matrix multiply-accumulate over supported tile shapes and dtypes.", why: "Its peak throughput requires compatible layouts, alignment, precision, and enough reuse to feed it." },
  { term: "Tensor memory", category: "hardware", definition: "Architecture-specific on-chip storage introduced for staging or accumulating tensor-core data outside ordinary registers.", why: "It can relieve register pressure and reorganize the producer–consumer path for matrix operations." },
  { term: "Tensor parallelism", aliases: "TP", category: "training", definition: "Splitting the matrices and computation of individual layers across devices.", why: "It reduces per-device weight/compute burden but introduces communication inside each block." },
  { term: "Thread", category: "cuda", definition: "One logical CUDA execution instance with its own indices, registers, and local state.", why: "Threads are issued as warps, so neighboring thread behavior and addresses should align." },
  { term: "Thread hierarchy", category: "cuda", definition: "CUDA’s organization of threads into warps, blocks, and grids.", why: "It maps software work and synchronization scope onto SM scheduling and storage." },
  { term: "TMA", aliases: "tensor memory accelerator", category: "hardware", definition: "An asynchronous engine that copies multidimensional tensor tiles between global and shared memory from compact descriptors.", why: "It reduces address/transfer bookkeeping by threads and enables deeper producer–consumer pipelines." },
  { term: "Token", category: "training", definition: "A discrete vocabulary unit produced by a tokenizer and consumed or predicted by the model.", why: "Tokens are the accounting unit for data scale, context, cache size, throughput, and billing." },
  { term: "Tokenizer", category: "training", definition: "The reversible mapping between text or other input and vocabulary token IDs.", why: "Vocabulary, normalization, and segmentation alter sequence length, data efficiency, and model behavior." },
  { term: "TPC", aliases: "texture processing cluster", category: "hardware", definition: "An NVIDIA physical grouping that commonly contains one or more SMs and texture-related resources.", why: "It is a floorplan hierarchy term whose exact composition varies by GPU generation." },
  { term: "TPOT", aliases: "time per output token inter-token latency", category: "inference", definition: "Average elapsed time between streamed output tokens after the first token.", why: "It tracks the interactive pace of decode separately from prompt processing." },
  { term: "TTFT", aliases: "time to first token", category: "inference", definition: "Elapsed time from request arrival to the first generated token.", why: "It includes queueing and prefill, so it grows with prompt length and load." },
  { term: "vLLM", category: "inference", definition: "An open-source LLM serving engine built around efficient KV management, scheduling, optimized kernels, and distributed execution.", why: "It is a reference system for continuous batching and production GPU model serving." },
  { term: "Warp", category: "cuda", definition: "A group of 32 CUDA threads scheduled and issued together on NVIDIA GPUs.", why: "Divergent control paths and scattered memory addresses reduce useful work per issued warp instruction." },
  { term: "Warp divergence", category: "performance", definition: "Different lanes in one warp take different control-flow paths, causing paths to execute with other lanes masked.", why: "It serializes work that appears parallel at the source level." },
  { term: "Warp execution state", category: "performance", definition: "A profiler’s classification of whether a warp is eligible, issuing, or stalled for a stated reason.", why: "It connects low issue rate to dependencies, barriers, memory, or lack of resident work." },
  { term: "Warp scheduler", category: "hardware", definition: "SM control logic that selects eligible resident warps and dispatches their next instructions.", why: "It hides latency only when independent warps and destination pipelines are ready." },
  { term: "Warpgroup", category: "cuda", definition: "A cooperating set of warps used by newer GPU instructions and programming models for larger asynchronous operations.", why: "Some tensor-core and pipeline features coordinate resources beyond one warp." },
  { term: "Weight decay", category: "training", definition: "An optimizer update that shrinks parameters, commonly decoupled from the gradient in AdamW.", why: "It regularizes training, and its application must exclude selected parameters such as some norms and biases." },
  { term: "ZeRO", category: "training", definition: "A staged family of data-parallel memory optimizations that partitions optimizer state, gradients, then parameters.", why: "It removes replicated model-state memory while adding gather/reduce communication." },
] satisfies GlossaryEntry[]).sort((a, b) => a.term.localeCompare(b.term));

const categoryNames: Record<GlossaryCategory, string> = {
  hardware: "Hardware",
  cuda: "CUDA software",
  performance: "Performance",
  training: "Training",
  inference: "Inference",
  network: "Network",
};

const escapeHTML = (value: string) => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

function entryMarkup(entry: GlossaryEntry) {
  const search = `${entry.term} ${entry.aliases ?? ""} ${entry.definition} ${entry.why}`.toLowerCase();
  return `
    <article class="glossary-entry" data-glossary-category="${entry.category}" data-glossary-search="${escapeHTML(search)}">
      <div class="glossary-term">
        <span>${categoryNames[entry.category]}</span>
        <h3>${escapeHTML(entry.term)}</h3>
        ${entry.aliases ? `<small>${escapeHTML(entry.aliases)}</small>` : ""}
      </div>
      <p>${escapeHTML(entry.definition)}</p>
      <p class="glossary-why"><strong>Why it matters</strong>${escapeHTML(entry.why)}</p>
    </article>`;
}

export function initializeGlossary() {
  const list = document.querySelector<HTMLElement>("[data-glossary-list]");
  const input = document.querySelector<HTMLInputElement>("[data-glossary-search]");
  const output = document.querySelector<HTMLElement>("[data-glossary-count]");
  const empty = document.querySelector<HTMLElement>("[data-glossary-empty]");
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-glossary-filter]"));
  if (!list || !input) return;

  list.innerHTML = entries.map(entryMarkup).join("");
  const rows = Array.from(list.querySelectorAll<HTMLElement>("[data-glossary-category]"));
  let category = "all";

  const render = () => {
    const query = input.value.trim().toLowerCase();
    let visible = 0;
    rows.forEach((row) => {
      const categoryMatch = category === "all" || row.dataset.glossaryCategory === category;
      const textMatch = !query || (row.dataset.glossarySearch ?? "").includes(query);
      const show = categoryMatch && textMatch;
      row.hidden = !show;
      if (show) visible += 1;
    });
    if (output) output.textContent = `${visible} of ${entries.length} terms`;
    if (empty) empty.hidden = visible !== 0;
  };

  buttons.forEach((button) => button.addEventListener("click", () => {
    category = button.dataset.glossaryFilter ?? "all";
    buttons.forEach((item) => item.classList.toggle("is-active", item === button));
    render();
  }));
  input.addEventListener("input", render);
  render();
}
