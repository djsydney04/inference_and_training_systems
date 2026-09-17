# Inference, serving and frontier content audit

Reviewed September 16, 2026 in the isolated textbook-audit checkout. This is an editorial and executable-reference audit, not a GPU performance validation.

## Review boundary

Read every paragraph, table, equation, worked check, embedded example and native diagram in these seven modules: `decoding-content.ts`, `speculation-frontier-content.ts`, `quantization-content.ts`, `serving-runtime-content.ts`, `disaggregation-content.ts`, `moe-execution-content.ts`, and `frontier-content.ts`. The 31 stable lesson IDs below were retained. Read their six math modules, six interactive lab modules, and all five embedded Python companions. Also reviewed the attention/inference portions of `content.ts`, the FlashAttention/cache/serving portions of `textbook-content.ts`, the serving chapter in `systems-content.ts`, `interactions.ts` attention/inference controls, `textbook.ts` softmax/cache controls, and generated diagrams in `lesson-visual-serving.ts` and their renderer. Shared-file findings were sent to the integrating agent rather than edited concurrently. Also inspected the four repeated model/cache/decoding/serving study plates, their catalog descriptions, and available generator branches; all four were rendered locally for visual inspection.

The editorial test was: can a reader identify what each symbol or arrow means, reproduce one small case, and explain what is and is not established by the example? The source test separated an algebraic identity, an original hypothetical calculation, an author-reported experiment, and an engine support claim.

## Learning order

Recommended dependency order: token vectors and conditional probabilities → ordinary attention and KV reuse → sampling and exact arithmetic for quantization → ordinary request state and batching → speculative sampling and rollback → load/streaming measurements → phase disaggregation → dated frontier architecture and kernel examples. The integrated curriculum can place hardware/performance chapters between those dependent ideas; the frontier is not the introduction to attention. Cross-links preserve deeper material without making it an assumed prerequisite of a basic definition.

Added definitions and concrete explanations for prefixes, categorical draws, conditional sequence probability, probability mass and normalization; bits/codebooks/clamping and channel groups; frozen targets, distillation, hidden features and tree ancestry; requests/iterations/batches, reservations, queues and objectives; workers/replicas/pools, handoffs and acknowledgements; and latent representations, recurrent state, delta writes and quality-oriented verification.

## Exhaustive lesson review

