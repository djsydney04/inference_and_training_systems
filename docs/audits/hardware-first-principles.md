# Hardware and kernel first-principles audit

Audit date: 2026-09-16. Workspace: the isolated `ai-almanac-textbook-audit` worktree. This is the hardware reviewer's coverage record, not a claim that every chapter or every hardware implementation has been independently validated.

## Method and boundaries

Read every lesson paragraph, equation, code excerpt, worked answer and authored diagram label in the lessons listed below. Read the numerical models and rendering data for the interactive hardware workbenches. Checked small examples by arithmetic and the existing focused tests; added a regression where the communication timeline contradicted its own dependency model. Reviewed relevant shared chapter overviews and catalogs, forwarding shared-file changes to the integrating reviewer.

For architecture claims, consulted the primary sources listed below. Inspected NVIDIA's actual rack-front and compute-tray-top reference images, in addition to the corresponding redrawings' geometry and labels. Diagram source review is distinct from rendered browser review. This reviewer’s Playwright CLI failed to retain its browser context, so final page screenshots and interaction coverage belong to the integrating review. An existing Vite server responded with HTTP 200, but integration subsequently found it served a stale checkout; that response does not validate this worktree. No accelerator execution or physical timing closure is implied by a browser illustration or TypeScript test.

The user requested hand-drawn diagrams. Existing diagram drawing/styling machinery is preserved; corrections change the represented facts rather than introducing a separate visual language. The global sketch rendering pass is owned by the integrating reviewer.

## Corrections and new foundations

- **Bits before circuits:** defined Boolean functions, gates, NOT/AND/OR/XOR, added the complete two-input truth table, distinguished a transistor's gate terminal from a logic gate, and expanded MOS/CMOS. Derived the full-adder relation `a + b + cin = s + 2cout` with the cases 2 and 3 before the eight-bit workbench.
- **Timing vocabulary:** defined period, frequency, clock-to-Q and slack; tied 1 ns to 1 GHz. Defined memory ports and made the bank example's word-address unit explicit.
- **Instructions before out-of-order execution:** added the simplest fetch/decode/read/execute/update-PC account. Replaced the incorrect description of a register as an “immediate operand”: an immediate is a literal encoded in an instruction.
- **Caches from bytes:** defined hit, miss and cache levels. Qualified the sixteen-four-byte-values-per-line example with a line-aligned starting address and showed why a four-byte displacement touches two lines. Expanded NUMA and its topology units.
- **Runtime ownership:** defined host, device, runtime, kernel and DMA before the asynchronous-transfer example. Stated the cache-line alignment assumption in the row/column example.
- **Collectives from two lists:** defined communicator, rank, shard and reduction, then worked sum all-reduce, reduce-scatter and all-gather before ring scheduling. Added the SM/block/warp/residency bridge before occupancy arithmetic.
- **C syntax and numerical contracts:** explained pointer `*`, multiplication, `+=`, headers and a two-element dot product. Qualified unsigned wraparound with integer promotions. Added required headers and function-fragment context to the allocation guard. Made the floating-point non-associativity example use `f`-suffixed literals and a rounding assumption. Used a bounded teaching grid for the grid-stride example instead of overflow-prone ceiling arithmetic, and stated the index-overflow assumption.
- **CUDA terminology and derivatives:** defined lane, global/shared memory and sectors before coalescing; defined the Kronecker delta/Jacobian in the softmax derivative.
- **Backend contracts:** clarified that the portable workbench's BF16 storage ledger is not the scalar CUDA/HIP companion's FP32 execution. Corrected the CUDA/HIP comparison diagram to include wavefronts, and made the TPU7x physical-chip versus framework-device distinction explicit.
- **Chip versus system:** distinguished die, package, node, SRAM, DRAM and HBM. Clarified that WSE-3T's 43.2 PB/s is per wafer, while the three-wafer CS-4 disclosure reports 129.6 PB/s aggregate.
- **Groq spatial organization:** the active drawing incorrectly placed a matrix unit in the center and memory at the ends. Corrected it to the paper's mirrored `MXM → SXM → MEM → VXM → MEM → SXM → MXM` organization, using a source actually inspected. Corrected matching legacy Three.js slice positions as well. Blocks remain functional summaries, not slice-count or area claims.
- **Shared tile readiness:** the matrix workbench formerly said operands were available during the load phase, before the producer barrier. It now distinguishes loaded data from data that consumers may read.
- **Exposed communication:** a one-millisecond collective with eight milliseconds of independent compute was drawn at 9–10 ms, although its producer was ready at 2 ms. The model now starts it at 2 ms and finishes at 3 ms; total step time remains 10 ms. A 12 ms collective with the same producer starts at the same 2 ms and finishes at 14 ms. Tests cover these cases and conservation of overlapped/exposed duration.

