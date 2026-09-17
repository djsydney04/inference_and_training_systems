# Diagram coverage audit — September 16, 2026

The rendered curriculum contains 130 named lessons. All contain a figure, diagram,
or visual lab. This pass adds 84 authored interactive schematics and the four-level
system atlas. The shared pop-out control is available on 122 figures; the 3D labs
retain their existing workbench expansion controls.

## Interaction and content

Every new schematic provides selectable components, keyboard activation, an
internal-detail toggle, an invariant and a worked note. The eight visual layouts
represent flows, branches, cycles, memory, matrices, timelines, hierarchies and
comparisons. Relationships and dependency order are conceptual, not measured
latencies, physical dimensions or performance predictions.

The system atlas separates whole-system, rack, compute-tray and facility views.
Counts share one source with the 3D rack: 18 compute trays, 9 switch trays and
8 power shelves per DGX GB200 reference rack. Hardware configuration and network
claims link to NVIDIA's June 2025 reference, including in the central source ledger.
The rack adds service faces, tray separation, and isolated power/cooling views.

Figures move into the pop-out instead of being cloned: IDs, selections and live
controls are preserved. Closing and chapter navigation restore the same element.
The close path restores synchronously so a queued close event cannot interfere
with a newly opened figure.

## Verification

- `npm test`: 87 tests passed, including the catalog and rack inventory contracts.
- `npm run build`: TypeScript and production build passed. The existing large-chunk
  warning remains; no bundle-size improvement is claimed.
- Browser audit: every one of the 84 new schematics passed keyboard selection,
  inspector-label consistency, internal-detail toggling and worked-note opening.
- All 122 figure pop-outs opened, closed with Escape and returned to their chapter.
  The full set also passed a 390px dialog-overflow check.
  Rapid chapter navigation and immediate reopening preserved the new figure.
  No duplicate DOM IDs were present after the sweep.
- All chapter pages were checked at 1440px, 390px and 320px. New diagram text fitted
  its node boundaries; narrow layouts had no document-level horizontal overflow.
  Wide diagrams retain their own horizontal scrolling surface.
- System: rack counts, path selection, keyboard drill-down, all four levels,
  inspection, modal state retention and navigation restoration passed.
- 3D rack: all five views, separation, compute-view disabling and reset passed.
- Desktop diagram and rack captures and the 390px system pop-out were inspected.
  Local screenshots are in the ignored `output/playwright/` directory.

The table records the entire named-lesson inventory. Existing specialized labs
remain intact; eligible existing figures gain the shared pop-out and reading-note
controls. A visual's presence alone is not a claim of exhaustive pedagogical review
or a substitute for the numerical tests of its associated lab.

## Lesson inventory