| Stable lesson ID | What was checked | Result / intervention |
|---|---|---|
| `sampling-contract` | Stable softmax, temperature, greedy ties, top-k then top-p, target distribution contract | Added three-token scores→probabilities→uniform-interval sampling example. Kept exact filtering order; probability is not factual confidence. |
| `speculative-exactness` | q·min(1,p/q), residual repair, normalization, zero and disjoint support | Added 40%-proposal/10%-target intuition and unconditional-versus-conditional explanation. Existing rational enumeration retained. |
| `speculative-state` | Conditional sequence distribution, first rejection, causal logit ownership, pending tokens, KV rollback, EOS | Added chain-rule argument and why known proposals permit parallel scoring. Defined correction/bonus and EOS. |
| `speculation-economics` | Tail sum, baseline/round units, illustrative 2.24× and 0.84× ratios | Added elapsed-time-per-emitted-token derivation; removed implication that high acceptance is universally necessary. Constant independent acceptance remains a labelled simplifying model. |
| `modern-speculative-drafters` | EAGLE-3/3.1, sequential MTP, DFlash, DFlash 2, actual proposal law | Added hidden-vector and masked-position bridge before dated method names. Primary sources verified; author reports remain bounded. |
| `training-a-drafter` | Distillation cross-entropy, acceptance-overlap examples, feature feedback, masking, training/evaluation distinction | Defined frozen teacher and distillation before notation. Verified overlaps 0.56 and 0.95; integrated correctness separated from loss/latency. |
| `speculative-tree-attention` | Ancestry mask, logical positions, storage slots, parent-owned probabilities, accepted gather | Added parent/ancestor/sibling explanation. Redrew nodes and directed ancestry edges in pen-like SVG paths; checked slots 4,6,9. |
| `speculation-acceptance-depth` | Conditional survival, histogram denominator, censoring, aggregate cost | Added indicator-count derivation of expected accepted length. Verified 2.98 and 2.7 examples and explicit no-EOS plus-one assumption. |
| `quantization-codebook` | Affine reconstruction, round-before-zero-point semantics, ties, clipping, error bound | Added bit-pattern limitation and five-step formula reading. Source confirms nearest-even before zero point. Exact plotted value positions retained. |
| `grouped-weight-quantization` | Axis/group ownership, narrow signed range, ties, nibble packing, scale overhead | Added channel/group definitions. Checked 4.25 bits/weight, 8.5 MiB matrix, and `2f 09` packing. |
| `calibration-and-output-error` | Weight versus output MSE, second-moment geometry, calibration shift, GPTQ/AWQ/SmoothQuant, STE | Added elementary weight-error-times-activation example. Checked table and original scaling outputs; paper algorithms remain distinguished from toy implementation. |
| `quantized-kv-and-execution` | Operand/storage/accumulator types, grouped integer dot, K/V error, KIVI, target precision | Added tensor-lifetime distinctions and 0.625 integer-dot example. Checked exact attention-error expansion and local softmax approximation boundary. |
| `scheduler-iteration` | Request identity, prefill-produced first output, one transition/request/iteration, mixed token budgets | Added request/iteration/batch definitions before scheduling. Iteration index stays distinct from elapsed time. |
| `kv-admission` | S+O−1, block ceilings, stalled growth, maximum reservation, cancellation completion | Added reservation-versus-filled-state intuition. CPU model verifies live blocks release only after execution; toy deadlock is intentional. |
| `serving-arrival-model` | Open/closed arrivals, FIFO recurrence, throughput versus latency, Little's law limits | Added queue/arrival/send/start definitions. Checked eighth request's 700 ms wait and 900 ms response. |
| `streaming-metrics` | Receipt TPOT, individual gaps, terminal completion, failed attempts, goodput/window/attainment | Defined SLO and terminal result. Verified 3 completed, 2 compliant, 50% attainment and buffering tradeoff. |
| `pd-disaggregation` | Role separation versus layer sharding, replicated weights, chunking baseline, workload-bound bottlenecks | Added worker/replica/pool definitions. Preserved fixed-fleet and experimental-feature boundaries. |
| `pd-handoff` | Four cached prompt positions versus pending y0, readiness, ownership, duplicate/stale chunks | Added plain handoff/publish/acknowledgement meanings. Read and ran CPU protocol and failure tests. |
| `pd-transfer-budget` | Full-attention and MLA bytes, block padding/reuse, GB versus GiB, first-gap and TPOT, TP shards | Added smallest-object byte derivation and critical-path definition. Verified 1 GiB, 42.95 ms, 94.95 ms first gap, 20.75 ms TPOT and 288 MiB latent state. |
| `pd-capacity` | Phase-work rate division, N−1 decode outputs, min-stage bound, staging/fleet limits, research scope | Added finite-stage bottleneck explanation. Default 9 arrivals/s versus 8 completions/s cannot be a stable unlimited-admission flow. |
| `moe-route-pack-combine` | Selected gates, row-vector experts, expanded assignments, inverse scatter-add, D-transpose algebra | Defined token row versus vocabulary token and router probabilities versus sampling probabilities. Verified route list and all worked outputs. |
| `moe-ownership-capacity` | Rank ownership, traffic matrix, local/remote counts, capacity policies, dropped assignments versus tokens | Added dispatch/placement/admission distinctions. Verified 32-byte one-way traffic and unchanged aggregate traffic with changed rank imbalance. |
| `moe-router-gradients` | Expert/gate/input gradients, selected versus full softmax, router input path, Switch balance | Added upstream-derivative explanation. Finite-difference and independent dense references pass; discrete selected IDs remain fixed. |
| `frontier-map` | Mechanism/evidence classification and dependencies | Added explicit prerequisite reading route. Dated examples now follow stable definitions. |
| `frontier-mla` | Projection shapes, absorption, positional limitation, cache ratio, schematic arrows | Fixed SVG dataflow: cache feeds scoring; probabilities feed latent sum; only latent sum feeds expansion. Added rectangular-projection example yielding output 3 and distinction from arbitrary lossless compression. |
| `frontier-moe` | Active versus total parameters, architecture source, traffic units, imbalance | Defined experts/router/gates before parameter counts. Kept original logical payload versus actual network distinction. |
| `frontier-hybrid` | Recurrent dimensions, normalized denominator, finite-state collision, delta update, hybrid memory and model reports | Added running-sum analogy, complete normalized derivation, two-address example and collision example, plus separate unnormalized delta-write explanation. Redrew hybrid schematic. |
| `frontier-flash` | Online softmax prerequisite, three-resource lower bound, FA3/FA4 implementation, FP4 experiment limits | Defined kernel/tile and linked stable derivation before hardware details. Checked 2 µs lower bound and Amdahl 1.176× example; negative training evidence retained with limited scope. |
| `frontier-precision` | Floating versus uniform codebook, format layouts, scale bytes, transpose requirements | Added exponent/fraction and microscaling bridge. Independently checked 1.03125 MiB MXFP8 and 589,828-byte NVFP4 basic layout. |
| `frontier-disaggregation` | Handoff diagram, 10 GiB transfer, amortization, versioned connector limitation | Corrected off-by-one: 77 decode intervals means **78 total output tokens** when prefill supplies token one. Added directed hand-drawn handoff arrows. |
| `frontier-test-time` | Fixed weights versus extra work, coverage/selection distinction, independent candidates, state and total cost | Defined candidate/selector/verifier roles; corrected claim that coverage probability itself assumes an oracle. Oracle selection is an additional requirement to turn coverage into delivered accuracy. |

