const reading = (href: string, text: string) =>
  `<a class="lesson-source" href="${href}" target="_blank" rel="noreferrer">${text}</a>`;
const exercise = (question: string, answer: string) =>
  `<details class="knowledge-check"><summary>${question}</summary><p>${answer}</p></details>`;
const chapter = (id: string, title: string, intro: string, body: string) =>
  `<section class="chapter" id="${id}" data-chapter="${title}"><div class="chapter-number"></div><div class="chapter-title"><p class="chapter-kicker">Systems practice</p><h2>${title}</h2><p class="chapter-summary">${intro}</p></div>${body}</section>`;

export const dataChapter = chapter(
  "data",
  "The training run begins before the first GPU step",
  "A reproducible model starts with a reproducible data contract. Design the experiment, its data, and its failure semantics together.",
  `
<section class="lesson" id="data-contract" data-lesson="The dataset contract"><header><span>Data engineering</span><h3>A dataset is a versioned procedure, not a directory</h3></header>
<p>A training sample depends on source acquisition, licensing, extraction, filtering, deduplication, tokenization, mixture sampling, and packing. If any of those change, the effective training distribution can change. Store an immutable manifest that identifies both the source objects and the transformations. A directory called “clean-data” cannot explain a regression six weeks later.</p>
<div class="data-contract-flow"><span>Source objects<small>origin, rights, hashes</small></span><i>→</i><span>Transformations<small>versions, thresholds</small></span><i>→</i><span>Token shards<small>tokenizer, counts</small></span><i>→</i><span>Sample stream<small>mixture, cursor, packing</small></span></div>
<p>Deduplicate before assigning closely related documents to train and evaluation splits. Otherwise near copies can make evaluation look easier than it is. Exact hashing catches identical normalized documents; approximate methods catch some near duplicates, with false positives and false negatives that need inspection. Decide whether repeated boilerplate, repeated code, and repeated mathematical facts should be treated alike.</p>
<h4>Make the token mixture explicit</h4><p>Suppose an experiment draws 70% of prediction targets from general text, 20% from code, and 10% from mathematics. This is a token-level sampling specification, not a statement about file counts. A long document and a short document contribute different amounts of optimization signal. Report the mixture actually consumed, not just the weights requested from a sampler.</p>
<p>A 10-billion-token run with that mixture targets 7B general, 2B code, and 1B math tokens. If a domain has only 250M eligible tokens, obtaining 1B domain tokens entails four effective passes on average, under uniform coverage. Repetition, ordering, curriculum and replacement policies now become experimental variables.</p>
${exercise("Design check: a shard fails to load. May a worker silently sample a replacement?", "Only if that behavior is part of the declared sampling and resumption contract. Silent substitution can change the distribution and cause different ranks to consume different numbers of targets. Record the failure and replacement, preserve collective progress, and make restart behavior reproducible.")}
${reading("https://arxiv.org/abs/2506.20920", "FineWeb2: source-specific filtering and multilingual data ablations")}
</section>
<section class="lesson" id="packing-loss" data-lesson="Packing and global normalization"><header><span>Objective accounting</span><h3>Count the targets that actually train the model</h3></header>
<p>Sequence packing improves utilization by placing several examples into a fixed context window. It also defines boundaries. You must choose whether attention can cross documents, how position indices behave, where end-of-document tokens appear, and which targets are valid. A packed tensor of shape [B, T] does not answer these questions.</p>
<p>For variable-length examples, define the global token-mean objective as <code>L = Σᵣ Σₜ mᵣₜ ℓᵣₜ / Σᵣ Σₜ mᵣₜ</code>. Here r ranges over workers, t over target positions, m is the valid-target mask, and ℓ is token cross entropy. The denominator is the global valid-target count, not the nominal padded shape.</p>
<div class="derivation"><h4>Why averaging local means can be wrong</h4><p>Worker A has two valid targets whose losses sum to 2. Worker B has six whose losses sum to 12. Averaging their local means gives <code>(1 + 2) / 2 = 1.5</code>. The global token mean is <code>(2 + 12) / (2 + 6) = 1.75</code>.</p><p>With summed gradient reduction, differentiate each local loss sum divided by the same global count. If the runtime averages gradients over R ranks instead, multiply that local contribution by R. Confirm the reducer’s semantics; a second accidental division changes the effective learning rate.</p></div>
<p>Gradient accumulation adds another scope: all microbatches in an optimizer update. Equal-sized microbatches can use an equal weighting. Unequal valid-target counts require token weighting across the entire update. The companion example avoids this complication by using equal-length, unpadded synthetic sequences; that simplifying assumption must not migrate silently into a variable-length trainer.</p>
<div class="lesson-code"><div><h4>Make the reduction contract executable</h4></div><pre><code>from token_objective import token_statistics, local_contribution

# Count valid targets across ALL workers and accumulation microbatches.
# global_count is shared by every contribution in this optimizer update.
with tf.GradientTape() as tape:
    logits = model(tokens)  # [B, T, V]
    loss_sum, local_count = token_statistics(logits, labels, valid_mask)
    loss = local_contribution(loss_sum, global_count,
                              replicas=world_size, reducer="sum")
grads = tape.gradient(loss, model.trainable_variables)
# Sum these microbatch gradients. Then apply the specified worker reducer.
# Do not divide again by the number of accumulation microbatches.</code></pre></div>
<p>The companion test partitions the same batch across two logical workers and two microbatches each, including an all-padding local microbatch. Both summed and averaged worker reducers recover the unpartitioned gradient. This checks the weighting algebra on CPU; it does not launch distributed workers or validate collective transport. An entirely masked global update is rejected.</p>
${reading("https://github.com/djsydney04/inference_and_training_systems/blob/main/examples/tensorflow/token_objective.py", "Companion: token statistics and reducer-aware loss scaling")}
${reading("https://www.tensorflow.org/tutorials/distribute/custom_training", "TensorFlow: loss scaling in a custom distributed loop")}
</section>
<section class="lesson" id="pretraining-experiments" data-lesson="Compute budgets and ablations"><header><span>Experimental design</span><h3>Spend a small run on a falsifiable question</h3></header>
<p>Start with a baseline that completes reliably. Change one hypothesis-bearing component: a filter, a mixture, a precision mode, an optimizer, or a parallel layout. Keep a run manifest covering code revision, configuration, seed policy, dataset version, tokenizer, devices, and evaluation protocol. Compare equal token budgets when asking about sample efficiency and equal compute budgets when asking about compute efficiency.</p>
<p>The rough dense-decoder estimate <code>training FLOPs ≈ 6ND</code> relates parameter count N and training tokens D. It is a planning approximation. Attention at long context, activation recomputation, sparse routing, embeddings and different architectures change the accounting. A compute-optimal model/token balance is conditional on the cost model and experiment; deployment economics can justify training a smaller model for more tokens.</p>
<h4>Separate three kinds of evidence</h4><p><strong>Optimization:</strong> held-out loss, gradient behavior and numerical stability. <strong>Capability:</strong> task performance under a fixed evaluation protocol. <strong>Systems:</strong> throughput, utilization, availability and recovery cost. A faster run that silently changes the target mask is not an efficiency improvement to the same experiment.</p>
<p>For a loss spike, first preserve the failing batch and run state. Check data anomalies, targets, loss scaling, gradient norms, learning rate and rank-local nonfinite values. Reproduce on the smallest configuration that preserves the failure. The ability to explain a failure and design a discriminating experiment matters more than having a long list of tuning knobs.</p>
${reading("https://arxiv.org/abs/2203.15556", "Chinchilla: parameter and token allocation under a compute budget")}
${exercise("Engineering exercise: compare two data mixtures without confusing quality with throughput.", "Fix the model, tokenizer, target count, optimization recipe and held-out suite. Record consumed-domain counts and data-loading time. Run repeated seeds where affordable and report variability. If one pipeline is faster, report that separately from the quality comparison; then design a second equal-wall-time experiment if operational cost is the question.")}
</section>`,
);

