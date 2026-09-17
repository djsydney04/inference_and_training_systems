# Frameworks and missing implementation boundaries — September 16, 2026

The new **Popular frameworks** chapter contains fourteen lessons. Four additional
lessons extend post-training, inference, CUDA and profiling at the point where
their missing framework contracts matter. Thirteen original figures expose
responsibility, numerical values, storage and timing; ten have live controls.
The chapter is part of both the training and inference learning paths.

The goal is to connect a tool name to the computation or state it owns. This is
not a popularity ranking, universal installation recipe or measured comparison
of framework performance. Primary sources sit beside the relevant claims.

## Coverage and learning sequence

| Stable lesson anchor | Worked understanding |
| --- | --- |
| `framework-roles` | Choose among six illustrative stacks; identify tensor/model, training, serving and deployment responsibilities. |
| `framework-same-update` | Compute masked cross entropy, all six parameter derivatives and a complete SGD update from explicit arrays. |
| `framework-autodiff-state` | Compare gradient accumulation, returned gradient trees, watched variables and optimizer state. |
| `framework-tracing-boundaries` | Separate eager dispatch, derivative graphs, compiler graphs, tracing and graph breaks. |
| `framework-shapes-and-migration` | Trace a declared signature cache, then run actual CPU graph-capture and numerical contracts. |
| `framework-model-contract` | Follow architecture/configuration, tokenizer, chat template, collator and model-owned labels. |
| `framework-training-stack` | Identify Transformers, Trainer, Accelerate, PEFT, TRL, DDP/FSDP2, DeepSpeed and Megatron responsibilities. |
| `framework-distributed-objective` | Preserve one global token-mean objective through backward-helper and rank-reducer divisions. |
| `framework-adapter-artifacts` | Work through LoRA orientation, algebraic merging, wrong-base attachment, conversion and export/resume state. |
| `framework-model-artifacts` | Compare vLLM, SGLang, TensorRT-LLM, llama.cpp and MLX LM loading paths and model-format constraints. |
| `framework-api-contract` | Specify tokenization, sampling transforms, stop behavior and completion semantics before comparing servers. |
| `framework-cache-identity` | Track model/adapter/position/cache identity and ancestor-dependent complete-block reuse. |
| `framework-deployment-layers` | Separate ONNX Runtime execution providers, model servers, Ray Serve replicas and tensor-parallel ranks. |
| `framework-choice` | Choose a reproducible experiment; distinguish Lightning/Fabric abstractions and the two Triton projects. |
| `framework-label-ownership` — post-training | Inspect actual prediction pairs after one model-owned causal shift; preserve genuine EOS when padding shares its ID. |
| `framework-token-boundary` — inference | Separate messages, model tokens and decoded text chunks; prevent partial stop delimiters leaking into output. |
| `framework-cuda-replay` — CUDA | Follow capture, fixed buffer addresses, in-place input copies, replay and overwritten outputs. |
| `framework-benchmark-boundary` — profiling | Distinguish host return, device service, first result, amortized completion, prior work and cold preparation. |

The framework overview comes first, with execution, training, serving and
deployment in that order. Earlier chapters link into the corresponding deeper
lessons. Optional details fold long derivations and complete source listings;
the main explanation and worked checks remain visible. Generated chapter,
section, figure, code and check numbers retain stable fragment IDs. Seven new
glossary terms and fourteen worked-context links connect terminology to examples.

## Actual numerical and runtime evidence

### One update, multiple frameworks

The classifier uses `X=[[1,2],[2,-1],[-1,1]]`,
`W=[[0.2,-0.3],[0.4,0.1]]`, `b=[0.1,-0.2]`, targets `[0,1,0]`,
mask `[1,1,0]` and SGD learning rate `0.125`. Mean loss is
`0.7668395487183368`. The numerical tests independently differentiate a binary
cross-entropy expression and check every parameter. They also test summed loss,
masked-row invariance, repeated examples and an explicit empty-update boundary.

The native arm64 CPU companion ran with Python 3.11.5, PyTorch 2.8.0 and
JAX/jaxlib 0.6.2. Both frameworks passed five numerical cases and three graph
calls; maximum absolute discrepancy was `2.220446049250313e-16`.

- PyTorch used Dynamo with `fullgraph=True`, `dynamic=False` and a custom backend
  returning `graph_module.forward`: two captures for two shapes. This checks
  capture and differentiation through captured work, not Inductor code generation.
