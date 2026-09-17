# Inference and training review — September 16, 2026

Eleven new lessons connect speculative generation, prefill/decode separation,
and asynchronous post-training. They extend three existing chapters, retain
stable anchors, and use the reader's generated section, figure and code labels.
Three gallery entries lead directly to the new working diagrams.

## Learning gaps addressed

| Lesson anchor | Concrete understanding added |
| --- | --- |
| `modern-speculative-drafters` | Separate the proposal mechanism from the verification contract; compare autoregressive, feature-based, multi-token and block proposals. |
| `training-a-drafter` | Connect teacher states, multi-step training and deployment-time acceptance; explain why draft argmax accuracy is insufficient. |
| `speculative-tree-attention` | Work through branch ancestry, logical positions, parent logits and noncontiguous KV gathering. |
| `speculation-acceptance-depth` | Derive progress from conditional survival probabilities and compare it with explicitly assumed draft/verification costs. |
| `pd-disaggregation` | Compare shared workers, chunked prefill and separate pools; account for weights in both pools. |
| `pd-handoff` | Follow prompt KV, the pending first output token, out-of-order writes, publication, acknowledgement and safe source release. |
| `pd-transfer-budget` | Calculate bytes and exposed transfer time; distinguish first-token latency, the next gap, average token pace and completion. |
| `pd-capacity` | Identify prefill, decode or fabric as the capacity bound; distinguish this bound from a latency forecast. |
| `rollout-runtime-records` | Preserve behavior probabilities, masks, versions and group identity as generation becomes training data. |
| `rollout-pipeline` | Simulate immutable actor snapshots, FIFO learning, version publication and bounded lag; expose the next bottleneck. |
| `rollout-policy-freshness` | Calculate importance ratios and both signs of PPO clipping; distinguish behavior, proximal and reference policies. |

The preceding sampling, attention, KV-cache and policy-objective lessons supply
the prerequisites. New sections link back where a formula or system contract
depends on them. Ten glossary entries supply the new vocabulary; TTFT, TPOT,
speculation and prefix reuse definitions now agree with these lessons.

## Primary-source record

Sources below were inspected for the new material on September 16, 2026.
Dates apply to this addition; they do not imply that every older chapter claim
has been rechecked. Links beside the actual lessons also enter the source ledger.

### Speculative generation