Shared findings forwarded to the integrating reviewer include the CPU primer's immediate/register mistake, GPU shared-memory/L1 distinction, first-use SM/HBM expansion, explicit FP32 A/B/C in the roofline byte count, and an LPU timetable that routed an output in the same abstract step as its activation. The integrated files were subsequently reread with those corrections present. Additional catalog findings forwarded: unsigned promotions, a three-stage picture beside the two-stage MAC implementation, word versus byte bank addresses, and a register-fragment picture whose scope should be the WMMA example rather than every Tensor Core generation.

## Reading-order findings

The local prerequisite chain is **bits and finite representations → gates and registered state → instructions and C memory → CPU control/locality → GPU logical execution → host/device lifetime and completion → occupancy/roofline → interconnects → collectives → kernel implementation and profiling**. FPGA implementation and physical design extend the digital-circuit branch; they are useful enrichment after the hardware foundations and need not interrupt every reader's GPU route.

CPU virtual-memory discussion needs a short local definition before the fuller runtime chapter. GPU chapters likewise need local expansions of SM, warp and HBM before their first architecture picture. Portable kernels and commercial accelerator comparisons belong after tensor shapes, basic GPU execution, memory lifetimes and numerical contracts. The integrating reviewer owns the final global chapter order.

## Per-lesson coverage

“Reviewed” means the complete authored lesson content was read and its equations/examples checked against the stated model. It does not mean physical measurements were reproduced. Generic catalogs and exact diagrams are detailed separately below.

### Digital logic and FPGA/ASIC

| Stable lesson ID | Paragraph, example and diagram review |
| --- | --- |
| `digital-abstraction` | Expanded analog-to-bit bridge, Boolean gates and truth table; checked voltage-range/noise-margin boundary. |
| `binary-and-signed` | Reviewed positional weights, two's complement, sign extension, unsigned carry versus signed overflow; bit-field diagram checked. |
| `full-adder-circuit` | Added derivation before equations; all 65,536 eight-bit operand pairs checked by model and RTL tests. |
| `fixed-point-rtl` | Reviewed range, scale, quantization, ties-to-even, saturation and multiplication width; exact rounding cases checked. |
| `verilog-combinational` | Read complete assignment example; reviewed blocking/nonblocking roles and latch inference. |
| `registers-and-fsm` | Read register/controller examples; checked edge update, reset and old-state nonblocking semantics. |
| `ready-valid-pipeline` | Reviewed payload stability and handshake; checked two-register-stage model, backpressure and simultaneous accept/consume. |
| `setup-hold-timing` | Expanded timing vocabulary; checked skew sign, min/max paths, uncertainty and distinct setup/hold constraints. |
| `metastability-cdc-reset` | Reviewed synchronizer limits, coherent multibit transfer and reset-release qualification. |
| `fpga-fabric-resources` | Reviewed LUT/register/DSP/memory/routing roles; synthesis mapping is appropriately conditional. |
| `rtl-simulation-synthesis` | Reviewed elaboration through timing closure; simulation does not establish routed clock performance. |
| `rtl-self-checking` | Read scoreboard/testbench examples and commands; accepted-input/output accounting and reset behavior checked. |
| `pipelined-mac-rtl` | Read imported elastic-MAC source; checked addend alignment, signed widths and stalls. Flagged generic three-stage visual mismatch to integration. |
| `fpga-memory-banking` | Added port/word-address definitions; checked four-bank collision example and replication versus capacity distinction. |
| `systolic-array-cycles` | Read PE/cycle model and RTL; 27 MACs across seven cycles and signed/reset/invalid-padding cases checked. |
| `accelerator-dataflows` | Reviewed stationary operand choices, loop mapping and remaining traffic. |
| `asic-physical-design` | Reviewed floorplan, placement, clocks, routing, extraction and signoff; no fabricated area/frequency claim. |
| `hardware-examples-and-interfaces` | Reviewed host/interface/device contracts and named interfaces; transport is not application semantics. |
| `fpga-asic-capstone` | Reviewed deliverables and evidence boundaries; physical implementation remains a reader exercise. |