- JAX compiled `jax.jit(jax.value_and_grad(...))` with XLA CPU. Changing values
  reused the first specialization; changing `[3,2]` to `[6,2]` caused a new trace.
- TensorFlow 2.20.0/Keras 3.11.3 code is supplied but **was not executed** in this
  pass. Its optional installation exceeded available disk; only task-created
  temporary dependencies were cleaned up. Its expected trace counts are labeled
  as expectations, separate from the actual PyTorch/JAX results.

See [execution instructions and evidence](../examples/frameworks/execution_README.md).

### Causal labels, normalization and adapters

The label diagram has two scored targets with mean loss `0.6`. Removing every
EOS-valued target incorrectly leaves one with mean `0.4`; double shifting changes
the input/target pairs. A truncated response with no valid target skips the update.
The distributed ledger has derivative sums totaling 21 and six valid targets,
so the global mean derivative remains `3.5` under the declared helper/reducer
choices. Independent finite differences and five scalar updates check the algebra.

The rank-one adapter produces `[4.5,-0.5]` through either separate or merged
algebra. Changing the base produces `[5,-0.5]`; rounding the merged weights to an
integer grid produces `[6,0]`. A nonsquare, rank-two test independently checks
the matrix orientation. The toy artifact manifest is explicitly original and
does not claim to implement PEFT's checkpoint schema.

The actual local Transformers 4.57.1/PEFT 0.17.0 smoke check passed on native CPU
with Torch 2.8.0 and Accelerate 1.11.0 installed. It creates a seven-token local
tokenizer and random one-layer GPT-2 without Hub downloads. It verifies assistant
masks, model-owned loss against an explicit shift, every named gradient, three
SGD updates, model/tokenizer reload, changed adapter reload, FP32 merge and
merged-model reload. Final random-model loss was `1.592381`; this is a numerical
check, not evidence of learned language ability. It does not run a distributed
Accelerate, DeepSpeed, Megatron or TRL job.

See [training instructions, pins and evidence](../examples/frameworks/training_README.md).

### Stop strings and cache identity

The decoded-text reference holds a possible delimiter suffix until subsequent
characters disambiguate it. The first completed stop wins, with a longest-match
rule for simultaneous completion. Exhaustive chunk partitions, overlapping
stops and terminal flushes compare against an independent full-string oracle.
The example consumes decoded strings; byte decoding and transport framing are
separate boundaries.

The cache diagram has ten explicit token/position pairs and selectable block
sizes. It checks changed token ancestry, weights, adapters, positions, cache
format and namespace. Temperature alone does not alter this fixed model's
already-evaluated prompt KV; subsequent generated histories can still differ.
This is a computation-identity model, not a measurement of an engine's cache.

See [serving reference and evidence limits](../examples/frameworks/serving-contract-README.md).

### Timing and replay

Eight calls with 0.5 ms host launch and 4 ms device service return from the host
loop at 4 ms and complete at 32.5 ms. One call completes at 4.5 ms. Adding 80 ms
of cold host preparation and 12 ms of prior device work produces 112.5 ms total
because these initial intervals overlap. With 6 ms launches, completion is 52 ms
and the device is idle for 20 ms. The tests compare the event recurrence to the
independent closed form `max(b+n*k, p+h+k+(n-1)*max(h,k))` over 162 configurations.
The model has one host producer, one FIFO stream and zero transfer/sync overhead.

The complete [CUDA replay example](../examples/frameworks/cuda_replay.py) captures
`y=x²+1` on fixed storage, copies two fresh inputs into the recorded buffer and
clones each result before the next replay. Python syntax is checked; CUDA device
execution and timing examples remain **unexecuted** here.

## Source versions and changing framework behavior

Documentation editions and actual installed runtimes are separately labeled.
The teaching pins are not claims about the newest available release or a tested
combined distributed stack.