export const performanceChapter = chapter(
  "performance",
  "A performance claim needs a trace",
  "Predict the bottleneck, measure the critical path, change one mechanism, and verify both correctness and the end-to-end effect.",
  `
<section class="lesson" id="critical-path" data-lesson="Exposed versus overlapped work"><header><span>Performance reasoning</span><h3>Busy time is not necessarily time you can remove</h3></header>
<p>A step completes when all required dependencies complete. Two operations that overlap do not contribute their full durations to wall time. Conversely, a small CPU delay before a GPU launch may be completely exposed. Summing kernel durations or staring at average utilization does not reconstruct the critical path.</p>
<figure class="textbook-lab trace-lab"><figcaption><span>Interactive trace</span><strong>When does communication stop delaying the update?</strong><p>Two milliseconds of input work precede eight milliseconds of GPU compute. Change how much independent compute is available after the collective is ready.</p></figcaption><div class="trace-inputs"><label>Collective duration <input data-trace-communication type="range" min="1" max="12" step="1" value="4" /><output data-trace-communication-value>4 ms</output></label><label>Independent compute to overlap <input data-trace-overlap type="range" min="0" max="8" step="1" value="0" /><output data-trace-overlap-value>0 ms</output></label></div><div data-critical-trace class="critical-trace"></div><div class="trace-results" aria-live="polite"><div><span>Step time</span><strong data-trace-step></strong></div><div><span>Exposed communication</span><strong data-trace-exposed></strong></div><div><span>Speedup vs serial</span><strong data-trace-speedup></strong></div></div><p class="figure-boundary">Synthetic dependency model, not a captured benchmark. It assumes compute and communication can coexist without contention, an optimistic simplification. Real collectives consume device resources and may slow concurrent kernels.</p></figure>
<p>Useful overlap needs both dependency readiness and spare execution resources. Launching a collective on another stream does not manufacture independent work. Buffer lifetime, synchronization, stream dependencies, network paths, and communication kernels can all limit overlap. The trace should show why an operation was eligible to start where it did.</p>
${exercise("Worked check: a 4 ms collective overlaps the final 3 ms of an 8 ms compute region. Input costs 2 ms. What is the step time?", "The collective has 1 ms left after compute. Total time is 2 + 8 + 1 = 11 ms, compared with 14 ms when serialized. A 4 ms kernel improvement in a region entirely hidden behind a longer dependency would not necessarily produce a 4 ms step improvement.")}
</section>
<section class="lesson" id="profiling-protocol" data-lesson="A reproducible profiling protocol"><header><span>From instrument to evidence</span><h3>Start with the timeline, then inspect the kernel</h3></header>
<p>Warm up compilation, memory pools and representative execution paths before recording steady-state measurements. Delimit a short region with known work. Record model shape, precision, device, driver, runtime, batch, context lengths and any power or clock constraints. Synchronize at measurement boundaries when the framework launches work asynchronously; timing only a Python call can measure enqueue time instead of device completion.</p>
<p>Use a system timeline to locate CPU gaps, transfers, compute, synchronization and collectives. Then investigate the kernels that explain an exposed bottleneck. A kernel profiler can relate achieved bandwidth, occupancy, instruction mix and tensor utilization to that kernel. Collecting every expensive metric on every kernel can perturb the workload and bury the question.</p>
<div class="lesson-code"><div><h4>Capture a delimited region in TensorFlow</h4></div><pre><code># train_step is already traced and returns a scalar Tensor.
for _ in range(10):
    train_step(next(iterator)).numpy()  # warm up + wait for completion

tf.profiler.experimental.start("logs/profile")
try:
    for step in range(10):
        with tf.profiler.experimental.Trace("train", step_num=step, _r=1):
            loss = train_step(next(iterator))
            loss.numpy()  # deliberate boundary for this serial diagnostic
finally:
    tf.profiler.experimental.stop()

# This diagnostic adds synchronization. Do not use its throughput as
# the production pipeline's throughput without a separate timed run.</code></pre></div>
<p>Classify the symptom before proposing a fix. Long idle regions suggest input or orchestration gaps. Repeated small launches suggest fusion or graph-capture opportunities. A large, bandwidth-limited kernel suggests reducing transferred bytes or improving reuse. Long exposed collectives suggest topology, message granularity, skew or an overlap problem. Each is a hypothesis to test, not a diagnosis from one percentage.</p>
${reading("https://www.tensorflow.org/guide/profiler", "TensorFlow Profiler guide")}${reading("https://docs.nvidia.com/nsight-systems/UserGuide/index.html", "Nsight Systems: whole-system timelines")}${reading("https://docs.nvidia.com/nsight-compute/ProfilingGuide/index.html", "Nsight Compute: kernel measurements and their limitations")}
</section>
<section class="lesson" id="kernel-roofline" data-lesson="Tiling, bandwidth and correctness"><header><span>Kernel design</span><h3>A tile is a promise to reuse data</h3></header>
<p>For <code>C = AB</code> with square n × n matrices, multiplication performs approximately <code>2n³</code> floating-point operations. Reading A and B once and writing FP32 C once would move about <code>12n²</code> bytes, giving an idealized arithmetic intensity near <code>n/6</code> FLOP/byte. Real kernels move more data across some hierarchy boundaries. State the boundary—HBM, shared memory, or registers—when using intensity.</p>
<p>A blocked kernel loads an A tile and a B tile, computes multiple outputs from those operands, and keeps partial sums close to the matrix units. Tile size competes with register capacity, shared-memory capacity, occupancy, edge handling and scheduling. “Use a larger tile” is not a complete optimization strategy.</p>
<p>Before measuring speed, compare against a reference across irregular dimensions, alignments, masks and representative value ranges. Report absolute and relative error; accumulated low-precision error can depend on reduction length and data scale. After a kernel improvement, remeasure the full workload. A faster component can shift the bottleneck without significantly reducing end-to-end latency.</p>
${reading("https://docs.nvidia.com/cuda/cuda-programming-guide/", "CUDA Programming Guide: execution and memory model")}
</section>`,
);

