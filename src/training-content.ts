export const trainingExpansionMarkup = `
  <section class="training-system-deep-dive" aria-labelledby="training-system-title">
    <div class="section-rule-title" id="training-ledgers" data-lesson="A training run is five coupled ledgers">
      <span>Systems deep dive</span>
      <h3 id="training-system-title">A training run is five coupled ledgers</h3>
      <p>The loss curve is only one view. A healthy run also reconciles data, tokens, numerical state, device memory, and time.</p>
    </div>

    <div class="ledger-grid" role="list">
      <article role="listitem"><span>01 / data</span><h4>Which examples arrived?</h4><p>Record source, license, filter version, dedup cluster, mixture weight, tokenizer, packing rule, and resumable shard position.</p></article>
      <article role="listitem"><span>02 / tokens</span><h4>What did the optimizer see?</h4><p>Count non-padding prediction targets globally. Sequence count is not enough when examples have different usable lengths.</p></article>
      <article role="listitem"><span>03 / numerics</span><h4>Was the update valid?</h4><p>Track loss scale, gradient norm, clipped or skipped steps, overflow, learning rate, weight norm, and per-rank anomalies.</p></article>
      <article role="listitem"><span>04 / memory</span><h4>Where did every byte live?</h4><p>Separate parameters, gradients, optimizer state, saved activations, temporary workspaces, communication buffers, and allocator slack.</p></article>
      <article role="listitem"><span>05 / time</span><h4>Why did the step take this long?</h4><p>Break the critical path into input, forward, backward, optimizer, checkpoint, exposed collectives, bubbles, and stragglers.</p></article>
    </div>

    <div class="derivation"><h4>Build the byte count from one parameter</h4><p>In this declared recipe, one parameter has a two-byte compute weight, a two-byte gradient, a four-byte update weight, and two four-byte Adam moments: <code>2+2+4+4+4=16 bytes</code>. The gradient says which way to move; the moments retain update history; the higher-precision update weight accumulates changes before rounding the compute copy. These are separately stored numbers, not sixteen bytes inside a single weight.</p><p>Let P be the parameter count and R the number of data-parallel ranks. Ordinary replication retains <code>16P</code> bytes per rank. Sharding optimizer state gives <code>P(2+2+12/R)</code>; additionally sharding gradients gives <code>P(2+14/R)</code>; sharding all three categories gives <code>16P/R</code>. These are ZeRO stages 1, 2 and 3 in the calculator. A shard is an owned slice, so computation may still temporarily gather more state. The <a href="#sharded-state-ownership">sharding lesson</a> follows those temporary lifetimes.</p><p>At 7 billion parameters, replication is 112 billion bytes, or about 104.31 GiB, on each rank. On eight ranks the stage-3 retained model state is 14 billion bytes, about 13.04 GiB per rank. One GiB is 2³⁰ bytes. Neither retained total includes the activations or temporary allocations that decide the actual peak.</p></div>

    <div class="training-calculator wide-figure" id="training-state" data-lesson="Model-state and token budgets">
      <div class="lab-head">
        <figcaption><span>Interactive 4.3</span><strong>Model-state and token-budget ledger</strong><p>Estimate one dense decoder run. Change the ZeRO stage to see replication turn into communication.</p></figcaption>
        <div class="calc-assumption"><span>Assumption</span><strong>classic mixed-precision AdamW</strong><small>2 B weights + 2 B gradients + 4 B master weights + 8 B moments per parameter</small></div>
      </div>
      <div class="training-calc-grid">
        <form class="calc-inputs" data-training-calculator>
          <label>Parameters <span><input type="number" min="0.1" max="3000" step="0.1" value="7" data-train-params /> billion</span></label>
          <label>Data-parallel ranks <span><input type="number" min="1" max="4096" step="1" value="8" data-train-ranks /> GPUs</span></label>
          <label>Sharding stage
            <select data-train-zero>
              <option value="0">Replicated / ZeRO-0</option>
              <option value="1">ZeRO-1 · shard optimizer</option>
              <option value="2">ZeRO-2 · + shard gradients</option>
              <option value="3">ZeRO-3 · + shard parameters</option>
            </select>
          </label>
          <div class="calc-divider">Global batch arithmetic</div>
          <label>Sequences / rank <span><input type="number" min="1" max="1024" step="1" value="2" data-train-microbatch /> each microstep</span></label>
          <label>Sequence length <span><input type="number" min="128" max="1048576" step="128" value="4096" data-train-sequence /> tokens</span></label>
          <label>Accumulation <span><input type="number" min="1" max="1024" step="1" value="8" data-train-accum /> microsteps</span></label>
          <label>Training target <span><input type="number" min="0.001" max="100" step="0.001" value="1" data-train-target /> trillion tokens</span></label>
        </form>
        <div class="calc-results" aria-live="polite">
          <div class="model-state-bar" aria-label="Per-rank model-state memory composition">
            <i data-state-weights><span>weights</span></i><i data-state-gradients><span>gradients</span></i><i data-state-optimizer><span>optimizer</span></i>
          </div>
          <dl>
            <div><dt>Model state / rank</dt><dd data-train-per-rank>104.31 GiB</dd></div>
            <div><dt>Cluster allocation</dt><dd data-train-cluster>834.47 GiB</dd></div>
            <div><dt>Tokens / optimizer update</dt><dd data-train-global-tokens>524,288</dd></div>
            <div><dt>Updates to target</dt><dd data-train-steps>1,907,349</dd></div>
            <div><dt>Approx. training compute</dt><dd data-train-flops>0.49 exaFLOP-days</dd></div>
          </dl>
          <p data-train-explanation>All model state is replicated. Eight ranks allocate eight complete copies.</p>
        </div>
      </div>
      <div class="omission"><strong>Model boundary:</strong> the memory estimate excludes activations, attention matrices, temporary workspaces, communication buffers, fragmentation, embeddings with unusual precision, and framework-specific state. Batch arithmetic assumes the selected sequence length counts valid prediction targets per sequence: an input/target pair constructed from T+1 recorded tokens provides T such targets. Padding and response masks require the actual valid count. The rough <code>6 × parameters × tokens</code> compute rule is for dense-decoder training and is not a wall-time estimate.</div>
    </div>
    <div class="derivation"><h4>Where the token and compute products come from</h4><p>The default update uses <code>8 ranks × 2 sequences × 4,096 targets × 8 microsteps = 524,288 targets</code>. An accumulation microstep computes another contribution at unchanged weights; the optimizer changes the weights only after all eight contributions have been combined. Reaching one trillion targets needs <code>ceil(10¹²/524,288)=1,907,349</code> full updates, with either a shorter final update or a small budget overshoot declared explicitly.</p><p>For a dense matrix, one multiply and one add count as two floating-point operations. Forward applies its weights once per token; backward forms an input derivative and a weight derivative, each with a matrix multiplication of similar arithmetic cost. Counting those three products gives roughly six operations per matrix parameter per token. Extending that approximation to a dense decoder gives <code>6PT</code> for P parameters and T training tokens. Attention pairwise products, recomputation and other operations require additional accounting. An exaFLOP-day means <code>10¹⁸×86,400</code> operations; dividing by it expresses an amount of work, not measured days on a machine.</p></div>

    <div class="checkpoint-transaction">
      <div class="checkpoint-diagram" aria-label="A distributed checkpoint commit protocol">
        <span>live ranks</span><i></i><strong>write shards</strong><i></i><strong>verify manifest</strong><i></i><strong>publish commit</strong><i></i><span>resume point</span>
      </div>
      <div class="checkpoint-copy">
        <span>Failure semantics</span>
        <h3>A checkpoint is a transaction, not a folder of tensors</h3>
        <p>One checkpoint protocol has each rank write immutable shards for the same completed update. A coordinator records sizes and hashes, verifies that the complete set exists, then publishes a manifest through the storage system's atomic commit mechanism. The manifest lists the exact shards belonging to that checkpoint; readers ignore uncommitted attempts. Atomic visibility and durability after a power failure are separate properties, so the filesystem or object store must supply the required write, flush and publication guarantees.</p>
        <dl>
          <div><dt>Numerical state</dt><dd>parameters, optimizer moments, loss scale, scheduler, step</dd></div>
          <div><dt>Stochastic state</dt><dd>Python/framework/device RNG and sampling generators</dd></div>
          <div><dt>Data state</dt><dd>dataset version, shuffle seed, consumed-token cursor</dd></div>
          <div><dt>Layout state</dt><dd>mesh axes, shard metadata, format version, code/config identity</dd></div>
        </dl>
      </div>
    </div>

    <div class="objective-ladder">
      <div class="section-rule-title compact">
        <span>Post-training objectives</span>
        <h3>What signal changes the policy?</h3>
      </div>
      <p>A policy πθ is the model's conditional probability distribution, with trainable parameters θ. Here x denotes the prompt and y the response; <code>log πθ(y|x)=Σₜ log πθ(yₜ|x,y&lt;ₜ)</code>. The sum follows response positions, including any selected end token. The rows below preview different sources of training signal. They can be combined in one recipe; they are not a required four-step sequence. The <a href="#post-training-loss">post-training lessons</a> derive their masks and objectives.</p>
      <div class="objective-row">
        <span>Demonstration</span><h4>SFT</h4><code>−Σ log πθ(yₜ | x, y&lt;ₜ)</code><p>Supervised fine-tuning uses recorded responses as next-token targets. Each selected response token supplies a direct loss; quality still depends on the data and optimization recipe.</p>
      </div>
      <div class="objective-row">
        <span>Pairwise preference</span><h4>DPO</h4><code>−log σ(β[(log πθ−log πref)chosen − (log πθ−log πref)rejected])</code><p>Direct preference optimization rewards a larger chosen-versus-rejected likelihood margin relative to a frozen reference. Here σ(z)=1/(1+exp(−z)) and β&gt;0 sets the margin scale. This pair loss does not enforce a hard bound on distance from the reference.</p>
      </div>
      <div class="objective-row">
        <span>Sampled outcomes</span><h4>RLVR</h4><code>prompt → K rollouts → verifier → advantages → policy update</code><p>Reinforcement learning with verifiable rewards uses a checker to score generated responses. An advantage compares a sampled outcome to a baseline. A program test checks the supplied cases; it need not prove correctness for every input. Generation, scoring and sample age become part of the run.</p>
      </div>
      <div class="objective-row">
        <span>Human feedback</span><h4>RLHF</h4><code>human judgments → reward model → rollouts → policy optimization</code><p>Reinforcement learning from human feedback can fit a reward model to human judgments, then optimize sampled responses using that reward. An AI judge supplies a different feedback source unless its relationship to human supervision is specified. Reward-model error and exploitation need independent evaluation.</p>
      </div>
    </div>

    <div class="field-notes">
      <div class="section-rule-title compact">
        <span>Research watch · checked 2026-09-03</span>
        <h3>Recent recipes worth reading as versioned evidence</h3>
        <p>These are case studies, not universal defaults. Each claim is scoped to its authors’ disclosed run.</p>
      </div>
      <div class="field-note-grid">
        <article><span>Open model flow · 2025</span><h4>Olmo 3</h4><p>Ai2 exposes a three-stage base-model path—broad pre-training, targeted mid-training, then long-context extension—and separate SFT, DPO, and RLVR branches with data and checkpoints.</p><a href="https://allenai.org/blog/olmo3" target="_blank" rel="noreferrer">Read Ai2’s release →</a></article>
        <article><span>Data · 2025</span><h4>FineWeb2</h4><p>The released pipeline adapts filtering and deduplication across more than 1,000 languages and explicitly ablates choices instead of treating “web text” as one undifferentiated source.</p><a href="https://arxiv.org/abs/2506.20920" target="_blank" rel="noreferrer">Read the paper →</a></article>
        <article><span>Optimizer · 2025</span><h4>Muon at scale</h4><p>Moonshot’s Moonlight work studies how matrix orthogonalization can be made practical for a multi-trillion-token MoE run. Treat its recipe as optimizer research, not a drop-in guarantee.</p><a href="https://github.com/MoonshotAI/Moonlight" target="_blank" rel="noreferrer">Read the project →</a></article>
        <article><span>Reasoning RL · 2025</span><h4>DAPO</h4><p>The open system documents asymmetric clipping, dynamic prompt sampling, token-level policy loss, and overlong-response shaping as interventions against entropy collapse and noisy updates.</p><a href="https://arxiv.org/abs/2503.14476" target="_blank" rel="noreferrer">Read the paper →</a></article>
        <article><span>MoE RL · 2025</span><h4>GSPO</h4><p>Qwen’s method uses a length-normalized sequence likelihood ratio—exp of the mean response-token log ratio—and applies clipping at the sequence level. That quantity differs from both one token's ratio and an unnormalized product across the response.</p><a href="https://arxiv.org/abs/2507.18071" target="_blank" rel="noreferrer">Read the paper →</a></article>
        <article><span>Frontier system · 2026</span><h4>Kimi K3</h4><p>The disclosed stack combines hybrid KDA/MLA, very sparse MoE, multimodal training, pipeline-bubble scheduling, and quantization-aware post-training. It is evidence that architecture, training, and serving co-design are now inseparable.</p><a href="https://github.com/MoonshotAI/Kimi-K3" target="_blank" rel="noreferrer">Read the report →</a></article>
      </div>
    </div>

    <div class="exercise-set">
      <div><span>Exercises 4.A–4.D</span><h3>Check that you can operate the ledger</h3></div>
      <ol>
        <li><strong>Memory.</strong> For a 70B dense model on 64 data-parallel ranks, compare ZeRO-0 and ZeRO-3 model-state bytes per rank. Explain why neither number proves the run will fit.</li>
        <li><strong>Batch.</strong> Keep tokens per update constant while doubling sequence length. Give two microbatch/accumulation changes and predict the activation-memory consequence.</li>
        <li><strong>Failure.</strong> A job resumes with identical weights but a reset data cursor and RNG. Name two scientific and two systems failures this can create.</li>
        <li><strong>Post-training.</strong> Design one verifiable reward that is correct but exploitable. Add a held-out evaluation that exposes the exploit.</li>
      </ol>
    </div>

    <div class="companion-code-note">
      <span>Runnable companion</span><p>The repository includes a small decoder, synthetic dataset, gradient accumulation, clipping, metrics, and atomic checkpoint workflow in <code>examples/tensorflow/</code>.</p><a href="https://github.com/djsydney04/inference_and_training_systems/tree/main/examples/tensorflow" target="_blank" rel="noreferrer">Open the TensorFlow example →</a>
    </div>
  </section>
`;