- [PyTorch 2.14 autograd](https://docs.pytorch.org/docs/2.14/notes/autograd.html),
  [compiler graph breaks](https://docs.pytorch.org/docs/2.14/user_guide/torch_compiler/compile/programming_model.graph_breaks_index.html)
  and [CUDA semantics](https://docs.pytorch.org/docs/2.14/notes/cuda.html).
- [JAX JIT](https://docs.jax.dev/en/latest/jit-compilation.html),
  [asynchronous dispatch](https://docs.jax.dev/en/latest/async_dispatch.html),
  [TensorFlow tracing](https://www.tensorflow.org/guide/function) and
  [Keras 3 portability](https://keras.io/guides/migrating_to_keras_3/).
- [Transformers 4.57.1 chat templates](https://huggingface.co/docs/transformers/v4.57.1/en/chat_templating),
  [Accelerate 1.11 accumulation](https://huggingface.co/docs/accelerate/v1.11.0/en/usage_guides/gradient_accumulation),
  [PEFT 0.17 checkpoints](https://huggingface.co/docs/peft/v0.17.0/en/developer_guides/checkpoint)
  and [TRL 0.24 SFT](https://huggingface.co/docs/trl/v0.24.0/en/sft_trainer).
- [vLLM 0.22](https://docs.vllm.ai/en/v0.22.0/),
  [SGLang](https://docs.sglang.ai/),
  [llama.cpp](https://github.com/ggml-org/llama.cpp) and
  [MLX LM](https://github.com/ml-explore/mlx-lm).
- The [TensorRT-LLM migration guide](https://nvidia.github.io/TensorRT-LLM/latest/legacy/tensorrt-backend-removal.html)
  and [1.2 release notes](https://nvidia.github.io/TensorRT-LLM/release-notes.html#tensorrt-llm-release-1-2)
  explicitly remove the legacy TensorRT engine backend. The lesson cites the
  migration guide's September 4, 2026 generated revision `c295dd9` and distinguishes
  this current path from older serialized-engine tutorials. No local runtime is
  inferred from the documentation.
- [ONNX Runtime](https://onnxruntime.ai/docs/get-started/with-python.html),
  [NVIDIA Triton Inference Server](https://docs.nvidia.com/deeplearning/triton-inference-server/user-guide/docs/index.html),
  [Ray Serve configuration](https://docs.ray.io/en/latest/serve/llm/user-guides/configuration.html),
  [Triton kernel language](https://triton-lang.org/main/index.html) and
  [Lightning/Fabric](https://github.com/Lightning-AI/pytorch-lightning) define
  the deployment and training abstraction boundaries.

## Integrated verification and collaboration

- **173 Node tests pass**, including 24 new framework tests: six execution,
  seven training, six serving and five timing checks.
- **14 new standard-library Python tests pass**: three execution, six training
  and five serving. All framework Python files pass syntax compilation.
- TypeScript and the production build pass. The existing bundle advisory remains:
  main JavaScript is approximately 1,339 kB minified / 447 kB gzip. This expansion
  does not establish a startup-performance improvement.
- Production inventory: **31 chapters, six learning paths, 184 sections,
  191 figures, 89 code listings, 133 worked checks, 280 source entries and
  54 optional deep dives**.
- All 34 pages pass at 1440, 1280, 820, 390 and 320 pixels: **170 page/width
  checks**, with no document overflow, duplicate IDs, missing internal targets,
  numbering errors or mismatched chapter titles.
- All six responsibility routes, execution/mask/cache controls, training label,
  reducer and adapter controls, serving stop/cache cases and timing counterexamples
  were exercised. New figures received keyboard, popout and narrow-layout checks;
  desktop/mobile screenshots were visually inspected. Independent cross-review
  found no unresolved numerical or explanatory errors in these additions.
- The incoming automatic-walkthrough requirement exposed 34 uncovered diagrams
  across this and the earlier inference/training expansions. Explicit adapters
  now advance a named comparison axis, ordered phase slider, existing simulation
  step/reset control or authored responsibility flow. No arbitrary control
  discovery, page navigation or modal opening occurs during playback. The
  coverage check advances every adapter 110 times and validates its captions and
  input bounds; it passes after this integration.

Work stayed in `/tmp/atlas-learning-clarity`, on `codex/atlas-learning-clarity`.
Implementation slices were committed separately and rebased onto concurrent
GitHub `main` through `3de391b`, preserving the incoming AI Almanac design,
navigation, 2D workbenches, diagram playback, illustrations and release metadata.
The shared checkout was never
edited, stashed or reset. See the latest [verification record](../VERIFICATION.md)
for final integrated UI-suite results and synchronization evidence.

Remaining empirical work is explicit: TensorFlow/Keras parity, CUDA replay and
timing, compiler code generation, distributed training/restart, real engine
compatibility, model quality and serving performance on the target hardware.