export const servingChapter = chapter(
  "serving-lab",
  "Capacity is a workload and a service objective",
  "A tokens-per-second number is incomplete without arrivals, lengths, quality constraints, tail latency, and failure behavior.",
  `
<section class="lesson" id="load-test" data-lesson="Build the workload"><header><span>Serving experiments</span><h3>Define the traffic before choosing the batch</h3></header>
<p>Record the arrival process and the joint distribution of input and output lengths. Include repeated prefixes only when the workload actually contains them. A test of short prompts and one-token outputs does not predict a long-context agent workload. Likewise, a warmed prefix cache can produce an impressive result that disappears on unique requests.</p>
<p>A closed-loop client sends another request after the previous one finishes. As the service slows, the client sends less work, which can conceal queue buildup. An open-loop generator schedules arrivals independently of completion; it can reveal overload. Both are useful, but they answer different questions. Report which one you used and how actual offered load differed from the target.</p>
<div class="service-timeline"><span>Scheduled arrival</span><b>→</b><div>Admission + queue</div><b>→</b><div>Prefill</div><b>→</b><strong>First token</strong><b>→</b><div>Decode / stream</div><b>→</b><span>Completion</span></div>
<p>Measure time to first token from the client’s request start through the first received token. Inter-token latency measures gaps during streaming; time per output token is an aggregate and can hide stalls. Define whether queueing, network transit and tokenization are included. Report distributions, not just means, and include failures rather than calculating percentiles only over the successes.</p>
${reading("https://docs.vllm.ai/en/latest/cli/bench/serve/", "vLLM serving benchmark reference")}
</section>
<section class="lesson" id="goodput-cost" data-lesson="Goodput, cost and overload"><header><span>Operating a service</span><h3>Count work delivered within the objective</h3></header>
<p>Define goodput as successful work satisfying a stated service objective. One example counts completed requests whose TTFT and per-request output-token timing both meet thresholds. Another counts compliant output tokens. These denominators differ; choose one and publish the definition. Raw throughput can rise while interactive usefulness falls.</p>
<div class="derivation"><h4>A simple accounting example</h4><p>A ten-minute experiment completes 6,000 requests, but only 4,500 meet the chosen latency objective. Request throughput is <code>6,000 / 600 = 10 requests/s</code>. Compliant-request goodput is <code>4,500 / 600 = 7.5 requests/s</code>.</p><p>If the experiment costs 12 currency units for the allocated fleet, its allocation cost per compliant request is <code>12 / 4,500 ≈ 0.00267</code>. This is hypothetical arithmetic, not a cloud price quote. Include idle replicas, cache warmup and failed attempts in the cost scope.</p></div>
<p>Admission control should keep overload from becoming unbounded queue growth. Decide when to queue, reject, shed work, preempt or route elsewhere. KV capacity, prompt-token budgets, output limits and fairness policies constrain scheduling. Recomputing evicted state costs work; retries can amplify an overloaded service unless budgets and backoff are explicit.</p>
<p>Autoscaling also has a critical path: instance readiness, weights loaded, runtime initialization and warmup. A replica is not useful merely because a process exists. Test graceful drain, cancellation, partial streaming failures, overload, and the loss of a worker. Preserve enough request metadata to distinguish server execution problems from client disconnects without unnecessarily logging sensitive prompts.</p>
${reading("https://docs.vllm.ai/en/latest/configuration/optimization/", "vLLM: scheduler and memory optimization considerations")}
${exercise("Incident exercise: throughput is flat while p99 TTFT climbs. What would you inspect first?", "Check offered arrivals versus completions, queue depth and admission policy, prompt lengths, prefill budget, cache pressure and preemptions, and replica readiness. Separate queue delay from device execution time. Increasing batch size may improve throughput yet worsen TTFT; test the proposed change against the actual service objective.")}
</section>`,
);

