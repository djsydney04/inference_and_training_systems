export type ChipKind = "memory" | "compute" | "control" | "link";
export type ChipPart = {
  id: string; label: string; detail: string; kind: ChipKind;
  x: number; y: number; body: string; watch: string; example: string;
  open?: string;
};
export type ChipEdge = { from: string; to: string; control?: boolean; bends?: [number, number][] };
export type ChipRoute = { label: string; steps: string[]; note: string };
export type ChipView = {
  id: string; label: string; title: string; boundary: string;
  parts: ChipPart[]; edges: ChipEdge[]; routes: ChipRoute[];
  sources: [string, string][];
};
export type ChipExplorer = {
  id: string; host: string; title: string; intro: string; views: ChipView[];
};

const tuning = "https://docs.nvidia.com/cuda/blackwell-tuning-guide/index.html";
const mma = "https://docs.nvidia.com/cutlass/4.5.2/media/docs/pythonDSL/mma_docs/tcgen05_programming.html";
const copies = "https://docs.nvidia.com/cuda/cuda-programming-guide/04-special-topics/async-copies.html";
const cuda = "https://docs.nvidia.com/cuda/cuda-programming-guide/02-basics/asynchronous-execution.html";
const groq = "https://doi.org/10.1109/ISCA45697.2020.00023";
const groqScale = "https://groq.com/wp-content/uploads/2023/05/GroqISCAPaper2022_ASoftwareDefinedTensorStreamingMultiprocessorForLargeScaleMachineLearning-1.pdf";
const rack = "https://docs.nvidia.com/dgx/dgxgb200-user-guide/hardware.html";
const network = "https://docs.nvidia.com/dgx/dgxgb200-user-guide/networking.html";
const rdma = "https://docs.nvidia.com/cuda/gpudirect-rdma/index.html";
const roce = "https://docs.nvidia.com/networking-ethernet-software/cumulus-linux/Layer-1-and-Switch-Ports/Quality-of-Service/RDMA-over-Converged-Ethernet-RoCE/";

const part = (id: string, label: string, detail: string, kind: ChipKind, col: number, row: number,
  body: string, watch: string, example: string, open?: string): ChipPart =>
  ({ id, label, detail, kind, x: 24 + col * 248, y: 48 + row * 170, body, watch, example, open });
const edge = (from: string, to: string, control = false, bends?: [number, number][]): ChipEdge =>
  ({ from, to, control, bends });