| Source | What the lesson uses | Boundary |
| --- | --- | --- |
| [EAGLE-3, v1](https://arxiv.org/html/2503.01840v1) | Feature-based draft design and training/acceptance relationship | Author's method and evaluation; no locally reproduced speedup. |
| [EAGLE 3.1, May 26, 2026](https://vllm-project.github.io/2026/05/26/eagle-3-1.html) | A newer training and serving direction | Versioned technical post; checkpoint and engine support must match. |
| [DeepSeek-V3, v2](https://arxiv.org/html/2412.19437v2#S2.SS2) | Multi-token prediction and its relationship to speculation | An auxiliary training objective is not itself a verification rule. |
| [DFlash, v1](https://arxiv.org/html/2602.06036v1), [DFlash2, August 2026](https://inco.ai/blog/dflash2/) | Block proposals and newer draft/verification integration | DFlash2 is an original-author technical post; release compatibility is not assumed. |
| [Exact speculative sampling](https://proceedings.mlr.press/v202/leviathan23a.html) | Target-distribution verification and the rollout behavior-policy contract | Exact sampling, greedy equivalence and approximate acceptance remain distinct contracts. |

The tree and acceptance labs use original small examples, not paper benchmark
data. A depth can improve expected token progress while worsening elapsed time.
The cost planner labels its draft, verifier and scheduling times as assumed.

### Prefill/decode disaggregation

| Source | What the lesson uses | Boundary |
| --- | --- | --- |
| [DistServe, OSDI 2024](https://www.usenix.org/system/files/osdi24-zhong-yinmin.pdf) | Separate scheduling/parallelism and transfer of prompt KV plus the first sampled token | Goodput and hardware placement matter; decode is not universally memory-bound. |
| [Splitwise, v2](https://arxiv.org/html/2311.18677v2) | First-to-second token gap and opportunities for layer-wise overlap | Overlap depends on an actual schedule, transport and implementation. |
| [Sarathi-Serve, OSDI 2024](https://www.usenix.org/system/files/osdi24-agrawal.pdf) | Chunked prefill as a colocated scheduling baseline | Chunking and disaggregation solve related but different scheduling constraints. |
| [Mooncake, FAST 2025](https://www.usenix.org/system/files/fast25-qin.pdf) | Cache-centric placement and request movement | Architecture discussion, not a local service deployment. |
| [vLLM 0.22.0 disaggregated prefill](https://docs.vllm.ai/en/v0.22.0/features/disagg_prefill/), [NIXL connector](https://docs.vllm.ai/en/v0.22.0/features/nixl_connector_usage/) | Experimental status, fail/recompute handling and decode interference | Documentation version is explicit; separation does not imply greater raw throughput. |
| [NIXL compatibility](https://docs.vllm.ai/en/latest/features/nixl_connector_compatibility/), [KV leases](https://docs.vllm.ai/en/latest/design/nixl_kv_cache_lease/), [backend contract](https://github.com/ai-dynamo/nixl/blob/main/docs/BackendGuide.md) | Layout/scales, compatibility limits, pinning, completion and transfer ordering | Rolling documentation as inspected; a layout hash does not prove identical model weights. |
| [SGLang disaggregation](https://docs.sglang.io/docs/advanced_features/pd_disaggregation) | Heterogeneous tensor-parallel gather/scatter | Model/state format and current implementation restrictions still apply. |
| [DeepSeek-V2, v5](https://arxiv.org/html/2405.04434v5), [hybrid cache manager](https://docs.vllm.ai/en/latest/design/hybrid_kv_cache_manager/) | Why MLA and hybrid states need their actual representation | The ordinary K-plus-V formula cannot be blindly reused for compressed/recurrent state. |
| [Prefill-as-a-Service, v2, April 2026](https://arxiv.org/html/2604.15039v2) | Pooling prefill work and accounting for transfer capacity | The cited throughput/bandwidth study uses a profile-informed model and synthetic workload; no production speedup is asserted. |

The transfer lab's default ordinary KV cache is 1 GiB. At an assumed effective
25 decimal GB/s, payload movement takes 42.95 ms, plus 2 ms of serial overhead.
The early-emission example reports TTFT 410 ms, a 94.95 ms first-to-second gap,
and 2,484.95 ms completion for 101 outputs. Late emission moves delay to TTFT;
it does not accelerate completion. Reusing all compatible blocks removes the
payload, but not the model's fixed overhead.

The fleet model uses a separate, declared workload with a 1 decimal GB transfer
per request. Its default bounds are 10 prefill, 8 decode and 25 fabric requests/s.
These are capacity calculations, not a queue simulation or p99 prediction.

### Asynchronous post-training

| Source | What the lesson uses | Boundary |
| --- | --- | --- |
| [AReaL, v1](https://arxiv.org/html/2505.24298v1) | Asynchronous collection/learning and behavior/proximal policy separation | The paper's engine versions describe its experiment, not a current installation recommendation. |
| [NeMo RL 0.7.0 async GRPO](https://docs.nvidia.com/nemo/rl/0.7.0/guides/async-grpo.html) | Weight versions and trajectory-age filtering | Framework semantics are version-specific. |
| [verl V1 trainer](https://github.com/verl-project/verl/blob/678589299a280fac2c17a8fcc03b8839d49b823c/docs/advance/v1_async_trainer.md), [rollout correction](https://github.com/verl-project/verl/blob/678589299a280fac2c17a8fcc03b8839d49b823c/docs/algo/rollout_corr.md) | Runtime modes, partial rollouts, policy correction and composition limits | Both links pin commit `678589299a280fac2c17a8fcc03b8839d49b823c`; resource switching is not assumed to compose with PD separation. |
| [PPO](https://arxiv.org/abs/1707.06347), [IMPALA](https://arxiv.org/abs/1802.01561) | Clipped ratios and off-policy correction | A scalar surrogate is not a full algorithm or a convergence guarantee. |
| [Stale but Stable, v3, July 2026](https://arxiv.org/abs/2607.18722v3) | Recent work on stale-data optimization | Claims remain scoped to the disclosed method, model and experiment. |

The original six-group schedule finishes in 78 declared seconds with strict
synchronization and 53 with one-step overlap. A threefold decrease in its decode
component produces 34 seconds. These calculations use fixed dedicated actor and
learner pools and explicitly include other work; they are not GPU measurements.
The browser recurrence and independent Python event simulation agree.

## Executed checks

- **103 Node tests pass** after integrating GitHub `main` through `b4b8801`.
  Seventeen new tests cover packed tree attention and KV gathering, conditional
  survival/cost accounting, KV transfer/timing/capacity, schedule boundaries and
  both advantage signs. Incoming render-budget and schematic tests are included.
- **8 inference Python tests pass:** four exact-sampling tests and four handoff
  tests. The handoff demo also executes to a completed ownership transfer.
- **6 rollout Python tests pass**, including publication ties, FIFO exclusion,
  lag bounds and bottleneck changes. Displayed small Python/JavaScript examples
  were executed during their lesson reviews.
- TypeScript and the production build pass. The existing bundle advisory remains;
  integrated main JavaScript is approximately 908 kB minified / 304 kB gzip.
- Production inventory: **29 chapters, 142 sections, 156 figures, 62 code
  listings, 94 checks, 199 sources and 22 deep dives**. The figure total includes
  the other agent's new schematics; it is not the number authored in this pass.
- All 31 pages at 1440, 1280, 820, 390 and 320 pixels: **155 page/width checks,
  no document overflow**. No duplicate IDs, missing internal targets, numbering
  errors or chapter-title mismatches. Advanced detail remains in disclosures.
- New lesson controls were exercised at desktop and phone widths: tree-node
  selection, cost/depth controls, handoff completion, early/late token emission,
  full prefix reuse, worker/fabric bottlenecks, policy lag and both ratio signs.
  Reviewed screenshots are under `output/playwright/`.
- After merging the shared figure tools, verified all three new lab families in
  popouts. Controls retain state, Escape restores focus, navigation restores the
  original figure, and the mobile dialog stays within its width. New glossary
  searches resolve the intended definitions. No page errors were observed.

## What this does not establish

The Python handoff uses placeholder per-position state. It has no network,
GPU events, lease clock or serializer; cancellation assumes the transport has
already drained. The rollout model has no language model, reward engine,
optimizer or distributed transport. None of these checks establish draft
checkpoint quality, accelerated verification speed, live NIXL compatibility,
GPU serving capacity, RL convergence or production reliability.

The serving lesson gives a controlled comparison matrix: colocated and split
pools, each with and without speculation, on a fixed total fleet, under the same
quality, prompt/output, cache and service constraints. Target-hardware results
are the next empirical step, and remain unclaimed here.