### CPU and runtime

| Stable lesson ID | Paragraph, example and diagram review |
| --- | --- |
| `cpu-instructions` | Added minimal execution loop and immediate definition; checked RISC-V load/add/store example. |
| `cpu-dependencies` | Reviewed issue/complete/retire, latency/throughput and renaming; exact toy issue model checked. |
| `cpu-branches` | Reviewed speculation and architectural rollback; checked two-bit counter trace and update ordering. |
| `cpu-caches` | Added hit/miss and alignment explanations; checked set/tag/offset, fixed capacity, LRU and traffic boundary. |
| `cpu-translation` | Reviewed virtual pages, TLBs, faults and permissions; 0x234 offset and byte 52 diagram checked. |
| `cpu-load-store` | Reviewed coherence versus consistency, C atomics and one-shot release/acquire publication; diagram arrows checked. |
| `cpu-simd` | Reviewed vectorization, aliasing, tails and numerical rules; four-lane arithmetic and nineteen-element tail examples checked. |
| `cpu-coherence` | Reviewed false sharing, ownership traffic, alignment and eight-counter/512-byte padding arithmetic. |
| `cpu-cores-threads` | Reviewed software threads, contexts, cores and oversubscription; nested 8×8 pools checked. |
| `cpu-numa` | Defined acronym and topology; checked local/remote/interleaved page diagram and first-touch qualifications. |
| `cpu-measurement` | Reviewed timing/counter/assembly reasoning, repeatability and equal-work requirement. |
| `cpu-practical-lab` | Read companion kernels and commands; 4×4 0…15 example sums to 120 in both orders; native check passed. |
| `cpu-model-workloads` | Reviewed host request path and end-to-end example; 4 ms host + 6 ms device becomes 8 ms when host halves. |
| `cpu-execution` | Shared primer and all six stage-inspector texts read; immediate/register issue corrected by integration. |
| `processes-and-threads` | Reviewed process address space, thread state, scheduler and oversubscription examples. |
| `virtual-memory-and-locality` | Reviewed addresses, pages, faults and locality; clarified alignment of line-based example. |
| `device-transfer-lifetimes` | Added first-use runtime terms; checked ownership and separate-buffer overlap figure. |
| `latency-throughput-and-scaling` | Reviewed latency/throughput, Little's law assumptions and scaling/critical-path arithmetic. |

### GPU resources, racks and collectives

| Stable lesson or figure ID | Paragraph, example and diagram review |
| --- | --- |
| `machine` | GPU chapter introduction, anatomy prose, resource/memory hierarchy and comparison copy read; shared definitions corrected by integration. |
| `warp-memory` | Reviewed 32 lanes, four-byte accesses and sectors; stride 1 uses four sectors, stride 8 uses 32 and 12.5% useful-sector efficiency. |
| `occupancy-contract` | Added SM/block/warp/resident definitions; checked ideal register/shared/thread/block constraints and allocation cliff. |
| `roofline-contract` | Checked units, precision/sparsity boundary, ceilings and selected point; upper bound is not a measurement. |
| `async-execution` | Reviewed enqueue/completion and overlap conditions; no promise that asynchronous submission produces overlap. |
| `rack` | Rack overview, inventory and generation/bandwidth comparison prose read; product, rack and direction boundaries checked. |
| `hardware-photographs` | Read all captions/alt text and source attribution; compared published rack/tray component references. |
| `system-buildout` | Read all four levels and every inspector entry; counts, facility loops, management and storage roles checked. |
| `network-budget` | Checked 400 Gb/s = 50 GB/s, 1 GB/50 GB/s = 20 ms, 100 m/(2×10^8 m/s) = 0.5 μs. |
| `collective-contracts` | Added two-rank derivation and definitions; reviewed output ownership and reduction semantics. |
| `ring-allreduce` | Checked complete four-rank sequence and contributors; six stages, 48 sent bytes/rank for a 32-byte tensor. |
| `collective-topology` | Reviewed rank placement, startup terms, ring assumptions and scale-up/scale-out boundaries. |