const gpuPackage: ChipView = {
  id: "gpu-package", label: "Package and die", title: "Follow bytes from memory to the SM",
  boundary: "Logical GPU organization, with B200 / compute capability 10.0 examples. Blocks are functional groups, not a die photograph or a physical SM count. HBM sits outside the compute dies.",
  parts: [
    part("hbm", "HBM stacks", "Off-die DRAM", "memory", 0, 0,
      "Model weights, activations and the KV cache occupy device memory. Stacked DRAM gets capacity close to the GPU through a wide package interface.",
      "Capacity determines what fits; bandwidth determines how quickly cold data can arrive.",
      "An illustrative 8 GB of weights read once over 8 TB/s already takes 1 ms, before other traffic or computation."),
    part("controller", "Memory controllers", "Requests → DRAM channels", "control", 1, 0,
      "Memory partitions turn requests into DRAM commands and return data. Address distribution, access granularity and channel utilization affect useful bandwidth.",
      "Scattered reads can transfer more bytes than the kernel uses.",
      "Compare a warp loading adjacent words with a warp loading one word from each distant cache line."),
    part("l2", "Shared L2", "Reuse across SMs", "memory", 2, 0,
      "L2 is a device-level cache between execution clients and memory partitions. A hit can avoid an HBM access; it does not eliminate traffic within the GPU.",
      "Working-set size and competing kernels change reuse.",
      "Two thread blocks reading the same weight tile may reuse it in L2 even though their shared-memory allocations are distinct."),
    part("sm", "SM clusters", "Warps + local storage", "compute", 3, 0,
      "Streaming multiprocessors hold resident thread blocks and execute their instructions. Registers, shared memory and warp slots limit how much work can reside at once.",
      "Resident warps and eligible warps are different quantities.",
      "Open one SM to follow an asynchronous tile copy, Tensor Core operation and epilogue.", "gpu-sm"),
    part("host", "Host interface", "Commands and transfers", "link", 0, 1,
      "The host submits work and coordinates memory. PCIe connects many GPU systems; Grace–Blackwell also has an NVLink-C2C CPU–GPU path.",
      "A faster GPU cannot remove a serialized host submission dependency.",
      "A launch can be queued before an earlier kernel completes, but stream ordering still constrains when it runs."),
    part("copy", "Copy engines", "Asynchronous transfers", "control", 1, 1,
      "Dedicated transfer resources can move data while SMs compute when the runtime, memory and dependencies permit overlap. These are distinct from the SM's TMA tile-copy mechanism.",
      "Async API return does not mean the transfer is complete.",
      "Use an event dependency before a consumer accesses data produced by a copy in another stream."),
    part("fabric", "On-chip fabric", "Connects shared resources", "link", 2, 1,
      "Requests and responses traverse internal interconnects among caches, memory clients and interfaces. A shared address space is not a single uniform-latency storage bank.",
      "Concurrent clients can contend even when arithmetic units are available.",
      "A local load, a cache miss and a peer-memory access take different routes."),
    part("nvlink", "NVLink ports", "Peer GPU traffic", "link", 3, 1,
      "NVLink carries traffic to peer GPUs through the scale-up fabric. The peer's memory remains physically remote.",
      "Link bandwidth is separate from the GPU's HBM bandwidth.",
      "A tensor-parallel reduction can leave the GPU each layer even when the weights fit locally."),
  ],
  edges: [edge("hbm", "controller"), edge("controller", "l2"), edge("l2", "sm"), edge("host", "copy"), edge("copy", "controller"), edge("l2", "fabric"), edge("fabric", "nvlink")],
  routes: [
    { label: "Read a cold tile", steps: ["hbm", "controller", "l2", "sm"], note: "A conceptual response path. A cache hit avoids the HBM portion; request and return traffic are both needed." },
    { label: "Leave the GPU", steps: ["l2", "fabric", "nvlink"], note: "Peer traffic crosses a different interface from local DRAM traffic. The program must establish access and synchronization." },
  ],
  sources: [[tuning, "NVIDIA: Blackwell memory and SM organization"], [cuda, "CUDA: asynchronous execution and transfers"], [network, "NVIDIA: NVLink and network boundaries"]],
};