const project = (
  id: string,
  title: string,
  focus: string,
  task: string,
  evidence: string,
  review: string,
) =>
  `<article class="engineering-project" id="${id}"><header><span>${focus}</span><h3>${title}</h3></header><p>${task}</p><dl><div><dt>Deliver</dt><dd>${evidence}</dd></div><div><dt>Review question</dt><dd>${review}</dd></div></dl></article>`;
export const projectsChapter = chapter(
  "projects",
  "Build evidence of engineering judgment",
  "The objective is not to memorize architecture names. It is to implement correctly, make a defensible measurement, and explain the tradeoff.",
  `
<div class="project-intro"><p>These projects grow from laptop-scale tests to real accelerator experiments. Passing a checklist is not equivalent to being ready for a particular employer; the work should stand up to a technical review. Do not substitute an illustrative browser diagram for a hardware measurement.</p><p>TensorFlow remains the teaching framework. For roles in current training and serving stacks, also become comfortable reading PyTorch, CUDA, compiler IR, distributed runtime code and Linux tooling. The transferable skill is reasoning below the framework abstraction.</p></div>
${project("project-trainer", "A trainer that resumes correctly", "Pre-training systems", "Extend the companion from synthetic cycles to a versioned token-shard dataset. Add deterministic shuffling, a held-out split, a learning-rate schedule, and an explicit global target-count contract.", "Code; tests for masks and gradients; a data manifest; an uninterrupted/resumed comparison; a run report with loss and throughput.", "Kill the job between shard writes and manifest publication. What is the last valid state, and what data will the next update consume?")}
${project("project-parallel", "One model, multiple workers", "Distributed systems", "Scale a small model across devices. First reproduce a single-device update with matching global data. Then compare one sharding or overlap strategy under a fixed model and batch.", "Gradient-equivalence checks; per-rank memory ledger; collective sizes; a real timeline; speedup and exposed communication with assumptions.", "Which part of the step remains serial? What breaks if one rank has fewer valid targets or takes longer to read its batch?")}
${project("project-kernel", "A kernel with a correctness envelope", "Hardware and kernels", "Implement and benchmark a tiled operation, such as matrix multiplication or a normalization kernel, against a trusted reference. Include awkward shapes and nontrivial strides.", "Kernel and test suite; precision/error tables; launch configuration; profiler evidence; boundary-specific arithmetic-intensity analysis.", "Did the optimization improve the full model, or only a microbenchmark? What register, shared-memory or bandwidth constraint stopped the next improvement?")}
${project("project-preference", "A post-training result you can audit", "Post-training", "Run SFT and a small preference experiment with a frozen, identified reference. Test response masks and sequence likelihoods, and hold out prompts by source or task family.", "Dataset and preference provenance; objective tests; length/KL diagnostics; independent evaluation; failure examples, not just averages.", "How would you tell whether reward, response length or a leaked template explains the apparent improvement?")}
${project("project-serving", "A serving envelope, not a peak number", "Inference and cloud systems", "Serve a small model and sweep offered load across prompt/output distributions. Compare one scheduler or cache choice while keeping quality and workload fixed.", "Open- and closed-loop protocols; latency distributions; goodput; memory pressure; an overload and worker-failure test; cost-scope accounting.", "When arrivals increase by 30%, where does the system queue? What policy preserves useful service, and what measurement supports that choice?")}
<section class="lesson"><header><span>How to review your work</span><h3>A short engineering report</h3></header><ol class="report-outline"><li><strong>Question.</strong> What hypothesis are you testing?</li><li><strong>Contract.</strong> Which outputs, data and quality constraints must remain unchanged?</li><li><strong>Method.</strong> Can another engineer reproduce the environment and workload?</li><li><strong>Evidence.</strong> Show correctness tests, traces, distributions and counterexamples.</li><li><strong>Conclusion.</strong> Explain the bottleneck, the improvement, the cost, and what remains unknown.</li></ol><p>Current public roles emphasize overlapping foundations: data infrastructure and distributed execution at OpenAI; CUDA, communication and profiling at NVIDIA; inference reliability, latency and economics at compute-cloud companies such as Baseten. The project selection is an editorial synthesis of those themes, not a company hiring rubric.</p>${reading("https://openai.com/careers/software-engineer-data-infrastructure-research-san-francisco/", "OpenAI: research data infrastructure role")}${reading("https://nvidia.wd5.myworkdayjobs.com/en-US/NVIDIAExternalCareerSite/job/Senior-Deep-Learning-Frameworks-CUDA-Software-Engineer_JR2017369", "NVIDIA: deep-learning frameworks and CUDA role")}${reading("https://www.baseten.co/resources/careers/", "Baseten: inference engineering context")}<p class="figure-boundary">Role context checked September 8, 2026. Openings and requirements change.</p></section>`,
);

export const postChapter = chapter(
  "post-training",
  "From a base distribution to a useful policy",
  "Connect demonstrations, preferences, rollouts and independent evaluation to the exact tensors being optimized.",
  "<div data-post-training-body></div>",
);
