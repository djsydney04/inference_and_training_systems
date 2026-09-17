import type { TileShape } from "./portable-kernel-math";
export type KernelBackend = {
  id: string; name: string; software: string; lesson: string; tile: TileShape;
  ownership: string; boundary: string;
  stages: { label: string; detail: string; note: string }[];
};
export const kernelBackends: KernelBackend[] = [
  { id: "h100", name: "NVIDIA H100", software: "CUDA / Hopper", lesson: "h100-kernel-example",
    tile: { m: 64, n: 128, k: 32 }, ownership: "Illustrative consumer: one 128-thread warpgroup, comprising four 32-thread warps.",
    boundary: "This models a Hopper tensor-core pipeline. The companion's scalar CUDA kernel is a separate correctness baseline and does not issue TMA or WGMMA.",
    stages: [
      { label: "HBM", detail: "A and B tiles", note: "Model operands begin in device memory. Reuse a loaded tile across several outputs instead of reloading each scalar." },
      { label: "Shared memory", detail: "TMA + barriers", note: "A Tensor Memory Accelerator transfer can stage tiles asynchronously. A consumer must observe the matching completion before reading the buffer." },
      { label: "Tensor Cores", detail: "warpgroup MMA", note: "Hopper warpgroup matrix instructions coordinate 128 threads. Instruction shapes, layouts and synchronization are specific programming contracts." },
      { label: "Accumulate", detail: "registers → output", note: "Keep partial sums across the K steps. Finish outstanding matrix operations before using the result or reusing their operand buffers." },
    ] },
  { id: "mi300x", name: "AMD MI300X", software: "HIP / ROCm / CDNA 3", lesson: "mi300x-kernel-example",
    tile: { m: 64, n: 64, k: 32 }, ownership: "Illustrative workgroup: 256 threads, comprising four 64-lane CDNA 3 wavefronts.",
    boundary: "This models an LDS-staged matrix pipeline. The companion's scalar HIP kernel is a correctness baseline; no matrix instruction or performance result is implied.",
    stages: [
      { label: "HBM", detail: "coalesced loads", note: "The tensor contract can stay unchanged while workgroup shape and memory-access mapping are redesigned for the AMD target." },
      { label: "LDS", detail: "workgroup storage", note: "Local Data Share is explicitly managed on-chip storage. Reusing a tile requires suitable bank layout and synchronization of its readers and writers." },
      { label: "Matrix cores", detail: "MFMA operations", note: "Matrix instructions consume wavefront-distributed fragments. A CUDA warp layout does not specify an AMD fragment layout." },
      { label: "Accumulate", detail: "registers → output", note: "Partial sums must retain the declared precision. Recheck register pressure and emitted instructions after changing the workgroup or tile." },
    ] },
  { id: "tpu", name: "Google TPU v5p", software: "JAX / XLA / Pallas", lesson: "tpu-kernel-example",
    tile: { m: 128, n: 128, k: 128 }, ownership: "A program owns a tile. The compiler maps it to TPU execution; there is no CUDA thread or warp count to copy.",
    boundary: "Tiles describe one program's logical work, not chip count or a complete TPU pipeline. A full schedule must also allocate buffers and overlap transfers.",
    stages: [
      { label: "HBM", detail: "array blocks", note: "Block specifications map program indices to slices of the input and output arrays." },
      { label: "VMEM", detail: "staged operands", note: "Pallas presents tile references backed by vector memory in the TPU pipeline. Buffer lifetimes determine when the next transfer may reuse that storage." },
      { label: "Matrix unit", detail: "tile product", note: "The compiler lowers a tile product to the TPU's matrix computation. Vector work handles surrounding elementwise operations." },
      { label: "Accumulate", detail: "FP32 tile → HBM", note: "Initialize the output accumulator once and carry it across the contraction steps. Store only the valid output region when padding a ragged problem." },
    ] },
  { id: "trainium", name: "AWS Trainium2", software: "Neuron / NKI", lesson: "trainium-kernel-example",
    tile: { m: 128, n: 128, k: 128 }, ownership: "An NKI program schedules tiles and engines. Partition dimensions and free dimensions replace CUDA lane-index assumptions.",
    boundary: "The diagram uses a logical [M,K] × [K,N] operation. The Tensor Engine's stationary operand is represented as [K,M]; transposition and layout are explicit work.",
    stages: [
      { label: "HBM", detail: "load operand tiles", note: "Global inputs must be moved into the on-chip memory that the selected engine can consume." },
      { label: "SBUF", detail: "[K,M] and [K,N]", note: "The contracting K axis maps to the partition dimension for this Tensor Engine path. The stationary operand is A transposed, not an unchanged CUDA pointer." },
      { label: "Tensor Engine", detail: "stationaryᵀ × moving", note: "Matrix computation combines the stationary and moving tiles. Layout and tile limits are part of the NKI instruction contract." },
      { label: "PSUM", detail: "partial sums → store", note: "Partial-sum memory holds accumulations. Move or cast the completed result to a supported store path; PSUM and SBUF are different storage resources." },
    ] },
];