| Chapter | Lesson / fragment | Visual coverage |
| --- | --- | --- |
| orientation | Model, machine and system (`#systems-mental-models`) | New hierarchy schematic + inspection + worked note |
| orientation | From a scalar to a cluster (`#systems-scale-ladder`) | New hierarchy schematic + inspection + worked note |
| orientation | Pre-training and post-training (`#training-lifecycle`) | New flow schematic + inspection + worked note |
| first-principles | What a model computes (`#what-a-model-is`) | Existing diagram or visual lab |
| first-principles | Tokens and embeddings (`#tokens-and-bytes`) | New memory schematic + inspection + worked note |
| first-principles | Tensor shapes and multiplication (`#math-reading-kit`) | New matrix schematic + inspection + worked note |
| first-principles | Loss and training targets (`#probability-and-loss`) | New flow schematic + inspection + worked note |
| first-principles | A weight update (`#first-weight-update`) | Existing diagram or visual lab |
| first-principles | Attention by hand (`#attention-by-hand`) | New flow schematic + inspection + worked note |
| first-principles | Check your understanding (`#learning-practice`) | New cycle schematic + inspection + worked note |
| tensors | Loss and gradients (`#autodiff`) | New cycle schematic + inspection + worked note |
| transformer | The whole neural network (`#network-map`) | Existing diagram or visual lab |
| transformer | Trace a decoder block (`#decoder-block`) | Existing diagram or visual lab |
| transformer | Attention and the feed-forward network (`#attention-and-mlp`) | New compare schematic + inspection + worked note |
| transformer | Implement causal attention (`#attention-primitives`) | New flow schematic + inspection + worked note |
| transformer | Tokens become vectors (`#network-embeddings`) | Existing diagram or visual lab |
| transformer | Normalization and residuals (`#network-residual`) | Existing diagram or visual lab |
| transformer | Inside attention (`#network-attention`) | Existing diagram or visual lab |
| transformer | Inside the feed-forward network (`#network-feedforward`) | Existing diagram or visual lab |
| transformer | From logits to the next token (`#network-output`) | Existing diagram or visual lab |
| attention | FlashAttention, tile by tile (`#flashattention`) | Existing diagram or visual lab |
| programming | C values and types (`#c-values-bytes`) | New memory schematic + inspection + worked note |
| programming | Integer and floating-point arithmetic (`#c-arithmetic-contracts`) | New compare schematic + inspection + worked note |
| programming | Compile and run C (`#c-compile-run`) | New flow schematic + inspection + worked note |
| programming | Pointers and array bounds (`#c-pointers-arrays`) | New memory schematic + inspection + worked note |
| programming | Tensor storage and strides (`#tensor-strides`) | Existing diagram or visual lab |
| programming | Memory ownership and lifetime (`#c-storage-ownership`) | New timeline schematic + inspection + worked note |
| programming | Debugging with a reference (`#c-debug-contract`) | New compare schematic + inspection + worked note |
| data | The dataset contract (`#data-contract`) | New flow schematic + inspection + worked note |
| data | Packing and global normalization (`#packing-loss`) | New memory schematic + inspection + worked note |
| data | Compute budgets and ablations (`#pretraining-experiments`) | New compare schematic + inspection + worked note |
| optimization | SGD, momentum and AdamW (`#optimizer-state`) | Existing diagram or visual lab |
| optimization | Gradient accumulation and clipping (`#clipping-order`) | Existing diagram or visual lab |
| optimization | FP16, BF16 and loss scaling (`#mixed-precision`) | New cycle schematic + inspection + worked note |
| optimization | Activation checkpointing and recomputation (`#activation-recomputation`) | Existing diagram or visual lab |
| training | A training run is five coupled ledgers (`#training-ledgers`) | New hierarchy schematic + inspection + worked note |
| training | Model-state and token budgets (`#training-state`) | New memory schematic + inspection + worked note |
| training | Verify a real replica update (`#replica-update`) | Existing diagram or visual lab |
| parallel-training | Data, model and state partitioning (`#parallel-axes`) | New compare schematic + inspection + worked note |
| parallel-training | Tensor-parallel MLPs (`#tensor-parallel-mlp`) | Existing diagram or visual lab |
| parallel-training | Pipeline schedules (`#pipeline-schedules`) | Existing diagram or visual lab |
| parallel-training | Sequence, context and expert parallelism (`#sequence-context-experts`) | New fork schematic + inspection + worked note |
| parallel-training | Combining parallel methods (`#rank-grid`) | New hierarchy schematic + inspection + worked note |
| post-training | SFT and preference losses (`#post-training-loss`) | Existing diagram or visual lab |
| post-training | LoRA and rollout systems (`#adapters-rollouts`) | New fork schematic + inspection + worked note |
| digital-logic | Bits, transistors and wires (`#digital-abstraction`) | New hierarchy schematic + inspection + worked note |
| digital-logic | Binary and signed numbers (`#binary-and-signed`) | New memory schematic + inspection + worked note |
| digital-logic | Build a binary adder (`#full-adder-circuit`) | Existing diagram or visual lab |
| digital-logic | Fixed-point arithmetic (`#fixed-point-rtl`) | Existing diagram or visual lab |
| digital-logic | Verilog and SystemVerilog (`#verilog-combinational`) | New flow schematic + inspection + worked note |
| digital-logic | Registers and state machines (`#registers-and-fsm`) | New cycle schematic + inspection + worked note |
| digital-logic | Ready and valid handshakes (`#ready-valid-pipeline`) | Existing diagram or visual lab |
| digital-logic | Setup and hold timing (`#setup-hold-timing`) | Existing diagram or visual lab |
| digital-logic | Clock domains and reset (`#metastability-cdc-reset`) | New timeline schematic + inspection + worked note |
| fpga-asic | Inside an FPGA (`#fpga-fabric-resources`) | New hierarchy schematic + inspection + worked note |
| fpga-asic | From RTL to hardware (`#rtl-simulation-synthesis`) | New flow schematic + inspection + worked note |
| fpga-asic | Test your RTL (`#rtl-self-checking`) | New compare schematic + inspection + worked note |
| fpga-asic | Pipeline a multiply-add (`#pipelined-mac-rtl`) | New timeline schematic + inspection + worked note |
| fpga-asic | Memory banks and ports (`#fpga-memory-banking`) | New memory schematic + inspection + worked note |
| fpga-asic | Trace a systolic array (`#systolic-array-cycles`) | Existing diagram or visual lab |
| fpga-asic | Accelerator data reuse (`#accelerator-dataflows`) | New fork schematic + inspection + worked note |
| fpga-asic | ASIC physical design (`#asic-physical-design`) | New flow schematic + inspection + worked note |
| fpga-asic | Devices and interfaces (`#hardware-examples-and-interfaces`) | New hierarchy schematic + inspection + worked note |
| fpga-asic | Build a small accelerator (`#fpga-asic-capstone`) | New cycle schematic + inspection + worked note |
| machine | Inside a CPU core (`#cpu-execution`) | Existing diagram or visual lab |
| machine | Warps, registers, and memory (`#warp-memory`) | Existing diagram or visual lab |
| gpu-resources | SM residency and register allocation (`#occupancy-contract`) | Existing diagram or visual lab |
| gpu-resources | Arithmetic intensity and roofline bounds (`#roofline-contract`) | New compare schematic + inspection + worked note |
| gpu-resources | Streams, DMA and asynchronous execution (`#async-execution`) | New timeline schematic + inspection + worked note |
| cuda-kernels | Your first CUDA kernel (`#cuda-first-launch`) | New hierarchy schematic + inspection + worked note |
| cuda-kernels | Warps and memory access (`#cuda-coalescing`) | Existing diagram or visual lab |
| cuda-kernels | Synchronization and data races (`#cuda-synchronization`) | New timeline schematic + inspection + worked note |
| cuda-kernels | Parallel reductions (`#cuda-reductions`) | Existing diagram or visual lab |
| cuda-kernels | Softmax and its gradient (`#cuda-stable-softmax`) | New flow schematic + inspection + worked note |
| cuda-kernels | RMSNorm and parameter gradients (`#cuda-rmsnorm-backward`) | Existing diagram or visual lab |
| cuda-kernels | Build and test CUDA (`#cuda-complete-harness`) | New cycle schematic + inspection + worked note |
| cuda-kernels | Matrix multiplication tiling (`#cuda-gemm-hierarchy`) | Existing diagram or visual lab |
| cuda-kernels | Tensor Core instructions (`#cuda-tensor-cores`) | New matrix schematic + inspection + worked note |
| cuda-kernels | Triton and generated code (`#cuda-triton-compiler`) | New flow schematic + inspection + worked note |
| cuda-kernels | Profile and improve kernels (`#cuda-profile-iterate`) | New cycle schematic + inspection + worked note |
| cuda-kernels | Custom kernels in training (`#cuda-framework-training`) | Existing diagram or visual lab |
| rack | Build the complete system (`#system-buildout`) | New four-level system atlas |
| rack | Read the real hardware (`#hardware-photographs`) | Existing diagram or visual lab |
| rack | Fiber and communication budgets (`#network-budget`) | New flow schematic + inspection + worked note |
| collectives | Collective operations (`#collective-contracts`) | New compare schematic + inspection + worked note |
| collectives | Ring all-reduce, fragment by fragment (`#ring-allreduce`) | Existing diagram or visual lab |
| collectives | Rank placement, scale-up and scale-out (`#collective-topology`) | New hierarchy schematic + inspection + worked note |
| lpu | A compiler owns the timetable (`#lpu-schedule`) | Existing diagram or visual lab |
| accelerator-atlas | How to compare accelerators (`#accelerator-comparison-contract`) | New compare schematic + inspection + worked note |
| accelerator-atlas | Memory and peak specifications (`#accelerator-memory-atlas`) | New hierarchy schematic + inspection + worked note |
| accelerator-atlas | Programming models (`#accelerator-programming-models`) | Existing diagram or visual lab |
| accelerator-atlas | SRAM streaming and wafer-scale systems (`#accelerator-sram-machines`) | New memory schematic + inspection + worked note |
| accelerator-atlas | Interactive model residency and KV budgets (`#accelerator-capacity`) | Existing diagram or visual lab |
| accelerator-atlas | CPUs and edge devices (`#accelerator-local-systems`) | New hierarchy schematic + inspection + worked note |
| accelerator-atlas | Matching hardware to workloads (`#accelerator-topology-fit`) | New compare schematic + inspection + worked note |
| accelerator-atlas | Porting an operation (`#accelerator-portability-lab`) | New compare schematic + inspection + worked note |
| performance | Exposed versus overlapped work (`#critical-path`) | Existing diagram or visual lab |
| performance | A reproducible profiling protocol (`#profiling-protocol`) | New cycle schematic + inspection + worked note |
| performance | Tiling, bandwidth and correctness (`#kernel-roofline`) | New matrix schematic + inspection + worked note |
| performance | A matrix tile, instruction by instruction (`#tiled-matmul`) | Existing diagram or visual lab |
| inference | Paged KV memory (`#paged-kv`) | Existing diagram or visual lab |
| inference | Serving latency and quantization (`#serving-budgets`) | New timeline schematic + inspection + worked note |
| decoding | Greedy, temperature, top-k and top-p (`#sampling-contract`) | New flow schematic + inspection + worked note |
| decoding | Exact speculative sampling (`#speculative-exactness`) | Existing diagram or visual lab |
| decoding | Verification and cache rollback (`#speculative-state`) | Existing diagram or visual lab |
| decoding | Speculation cost and method selection (`#speculation-economics`) | New compare schematic + inspection + worked note |
| serving-lab | Latency, throughput and batching (`#load-test`) | New timeline schematic + inspection + worked note |
| serving-lab | Goodput, cost and overload (`#goodput-cost`) | New compare schematic + inspection + worked note |
| frontier | A map of frontier mechanisms (`#frontier-map`) | New hierarchy schematic + inspection + worked note |
| frontier | Latent attention (`#frontier-mla`) | Existing diagram or visual lab |
| frontier | Mixture of experts (`#frontier-moe`) | New fork schematic + inspection + worked note |
| frontier | Linear and hybrid attention (`#frontier-hybrid`) | Existing diagram or visual lab |
| frontier | FlashAttention-3 and FlashAttention-4 (`#frontier-flash`) | New timeline schematic + inspection + worked note |
| frontier | Microscaling, FP4 and numerical contracts (`#frontier-precision`) | New memory schematic + inspection + worked note |
| frontier | Separating prefill and decode (`#frontier-disaggregation`) | Existing diagram or visual lab |
| frontier | Test-time compute (`#frontier-test-time`) | New fork schematic + inspection + worked note |
| end-to-end | The complete experiment (`#capstone-contract`) | Existing diagram or visual lab |
| end-to-end | Training, validation and generation (`#capstone-forward`) | New cycle schematic + inspection + worked note |
| end-to-end | Training and validation checks (`#capstone-training`) | New compare schematic + inspection + worked note |
| end-to-end | Cache correctness and memory (`#capstone-cache`) | New compare schematic + inspection + worked note |
| end-to-end | Profiling and equal-work comparisons (`#capstone-profile`) | New compare schematic + inspection + worked note |
| end-to-end | Serving over HTTP (`#capstone-http`) | New cycle schematic + inspection + worked note |
| end-to-end | GPU serving with vLLM (`#capstone-vllm`) | New hierarchy schematic + inspection + worked note |
| end-to-end | Final engineering assessment (`#capstone-assessment`) | New hierarchy schematic + inspection + worked note |
| projects | A trainer that resumes correctly (`#project-trainer`) | New cycle schematic + inspection + worked note |
| projects | One model, multiple workers (`#project-parallel`) | New compare schematic + inspection + worked note |
| projects | A kernel with a correctness envelope (`#project-kernel`) | New cycle schematic + inspection + worked note |
| projects | A post-training result you can audit (`#project-preference`) | New flow schematic + inspection + worked note |
| projects | A serving envelope, not a peak number (`#project-serving`) | New compare schematic + inspection + worked note |
| projects | Write an engineering report (`#engineering-report`) | New flow schematic + inspection + worked note |