### LPU and accelerator atlas

| Stable lesson or chapter ID | Paragraph, example and diagram review |
| --- | --- |
| `lpu` | Historical TSP, current-product disclosure and CPU/GPU/LPU comparison read; static chip timing is distinguished from API latency. |
| `lpu-schedule` | Reviewed resource timetable and data dependency; integration separated activation, routing and final write. |
| `accelerator-comparison-contract` | Added physical scale and memory terminology; reviewed workload, precision, capacity/rate/direction annotations. |
| `accelerator-memory-atlas` | Checked official specification tables with source/version boundaries; retained explicit Trainium3 documentation disagreement. |
| `accelerator-programming-models` | Corrected warp/wavefront wording; added TPU7x two-device/two-memory-space distinction; read all four SVG rows. |
| `accelerator-sram-machines` | Verified historical 220 MiB TSP and wafer disclosures; clarified CS-4 per-wafer versus three-wafer aggregate. |
| `accelerator-capacity` | Checked all controls/formulas and default ledger: 34.63 GiB weights, 10 GiB/request, three requests fit after reserve. |
| `accelerator-local-systems` | Checked dated M4 Max specification and ideal 7.33 ms weight-sweep arithmetic; shared-pool exclusions reviewed. |
| `accelerator-topology-fit` | Read every workload-table row and placement example; 8×192−8×40 = 1,216 GiB before other state. |
| `accelerator-portability-lab` | Reviewed operation contract, shape cases, reference and result-report requirements. |

### C, CUDA and portable kernels