const gpuSM: ChipView = {
  id: "gpu-sm", label: "Inside one SM", title: "Data movement, issue and arithmetic are separate jobs",
  boundary: "A Blackwell SM100 tcgen05 dataflow, not a floorplan. General CUDA instructions also use the register/ALU and load/store paths. Dashed lines represent control dependencies. These stages are not clock cycles.",
  parts: [
    part("global", "L2 / global memory", "Outside the SM", "memory", 0, 0,
      "A global pointer names storage beyond the SM's private execution state. Cache misses can continue to HBM.",
      "Coalesce accesses before trying to hide their latency.", "One 128 × 64 BF16 tile contains 16 KiB of payload."),
    part("tma", "TMA copy path", "Bulk tile movement", "link", 1, 0,
      "The Tensor Memory Accelerator moves described tiles asynchronously. It can stage global data in shared memory without a per-element register round trip.",
      "A valid descriptor, layout and completion protocol are required.", "A producer can start loading tile k+1 while consumers calculate with tile k."),
    part("shared", "Shared memory / L1", "Staging and caching", "memory", 2, 0,
      "Shared memory is explicitly managed block storage. L1 is a hardware cache. They have different semantics while sharing a configurable on-SM capacity resource.",
      "Banks, capacity and reuse affect the useful tile size.", "Two 16 KiB A tiles and two 16 KiB B tiles consume 64 KiB before other shared state."),
    part("tensor", "Tensor Cores", "Matrix multiply-accumulate", "compute", 3, 0,
      "tcgen05 consumes matrix operands from supported shared/Tensor Memory locations and accumulates in Tensor Memory. A single issuing thread does not imply one scalar multiply.",
      "Shape, precision and descriptor layout must match the instruction.", "D = A × B + C updates an output tile across reduction steps."),
    part("lsu", "Load / store units", "Addressed memory operations", "link", 0, 1,
      "Load/store machinery moves addressed values between the thread execution context and memory. Global accesses are grouped into transactions; shared accesses use banks.",
      "Address calculations and memory dependencies still consume resources.", "After the epilogue, participating threads store their assigned output elements."),
    part("alu", "Arithmetic lanes", "Scalar and SIMD work", "compute", 1, 1,
      "Regular instructions perform address arithmetic, comparisons and elementwise math. Active masks determine participating lanes in a warp.",
      "A 32-thread warp is a logical execution group, not a count of dedicated ALUs.", "The epilogue scales the accumulated result and applies a bias before storing."),
    part("registers", "Register file", "Per-thread live values", "memory", 2, 1,
      "Registers hold thread operands, addresses and intermediate values. Register allocation is a shared SM capacity constraint even though values belong to individual threads.",
      "More live registers can reduce residency or cause spills.", "Load the completed tcgen05 accumulator into registers for the epilogue."),
    part("tmem", "Tensor Memory", "tcgen05 accumulators", "memory", 3, 1,
      "TMEM is dedicated on-chip storage separate from the register file and shared memory. tcgen05 reads and writes its accumulator here.",
      "Wait for the matrix operation before reading its result.", "Successive K tiles update the same accumulator; tcgen05.ld brings the completed values to registers."),
    part("scheduler", "Warp schedulers", "Choose eligible work", "control", 0, 2,
      "Schedulers select instructions whose dependencies and execution resources permit issue. Other ready warps can make progress during a wait.",
      "High occupancy does not guarantee an eligible instruction each cycle.", "If every resident warp waits on memory, adding arithmetic lanes does not help."),
    part("scoreboard", "Dependency tracking", "Registers and issue readiness", "control", 1, 2,
      "The scoreboard tracks instruction dependencies so a consumer does not use an unfinished result. This is distinct from a software-visible cooperative barrier.",
      "A true dependency remains even when many execution units are free.", "An instruction using a just-loaded register must wait until that operand is ready."),
    part("barrier", "Async barriers", "Producer → consumer ordering", "control", 2, 2,
      "Completion signals coordinate asynchronous producers and consumers. Buffer reuse must wait for the previous consumer as well as the next copy.",
      "Starting a transfer is not evidence that the tile can be read.", "A double-buffered pipeline alternates storage only after its phase's producer and consumer obligations finish."),
    part("sfu", "Special functions", "Instruction-specific math", "compute", 3, 2,
      "Specialized execution supports operations such as approximate transcendental instructions. A full activation or normalization usually involves several instructions and reductions.",
      "Tensor Core throughput does not describe the whole layer.", "Softmax also needs maxima, exponentials, a sum and normalization."),
  ],
  edges: [edge("global", "tma"), edge("tma", "shared"), edge("shared", "tensor"), edge("tensor", "tmem"), edge("tmem", "registers"), edge("registers", "alu"), edge("alu", "lsu"), edge("lsu", "global"), edge("scheduler", "scoreboard", true), edge("scoreboard", "alu", true), edge("barrier", "shared", true, [[718, 433], [756, 433], [756, 93]]), edge("registers", "sfu")],
  routes: [
    { label: "A matrix tile through the SM", steps: ["global", "tma", "shared", "tensor", "tmem", "registers", "alu", "lsu"], note: "The common SMEM-operand tcgen05 path. Completion waits sit between producers and consumers; other instruction families use different operand and accumulator storage." },
    { label: "Why a warp waits", steps: ["scheduler", "scoreboard", "alu"], note: "A control dependency, not a payload transfer. Readiness and available execution capacity both constrain issue." },
  ],
  sources: [[mma, "CUTLASS 4.5.2: tcgen05 operands, TMEM and result loads"], [copies, "CUDA: asynchronous copies, TMA and barriers"], [tuning, "NVIDIA: register, shared-memory and residency limits"]],
};

