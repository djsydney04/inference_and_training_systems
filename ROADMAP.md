# Build roadmap

The site is developed as a series of independently verifiable vertical slices.
“Complete” means the prose, diagrams, source ledger, interactions, mobile layout,
and accessibility all agree—not merely that every heading exists.

## Verified checkpoint — 2026-09-08

The curriculum is now organized as 16 chapters with a grouped syllabus, four
prerequisite-ordered routes, keyboard search, local contents, and deep-link-aware
navigation. The eleven-entry gallery includes training and post-training alongside
hardware and inference. New material covers data contracts, token normalization,
profiling methodology, load testing, goodput, and five reviewable projects.

Three.js workbenches now include a four-partition SM teaching model, labeled
storage/execution components, layer separation, rack communication-domain steps,
and bank/tile/route detail in the LPU. Guided stages synchronize component
selection and explanatory text; each model can expand without recreating WebGL.

The token-normalization companion adds CPU gradient-equivalence tests across
unequal logical workers and accumulation microbatches. A synthetic trace teaches
overlap accounting, but the real-GPU profiler work below remains unimplemented.

The next slice adds a real `MirroredStrategy` experiment on two logical CPUs:
four accumulated updates agree with an unpartitioned reference, including both
parameter copies and optimizer-state copies. This establishes framework-level
aggregation behavior, not GPU or multi-host transport correctness.

A fourth Three.js workbench now computes tiled matrix multiplication with actual
operand values, synchronized stages, register partial sums, padding, and masked
stores. Accessible tables use the same tested model. A new CUDA SIMT companion
provides ten reference-comparison cases and sanitizer commands, but its GPU
compilation and execution remain unverified.

The earlier checkpoint added eleven deeper lessons across the existing
chapters: gradients, tiled softmax, SFT/DPO, adapters/rollouts, CPU execution,
warp memory, hardware imagery, communication budgets, paged KV, serving budgets,
and LPU scheduling. Three new stateful labs make tile statistics, memory sectors,
and cache ownership inspectable. The training-state calculator is also covered
by numerical tests.

The companion runs under TensorFlow 2.20, including a deterministic
checkpoint-resume comparison and tests for SFT/DPO/LoRA. Official GB200 images
have provenance, captions, alt text, and a viewer. Three.js selectors support
keyboard use, visible-part filtering, and responsive camera framing.

Next depth gaps, in order:

1. A reproducible profiler lab: trace CPU launch gaps, GEMMs, memory traffic,
   collectives, and the exposed critical path on an actual GPU.
2. Extend the tested logical-CPU replica loop to real accelerators, model
   sharding, collective traces, and multi-host failure injection.
3. Compile and validate the CUDA matmul companion; add backward attention,
   fused normalization, quantization calibration, and numerical error checks.
4. Exact documented topology walkthroughs and a broader, graded exercise bank.
5. Continued source refresh and claim-level review of new model releases.

These remain work to do. A build, an educational 3D view, or elapsed calendar
time does not constitute completion of the requested textbook.

## Release 0.1 — orientation and foundations

- Learning-path shell, glossary search, progress tracking, and source ledger.
- Tensor shapes, matmul, tokenization, Transformer block, residual stream.
- Interactive attention matrix: causal MHA, GQA, local/sparse, and hybrid.
- TensorFlow implementations with runnable shape assertions.

## Release 0.2 — training systems

- Data pipeline, token budget, scaling laws, optimizer state, mixed precision.
- Data/tensor/pipeline/context/expert parallelism and collective communication.
- Checkpointing, failure recovery, observability, and validation methodology.
- SFT, preference optimization, RLHF/RLVR, reward models, and evaluation.

## Release 0.3 — machine atlas

- CPU execution and memory hierarchy.
- GPU package → GPC/TPC/SM → warp scheduler/register/shared memory/tensor core.
- Three.js Blackwell-style package and SM cutaway.
- PCIe, NVLink/NVSwitch, InfiniBand/Ethernet, copper and optical signaling.
- Three.js GB200 NVL72 rack, compute tray, switch tray, power, and liquid loop.

## Release 0.4 — serving systems

- Prefill/decode arithmetic and latency/throughput tradeoffs.
- KV-cache sizing lab, PagedAttention, continuous batching, chunked prefill.
- Tensor/pipeline/expert parallel serving; prefill/decode disaggregation.
- Speculative decoding families and acceptance-rate lab.
- vLLM request lifecycle and an annotated deployment example.

## Release 0.5 — LPU and comparison

- Groq-style deterministic tensor-streaming processor cutaway.
- SRAM placement, compiler scheduling, instruction/data movement, chip-to-chip.
- Honest CPU/GPU/LPU workload comparison and bottleneck worksheet.

## Editorial and evidence standard

- Prefer papers, official code, architecture guides, and model cards.
- Date claims that can change and distinguish measurements from vendor claims.
- Redraw conceptual figures in the site’s visual language; link every redraw to
  its source rather than copying paper or vendor artwork without context.
- Give all equations symbol tables and all code samples expected tensor shapes.
- Include “what this model omits” beneath simplified diagrams.