| Stable lesson ID | Paragraph, example and diagram review |
| --- | --- |
| `c-values-bytes` | Explained dot-product syntax from zero; checked byte/type distinctions and worked 23 result. |
| `c-arithmetic-contracts` | Qualified unsigned promotions, overflow and literal types; reviewed shifts and floating-point non-associativity. |
| `c-compile-run` | Read compiler/run/error instructions and program structure; compilation, linking and execution distinguished. |
| `c-pointers-arrays` | Checked pointer arithmetic, bounds and contiguous storage; six-element/index-three diagram reviewed. |
| `tensor-strides` | Checked element versus byte strides, row-major/transpose/padding examples and live-storage requirements. |
| `c-storage-ownership` | Added allocation-fragment headers/context; reviewed overflow guard, owner/borrower and lifetime. |
| `c-debug-contract` | Reviewed reference cases, exceptional values, tolerances, bounds and sanitizers. |
| `cuda-first-launch` | Checked logical index coverage and guard, zero/ragged input, grid-stride bounds; removed unsafe illustrative ceiling arithmetic. |
| `cuda-coalescing` | Added lane/memory/sector definitions; checked sectors, useful bytes, padding and bank mapping. |
| `cuda-synchronization` | Reviewed write/barrier/read and overwrite protection; block scope and divergent barriers distinguished. |
| `cuda-reductions` | Checked eight-slot sum stages, ragged reduction and floating-point reassociation contract. |
| `cuda-stable-softmax` | Checked stable forward and derivative; added delta/Jacobian explanation and finite/nonempty-row assumptions. |
| `cuda-rmsnorm-backward` | Reviewed analytical input/weight derivatives, normalization factor and cross-row parameter reduction. |
| `cuda-complete-harness` | Read reference/sanitizer/timing instructions; GPU execution not reproduced on this CPU host. |
| `cuda-gemm-hierarchy` | Reviewed M/N/K ownership, staging, accumulators, masks and pipeline costs. |
| `cuda-tensor-cores` | Reviewed WMMA, warp/warpgroup and Tensor Memory distinctions; generic diagram scope flagged to integration. |
| `cuda-triton-compiler` | Reviewed program IDs, masks, layouts and compiler lowering; source brevity not treated as performance evidence. |
| `cuda-profile-iterate` | Reviewed trace/counter hypothesis cycle, equal work, correctness and end-to-end remeasurement. |
| `tiled-matmul` | Read full lesson and exact matrix model; checked tile tails/zero padding and both barriers; fixed premature readiness label. |
| `cuda-framework-training` | Reviewed the complete autograd-contract lesson, RMSNorm gradients and CPU versus native-extension dtype boundary. |
| `portable-matmul-contract` | Read numerical and ownership contract; separated BF16 accounting from FP32 scalar CUDA/HIP baseline. |
| `h100-kernel-example` | Read full lesson and backend data; checked 128-thread warpgroup and 12 KiB operands/32 KiB accumulators as logical budgets. |
| `mi300x-kernel-example` | Read full lesson and backend data; checked four 64-lane wavefronts per 256-thread workgroup and LDS ownership. |
| `tpu-kernel-example` | Read full lesson and backend data; checked four output tiles × two K steps = eight updates for 256-square input. |
| `trainium-kernel-example` | Read full lesson and backend data; checked [K,M] stationary operand, partition dimension and SBUF/PSUM distinction. |
| `critical-path` | Read whole lesson and trace renderer; corrected producer-ready start, tested overlap conservation and total-step maximum. |
| `profiling-protocol` | Reviewed complete profiler checklist and code excerpt, warmup and host/device timing boundaries. |
| `kernel-roofline` | Checked 2n^3 FLOPs, FP32 12n^2 minimal bytes and n/6 intensity; shared source corrected by integration. |

## Diagram inventory and exact checks