## Diagram-by-diagram review

Unnumbered figures are identified by their containing lesson and caption because generated figure numbers change with curriculum order.

| Figure / control ID or exact caption | Meaning and findings |
|---|---|
| `speculation-lab` | Probability bars are unconditional masses; residual table is conditional on rejection. All four presets, candidate support and stage boundaries checked against `speculativeMass`/`speculativeDraw`. Quantitative lengths remain exact. |
| `speculative-state`: Three proposed tokens, one rejection | P,a is valid after b rejects; d is sampled but may lack KV. Text and five-stage flow agree. |
| `sampling-contract-visual` (generated) | Logits→policy→selection is a valid dependency chain. Policy order is explicit in text. |
| `speculation-economics-visual` (generated) | Sent root correction: use emitted-token cost, and say correction **or bonus** in progress label. |
| `training-a-drafter`: From a target checkpoint to a useful draft checkpoint | Data split, supervision/masks, training, full rounds and engine check are in prerequisite order; no timing claim. |
| `speculation-tree-lab` | All seven node paths/positions/slots independently tested against causal-path attention. Pen-like outlines and explicit directed parent edges added. |
| `speculation-depth-lab` | Table compares depths 1–8; hypothetical serial/block costs and baseline 8 ms/token shown. Zero acceptance and slow draft can correctly favor no speculation. |
| `quantization-scale-lab` | Original and reconstructed markers share a true numeric axis; grid code/value meanings and MSE frequency weights agree. No jitter was added to numerical positions. |
| `quantization-matrix-lab` | Effective reconstructed weights undo channel scaling; output uses original x. Column/group labels match row/column convention and typed helper. |
| `quantized-kv-and-execution`: Follow the four precision contracts | Codes/metadata→working tile→multiply/accumulate→epilogue describes one allowed backend, not all W4A16 engines. |
| `scheduler-iteration-lab` | P counts known prompt inputs; D counts one pending decode input. Token budgets, arrival iterations and safe block release checked. |
| `kv-admission-lab` | Four-block growth stalls both requests; reservation serializes admission and completes. Cancellation is only at a completed-iteration boundary. |
| `arrival-pressure-lab` | Gray waiting and blue service have a declared millisecond axis; open/closed arrival times differ by design. |
| `delivery-metrics-lab` | All offered attempts retained; buffering trades first-token latency for smaller observed gaps without earlier completion. |
| `pd-disaggregation`: The weights stay; the request's KV moves | P/D are roles, each with executable model weights; first output is distinct from cached positions. |
| `pd-handoff`: When may the decoder read, and the sender release? | Out-of-order arrival cannot publish incomplete coverage; readiness and acknowledgement have distinct roles. |
| `pd-transfer-lab` | Bytes, overlap allowance, first gap and TPOT agree with the five-stage timeline; no hidden queue subtraction. |
| `pd-capacity-lab` | Stage capacities and offered-load ratios agree with arithmetic; no p99 prediction. |
| `moe-routing-lab` | Selected-token edges match expert gates; eight assignments reconstruct four outputs by weighted scatter-add. Replaced exact rectangular outlines with deterministic pen-like paths. |
| `moe-capacity-lab` | Kept/dropped chips use admission order, not packing order; table traffic is after capacity. Overwrite is never substituted for summation. |
| `moe-gradient-lab` | Task derivative and separate Switch top-1 auxiliary derivative clearly have different definitions; α excluded explicitly. |
| `frontier-map-visual` (generated) | Classification panels identify abstraction levels, with no quantitative capacity implication. |
| `frontier-mla`: Move a matrix through a dot product, then through a sum | Corrected two wrong connections and added arrowheads. Matrix orientation and omitted positional path are explicit. Visually checked actual rendering. |
| `frontier-moe-visual` (generated) | Fork and combine retain both selected functions; widths represent neither expert count nor traffic. |
| `frontier-hybrid`: Three compressed memories, then an addressable history | Three recurrent states plus one growing MLA cache; fixed-state layers do not imply constant total memory. Pen-like outlines and token-flow arrows added. |
| `frontier-flash-visual` (generated) | Serial dependency panels cannot by themselves demonstrate overlap; title clarification sent to root. |
| `frontier-precision-visual` (generated) | Generic 32×4-bit payload =16 bytes is correct; it is not labelled as NVFP4's 16-value scale grouping. |
| `frontier-disaggregation`: The handoff includes state and its meaning | Producer→transfer→consumer directions now explicit; metadata/compatibility and release loop remain present. |
| `frontier-test-time-visual` (generated) | Multiple candidate branches meet a selector; existence of a correct branch does not guarantee chosen-answer correctness. |
| `public/illustrations/model-study.svg` | Rebuilt the plate to remove eight misleading position-row-to-vocabulary-bar connections. All 64 causal cells retain future-column > query-row exclusion. Explicit pen-like stages now show value mixing/omitted operations, final-position vocabulary projection and softmax before an illustrative eight-token distribution totaling 100%. The generator now supports selecting one study, and the revised SVG was rendered and visually inspected. |
| `public/illustrations/cache-study.svg` | Two request lists point to the same physical page; other pages differ. Catalog correctly describes incomplete ownership/indirection, not a fully specified page table. |
| `public/illustrations/decoding-study.svg` | Selected blue edges form one connected root-to-leaf path. Branch spacing/count is conceptual, neither a probability scale nor evidence of a beam-search algorithm. |
| `public/illustrations/serving-study.svg` | Queue, three worker groups and response path match the generic catalog claim. The capstone-specific note explicitly distinguishes this overview from the companion's single admitted generation and complete JSON response. |

