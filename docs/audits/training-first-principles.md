# Training, evaluation, frameworks and capstone audit

Audit date: 2026-09-16. Working checkout: `/tmp/ai-almanac-textbook-audit`.

This is a bounded content review, not a certification of all scientific or hardware claims. I read the complete source of the 13 listed content modules, the `distributedRuntimeLesson` in `kernel-content.ts`, the shared data/post-training/project passages, the mathematical helpers and lab renderers listed below, and the executable companions embedded in these chapters. Existing dated hardware/framework execution evidence remains historical evidence unless an execution is explicitly recorded here.

## Changes and reader prerequisites

- Added the local linear approximation that explains the negative-gradient update, the meaning of stochastic sampling, moment initialization/bias correction, and the distinction between a second moment and variance.
- Qualified accumulation equivalence: fixed parameters and correct weighting are necessary, but batch-dependent computation and different random draws can still change the function.
- Derived accuracy standard error from a Bernoulli variance; defined paired sample variance and its denominator; connected nats to perplexity and tokenizer comparability.
- Derived the 16-byte Adam state recipe, every ZeRO stage's retained-state equation, the default token product and update count, and the approximate six FLOPs per dense parameter/token. Distinguished target length from raw sequence length.
- Qualified checkpoint publication as one protocol with storage-specific atomicity and durability, not a universal property of folders or file renames.
- Removed an unconditional SFT stability claim and a hard-reference-anchor implication for DPO. Expanded SFT/DPO/RLVR/RLHF names and notation, distinguished AI judges from human feedback, and made the objective rows alternative/composable signals rather than a required sequence.
- Corrected GSPO's short description to include length normalization of the sequence likelihood ratio.
- Defined rank, process group, collective, replica, shard, stage, microbatch, bubble, 1F1B, flush, DTensor and half-open intervals at their use. Added a tensor-parallel shape example, collective numerical example and explicit rank-5 group memberships.
- Added the expected-reward gradient derivation and two-response calculation before actor/learner scheduling; explained the condition on a baseline; clarified PPO clipping is a surrogate gate rather than a hard final probability constraint; defined reference KL and its direction.
- Explained Python target slicing/collators, stable logsumexp, indicator notation, autograd leaves, pytrees and optimizer slots.
- Changed adapter diagram/readout wording so identity rejection is attributed to a loader that explicitly verifies the illustrated manifest, not implied to be default PEFT behavior.
- Fixed the capstone's test-set wording; explained its raw UTF-8 vocabulary has no EOS token, fresh-context evaluation windows are not statistically independent observations, and an emitted final ID may not yet have a KV entry.

Suggested shared corrections were sent to the root agent, which owns curriculum and shared files: put conceptual hardware/collectives before distributed execution and inference before asynchronous rollout details; define raw data/padding/packing/microbatch terms; qualify loss scaling versus learning-rate equivalence; define DPO notation before its formula; initialize LoRA A nonzero/random while B starts at zero; distinguish empty local contributions from globally empty updates; remove the false implication that every adapter needs a rollout system; recommend integer target-count aggregation in large runs. Final ordering is maintained by the root agent.

## Complete lesson coverage

Each row covers all prose, formulas, checks and in-section illustrations in the named lesson. “Retained” means no substantive error was found in the inspected teaching contract, not that arbitrary production configurations were tested.