| Diagram/model family | IDs or coverage | What was actually checked |
| --- | --- | --- |
| Digital exact workbenches | `digital-bits-lab`, `fixed-point-lab`, `elastic-pipeline-lab`, `digital-timing-lab`, `digital-systolic-lab` | All renderer labels and model formulas. Adder carry/overflow, ties-to-even and saturation, handshake conservation, setup/hold skew, PE operand alignment. |
| CPU exact workbenches | `cpu-issue-lab`, `cpu-cache-lab`, `cpu-branch-lab` | Complete models and renderer data. Issue/finish/in-order retirement; fixed four-line capacity with varying associativity; two-bit predictor before/after state. |
| CPU conceptual visuals | All 13 entries in `cpu-visuals.ts`; subject variants for traversal, SIMD, publication, NUMA and translation | Every label, note, invariant and numerical miniature; no claim of a measured CPU pipeline width or latency. |
| C/GPU generic visuals | C entries in `lesson-visual-data.ts`; all `lesson-visual-hardware.ts` entries | Every hardware label/example read, including software contracts and physical-model exclusions. Specific shared mismatches forwarded as above. |
| Portable visuals | All four backend stages in `portable-kernel-data.ts` and all examples in `lesson-visual-portable.ts` | Tile shapes, byte counts, lanes, memories, dependency and baseline boundaries. |
| Accelerator capacity | `accelerator-capacity-lab`, `accelerator-math.ts` | Decimal/binary conversion, scale overhead, cache formula, reserve and floor to complete sequences. |
| GPU arithmetic labs | `cuda-math.ts`, `cuda-labs.ts`, `resource-math.ts`, `hardware-labs.ts` | Stride/sector/bank/reduction arithmetic; occupancy register cliff and roofline units. |
| Collectives | `collective-math.ts`, ring rendering in `hardware-labs.ts` | Rank membership, every contributor, reduce-scatter then all-gather, sent/received bytes and stage counts. |
| Matrix workbench | `matmul-math.ts`, `kernel-lab.ts`, `numerical-diagrams.ts` | Input/output coordinates, partial K, padding, producer/consumer barriers and final reduction. |
| Runtime/critical path | `runtimePipeline` in `notebook-figures.ts`; `trace-math.ts`, `systems-labs.ts` | Copy-before-consume, buffer remains live through last reader, communication producer readiness and critical-path length. |
| H100 drawings | `hopper-die`, `hopper-sm` | Full 144 SM topology versus enabled 132 SXM SMs; 50 MB enabled L2; five active HBM3 stacks/80 GB; four SM partitions and 65,536 registers; combined L1/shared capacity distinction. |
| AMD drawing | `mi300x` | Eight XCDs, four I/O dies, 38 enabled CUs/XCD, 304 total, eight HBM stacks; physical disabled CUs distinguished. |
| Rack drawings | `rack-front`, `tray-top` | Compared actual primary images with drawn order: two management switches; 4 power, 10 compute, 9 switch, 8 compute, 4 power. CPU/GPU, adapter, fan, front-service and liquid zones compared with source top view. |
| Groq drawing | `groq-slices` | Corrected matrix/shuffle/memory/vector spatial ordering using paper section II-B and Figure 1; functional count and modern-product exclusions retained. |
| Chip component explorers | `gpu-package`, `gpu-sm`, `lpu-slices`, `network-fabric`, `network-switch` in `chip-anatomy-data.ts` | Every component's body/watch/example, route steps and directed/control edges read. Blackwell TMEM separated from H100 registers. Network incast and fabric counts inspected as ideal models. |
| Buildout | `system`, `rack`, `tray`, `facility` views in `system-buildout.ts` | Every inspector and drawable label; 18 trays/72 GPUs/36 CPUs/18 switch chips per rack; energy/thermal/data paths distinguished. |
| Legacy Three.js | Hardware-facing strings and associated GPU/rack/LPU construction in `scenes.ts`; all `rack-detail.ts` | Reviewed teaching copy, symbolic versus physical counts, power/cooling exclusions and corrected LPU positions. Legacy 3D views were not exercised in browser; this is not an audit of every Three.js rendering operation. |

The 3×3 systolic example performs 27 multiply-accumulates with active-PE counts `1, 3, 6, 7, 6, 3, 1`; the example PE at row 2, column 1 finishes at 23. The ring example sends `2(4−1)×32/4 = 48` bytes per rank, 192 bytes over all senders. The occupancy model intentionally ignores allocation granularity beyond its declared assumptions; it is not an exact device occupancy calculator.

## Primary-source evidence

