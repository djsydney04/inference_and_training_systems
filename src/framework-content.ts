import { chapterMarkup, sourceLink as ref, workedCheck } from "./lesson-template";
import { frameworkRoutes } from "./framework-map";
import { frameworkExecutionLessons } from "./framework-execution-content";
import { frameworkTrainingLessons } from "./framework-training-content";
import { frameworkServingLessons } from "./framework-serving-content";

export const frameworkChapter = chapterMarkup("frameworks", "Popular frameworks", "", `
<section class="lesson" id="framework-roles" data-lesson="Find the right layer">
<header><span>The ecosystem</span><h3>Learn what a tool owns before learning its flags</h3></header>
<p>A <strong>framework</strong> supplies reusable machinery for writing and executing a program. In machine learning, the name can refer to very different jobs: differentiating tensors, loading a model, running a training loop, compiling kernels or scheduling generation requests. Start with the job. A model library and a serving engine can cooperate in one system while exposing very different interfaces.</p>
<p>This chapter covers commonly encountered projects by role, without a popularity or speed ranking. First compare <a href="#framework-same-update">tensor execution</a>, then <a href="#framework-model-contract">training tools</a>, and finally <a href="#framework-model-artifacts">serving engines</a>. The earlier numerical lessons explain what these abstractions must preserve.</p>
<figure class="textbook-lab fw-map" id="framework-stack-lab">
<figcaption><span>Interactive responsibility map</span><strong>Trace one concrete stack</strong><p>Choose a task. Read downward from the model or request to execution. These are responsibility layers, not a measured timeline or a universal installation recipe.</p></figcaption>
<label class="fw-control">Task<select data-fw-route>${frameworkRoutes.map(r => `<option value="${r.id}">${r.title}</option>`).join("")}</select></label>
<ol class="fw-layers" data-fw-layers></ol>
<div class="fw-proof" aria-live="polite"><span>First correctness check</span><p data-fw-proof></p></div>
<p class="figure-boundary">Original illustrative configurations. Each task has alternatives. Hardware, model architecture, dtype, software revisions and feature combinations require their own compatibility check.</p>
</figure>
<p>Keras 3 is a high-level, multi-backend API; it is not synonymous with TensorFlow. Accelerate coordinates a PyTorch training program and its selected backend. vLLM manages inference requests and model execution. llama.cpp provides a separate C/C++ inference implementation with multiple device backends. These projects occupy different boundaries.</p>
${ref("https://keras.io/getting_started/", "Keras 3 · backend choice and installation")}
${ref("https://huggingface.co/docs/accelerate/index", "Accelerate · training-loop and backend responsibilities")}
${ref("https://docs.vllm.ai/en/v0.22.0/", "vLLM 0.22.0 · inference and serving scope")}
${ref("https://github.com/ggml-org/llama.cpp", "llama.cpp · implementation and backends · checked September 16, 2026")}
${workedCheck("Does adding Accelerate replace the model's forward function?", "No. It prepares and coordinates components of a training program. The model still computes its declared function, and the loss still needs the intended labels and normalization. A shorter loop does not establish a correct objective.")}
</section>
${frameworkExecutionLessons}
${frameworkTrainingLessons}
${frameworkServingLessons}
<section class="lesson" id="framework-deployment-layers" data-lesson="Runtimes and deployment">
<header><span>Know which boundary you are changing</span><h3>A tensor runtime, a model server and a fleet have different jobs</h3></header>
<p><strong>ONNX Runtime</strong> loads a supported exported graph into an inference session and executes it through configured execution providers. An export must preserve the intended inputs, outputs and operations. A successful session run does not by itself implement token sampling, a request queue or an HTTP streaming protocol.</p>
${ref("https://onnxruntime.ai/docs/get-started/with-python.html", "ONNX Runtime · exported graphs, inference sessions and providers")}
<p><strong>NVIDIA Triton Inference Server</strong> supplies model management, request interfaces and scheduling around selected backends. Its backend can itself implement an LLM engine. <strong>Ray Serve</strong> supplies deployment and replica management; its LLM integration separates deployment settings from arguments forwarded to the inference engine. Request scheduling inside an engine and scaling engine replicas are distinct control loops.</p>
${ref("https://docs.nvidia.com/deeplearning/triton-inference-server/user-guide/docs/index.html", "NVIDIA Triton Inference Server · server/backend architecture")}
${ref("https://docs.ray.io/en/latest/serve/llm/user-guides/configuration.html", "Ray Serve LLM · deployment_config and engine_kwargs · checked September 16, 2026")}
<figure class="textbook-lab fw-map" id="framework-deployment-diagram"><figcaption><span>Original dependency diagram</span><strong>Two different meanings of more parallelism</strong><p>A replica is one complete serving instance in this example. Each instance uses two device ranks to shard a supported model.</p></figcaption>
<div class="fw-replicas"><div class="fw-router"><strong>Request router</strong><span>Choose a ready replica</span></div><div class="fw-replica-row"><div><strong>Replica A</strong><span>Engine scheduler + request KV</span><p>Rank A0 ↔ Rank A1</p></div><div><strong>Replica B</strong><span>Engine scheduler + request KV</span><p>Rank B0 ↔ Rank B1</p></div></div></div>
<p class="figure-boundary">Four devices, two complete replicas, two ranks per replica. Arrows inside a replica represent required model communication. KV is local to its replica here; no cross-replica cache transfer is assumed. This is an illustrative placement, not a deployment measurement.</p></figure>
<p>Adding a third two-rank replica needs two more devices in this placement. Increasing one replica from two ranks to four changes its sharding, collectives and memory layout. Those choices can have different effects on <a href="#pd-capacity">fleet capacity</a>. A new replica must load its model and become ready; adding desired capacity is not the same instant as receiving usable capacity.</p>
<details class="deep-dive"><summary>The two Tritons</summary><p><strong>Triton the kernel language/compiler</strong> is used to write parallel device programs. <strong>NVIDIA Triton Inference Server</strong> hosts models through backends. Writing a <code>@triton.jit</code> kernel does not create a model server, and configuring a server backend does not write a custom kernel. Follow the <a href="#cuda-triton-compiler">Triton kernel exercise</a> when the bottleneck is a device operation.</p>${ref("https://triton-lang.org/main/index.html", "Triton language · custom GPU kernels and compilation")}</details>
${workedCheck("Two replicas each use two tensor-parallel ranks. Is tensor parallelism four?", "No. In this declared placement it is two within each replica. The fleet has four device ranks total and two independent serving replicas. State their group membership rather than describing every kind of parallelism with one number.")}
</section>
<section class="lesson" id="framework-choice" data-lesson="Choose and verify a stack">
<header><span>From learning to an experiment</span><h3>Choose the smallest stack that answers your next question</h3></header>
<p>Begin with the <a href="#capstone-training">small decoder</a> and the framework whose execution model you can inspect. Add a model library when you need its architecture and tokenizer support; a training coordinator when you need its distribution or workflow; a serving engine when you need its request and cache management. Check each new boundary against the previous implementation.</p>
<p><strong>PyTorch Lightning</strong> is another training-loop abstraction: a LightningModule supplies model and training-step logic while a Trainer coordinates execution. <strong>Lightning Fabric</strong> exposes lower-level helpers when you want to retain more of a custom loop. These sit above PyTorch's tensor/autograd machinery. As with Trainer or TRL, inspect who owns backward, accumulation and optimizer stepping before porting an existing loop.</p>
${ref("https://github.com/Lightning-AI/pytorch-lightning", "Lightning · Trainer, LightningModule and Fabric responsibilities · checked September 16, 2026")}
<div class="fw-scroll" tabindex="0" aria-label="Framework selection experiments; scroll horizontally if needed"><table><caption>Mechanism → candidate → evidence to collect</caption><thead><tr><th>Next question</th><th>Candidate starting point</th><th>Required experiment</th></tr></thead><tbody>
<tr><th scope="row">Are the derivatives right?</th><td>PyTorch, JAX or TensorFlow primitives</td><td>Fixed arrays, matching dtype, finite differences and complete updates</td></tr>
<tr><th scope="row">Can fewer parameters adapt this model?</th><td>Transformers + PEFT; a suitable TRL objective</td><td>Label trace, trainable-state inventory, held-out quality and adapter reload</td></tr>
<tr><th scope="row">How can training state fit?</th><td>FSDP2 / DeepSpeed, or Megatron Core for a supported model-parallel design</td><td>Actual peak allocation, global-gradient equivalence and next-update restart</td></tr>
<tr><th scope="row">Which engine fits this workload?</th><td>Supported vLLM, SGLang or TensorRT-LLM configuration</td><td>Same model/input contract, then <a href="#streaming-metrics">quality and goodput</a> across request rates</td></tr>
<tr><th scope="row">Can the model run on this laptop?</th><td>Supported llama.cpp or MLX path</td><td>Conversion quality, full-context memory and complete response time</td></tr>
</tbody></table></div>
<h4>Record enough to repeat the result</h4>
<p>Keep the Python and package versions, source commit, model and tokenizer revisions, compiler/backend, device model, driver/runtime, precision, parallel layout and the exact command. Describe the dataset or request trace and the correctness tolerance. Pinning a model name alone leaves many of these choices unresolved.</p>
<p>Read an installation matrix as a compatibility constraint. A Python package importing successfully does not prove that the intended device backend is active. Inspect device placement and run a real operation on that backend. Custom kernels add compiler and target-architecture requirements beyond the prebuilt framework package.</p>
${ref("https://pytorch.org/get-started/locally/", "PyTorch · platform-specific installation and device verification")}
<details class="deep-dive"><summary>Separate a learning environment from a frontier configuration</summary><p>The atlas includes pinned teaching examples and newer documented framework features. Their versions may intentionally differ. Start from a tested companion's environment to reproduce its result, then change one component and repeat its contracts. Do not combine a command from an older example with current flags and call the combination verified.</p><p>Use <a href="#framework-benchmark-boundary">completed-work timing</a> to separate compilation, device work and host preparation. Then profile the same configuration under the actual workload. Kernel time, one-request latency, aggregate token throughput and service goodput answer different questions.</p></details>
${workedCheck("Two servers accept the same request JSON. What should you compare before their speed?", "Rendered input token IDs and positions, model and adapter identity, numerical precision, logits on fixed prefixes, sampling transformations, stop rules and reported completion behavior. Then measure quality and load behavior with the same workload and timing definitions.")}
</section>`);
