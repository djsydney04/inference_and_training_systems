import { sourceLink as ref, workedCheck, escapeCode } from "./lesson-template";

const cudaExample = `# CUDA timing pattern, not a benchmark result from this machine.
# op is already validated; x is resident on a single CUDA device.
import time
import torch

with torch.inference_mode():
    for _ in range(10):
        y = op(x)                   # warm this shape and code path
    torch.cuda.synchronize(x.device)
    start = time.perf_counter()
    for _ in range(100):
        y = op(x)
    torch.cuda.synchronize(x.device)
    elapsed = time.perf_counter() - start
print("seconds per call, amortized:", elapsed / 100)
# Includes host dispatch; excludes input creation and the warmup above.
# Ten warmups are an example, not a convergence criterion.
# Measure cold start and repeated trials separately.`;
const jaxExample = `# JAX pattern: wait on outputs that depend on all measured work.
import time
import jax

compiled = jax.jit(op)
jax.block_until_ready(x)              # input already placed
jax.block_until_ready(compiled(x))    # trace, compile, execute
start = time.perf_counter()
y = compiled(x)
jax.block_until_ready(y)
elapsed = time.perf_counter() - start
# This is one warm call's completed latency, not 100-call throughput.
# Waiting for an output does not join unrelated device work.`;

export const frameworkTimingLesson = `
<section class="lesson" id="framework-benchmark-boundary" data-lesson="Time completed work">
<header><span>Connect Python to the device timeline</span><h3>A returned tensor can still be waiting for its computation</h3></header>
<p class="figure-boundary">Source check: September 16, 2026. Timings below are explicitly assumed; API patterns are separate from the measured CPU framework checks.</p>
<p>The CPU can enqueue device work and continue before that work finishes. A host timer wrapped around the call may therefore measure dispatch rather than a completed result. Before comparing <a href="#frameworks">frameworks</a>, define what must be finished when your timer stops.</p>
<p>In this example, a host launch takes 0.5 ms and the requested device operation takes 4 ms. One warm call on an idle device returns to the host at 0.5 ms and produces its result at 4.5 ms. Eight queued calls finish at 32.5 ms: 4.0625 ms per call amortized, while the first result still takes 4.5 ms. All durations are assumed for teaching.</p>
<figure class="textbook-lab fw-timing" id="framework-timing-lab">
<figcaption><span>Interactive dependency timeline</span><strong>Move the timer boundary</strong><p>Gray bars show host dispatch, blue bars show device execution. The table gives exact timestamps; lengths share one time scale.</p></figcaption>
<div class="fw-timing-controls">
<label class="fw-control">Calls in the measured region<select data-ft-count><option value="1">1 call</option><option value="8" selected>8 calls</option><option value="16">16 calls</option></select></label>
<label class="fw-control">Code state<select data-ft-cold><option value="0">Warm: already compiled</option><option value="80">Cold: 80 ms host preparation</option></select></label>
<label class="fw-control">Device at timer start<select data-ft-prior><option value="0">Idle: earlier work drained</option><option value="12">Busy: 12 ms of earlier work</option></select></label>
<label class="fw-control">Host dispatch per call<select data-ft-launch><option value="0.5">0.5 ms: device has queued work</option><option value="6">6 ms: device waits for the host</option></select></label>
</div>
<div class="fw-proof" data-ft-result aria-live="polite"></div>
<div class="fw-scroll" tabindex="0" aria-label="Host and device timing table; scroll horizontally if needed" data-ft-table></div>
<p class="figure-boundary">One FIFO device stream, one host producer, independent calls, no transfer or synchronization cost. Cold preparation runs once on the host and can overlap earlier device work. The browser computes a schedule; it does not execute a framework or predict hardware latency.</p>
</figure>
<h4>Choose the timing contract</h4>
<p><strong>Cold start</strong> includes loading, compilation or first-use initialization you choose to put inside the boundary. <strong>Warm completed latency</strong> measures a ready-to-run call through its required result. <strong>Amortized batch time</strong> divides a completed sequence by its call count and can hide host cost through overlap. Report them separately.</p>
<p>CUDA events measure an interval on a device timeline, which can include waits and idle gaps. A host-side synchronization can instead wait for broader device work. Neither automatically measures a whole distributed step: join every required stream or rank according to the experiment. Printing a tensor or fetching a scalar in the loop can introduce an unintended wait.</p>
${ref("https://docs.pytorch.org/docs/2.14/notes/cuda.html#asynchronous-execution", "PyTorch 2.14 · asynchronous execution, synchronization and stream semantics")}
${ref("https://docs.jax.dev/en/latest/async_dispatch.html", "JAX · asynchronous dispatch and result readiness · checked September 16, 2026")}
<details class="code-disclosure"><summary>Python / PyTorch: time a completed batch on CUDA</summary><pre><code>${escapeCode(cudaExample)}</code></pre></details>
<details class="code-disclosure"><summary>Python / JAX: time a completed warm call</summary><pre><code>${escapeCode(jaxExample)}</code></pre></details>
<p class="figure-boundary">These integration patterns assume an existing validated operation and suitable runtime; they were not executed as accelerator benchmarks here. The <a href="#framework-same-update">framework companion</a> provides separately recorded CPU correctness evidence.</p>
<details class="deep-dive"><summary>Warmup, shapes and caches are part of the workload</summary><p>A cached executable may apply only to compatible shapes, types and static arguments. Warm representative cases and report recompilations. A prompt cache introduces a different kind of reuse: it changes the work being measured even if no compilation occurs. Keep input distributions and cache state explicit when comparing engines.</p><p>Collect multiple trials and inspect variability. For a microbenchmark, control thread count and avoid unrelated work. For a production-service experiment, include the queues and interference that the service must actually handle. PyTorch's benchmark utilities help with warmup, synchronization and robust timing; JAX's guide separates compile, transfer and execution costs.</p>
${ref("https://docs.pytorch.org/tutorials/recipes/recipes/benchmark.html", "PyTorch benchmark utilities · warmup, thread count and timing")}
${ref("https://docs.jax.dev/en/latest/benchmarking.html", "JAX benchmarking · compilation, transfers and completion")}
</details>
${workedCheck("Why is eight-call amortized time smaller than one-call latency in the default timeline?", "The host queues later calls while the device executes earlier calls. Eight calls need 0.5 + 8 × 4 = 32.5 ms, or 4.0625 ms each. One call needs 0.5 + 4 = 4.5 ms. The operation's assumed 4 ms device service time did not improve.")}
${workedCheck("Cold preparation takes 80 ms while 12 ms of earlier device work remains. Do you add both delays?", "Not in this declared schedule. They overlap: the first launch ends at 80.5 ms, after the earlier work finished at 12 ms. The first new result is ready at 84.5 ms. A dependency or shared-resource constraint could change that overlap in a real run.")}
</section>`;