| Lesson | Review and result |
| --- | --- |
| `evaluation-generalization` | Read training/validation/test roles, leakage, split unit, weighted corpus mean, context protocol and regularization. The 10/90 example gives 1.9. Added nats/perplexity and tokenizer-comparison limits. |
| `evaluation-uncertainty` | Checked independent Bernoulli and paired comparisons, bootstrap units, repetitions and attempt budgets. Added derivations. 800/1000 SE is 1.2649 percentage points; paired 100-task example is 3.4757 points. |
| `evaluation-calibration` | Checked event definition, token confidence distinction, reliability groups, binary Brier convention, discrimination and shift. Expected scores 0.21/0.1875 and decomposition retained. |
| `optimizer-state` | Read SGD, momentum convention, quadratic example, AdamW/bias correction/epsilon and checkpoint state. Added missing derivation and stochastic meaning. First SGD point (1.84,0.04), Adam point approximately (1.92,0.92), decay 0.016 retained. |
| `clipping-order` | Counterexample, cross-shard norm, accumulation, schedule and skipped-step semantics checked. Added batch-function equivalence qualification. Global clip (0.7071,0.7071) differs from local sum (0.0513,0.3162). |
| `mixed-precision` | Format bits, spacing, FP16 underflow/overflow and BF16 rounding checked. Keras wrapper unscale/skip behavior verified against docs; heading no longer implies an unbounded newest-version claim. |
| `activation-recomputation` | Read segment dependency diagram, saved boundaries, dropout reproducibility and side effects. Retained explicit distinction from durable checkpoints and absence of measured GPU savings. |
| `training-ledgers` | All five ledgers reviewed. Added one-parameter derivation, storage protocol qualification, objective-row notation/feedback corrections and GSPO normalization. Six research-watch entries reviewed against primary sources. |
| `training-state` | All controls, static values, math/helper/render linkage checked. 16-byte retained recipe, 524288 targets/update, 1907349 updates and about 0.4861 exaFLOP-days reconcile. Added missing denominator and compute derivation. |
| `replica-update` | Read all prose, diagram, embedded evidence and complete TF script: counts [2,0] versus [6,3], count reduction, summed normalized contributions, single optimizer aggregation and empty-local participation agree. Historical TF execution retained as dated evidence. |
| `parallel-axes` | Ownership table and reference-comparison requirements reviewed; defined rank/group/collective/replica/shard before the methods. |
| `tensor-parallel-mlp` | Forward/backward shapes, local nonlinearity, shared-input derivative sum and single output bias checked against complete TF companion. Added concrete shape reading. ReLU counterexample retained. |
| `pipeline-schedules` | GPipe/1F1B diagram and dependency model read. 4 stages/8 microbatches give 22 units and 27.27% idle slots; saved-state peaks [4,3,2,1] for 1F1B agree. Defined stage/microbatch/bubble/flush and chart labels. |
| `sequence-context-experts` | Sequence versus context ownership, causal work imbalance, top-k assignment count, expert dispatch, dropping versus dropless computation and process groups reviewed; retained scoped Megatron terminology. |
| `rank-grid` | Formula, generated groups and physical-placement discussion checked. Added rank 5 coordinates and groups [4,5], [5,7], [1,5]. |
| `sharded-state-ownership` | ZeRO table, FSDP2 lifecycle and version-specific root/non-root policy checked. Added four-coordinate collective example and DTensor/module terminology. |
| `fsdp-live-memory` | All phase ordering, coexistence, controls and exclusions checked. Default 384 MiB persistent/704 MiB peak; prefetch 768 MiB; retained weights 896 MiB. Forward prefetch 18/24 ms and 28 ms with 6 ms gathers agree. |
| `sharded-optimizer-update` | Unequal local counts, SUM normalization, owner independence and AdamW coordinate checked. [0.25,0.5,0.75,1] global gradient and 0.893846154 AdamW result retained. |
| `sharded-checkpoint-reshard` | Tensor identity, chunk intersections, moments and counters, next-update recovery and floating-point topology limitations reviewed. Defined [a,b) and mesh. |
| `rollout-runtime-records` | Actor/learner arrows, cache/optimizer ownership, speculative behavior denominator, snapshot continuation and AReaL implementation versions checked. Added reward-gradient foundations before systems details. |
| `rollout-pipeline` | Six-group timeline, publication ownership, admission inequality, lag, Amdahl and saturation checked. Defaults 78 seconds serial/53 overlapped; accelerated 34 seconds retained. Pinned verl non-composability restriction checked. |
| `rollout-policy-freshness` | Per-token ratio, both signs of PPO objective, behavior/proximal/reference roles, support, truncation and full-context mismatch reviewed. Added surrogate-gating and KL definitions. NeMo age example and dated SAT research scope checked. |
| `framework-roles` | Responsibility map and every route read; Keras/TF, Accelerate, vLLM and llama.cpp roles retained. No ranking/speed claim inferred. |
| `framework-same-update` | All assigned logits, loss and derivative entries checked with independently tested classifier helper. Added logsumexp and indicator reading. Empty update handling retained. |
| `framework-autodiff-state` | Framework table, accumulation, eval/no-grad, watched variables, disconnected gradients, explicit state and checkpoint meanings reviewed. Added leaf/pytree/slot definitions. |
| `framework-tracing-boundaries` | Every selector branch and explanatory caption read: eager, first capture, reuse, tensor-dependent Python if across three frameworks. Retained graph/kernel distinction and CPU counting-backend limit. |
| `framework-shapes-and-migration` | Signature keys, six-call trace, fixed/variable batch counts 4/3, dtype/static mode, tensor orientation and Keras state lifecycle reviewed. Historical runtime evidence distinguished from docs edition. |
| `framework-label-ownership` | All mask/shift/truncation combinations and table/edges read. Added collator/slicing definitions; true EOS versus same-ID padding and model-owned shift retained. |
| `framework-model-contract` | Configuration, vocabulary meaning, tied rows, templates, local model/adapter smoke script and reload contract reviewed; no downloaded/model-quality claim added. |
| `framework-training-stack` | Complete responsibility map and runtime table reviewed. DDP does not partition data itself; wrappers do not multiply optimizers; integration constraints retained. |
| `framework-distributed-objective` | R×K/N compensation derived and checked across controls. Counts [1,2]/[0,3], derivative sums [1,5]/[0,15], final 3.5 agree. Short windows and backend-specific division caveats retained. |
| `framework-adapter-artifacts` | Column-oriented LoRA, rank/scaling, numerical merge, integer rounding and artifact table checked. Fixed implied automatic base rejection in diagram/readout. Expected [4.5,-0.5], incompatible-base [5,-0.5], rounded [6,0] retained. |
| `framework-token-boundary` | Token/template example, all stop-filter cases/chunking options, EOS/string/transport distinction and UTF-8 boundary read. Standard-library exhaustive partition tests passed. |
| `framework-model-artifacts` | Entire engine table, artifact manifest, GGUF distinction, conversion and TRT-LLM backend-removal snapshot checked against primary sources. Existing version/date qualification retained. |
| `framework-api-contract` | vLLM field limits, SGLang resolved defaults, JSON specimen, parity table, tool parsing and greedy margin bound reviewed. Δ>2ε argument retained. |
| `framework-cache-identity` | All eight controls, ten-token IDs, full-block rule, parent dependence, positions/adapters/format/namespace/temperature cases read. 8 eligible tokens with block 4; token index 3 invalidates block 0 onward. |
| `framework-deployment-layers` | Runtime/server/fleet roles, 2 replicas×2 ranks diagram, readiness and two Tritons reviewed; no four-way TP implication. |
| `framework-choice` | All candidate/evidence rows, Lightning responsibilities, reproducibility and historical/latest-version boundary read; retained scope. |
| `framework-benchmark-boundary` | Complete FIFO timing helper/table/controls and both snippets read. 8 calls complete at 32.5 ms, first result 4.5 ms; 80 ms preparation overlaps previous 12 ms. Cold/warm/amortized and multi-stream limits retained. |
| `framework-cuda-replay` | Fixed-buffer diagram, both numerical inputs/outputs, side-stream warmup and complete CUDA exercise read. Capture, replay, compilation and buckets remain distinct; still unexecuted on CUDA. |
| `capstone-contract` | Full artifact diagram, commands/defaults and architecture checked against code. Added UTF-8 byte examples and no-EOS/fixed-count behavior. |
| `capstone-forward` | Teacher-forced versus generation call counts, module modes, all tensor shapes and cached offset mask read against complete decoder. Retained prefill selects first output. |
| `capstone-training` | Complete trainer/readme claims, target shift, clipping, saved RNG and evaluation routine read. Fixed test-set and independence wording. |
| `capstone-cache` | Full/chunk/greedy contract, KV equation, 128 KiB/1 GiB examples and append costs reviewed. Added emitted-ID versus evaluated-KV distinction. |
| `capstone-profile` | Complete profiler, warmup/seven trials, equal IDs, host/device boundary and Amdahl check reviewed. No new real performance claim. |
| `capstone-http` | Complete handler/validation/admission/lifetime flow read; endpoint is unstreamed, returns raw byte IDs, one generation admitted, rejects busy with 503. Retained production extension boundary. |
| `capstone-vllm` | Both pinned 0.12.0 commands, model compatibility, sampling/measurement terminology and reproducibility list reviewed. Commands remain separate unexecuted NVIDIA/Linux exercise. |
| `capstone-assessment` | Every rubric row and oral check read; completion requires relevant measured device evidence, not merely this content audit. |
| `data-contract` (shared) | Full data pipeline, source grouping, consumed token mixture and 250M→1B repetition example read; root owns first-use glossary/flow edits. |
| `packing-loss` (shared) | All masks, equation, 1.5 versus 1.75 calculation, TF snippet and reducer semantics read. Root sent precise terminology, scaling and count-width qualifications. |
| `pretraining-experiments` (shared) | Baseline/ablation, 6ND approximation, quality/system distinction and failure reproduction read; root owns amendments. |
| `post-training-loss` (shared) | SFT alignment diagram, 0.6 versus 0.24, DPO 0.5981 calculation and full TF snippet read. Sent notation and local/global empty-batch corrections to root. |
| `adapters-rollouts` (shared) | LoRA 65536/16777216 ratio, frozen-base flow, group [1,0,1,0] advantages and records read. Sent A initialization and adapter-versus-rollout distinction to root. |
| `project-trainer` / `project-parallel` | Read each task, deliverable and oral question; recovery and equal-global-work evidence required. |
| `project-kernel` / `project-preference` / `project-serving` | Read each task/deliverable/review question; distinguish kernel microbench, preference evidence and service load envelopes. |
| `engineering-report` | Read all five report stages and employer context. Root removed the unrelated employer/career context during the audit. |