const lpu: ChipView = {
  id: "lpu-slices", label: "Slices and streams", title: "The program schedules where data meets an operation",
  boundary: "Logical organization based on the published 2020/2022 Groq TSP. This is not a Groq 3 die map. Slices repeat across the chip; arrows select one teaching route rather than every physical stream.",
  parts: [
    part("mem", "MEM · SRAM", "Explicit tensor storage", "memory", 0, 0,
      "The compiler assigns tensor values to on-chip memory locations and schedules reads. The model does not depend on demand-filled cache placement.",
      "Capacity and bank access must fit the schedule.", "Keep a weight tile available while several activation vectors reuse it."),
    part("streams", "Data streams", "Values in space and time", "link", 1, 0,
      "Streams carry operands between functional slices. Placement and arrival time are part of the compiled program.",
      "Movement consumes scheduled resources even when no arithmetic happens.", "Delay one producer in a teaching schedule and its consumer no longer receives the expected value at the expected step."),
    part("mxm", "MXM · matrix units", "Reuse installed weights", "compute", 2, 0,
      "Matrix execution combines arriving operands with locally placed weights. Partial results must continue to the next scheduled operation.",
      "A large array helps only while its operand schedule keeps it fed.", "For y = Wx, each output combines products over the input dimension. Reuse W across input vectors."),
    part("sxm", "SXM · switch units", "Route and rearrange", "link", 3, 0,
      "Switching resources rearrange and move vector elements between producers and consumers. Tensor layout is therefore an execution concern.",
      "A permutation can cost movement even when the element count stays fixed.", "The next operator may need elements grouped along a different tensor axis."),
    part("dispatch", "Instruction dispatch", "Independent slice programs", "control", 0, 1,
      "Instruction queues direct functional slices on compiler-planned timelines. Instructions and tensor payloads are different flows.",
      "The compiler must coordinate their relative timing.", "A memory instruction launches a value early enough for a later matrix operation."),
    part("links", "Chip-to-chip links", "Extend the scheduled route", "link", 1, 1,
      "A distributed tensor program moves values between chips. Link resources and transfer delays enter the placement and timing problem.",
      "Aggregate SRAM across chips is not all local to one arithmetic unit.", "Place model shards on separate chips, then account for the activation that crosses between them."),
    part("result", "MEM · result storage", "Live values for later work", "memory", 2, 1,
      "Results may be stored for a later consumer. The compiler must keep values alive until their final use.",
      "Reusing storage too early destroys a future operand.", "A residual path keeps an earlier activation live while another path computes."),
    part("vxm", "VXM · vector units", "Elementwise and vector math", "compute", 3, 1,
      "Vector execution handles work around the matrix products, including arithmetic and pieces of activation or reduction operations.",
      "Layer latency includes this work as well as matrix multiplication.", "A bias and activation follow the matrix product before the next layer consumes the result."),
  ],
  edges: [edge("mem", "streams"), edge("streams", "mxm"), edge("mxm", "sxm"), edge("sxm", "vxm"), edge("vxm", "result"), edge("result", "links"), edge("dispatch", "mem", true)],
  routes: [
    { label: "A tensor through the slices", steps: ["mem", "streams", "mxm", "sxm", "vxm", "result"], note: "A dependency walkthrough. Real schedules overlap many operations; these clicks do not simulate chip cycles." },
    { label: "Continue on another chip", steps: ["vxm", "result", "links"], note: "One illustrative store-and-forward path. Storage, layout, transfer and the receiving operation must agree." },
  ],
  sources: [[groq, "Groq / ISCA 2020: Think Fast, the Tensor Streaming Processor"], [groqScale, "Groq / ISCA 2022: software-defined tensor streaming multiprocessor"]],
};