| Source | Verified claim and evidence boundary |
| --- | --- |
| [RISC-V RV32I specification](https://docs.riscv.org/reference/isa/v20240411/unpriv/rv32.html) | Register/instruction/load-store/immediate meanings. The toy sequence illustrates behavior, not exact compiler output for every C type. |
| [C11 committee draft N1570](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf) | C arithmetic, conversions, integer promotions and object-lifetime contracts; no claim that every implementation uses the lesson's byte/float widths. |
| [MIT Computation Structures, combinational logic](https://computationstructures.org/notes/combinational_logic/notes.html) | Boolean gates and the digital abstraction; physical delay is separate from a truth table. |
| [Linux memory-management concepts](https://www.kernel.org/doc/html/latest/admin-guide/mm/concepts.html) | Virtual-memory and page-fault concepts; actual placement and cache behavior depend on the system. |
| [CUDA Best Practices](https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/index.html) | Coalescing, occupancy, transfers and performance accounting. Timing claims remain illustrative unless measured. |
| [NCCL collective semantics](https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/usage/collectives.html) | All-reduce, reduce-scatter and all-gather ownership; the lesson's ring is an algorithm model rather than a guarantee of NCCL's selected algorithm. |
| [NVIDIA Hopper architecture](https://developer.nvidia.com/blog/nvidia-hopper-architecture-in-depth/) | Full die versus H100 SXM configuration and SM structure. Original announcement bandwidth numbers are not substituted for later product-sheet bandwidth. |
| [NVIDIA HGX component reference](https://docs.nvidia.com/enterprise-reference-architectures/hgx-ai-factory/latest/components.html) | H200/B200/B300 capacity and bandwidth disclosures. SKU and aggregate boundaries retained. |
| [NVIDIA Rubin architecture, July 21, 2026](https://developer.nvidia.com/blog/inside-nvidia-rubin-gpu-architecture-powering-the-era-of-agentic-ai/) | Body text specifies up to 288 GB HBM4 and 22 TB/s per GPU. This is a dated disclosure, not verification of an available cloud instance. |
| [AMD MI300X organization](https://instinct.docs.amd.com/projects/amdgpu-docs/en/docs-30.30.3/gpu-partitioning/mi300x/overview.html) | Eight XCDs/four I/O dies, 38 enabled CUs each and eight HBM stacks. |
| [AMD GPU architecture specifications](https://rocm.docs.amd.com/en/docs-7.2.3/reference/gpu-arch-specs.html) | Independent official corroboration for architecture/lane/capacity entries. The originally linked ROCm 7.2.4 workload page repeatedly returned 429 in this review, so its full prose was not freshly verified. |
| [Google TPU7x](https://docs.cloud.google.com/tpu/docs/tpu7x) | Per-chip 192 GiB, bandwidth table, two chiplets/separate memory spaces and two JAX devices per chip; chip and device units cannot be silently equated. |
| [AWS Trainium3 hardware guide](https://awsdocs-neuron.readthedocs-hosted.com/en/latest/about-neuron/arch/neuron-hardware/trainium3.html) and [NKI architecture guide](https://awsdocs-neuron.readthedocs-hosted.com/en/latest/nki/guides/architecture/trainium3_arch.html) | Hardware guide reports 4.9 TB/s; NKI guide reports 4.7 TB/s and conflicting engine counts. The disagreement is explicitly retained and no undisputed engine count invented. |
| [Groq, Answer Fast (2022)](https://arxiv.org/abs/2206.11062) | Section II-B and Figure 1 establish matrix modules outside, switching inside them, SRAM beside the central vector module. This supports the corrected first-generation drawing. |
| [Groq ISCA 2022 paper](https://www.groq.com/wp-content/uploads/2023/05/GroqISCAPaper2022_ASoftwareDefinedTensorStreamingMultiprocessorForLargeScaleMachineLearning-1.pdf) | Primary search extraction corroborates 220 MiB/TSP and compiler-scheduled distributed execution. Direct publisher PDF retrieval was inconsistent. |
| [NVIDIA Groq 3 LPX, March 16, 2026](https://developer.nvidia.com/blog/inside-nvidia-groq-3-lpx-the-low-latency-inference-accelerator-for-the-nvidia-vera-rubin-platform) | Article body reports 500 MB local SRAM, 320-byte vectors and 256 LPUs/system. Dated vendor disclosure remains distinct from historical TSP and independent performance measurement. |
| [Cerebras CS-4 announcement, August 18, 2026](https://investors.cerebras.ai/news-releases/news-release-details/cerebras-unveils-cs-4-30-times-faster-gpu-based-solutions) | Primary indexed text confirms 44 GB/900,000 cores/43.2 PB/s per WSE-3T and three wafers/129.6 PB/s per CS-4. Direct page fetch was inconsistent; primary search extraction and investor PDF corroborated the figures. No application speedup reproduced. |
| [Apple M4 Pro/M4 Max announcement](https://www.apple.com/sg/newsroom/2024/10/apple-introduces-m4-pro-and-m4-max/) | Dated up-to-128-GB/546-GB/s example corroborated by official regional announcement/specification pages. Shared SoC capacity is not wholly available to a model. |
| [Intel Gaudi 3 technical paper](https://cdrdv2-public.intel.com/817486/gaudi-3-ai-accelerator-white-paper.pdf) | HBM capacity/bandwidth and interface contract corroboration; official product slides distinguish 24×200 GbE Gaudi 3 ports from Gaudi 2's 100 GbE ports. |
| [DGX GB hardware guide](https://docs.nvidia.com/dgx/dgxgb200-user-guide/hardware.html) | Read inventory, storage/network table and cooling distinctions. Visually inspected its rack-front and compute-tray-top images against the original redrawings. |

## Verification run by this reviewer

- TypeScript: `npm run check` passed after the integrating reviewer repaired a temporary curriculum parser error during concurrent editing.
- Focused Node tests: **44 passed** across CPU models, digital logic, CUDA math, accelerator capacity, portable kernels, chip anatomy, rack layout, occupancy/collectives, tiled matmul and the new trace regression. These are mathematical/contract checks, not hardware benchmarks.
- Native C: `make -C examples/cpu check` passed: four reductions, accumulator tails, AXPY and surrounding values.
- RTL: `sh examples/rtl/run.sh` passed all four Icarus benches: 65,536 adder pairs; elastic MAC stalls/reset/signed arithmetic; dot4 bubbles/stalls/-128/reset; 1,620 systolic PE-cycle checks.
- Local server: port 4297 returned HTTP 200, but integration identified stale source content at that port. Browser launch failed with a closed context; neither check validates this worktree’s rendered page. Integration is running a separate verified-source server.

## Remaining evidence limits

CUDA/HIP kernels, PyTorch native extensions, Pallas/TPU and NKI/Trainium examples were reviewed as code and contracts, not executed on their accelerators. RTL simulation is not synthesis, place-and-route, timing closure or board validation. Modern product disclosure and independent measured performance remain different evidence classes. Legacy Three.js teaching labels were reviewed, but its dormant rendering and interactions were not exercised. Shared catalog changes and whole-page browser checks are integration responsibilities; this report records the findings rather than silently certifying those later steps.


## Follow-up: repeated conceptual plates

Read `illustration-catalog.ts`, the nine requested SVG title/description blocks, the direct `silicon-study.svg` and `systems-study.svg` geometry, and all corresponding branches in `scripts/generate-illustrations.mjs` for `memory`, `logic`, `compiler`, `tiling`, `execution`, `pipeline` and `collective`.

- `silicon-study`: the central repeated compute tiles, side memory and connecting paths match its expressly conceptual caption. No vendor configuration or capacity is encoded.
- `systems-study`: eight server groups and communication paths match the caption; no prescribed network topology or link rate is stated.
- `memory-study`: four widening storage layers match the hierarchy metaphor and explicitly exclude capacity/bandwidth/latency scale. No numerical result inferred.
- `logic-study`: found a final AND input drawn with two independent drivers (an earlier gate output and an external signal). Removed the duplicate driver and rerouted clock wiring to the drawn left-edge clock triangles. Integration updated the generator to reproduce both corrections.
- `compiler-study`: source, graph and schedule relationships match the caption. No operation values or IR semantics are claimed.
- `tiling-study`: found visibly incompatible complete matrix grids, A 8×8 and B 6×10 beside C 8×10. Changed B to eight rows, extended its bracket and routed its output around the new rows; selected two-term tile coordinates align. Integration updated the generator.
- `execution-study`: its queue/scheduler/execution/retirement arrangement is a CPU conceptual model. Integration changed the GPU chapter mapping to the silicon plate, avoiding an implication of CPU in-order retirement for GPU execution.
- `pipeline-study`: six staggered rows, hatched idle positions and forward-in-time interstage arrows match the caption; no exact F/B schedule or timing scale inferred.
- `collective-study`: eight nodes and a consistently directed ring match its caption. Four displayed chunks per node are illustrative, not the exact eight-shard reduction schedule; numerical workbenches own that contract.

These shared plate findings were sent to integration before its final rendering pass. In the final browser follow-up, the hardware reviewer rendered the corrected logic and tiling SVGs from the integrated worktree and visually checked both. Served bytes matched the files. The gate drivers and clock triangles, 8×8 / 8×10 / 8×10 grids, selected tiles and accessible descriptions agree; no label or cropping problem was found. Screenshots remain local QA artifacts under `output/playwright/`. The other hardware plates in this appendix received source-geometry and caption review.