Also audited shared native figures: attention connectivity canvas, GLM layer tape, conceptual KDA update, Kimi paper plate, `softmax-lab`, prefill/decode phase diagram, KV calculator, vLLM request flow, original acceptance-rate sketch, paged-cache pool, serving timeline, and load/goodput generated panels. Their correction requests are listed below for integration tracking.

## Shared-file corrections sent for integration

- Sparse attention can retain all candidate KV/history and index state even when only a subset participates in the final attention sum. Its selection cost must be counted; sparse is not automatically subquadratic end to end.
- The sliding-window demo made W grow with T while discussing fixed-W scaling. The sparse selector was a periodic toy predicate rather than a trained indexer. The KDA mode put state-update markers on a query/key grid, inviting a false diagonal-only attention interpretation.
- The core inference heading overstated prefill/decode bottlenecks; prompt length/TTFT should hold cache, hardware and load fixed. Prefill emits a token that is not yet represented in KV.
- Conceptual KDA correction must depend on previous decayed state. Exact replacement requires the stated unit-key/write-strength assumptions.
- A terminal-latency TPOT exercise needs to state that completion coincides with the last token when using only first/last receipt times.
- Generated speculative cost labels need emitted tokens and correction-or-bonus; generated FlashAttention serial panels should describe dependencies rather than visually claiming measured overlap.
- The repeated model study originally connected attention-position rows directly to vocabulary bars. After integration review, the plate and its new generator branch were corrected here; root owns corresponding catalog text. Explicit intermediate stages now separate position mixing from vocabulary projection and softmax.