const fabric: ChipView = {
  id: "network-fabric", label: "GPU to GPU", title: "Inside a rack and across racks are different routes",
  boundary: "DGX GB200 NVL72 scale-up example plus a logical leaf/spine scale-out path. Real fabrics may be rail-optimized, use more tiers, or use different adapter placement. Lines are routes, not cable counts.",
  parts: [
    part("source", "Source GPU", "Local memory and compute", "compute", 0, 0,
      "A producer kernel creates data in GPU memory. Communication must observe its completion and the destination must wait before consuming the received result.",
      "Memory registration and a network connection do not replace ordering.", "Record the producer's completion before publishing its tensor shard."),
    part("nvswitch", "NVSwitch fabric", "Within the NVLink domain", "link", 1, 0,
      "Nine switch trays contain eighteen NVSwitch chips in an NVL72 rack. They connect the seventy-two GPU endpoints through the scale-up fabric.",
      "Every peer remains a distinct physical device.", "A transfer between two GPUs in this domain can use NVLink rather than the external Ethernet or InfiniBand network."),
    part("peer", "Peer GPU", "Same NVLink domain", "compute", 2, 0,
      "The destination GPU has its own local memory and execution resources. Peer access changes reachability; it does not turn remote data into local SRAM.",
      "Collective timing depends on the slowest required participants.", "Tensor-parallel ranks exchange partial results before the next layer."),
    part("management", "Management plane", "Configuration and telemetry", "control", 3, 0,
      "Fabric management configures connectivity and monitors health. Management Ethernet ports are not the payload path for a GPU collective.",
      "A reachable switch management address does not prove that all data links are healthy.", "Use link and error telemetry to distinguish a failed path from an overloaded one."),
    part("nic", "Network adapter", "DMA + transport", "link", 0, 1,
      "The adapter transfers registered buffers and implements network transport. GPUDirect RDMA can avoid a CPU bounce buffer when the platform path supports it.",
      "PCIe topology, registration and ordering constrain the transfer.", "A supported NIC reads GPU memory, sends packets and reports completion through the communication stack."),
    part("leaf", "Leaf switch", "Endpoint-facing ports", "link", 1, 1,
      "Leaf switches connect endpoint adapters and forward traffic toward other leaves through the fabric. Queue pressure and path capacity affect completion time.",
      "Downlink and uplink capacity determine oversubscription.", "Eight 400 Gb/s downlinks feeding four 400 Gb/s uplinks create a 2:1 aggregate contention boundary.", "network-switch"),
    part("spine", "Spine and destination leaf", "Cross-rack fabric path", "link", 2, 1,
      "A spine connects leaves so traffic can reach another endpoint group. This block collapses the spine-to-destination-leaf segment for readability.",
      "Several possible paths do not guarantee balanced load.", "An all-to-all phase can create hot output ports even when the aggregate network is large."),
    part("remote", "Remote NIC + GPU", "Receive and make visible", "compute", 3, 1,
      "The receiving adapter places data in an allowed buffer. The application observes the required completion and visibility guarantees before GPU use.",
      "Network arrival and safe kernel consumption are different milestones.", "The next kernel waits for its communication dependency rather than polling an assumed transfer duration."),
  ],
  edges: [edge("source", "nvswitch"), edge("nvswitch", "peer"), edge("source", "nic"), edge("nic", "leaf"), edge("leaf", "spine"), edge("spine", "remote"), edge("management", "peer", true)],
  routes: [
    { label: "Within one NVLink domain", steps: ["source", "nvswitch", "peer"], note: "Scale-up traffic uses the rack's NVLink fabric. It does not traverse a management Ethernet switch." },
    { label: "Across rack domains", steps: ["source", "nic", "leaf", "spine", "remote"], note: "Scale-out traffic crosses adapters and external switches. The diagram groups the destination leaf with the spine stage." },
  ],
  sources: [[rack, "NVIDIA: compute and NVSwitch tray inventory"], [network, "NVIDIA: scale-up, scale-out and management networks"], [rdma, "NVIDIA: GPUDirect RDMA ordering and platform limits"]],
};

