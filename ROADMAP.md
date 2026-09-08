# Build roadmap

The site is developed as a series of independently verifiable vertical slices.
“Complete” means the prose, diagrams, source ledger, interactions, mobile layout,
and accessibility all agree—not merely that every heading exists.

## Verified checkpoint — 2026-09-08

The current expansion delivers eleven deeper lessons across the existing
chapters: gradients, tiled softmax, SFT/DPO, adapters/rollouts, CPU execution,
warp memory, hardware imagery, communication budgets, paged KV, serving budgets,
and LPU scheduling. Three new stateful labs make tile statistics, memory sectors,
and cache ownership inspectable. The training-state calculator is also covered
by numerical tests.

The companion now runs under TensorFlow 2.20, including a deterministic
checkpoint-resume comparison and tests for SFT/DPO/LoRA. Official GB200 images
have provenance, captions, alt text, and a viewer. Three.js selectors support
keyboard use, visible-part filtering, and responsive camera framing.

Next depth gaps, in order:

1. A reproducible profiler lab: trace CPU launch gaps, GEMMs, memory traffic,
   collectives, and the exposed critical path on an actual GPU.
2. A distributed training companion with validated global token normalization,
   sharding, collective traces, and failure injection on multiple devices.
3. Deeper kernel derivations: tiled matmul, backward attention, fused
   normalization, quantization calibration, and numerical error checks.
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