## Primary evidence reviewed

All references below were opened during this audit. Source availability is not a performance reproduction. Moving documentation/configuration is marked by the audit date; readers still need a pinned revision for deployment experiments.

- Sampling: [Leviathan et al.](https://arxiv.org/abs/2211.17192), [Chen et al.](https://arxiv.org/abs/2302.01318), [Transformers generation strategies](https://huggingface.co/docs/transformers/main/en/generation_strategies), [vLLM speculation documentation](https://docs.vllm.ai/en/latest/features/speculative_decoding/).
- Proposal/training mechanisms: [EAGLE-2 v1](https://arxiv.org/html/2406.16858v1), [EAGLE-3 v1](https://arxiv.org/html/2503.01840v1), [EAGLE 3.1 May 2026 announcement](https://vllm-project.github.io/2026/05/26/eagle-3-1.html), [DFlash v1](https://arxiv.org/html/2602.06036v1), [DFlash 2 August 2026 author report](https://inco.ai/blog/dflash2/), [distillation](https://arxiv.org/abs/1503.02531).
- Architecture: [DeepSeek-V3 v2](https://arxiv.org/html/2412.19437v2), [DeepSeek-V2 v5](https://arxiv.org/html/2405.04434v5), [linear attention v3](https://arxiv.org/abs/2006.16236v3), [Kimi Linear v1](https://arxiv.org/html/2510.26692v1), [Kimi K3 model summary](https://github.com/MoonshotAI/Kimi-K3), [GLM-5.3-Flash released configuration](https://huggingface.co/zai-org/GLM-5.3-Flash/raw/main/config.json).
- Experts: [Switch Transformers](https://jmlr.org/papers/v23/21-0998.html), [GShard](https://arxiv.org/abs/2006.16668), [MegaBlocks](https://arxiv.org/abs/2211.15841), together with the pinned DeepSeek-V3 routing equations.
- Quantization: [ONNX QuantizeLinear version 21](https://onnx.ai/onnx/operators/onnx__QuantizeLinear.html#quantizelinear-21), [GPTQ v2](https://arxiv.org/html/2210.17323v2), [AWQ v6](https://arxiv.org/html/2306.00978v6), [SmoothQuant v7](https://arxiv.org/html/2211.10438v7), [KIVI v2](https://arxiv.org/html/2402.02750v2), [Jacob et al. v1](https://arxiv.org/html/1712.05877v1), [straight-through estimator](https://arxiv.org/abs/1308.3432v1).
- Low precision/kernel frontier: [Transformer Engine primer](https://docs.nvidia.com/deeplearning/transformer-engine/examples/fp8_primer.html), [recipe API](https://docs.nvidia.com/deeplearning/transformer-engine/api/common.html), [FlashAttention repository](https://github.com/Dao-AILab/flash-attention), [FlashAttention-3](https://arxiv.org/abs/2407.08608), [FlashAttention-4](https://arxiv.org/abs/2603.05451), [hardware-aware FP4 FlashAttention-4](https://arxiv.org/abs/2609.04105). Format payload and scale sizes were checked against the primer; the FP4 training divergence claim is explicitly in the preprint abstract.
- Scheduling/measurement: [Little (1961)](https://doi.org/10.1287/opre.9.3.383), [Orca](https://www.usenix.org/conference/osdi22/presentation/yu), [Sarathi-Serve](https://www.usenix.org/system/files/osdi24-agrawal.pdf), [vLLM 0.22 tuning](https://docs.vllm.ai/en/v0.22.0/configuration/optimization/), [vLLM 0.22 benchmark](https://docs.vllm.ai/en/v0.22.0/cli/bench/serve/), [SLO and goodput pitfalls](https://arxiv.org/html/2410.14257v1).
- Disaggregation: [DistServe](https://www.usenix.org/system/files/osdi24-zhong-yinmin.pdf), [Splitwise v2](https://arxiv.org/html/2311.18677v2), [Mooncake](https://www.usenix.org/system/files/fast25-qin.pdf), [Prefill-as-a-Service v2](https://arxiv.org/html/2604.15039v2), [vLLM 0.22 disaggregated prefill](https://docs.vllm.ai/en/v0.22.0/features/disagg_prefill/), [NIXL backend contract](https://github.com/ai-dynamo/nixl/blob/main/docs/BackendGuide.md), [KV leases](https://docs.vllm.ai/en/latest/design/nixl_kv_cache_lease/), [NIXL compatibility](https://docs.vllm.ai/en/latest/features/nixl_connector_compatibility/), [vLLM hybrid manager](https://docs.vllm.ai/en/latest/design/hybrid_kv_cache_manager/), [vLLM 0.22 NIXL usage](https://docs.vllm.ai/en/v0.22.0/features/nixl_connector_usage/), [SGLang PD documentation](https://docs.sglang.io/docs/advanced_features/pd_disaggregation).
- Additional inference effort: [Snell et al.](https://arxiv.org/abs/2408.03314). Candidate coverage arithmetic was independently recomputed; no reported improvement was generalized to every task.

## Verification and empirical limits

- Assigned Node tests: **44 passed**, including five new checks for rectangular MLA absorption, recurrence versus explicit weighted history, delta-write conditions, memory/scale payload examples, and the corrected handoff amortization count.
- Embedded Python companions: **24 passed** (8 inference/handoff, 6 quantization, 5 MoE, 5 service trace), including independent dense/finite-difference and conditional-probability checks.
- TypeScript check passed after initial diagram integration. The integrating agent owns final full build/release/UI checks across concurrent edits.
- Local HTTP response was **200** on the audit dev server. The corrected MLA and speculative-tree figures were captured and visually inspected at `output/playwright/inference-audit-mla.png` and `output/playwright/inference-audit-tree.png`. Repeated model/cache/decoding/serving SVG plates were also rendered and visually inspected. Browser navigation/control checks encountered stale references and pending-navigation timeouts during concurrent development; those interactions are not claimed as verified here.
- No CUDA kernels, trained models, distributed transfers or offered-load GPU benchmarks were run by this audit agent. Mathematical correctness, fixed Python examples and schematic rendering do not establish production numerics, model quality, kernel speed, tail latency or hardware compatibility.