## Diagram and executable source inspection

Read in full: `training-math.ts`, `optimizer-math.ts`, `optimizer-diagram.ts`, `pipeline-math.ts`, `sharded-training-math.ts`, `rollout-training-math.ts`, `framework-map.ts`, `framework-execution-math.ts`, `framework-training-math.ts`, `framework-serving-math.ts`, and `framework-timing-math.ts`. Read every branch of the eight corresponding `*-labs.ts`/`*-lab.ts` renderers. Phase bars retain a declared time/phase scale; no arbitrary hand-drawn distortion was introduced into measured axes or mathematical contours. Root owns the shared visual treatment.

Read embedded/direct companions completely: `examples/tensorflow/{post_training,token_objective,numerical_contracts,tensor_parallel,distributed_update}.py`; `examples/frameworks/{execution_contract,training_reference,training_hf_smoke,cuda_replay,serving_contract}.py`; `examples/sharded-training/reference.py`; `examples/pytorch/{tiny_decoder,train,serve,profile_decode}.py`. Checked the relevant test expectations and reference implementations while running the tests below. The tensor examples use deliberately small counts and inputs; they do not establish arbitrary large-input numerical robustness.

## Primary-source checks

Live primary sources opened during this audit, with targeted passages inspected for the specific claims:

- [PyTorch 2.14 fully_shard](https://docs.pytorch.org/docs/2.14/distributed.fsdp.fully_shard.html): lifecycle, DTensor representation, grouping, root/non-root defaults, mixed precision, accumulation and prefetch.
- [Keras LossScaleOptimizer](https://keras.io/api/optimizers/loss_scale_optimizer/): scaled-gradient input, internal unscale and nonfinite skip.
- [Accelerate 1.11.0 accumulation](https://huggingface.co/docs/accelerate/v1.11.0/en/usage_guides/gradient_accumulation): token counts and rank/backward compensation.
- [TRL 0.24.0 SFTTrainer](https://huggingface.co/docs/trl/v0.24.0/en/sft_trainer): assistant/completion masking and template generation blocks.
- [Transformers 4.57.1 GPT-2](https://huggingface.co/docs/transformers/v4.57.1/en/model_doc/gpt2): internal shift and ignored labels.
- [TensorFlow custom distributed training](https://www.tensorflow.org/tutorials/distribute/custom_training), [tf.function](https://www.tensorflow.org/guide/function), and [JAX JIT](https://docs.jax.dev/en/latest/jit-compilation.html): aggregation and trace/control-flow contracts.
- [DPO](https://arxiv.org/abs/2305.18290), [LoRA](https://arxiv.org/abs/2106.09685), [GSPO v1](https://arxiv.org/html/2507.18071v1), and [Sutton et al. policy gradients](https://proceedings.neurips.cc/paper_files/paper/1999/hash/464d828b85b0bed98e80ade0a5c43b0f-Abstract.html): objective roles, low-rank adaptation, sequence-ratio normalization and expected-reward derivatives. The attempted author-hosted Sutton/Barto book page failed in browsing, so the new lesson link uses the primary NeurIPS paper.
- [AReaL v1](https://arxiv.org/html/2505.24298v1): SGLang 0.4.6/Megatron 0.11.0 and versioned rollouts; [NeMo RL 0.7.0](https://docs.nvidia.com/nemo/rl/0.7.0/guides/async-grpo.html): v10/v11/v12 age example; [verl pinned guide](https://github.com/verl-project/verl/blob/678589299a280fac2c17a8fcc03b8839d49b823c/docs/advance/v1_async_trainer.md): step switching excludes PD disaggregation; [Stale but Stable v3](https://arxiv.org/abs/2607.18722v3): July 24, 2026, scoped Qwen3 experiment.
- [Olmo 3](https://allenai.org/blog/olmo3), [FineWeb2](https://arxiv.org/abs/2506.20920), [Moonlight](https://github.com/MoonshotAI/Moonlight), [DAPO](https://arxiv.org/abs/2503.14476), [Kimi K3](https://github.com/MoonshotAI/Kimi-K3): dated research-watch scope, multilingual count, optimizer work and quantization from SFT onward.
- [SGLang sampling](https://docs.sglang.io/docs/basic_usage/sampling_params), [vLLM 0.22.0 serving](https://docs.vllm.ai/en/v0.22.0/serving/online_serving/), [vLLM prefix caching](https://docs.vllm.ai/en/v0.22.0/design/prefix_caching/), [GGUF specification](https://github.com/ggml-org/ggml/blob/master/docs/gguf.md), [llama.cpp server README](https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md): defaults, endpoints, prefix identity, format and numerical limits.
- [TensorRT-LLM migration](https://nvidia.github.io/TensorRT-LLM/latest/legacy/tensorrt-backend-removal.html): confirmed documented removed TensorRT engine backend and commit c295dd9 / September 4, 2026 snapshot. This is not an inferred contradiction based on the project's name.

## Executed validation

- 53 focused Node tests passed across optimizer, pipeline, training-state arithmetic, sharded training, rollout training, framework execution/training/serving and timing.
- 7 standard-library sharded-training tests passed, including finite differences, unequal counts, moments and 2→4 owner restart, malformed checkpoint rejection and payload bytes.
- 14 standard-library framework execution/training/serving tests passed, including all-parameter execution gradients, invalid masked-target rejection, label alignment, finite differences, repeated partitioned updates, adapter identity/rounding, exhaustive text-stop partitions and terminal behavior.
- 6 rollout schedule self-tests passed, including default timings, lag constraints, publication ties and both PPO advantage signs.
- An independent one-off Python arithmetic check verified weighted loss, binomial/paired standard errors, Brier examples, ZeRO bytes, global token count, KV bytes, UTF-8 example, and the exact two-response policy-gradient expectation with four baselines.
- `npm run check` passed after these edits; `git diff --check` passed at inspection time. Root performs final integrated build, browser and curriculum validation after the concurrent edits settle.

Current default Python has no TensorFlow, PyTorch, JAX or NumPy installed. Those runtime paths were inspected, not rerun here; no large installation was attempted on the nearly full shared disk. CUDA graphs, actual FSDP/NCCL, GPU serving and load sweeps remain unexecuted by this audit. Prior recorded framework results retain their original dates and versions rather than being relabeled as fresh tests.


## Shared glossary and static-visual follow-up

Read every original glossary definition and explanation, its lesson-context map and search/filter implementation. Added 17 missing first-principles terms: Parameter, Loss, Gradient, Learning rate, Optimizer, Logit, Cross-entropy, Checkpoint, Epoch, Rank, Collective, Replica, Shard, Policy, Advantage, Standard error and CUDA thread. Added links to the relevant worked lessons, including the existing Tokenizer and general Thread entries. A one-off structural check verifies unique terms and that every glossary lesson link resolves to a content ID.

Corrected these substantive glossary claims:

- Tokenization is not universally reversible: normalization and vocabulary coverage matter. Quantization calibration is now distinguished by name from probability calibration, with its search alias preserved.
- Perplexity states the logarithm base and tokenizer/target/context comparison contract. Softmax states finite-logit, mask, nonempty-row and finite-precision qualifications. Quantization permits reconstruction rules beyond affine integer scale/zero-point encodings.
- Version lag counts update age rather than bounding elapsed scheduling delay. A microbatch travels through pipeline stages rather than belonging to only one stage. Accumulation permits a larger effective batch while preserving the chosen reduction.
- Weight-decay parameter exclusions are a recipe choice. Loss scaling reduces underflow risk without repairing a corrupted forward pass. Mixed precision, larger batches, post-training and RLVR have scoped benefits rather than guaranteed improvements. RLHF does not guarantee alignment, and residual-stream shape does not guarantee numerical stability.
- Generic Register, Register file, L1 data cache, L2 cache and Thread definitions now apply to CPU study as well as CUDA. CUDA thread is a separate term. Shared memory distinguishes the operating-system and CUDA meanings.
- Prefill distinguishes uncached prompt work, chunking and queueing. KV cache includes compressed latent and bounded-window designs; MQA’s cache comparison is scoped to matched MHA/GQA/MQA configurations, following the inference auditor’s cross-review.
- CUDA Graph includes explicit construction as well as stream capture. Roofline predicts an upper bound rather than actual saturation. A GPU-aware API does not prove GPUDirect RDMA, and NVLink is not universally faster than every scale-out configuration.

Additional live primary-source checks: [Hugging Face tokenizer components](https://huggingface.co/docs/tokenizers/components) documents lowercase, accent-stripping and unknown-token distinctions; [PyTorch optimizer parameter groups](https://docs.pytorch.org/docs/2.14/optim.html#per-parameter-options) presents weight-decay exclusions as a configurable choice; [CUDA Graph creation](https://docs.nvidia.com/cuda/cuda-programming-guide/04-special-topics/cuda-graphs.html#graph-creation) documents explicit construction and stream capture. The loss-scaling qualification follows finite-precision arithmetic and the previously reviewed forward/gradient examples, rather than reading the documentation's shorthand “prevent” as an unconditional guarantee.

Read `lesson-visual-data.ts`, `lesson-visual-catalog.ts`, `lesson-subject-diagrams.ts`, `lesson-visual-titles.ts` and `lesson-diagram-renderer.ts` in full, plus all serving/capstone/project entries in `lesson-visual-serving.ts`. Reviewed all foundation/training entries against their prose and numerical examples. The matrix multiplication, probability bars, attention weighted sum, scale nesting and parallel ownership subject drawings are arithmetically consistent within their explicitly illustrative scopes. The generic hierarchy renderer uses equal rows without causal arrows, so it does not falsely imply nested process groups.

Sent these shared-source corrections to root, which owns their implementation:

| Figure | Finding and requested correction |
| --- | --- |
| `capstone-http` | Streaming, stop-token and cancellation-monitoring labels described capabilities absent from the companion. Root is changing it to validation, one-worker admission/rejection, full-response generation and lock release. |
| `capstone-forward` | “Three forward-pass modes” can be confused with train/eval module modes; use three uses of one forward pass. |
| `rank-grid` | Both examples were valid but the static figure used 16 ranks while the worked table used 8; align the toy dimensions. |
| `packing-loss` | Both examples were valid but figure and prose used different loss sums/counts; reuse the prose's 1.75 example. |
| `training-state` | Gradients and moments were both called persistent buffers although gradients may be freed between updates; describe their actual update lifetimes. |
| `mixed-precision` | “Master + compute copies” implies separate copies in every recipe; make copy/representation ownership recipe-dependent. |
| `training-ledgers` | “Checkpoint state” hides the broader update ledgers; use state across a training update. |
| `adapters-rollouts` | Root fixed the original title and notes to distinguish trainable-parameter cost from optional online rollout cost. |

These recommendations do not constitute a new visual browser check. Root performs final rendered-page inspection and integration checks after concurrent changes settle.