const switchView: ChipView = {
  id: "network-switch", label: "Inside an Ethernet switch", title: "A switch selects a path, stores bursts and arbitrates an exit",
  boundary: "A logical packet-switch pipeline for explaining Ethernet/RoCE. It is not a disclosed Spectrum or NVSwitch floorplan. Buffer placement, cut-through behavior and arbitration vary by implementation; NVSwitch has a different protocol.",
  parts: [
    part("phy", "Ports / SerDes", "Bits on physical lanes", "link", 0, 0,
      "Serializers and deserializers connect electrical lanes to the chip's internal data path. Link encoding and error handling sit below packet forwarding.",
      "An advertised port rate counts bits; tensor payload is usually measured in bytes.", "400 Gb/s is 50 GB/s before framing, transport and other overhead."),
    part("parse", "Packet parser", "Read forwarding fields", "control", 1, 0,
      "The switch identifies packet headers and classifies the traffic. Payload tensor values do not need to be interpreted for ordinary forwarding.",
      "Packets can share a priority while belonging to different flows.", "An Ethernet/IP header helps select the forwarding behavior and queue class."),
    part("lookup", "Forwarding lookup", "Choose eligible output", "control", 2, 0,
      "Configured forwarding state maps the destination to an output or a set of eligible paths. Control software installs that state; packet hardware uses it.",
      "A correct route does not guarantee an uncongested output.", "Several source GPUs can all need the same destination-facing port."),
    part("buffer", "Packet buffers", "Absorb temporary bursts", "memory", 3, 0,
      "Buffering holds traffic that cannot leave immediately. It absorbs bursts for a finite time; it cannot fix sustained oversubscription.",
      "Queue occupancy adds latency and can trigger congestion feedback.", "A 1 MB queue at a usable 50 GB/s takes 20 µs to drain if no more bytes arrive."),
    part("egress", "Egress port", "Serialize the next hop", "link", 1, 1,
      "The output sends traffic at the negotiated link rate. Several inputs competing for it cannot all receive its full bandwidth at once.",
      "End-to-end throughput is constrained by shared bottlenecks.", "Two equal long-lived senders sharing one 400 Gb/s exit cannot each sustain 400 Gb/s."),
    part("crossbar", "Switching fabric", "Connect inputs to outputs", "link", 2, 1,
      "An internal switching fabric carries data to the chosen output. The exact topology is implementation-specific.",
      "Aggregate switching capacity does not remove contention for one exit.", "Traffic to independent outputs can proceed concurrently when internal resources permit."),
    part("arbiter", "Queue scheduling", "Who gets the next turn", "control", 3, 1,
      "Scheduling selects service among eligible queues. RoCE deployments can use ECN feedback and priority flow control to manage congestion.",
      "PFC pauses a link priority; ECN signals congestion to endpoints. Neither creates bandwidth.",
      "Inspect occupancy, ECN marks and pause counters together when a collective's tail latency rises."),
  ],
  edges: [edge("phy", "parse"), edge("parse", "lookup"), edge("lookup", "buffer"), edge("buffer", "arbiter"), edge("arbiter", "crossbar"), edge("crossbar", "egress")],
  routes: [{ label: "Follow a packet", steps: ["phy", "parse", "lookup", "buffer", "arbiter", "crossbar", "egress"], note: "Logical responsibilities, not mandatory store-and-forward stages or a cycle-accurate implementation. A cut-through switch may begin forwarding before the entire packet arrives." }],
  sources: [[roce, "NVIDIA Cumulus: RoCE congestion control and buffer counters"], [network, "NVIDIA: network planes and their protocols"]],
};

export const chipExplorers: ChipExplorer[] = [
  { id: "gpu-chip-anatomy", host: "gpu-scene", title: "GPU components and SM internals", intro: "Start with the memory path, then open one SM. Select a component to see its job, a limiting resource and a concrete example.", views: [gpuPackage, gpuSM] },
  { id: "lpu-chip-anatomy", host: "lpu-scene", title: "Inside the LPU dataflow", intro: "Follow a tensor through memory, matrix, switch and vector slices. The data route and instruction schedule must meet at the same operation.", views: [lpu] },
  { id: "network-switch-anatomy", host: "rack-scene", title: "GPU links, networks and switch internals", intro: "Compare an in-rack transfer with a cross-rack transfer, then inspect what an Ethernet switch does to each packet.", views: [fabric, switchView] },
];

export function chipRouteStep(view: ChipView, routeIndex: number, stepIndex: number) {
  const route = view.routes[routeIndex];
  if (!route || !Number.isInteger(stepIndex) || stepIndex < 0 || stepIndex >= route.steps.length)
    throw new RangeError("Unknown chip route step");
  const current = view.parts.find(p => p.id === route.steps[stepIndex]);
  if (!current) throw new Error("Route references a missing component");
  return { current, previous: stepIndex ? route.steps[stepIndex - 1] : null, total: route.steps.length };
}

/** Ideal simultaneous incast: equal messages, each input as fast as one output. */
export function outputContention(senders: number, portGbps: number, messageMiB: number) {
  if (!Number.isInteger(senders) || senders < 1 || senders > 16 ||
    !Number.isFinite(portGbps) || portGbps <= 0 || !Number.isFinite(messageMiB) || messageMiB <= 0)
    throw new RangeError("Use 1–16 senders and positive finite rates and message sizes");
  const bytes = messageMiB * 2 ** 20;
  const rateBytes = portGbps * 1e9 / 8;
  return { fairGbps: portGbps / senders, finishUs: senders * bytes / rateBytes * 1e6,
    inputUs: bytes / rateBytes * 1e6, queuedBytes: (senders - 1) * bytes };
}
