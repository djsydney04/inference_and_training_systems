export const atlasMarkup = `
  <a class="skip-link" href="#main-content">Skip to the atlas</a>

  <header class="topbar" data-topbar>
    <a class="wordmark" href="#top" aria-label="The Inference Engineering Atlas, home">
      <span class="wordmark-mark" aria-hidden="true"><i></i><i></i><i></i></span>
      <span>Inference Engineering Atlas</span>
    </a>
    <div class="topbar-progress" aria-label="Reading progress">
      <span data-progress-label>Orientation</span>
      <span class="progress-track"><span data-progress-bar></span></span>
    </div>
    <button class="index-toggle" type="button" aria-expanded="false" aria-controls="chapter-index" data-index-toggle>
      Chapter index
    </button>
  </header>

  <section class="hero" id="top" aria-labelledby="hero-title">
    <div class="hero-grid" aria-hidden="true"></div>
    <div class="hero-copy">
      <p class="edition">A systems field guide · living edition, September 2026</p>
      <h1 id="hero-title">Follow one token through the whole machine.</h1>
      <p class="hero-deck">
        From a vector in a Transformer to registers on a chip, then across a liquid-cooled rack—and back out as the next word.
      </p>
      <div class="hero-actions">
        <a class="primary-action" href="#tensors">Begin with tensors</a>
        <a class="text-action" href="#machine">Open the machine atlas</a>
      </div>
    </div>

    <div class="hero-machine" data-hero-machine>
      <div class="machine-stage is-active" data-stage-target="tensors" style="--stage: 0">
        <button type="button" aria-label="Go to tensors"><span class="stage-object token-object">T</span></button>
        <span>token</span>
      </div>
      <div class="machine-wire"><i></i></div>
      <div class="machine-stage" data-stage-target="attention" style="--stage: 1">
        <button type="button" aria-label="Go to attention"><span class="stage-object matrix-object"><b></b><b></b><b></b><b></b></span></button>
        <span>tensor</span>
      </div>
      <div class="machine-wire"><i></i></div>
      <div class="machine-stage" data-stage-target="gpu" style="--stage: 2">
        <button type="button" aria-label="Go to GPU architecture"><span class="stage-object chip-object"><b></b></span></button>
        <span>chip</span>
      </div>
      <div class="machine-wire"><i></i></div>
      <div class="machine-stage" data-stage-target="rack" style="--stage: 3">
        <button type="button" aria-label="Go to rack architecture"><span class="stage-object rack-object"><b></b><b></b><b></b><b></b><b></b></span></button>
        <span>rack</span>
      </div>
      <div class="pulse" aria-hidden="true"></div>
    </div>

    <div class="hero-note">
      <span>Reading model</span>
      <p>Concept → equation → code → silicon → system. Every simplified figure says what it leaves out.</p>
    </div>
  </section>

  <div class="page-shell">
    <aside class="chapter-index" id="chapter-index" aria-label="Chapter index">
      <div class="index-inner">
        <p>Learning path</p>
        <nav>
          <a href="#orientation" data-nav-section="orientation"><span>00</span> Orientation</a>
          <a href="#tensors" data-nav-section="tensors"><span>01</span> Tensors</a>
          <a href="#transformer" data-nav-section="transformer"><span>02</span> Transformer</a>
          <a href="#attention" data-nav-section="attention"><span>03</span> Attention field</a>
          <a href="#training" data-nav-section="training"><span>04</span> Training</a>
          <a href="#machine" data-nav-section="machine"><span>05</span> Machine atlas</a>
          <a href="#rack" data-nav-section="rack"><span>06</span> Rack & network</a>
          <a href="#inference" data-nav-section="inference"><span>07</span> Inference</a>
          <a href="#lpu" data-nav-section="lpu"><span>08</span> LPU</a>
          <a href="#glossary" data-nav-section="glossary"><span>09</span> Glossary</a>
          <a href="#sources" data-nav-section="sources"><span>10</span> Sources</a>
        </nav>
        <div class="index-legend">
          <i></i>
          <p><strong>Blue paths</strong> are active data movement. Gray geometry is capacity waiting to be used.</p>
        </div>
      </div>
    </aside>

    <main id="main-content">
      <section class="chapter chapter-opening" id="orientation" data-chapter="Orientation">
        <div class="chapter-number">00</div>
        <div class="chapter-title">
          <p class="chapter-kicker">Orientation</p>
          <h2>Three mental models before the details</h2>
          <p class="chapter-summary">Every training or inference bottleneck is a shortage of compute, memory capacity, memory bandwidth, communication bandwidth, or orchestration efficiency. Start by locating the scarce resource.</p>
        </div>

        <div class="concept-strip" role="list">
          <article role="listitem">
            <span>Model</span>
            <h3>A graph of tensor operations</h3>
            <p>The architecture says which arrays exist, how they transform, and which values must survive for backward or future tokens.</p>
          </article>
          <article role="listitem">
            <span>Machine</span>
            <h3>A hierarchy that moves bytes</h3>
            <p>Fast arithmetic only matters when registers, SRAM, HBM, links, and storage deliver operands on time.</p>
          </article>
          <article role="listitem">
            <span>System</span>
            <h3>A scheduler under uncertainty</h3>
            <p>Training coordinates one large job. Serving coordinates many arrivals with different prompts, deadlines, and output lengths.</p>
          </article>
        </div>

        <figure class="wide-figure hierarchy-figure">
          <figcaption>
            <span>Figure 0.1</span>
            <strong>The scale ladder</strong>
            <p>Click a level to follow the reading path. Sizes are conceptual, not drawn to scale.</p>
          </figcaption>
          <div class="scale-ladder" data-scale-ladder>
            <button data-scroll="tensors"><i style="--size: .22"></i><span>scalar</span><small>one number</small></button>
            <button data-scroll="tensors"><i style="--size: .34"></i><span>tensor</span><small>shaped numbers</small></button>
            <button data-scroll="transformer"><i style="--size: .47"></i><span>layer</span><small>operations</small></button>
            <button data-scroll="gpu"><i style="--size: .61"></i><span>chip</span><small>compute + memory</small></button>
            <button data-scroll="rack"><i style="--size: .78"></i><span>rack</span><small>scale-up domain</small></button>
            <button data-scroll="training"><i style="--size: 1"></i><span>cluster</span><small>scale-out fabric</small></button>
          </div>
          <div class="omission"><strong>Model boundary:</strong> the ladder omits storage, power, cooling, host software, and failures; those re-enter in Chapters 4–7.</div>
        </figure>
      </section>

      <section class="chapter" id="tensors" data-chapter="Tensors">
        <div class="chapter-number">01</div>
        <div class="chapter-title">
          <p class="chapter-kicker">Mathematical substrate</p>
          <h2>A tensor is data plus an agreement about its axes</h2>
          <p class="chapter-summary">“Tensor” is not mystical. It is a rectangular collection of numbers whose shape gives each axis a meaning. Most of a language model is matrix multiplication wrapped in bookkeeping.</p>
        </div>

        <div class="reading-grid">
          <div class="prose">
            <h3>Shape is the first debugging tool</h3>
            <p>Suppose a batch contains <em>B</em> sequences, each with <em>T</em> tokens, represented by <em>D</em> features. The residual stream has shape <code>[B, T, D]</code>. A learned projection <code>Wq</code> with shape <code>[D, H × Dh]</code> turns it into queries, then a reshape exposes heads: <code>[B, H, T, Dh]</code>.</p>
            <p>Axes are contracts. If an operation is hard to explain with axis names, it is usually hard to distribute or optimize correctly.</p>

            <div class="equation-block" aria-label="Matrix multiplication shape equation">
              <span class="equation-label">Projection</span>
              <div><var>X</var><sub>B×T×D</sub> · <var>W</var><sub>D×M</sub> = <var>Y</var><sub>B×T×M</sub></div>
              <p>The contracted <em>D</em> axis disappears; the free axes survive.</p>
            </div>

            <h3>Four quantities to track</h3>
            <dl class="definition-list">
              <div><dt>Shape</dt><dd>Which logical axes exist and their lengths.</dd></div>
              <div><dt>Dtype</dt><dd>How each number is represented: FP32, BF16, FP8, INT8, and so on.</dd></div>
              <div><dt>Layout</dt><dd>How logical indices map onto contiguous memory addresses.</dd></div>
              <div><dt>Device</dt><dd>Which physical memory owns the bytes right now.</dd></div>
            </dl>
          </div>

          <figure class="margin-figure tensor-figure">
            <figcaption><span>Figure 1.1</span><strong>One activation, four views</strong></figcaption>
            <div class="tensor-stack" aria-hidden="true">
              <div class="tensor-plane p3"></div><div class="tensor-plane p2"></div><div class="tensor-plane p1"></div>
              <div class="tensor-bracket tensor-b">B</div><div class="tensor-bracket tensor-t">T</div><div class="tensor-bracket tensor-d">D</div>
            </div>
            <ol>
              <li><button data-tensor-view="shape" class="is-active">Logical shape</button></li>
              <li><button data-tensor-view="layout">Memory layout</button></li>
              <li><button data-tensor-view="shard">Device shards</button></li>
            </ol>
            <p data-tensor-caption>Each plane is one token position; features run across, sequences run into the page.</p>
          </figure>
        </div>

        <div class="code-study">
          <div class="code-heading">
            <div><span>TensorFlow lab 1</span><h3>Watch the axes move</h3></div>
            <button class="copy-button" type="button" data-copy-target="tensor-code">Copy code</button>
          </div>
          <pre id="tensor-code"><code><span class="kw">import</span> tensorflow <span class="kw">as</span> tf

B, T, D, H = <span class="num">2</span>, <span class="num">8</span>, <span class="num">512</span>, <span class="num">8</span>
Dh = D // H
x = tf.random.normal([B, T, D])
wq = tf.keras.layers.Dense(D, use_bias=<span class="kw">False</span>)

q = wq(x)                              <span class="cm"># [B, T, D]</span>
q = tf.reshape(q, [B, T, H, Dh])       <span class="cm"># [B, T, H, Dh]</span>
q = tf.transpose(q, [<span class="num">0</span>, <span class="num">2</span>, <span class="num">1</span>, <span class="num">3</span>])          <span class="cm"># [B, H, T, Dh]</span>

tf.debugging.assert_shapes([(q, (B, H, T, Dh))])
print(q.shape, q.dtype, q.device)</code></pre>
          <div class="code-notes"><span>Why transpose?</span><p>Attention multiplies each head’s <code>T × Dh</code> query matrix by a <code>Dh × T</code> key matrix. Putting heads before sequence lets a batched matmul express that directly.</p></div>
        </div>
      </section>

      <section class="chapter" id="transformer" data-chapter="Transformer">
        <div class="chapter-number">02</div>
        <div class="chapter-title">
          <p class="chapter-kicker">Transformer architecture</p>
          <h2>The residual stream is the main road</h2>
          <p class="chapter-summary">Attention communicates across token positions. The feed-forward network computes independently at each position. Residual connections keep both updates additive and trainable at depth.</p>
        </div>

        <figure class="wide-figure transformer-map">
          <figcaption><span>Figure 2.1</span><strong>A decoder-only Transformer block</strong><p>Press play to trace one activation through a pre-normalized block.</p></figcaption>
          <div class="transformer-controls">
            <button type="button" data-transformer-play>Trace one token</button>
            <span data-transformer-status>Ready at the residual stream</span>
          </div>
          <div class="block-pipeline" data-block-pipeline>
            <div class="pipeline-rail"><i></i></div>
            <button class="pipeline-node residual is-active" data-step="0"><span>x</span><small>residual</small></button>
            <button class="pipeline-node" data-step="1"><span>RMS</span><small>normalize</small></button>
            <button class="pipeline-node attention-node" data-step="2"><span>Q K V</span><small>causal attention</small></button>
            <button class="pipeline-node plus-node" data-step="3"><span>+</span><small>residual add</small></button>
            <button class="pipeline-node" data-step="4"><span>RMS</span><small>normalize</small></button>
            <button class="pipeline-node wide-node" data-step="5"><span>SwiGLU</span><small>token-wise MLP</small></button>
            <button class="pipeline-node plus-node" data-step="6"><span>+</span><small>next layer</small></button>
          </div>
          <div class="pipeline-readout" data-pipeline-readout>
            <strong>Residual stream</strong>
            <p>Shape stays <code>[B, T, D]</code> from layer to layer. Sub-layers write updates into this shared representation.</p>
          </div>
          <div class="omission"><strong>Model boundary:</strong> this view omits dropout, biases, rotary position transforms, cache writes, MoE routing, and parallel sharding.</div>
        </figure>

        <div class="reading-grid">
          <div class="prose">
            <h3>Why self-attention works</h3>
            <p>Each token creates a query, key, and value. Query–key dot products measure compatibility. A causal mask forbids looking rightward. Softmax turns allowed scores into weights; their weighted sum selects information from prior values.</p>
            <div class="equation-block">
              <span class="equation-label">Scaled dot-product attention</span>
              <div>Attention(<var>Q</var>, <var>K</var>, <var>V</var>) = softmax((<var>QK</var><sup>T</sup> / √<var>d</var><sub>h</sub>) + <var>M</var>)<var>V</var></div>
              <p><var>M</var> is 0 for allowed pairs and −∞ for forbidden pairs.</p>
            </div>
            <h3>Why the MLP matters</h3>
            <p>Attention moves and blends information. The MLP transforms it. In a SwiGLU block, one projection produces content, another produces a learned gate, and their elementwise product is projected back to the residual width.</p>
          </div>
          <aside class="margin-note">
            <span>Decoder vocabulary</span>
            <dl>
              <div><dt>Embedding</dt><dd>Token ID → learned vector.</dd></div>
              <div><dt>RoPE</dt><dd>Rotates query and key channels by position-dependent angles.</dd></div>
              <div><dt>RMSNorm</dt><dd>Scales by root-mean-square magnitude without mean subtraction.</dd></div>
              <div><dt>Logits</dt><dd>One unnormalized score per vocabulary token.</dd></div>
            </dl>
          </aside>
        </div>

        <div class="code-study">
          <div class="code-heading">
            <div><span>TensorFlow lab 2</span><h3>Attention from primitives</h3></div>
            <button class="copy-button" type="button" data-copy-target="attention-code">Copy code</button>
          </div>
          <pre id="attention-code"><code><span class="kw">import</span> tensorflow <span class="kw">as</span> tf

<span class="kw">def</span> <span class="fn">causal_attention</span>(q, k, v):
    <span class="cm"># q, k, v: [batch, heads, tokens, head_dim]</span>
    scale = tf.cast(tf.shape(k)[-<span class="num">1</span>], q.dtype) ** -<span class="num">0.5</span>
    scores = tf.matmul(q, k, transpose_b=<span class="kw">True</span>) * scale

    tokens = tf.shape(scores)[-<span class="num">1</span>]
    allowed = tf.linalg.band_part(tf.ones([tokens, tokens]), -<span class="num">1</span>, <span class="num">0</span>)
    scores += (<span class="num">1.0</span> - allowed) * tf.cast(-<span class="num">1e9</span>, scores.dtype)

    weights = tf.nn.softmax(scores, axis=-<span class="num">1</span>)
    output = tf.matmul(weights, v)
    <span class="kw">return</span> output, weights

<span class="cm"># Production kernels fuse several of these steps to avoid HBM round trips.</span></code></pre>
          <div class="code-notes"><span>Correct, not fast</span><p>This pedagogical version materializes the score matrix. FlashAttention computes exact attention in tiles so intermediate scores remain in on-chip SRAM instead of HBM.</p></div>
        </div>
      </section>

      <section class="chapter" id="attention" data-chapter="Attention field">
        <div class="chapter-number">03</div>
        <div class="chapter-title">
          <p class="chapter-kicker">The attention field</p>
          <h2>Modern models choose where quadratic attention is worth paying for</h2>
          <p class="chapter-summary">Full attention is expressive but expensive at long context. Current systems reduce KV heads, select a sparse set of tokens, compress keys and values, or mix attention with a recurrent state.</p>
        </div>

        <div class="attention-lab wide-figure">
          <div class="lab-head">
            <figcaption><span>Interactive 3.1</span><strong>Who can each token read?</strong><p>Change the policy and sequence length. Each blue cell is one permitted query–key interaction.</p></figcaption>
            <div class="lab-controls">
              <label>Policy
                <select data-attention-mode>
                  <option value="causal">Causal full attention</option>
                  <option value="sliding">Sliding window</option>
                  <option value="sparse">Learned sparse selection</option>
                  <option value="hybrid">Hybrid: 3 linear + 1 full</option>
                  <option value="kda">KDA recurrent state</option>
                </select>
              </label>
              <label>Tokens <output data-token-output>16</output>
                <input type="range" min="8" max="40" step="4" value="16" data-token-count />
              </label>
            </div>
          </div>
          <div class="attention-workbench">
            <canvas data-attention-canvas width="720" height="480" aria-label="Attention connectivity matrix"></canvas>
            <div class="lab-readout">
              <div><span>Visible pairs</span><strong data-pair-count>136</strong></div>
              <div><span>Asymptotic work</span><strong data-complexity>O(T²)</strong></div>
              <p data-attention-description>Every query reads all earlier keys. Exact and general, but the score work and KV traffic grow with context.</p>
            </div>
          </div>
          <div class="omission"><strong>Model boundary:</strong> cell count is a structural proxy, not runtime. Kernel tiling, dtype, head dimension, sparsity overhead, and hardware utilization decide measured speed.</div>
        </div>

        <div class="mechanism-table" role="table" aria-label="Attention mechanism comparison">
          <div class="mechanism-row table-head" role="row"><span>Mechanism</span><span>What changes</span><span>Cache / state</span><span>Tradeoff</span></div>
          <div class="mechanism-row" role="row"><strong>MHA</strong><span>Each query head owns K and V heads</span><span>Largest KV cache</span><span>Maximum head independence</span></div>
          <div class="mechanism-row" role="row"><strong>GQA / MQA</strong><span>Groups share K/V heads</span><span>Smaller in proportion to KV heads</span><span>Cheaper decode with some sharing</span></div>
          <div class="mechanism-row" role="row"><strong>MLA</strong><span>Cache a low-rank latent representation</span><span>Compressed latent cache</span><span>Extra projections; implementation-specific absorption</span></div>
          <div class="mechanism-row" role="row"><strong>Sparse</strong><span>Score a learned or fixed subset</span><span>Selected tokens plus index state</span><span>Subquadratic work; selection quality matters</span></div>
          <div class="mechanism-row" role="row"><strong>Linear / recurrent</strong><span>Accumulate a fixed-size state</span><span>State independent of T</span><span>Efficient decode; lossy compression of history</span></div>
        </div>

        <div class="case-studies">
          <article class="case-study">
            <div class="case-meta"><span>Released Aug 2026</span><a href="https://huggingface.co/zai-org/GLM-5.3-Flash" target="_blank" rel="noreferrer">Official model card</a></div>
            <h3>GLM‑5.3 Flash: sparse + linear</h3>
            <p>Z.ai describes GLM‑5.3 Flash as the first GLM model to combine sparse and linear attention. Its release configuration specifies 45 layers: 34 KDA linear-attention layers and 11 DeepSeek Sparse Attention layers in a repeating 3:1 schedule. Each sparse indexer selects up to 2,048 positions. These are versioned checkpoint facts, not a promise about every future GLM‑5.3 variant.</p>
            <div class="layer-tape" aria-label="Conceptual hybrid layer schedule">
              <span class="linear">linear</span><span class="linear">linear</span><span class="linear">linear</span><span class="sparse">sparse</span><span class="linear">linear</span><span class="linear">linear</span><span class="linear">linear</span><span class="sparse">sparse</span>
            </div>
            <p class="claim-note"><strong>Why hybrid?</strong> Recurrent layers move long-range summary state cheaply; periodic sparse attention provides content-addressed retrieval that a fixed state can blur. <a href="https://huggingface.co/zai-org/GLM-5.3-Flash/raw/main/config.json" target="_blank" rel="noreferrer">Inspect the released config</a>.</p>
          </article>

          <article class="case-study">
            <div class="case-meta"><span>Kimi Linear, 2025 → Kimi K3, 2026</span><a href="https://arxiv.org/abs/2510.26692" target="_blank" rel="noreferrer">Technical report</a></div>
            <h3>Kimi: KDA + gated MLA</h3>
            <p>Kimi Delta Attention treats recent input as writes to a matrix-valued recurrent memory. A fine-grained decay gate controls forgetting by channel; a delta-rule correction removes an old key association before writing the new value. Kimi’s published hybrid uses three KDA layers for each MLA layer.</p>
            <div class="equation-block compact">
              <span class="equation-label">Conceptual KDA update</span>
              <div><var>S</var><sub>t</sub> ← decay(<var>S</var><sub>t−1</sub>) + correction(<var>k</var><sub>t</sub>, <var>v</var><sub>t</sub>)</div>
              <p>Training uses a chunkwise parallel form; token-by-token decode uses the recurrence.</p>
            </div>
            <p class="claim-note"><strong>Reported result:</strong> the Kimi Linear paper reports 6.3× lower time per output token than its MLA baseline at one-million-token context, batch one. This is an author measurement on its stated setup, not a universal speedup.</p>
          </article>
        </div>

        <div class="paper-plate">
          <div class="paper-visual" aria-label="Original redraw of hybrid attention architecture">
            <div class="paper-page">
              <span>PRIMARY SOURCE / REDRAW</span>
              <strong>Kimi Linear</strong>
              <div class="paper-diagram"><i>KDA</i><i>KDA</i><i>KDA</i><i>MLA</i></div>
              <small>3 recurrent mixers preserve throughput; 1 content-addressed layer restores exact lookup.</small>
            </div>
          </div>
          <div class="paper-caption">
            <span>Paper plate 3.A</span>
            <h3>Read the figure, then read the paper</h3>
            <p>This is an original schematic based on Figure 3 of the Kimi Linear report. It preserves the architectural idea without copying the published artwork.</p>
            <a href="https://yzhang.site/assets/pubs/techreport/2025/kda.pdf#page=6" target="_blank" rel="noreferrer">Open the authors’ Figure 3</a>
          </div>
        </div>
      </section>

      <section class="chapter" id="training" data-chapter="Training">
        <div class="chapter-number">04</div>
        <div class="chapter-title">
          <p class="chapter-kicker">Pre-training and post-training</p>
          <h2>Training is a data pipeline synchronized to a numerical experiment</h2>
          <p class="chapter-summary">Pre-training compresses statistical structure from enormous token streams. Post-training changes behavior: instruction following, preference, reasoning policy, tool use, safety, and calibration.</p>
        </div>

        <figure class="wide-figure training-loop">
          <figcaption><span>Figure 4.1</span><strong>The training step and what must survive it</strong><p>Hover or focus a stage for its dominant storage cost.</p></figcaption>
          <div class="loop-track">
            <button data-training-stage="batch"><span>batch</span><small>tokens + labels</small></button>
            <i>›</i><button data-training-stage="forward"><span>forward</span><small>activations</small></button>
            <i>›</i><button data-training-stage="loss"><span>loss</span><small>logits / reductions</small></button>
            <i>›</i><button data-training-stage="backward"><span>backward</span><small>gradients</small></button>
            <i>›</i><button data-training-stage="optimizer"><span>optimizer</span><small>master state</small></button>
            <i class="loop-return">↶</i>
          </div>
          <div class="training-readout" data-training-readout><strong>Batch</strong><p>The input pipeline must deliver already-tokenized, shuffled, deduplicated sequences quickly enough that accelerators never wait.</p></div>
        </figure>

        <div class="training-phases">
          <section>
            <span>Phase A</span>
            <h3>Pre-training</h3>
            <p>Predict held-out tokens from context. The objective is simple; the system is not. Dataset mixture, deduplication, contamination control, sequence packing, learning-rate schedule, optimizer, precision, and fault recovery all shape the result.</p>
            <ul>
              <li><strong>Data:</strong> acquire → license → filter → deduplicate → classify → mix → tokenize → pack.</li>
              <li><strong>Objective:</strong> usually next-token cross entropy; multimodal models may interleave text, image, audio, or action tokens.</li>
              <li><strong>Scale:</strong> choose parameters and tokens together; compute-optimal recipes are a budget allocation, not a law.</li>
              <li><strong>Validation:</strong> track held-out loss plus capability, memorization, contamination, and safety suites.</li>
            </ul>
          </section>
          <section>
            <span>Phase B</span>
            <h3>Post-training</h3>
            <p>Turn a base distribution into a useful policy. SFT demonstrates desired responses. Preference optimization separates chosen from rejected behavior. RLVR uses verifiable rewards for domains such as code and mathematics.</p>
            <ol>
              <li><strong>SFT:</strong> imitate curated demonstrations and tool trajectories.</li>
              <li><strong>Preference:</strong> DPO-like losses optimize relative likelihood without an online reward loop.</li>
              <li><strong>RL:</strong> sample trajectories, score outcomes, estimate advantages, and update under a trust constraint.</li>
              <li><strong>Evaluation:</strong> test helpfulness, regressions, robustness, reward hacking, and deployment behavior.</li>
            </ol>
          </section>
        </div>

        <div class="parallelism-atlas wide-figure">
          <div class="lab-head">
            <figcaption><span>Interactive 4.2</span><strong>How one model occupies many GPUs</strong><p>Select a parallel axis. Real systems compose several axes into an N-dimensional device mesh.</p></figcaption>
            <div class="segmented" data-parallel-controls>
              <button class="is-active" data-parallel-mode="data">Data</button>
              <button data-parallel-mode="tensor">Tensor</button>
              <button data-parallel-mode="pipeline">Pipeline</button>
              <button data-parallel-mode="context">Context</button>
              <button data-parallel-mode="expert">Expert</button>
            </div>
          </div>
          <div class="device-mesh" data-device-mesh aria-label="Eight-GPU logical mesh"></div>
          <div class="parallel-readout"><strong data-parallel-title>Data parallelism</strong><p data-parallel-copy>Every worker has the model and consumes different examples. Gradients are reduced across replicas before the optimizer step.</p><code data-parallel-collective>collective: all-reduce / reduce-scatter</code></div>
        </div>

        <div class="reading-grid">
          <div class="prose">
            <h3>The memory ledger</h3>
            <p>A naïve mixed-precision Adam training run can need weights, gradients, forward activations, FP32 master weights, and two FP32 moment tensors. Sharding optimizer state, gradients, and parameters (the ZeRO progression) turns redundant copies into communication.</p>
            <p>Activation checkpointing makes a different trade: save fewer intermediate tensors, then recompute them during backward. Sequence parallelism and selective recomputation target the activations that dominate at long sequence lengths.</p>
          </div>
          <aside class="margin-note warning-note">
            <span>Failure checklist</span>
            <ul>
              <li>Loss spike or silent divergence</li>
              <li>NaN/Inf in one rank</li>
              <li>Collective timeout</li>
              <li>Input starvation</li>
              <li>Checkpoint corruption</li>
              <li>Straggling host or link</li>
            </ul>
            <p>A recoverable run stores model, optimizer, scheduler, RNG, data cursor, and topology-aware shard metadata.</p>
          </aside>
        </div>

        <div class="code-study">
          <div class="code-heading"><div><span>TensorFlow lab 3</span><h3>A distributed pre-training step</h3></div><button class="copy-button" type="button" data-copy-target="train-code">Copy code</button></div>
          <pre id="train-code"><code>strategy = tf.distribute.MultiWorkerMirroredStrategy()

<span class="kw">with</span> strategy.scope():
    model = DecoderLM(config)
    optimizer = tf.keras.optimizers.AdamW(<span class="num">3e-4</span>, weight_decay=<span class="num">0.1</span>)

<span class="dec">@tf.function</span>(jit_compile=<span class="kw">True</span>)
<span class="kw">def</span> <span class="fn">distributed_step</span>(batch):
    <span class="kw">def</span> <span class="fn">replica_step</span>(tokens):
        x, labels = tokens[:, :-<span class="num">1</span>], tokens[:, <span class="num">1</span>:]
        <span class="kw">with</span> tf.GradientTape() <span class="kw">as</span> tape:
            logits = model(x, training=<span class="kw">True</span>)
            loss = tf.reduce_mean(
                tf.keras.losses.sparse_categorical_crossentropy(
                    labels, logits, from_logits=<span class="kw">True</span>))
        grads = tape.gradient(loss, model.trainable_variables)
        optimizer.apply_gradients(zip(grads, model.trainable_variables))
        <span class="kw">return</span> loss
    losses = strategy.run(replica_step, args=(batch,))
    <span class="kw">return</span> strategy.reduce(tf.distribute.ReduceOp.MEAN, losses, axis=<span class="kw">None</span>)

<span class="cm"># Production: add global-token normalization, loss scaling, gradient</span>
<span class="cm"># accumulation/clipping, checkpoint state, input resumption, and telemetry.</span></code></pre>
          <div class="code-notes"><span>Pedagogical boundary</span><p><code>MultiWorkerMirroredStrategy</code> explains synchronous data parallelism. Frontier model training generally needs multi-axis sharding and highly specialized fused kernels beyond this small example.</p></div>
        </div>
      </section>

      <section class="chapter" id="machine" data-chapter="Machine atlas">
        <div class="chapter-number">05</div>
        <div class="chapter-title">
          <p class="chapter-kicker">Machine atlas</p>
          <h2>A GPU is a latency-hiding machine wrapped around matrix units</h2>
          <p class="chapter-summary">Thousands of threads give the scheduler something else to run while prior warps wait for data. Registers and shared memory feed arithmetic quickly; HBM supplies capacity and bandwidth; the programming model coordinates the hierarchy.</p>
        </div>

        <div class="hardware-primer">
          <section><span>CPU</span><h3>Minimize one thread’s latency</h3><p>Large caches, branch prediction, out-of-order execution, and a few sophisticated cores handle control-heavy, irregular work.</p></section>
          <section><span>GPU</span><h3>Maximize parallel throughput</h3><p>Many simpler lanes execute warps, hiding stalls by switching among ready work. Tensor cores accelerate dense matrix fragments.</p></section>
          <section><span>LPU</span><h3>Schedule the whole dataflow</h3><p>A compiler places operations and movement on deterministic functional slices, trading dynamic hardware flexibility for predictable inference.</p></section>
        </div>

        <div class="three-lab wide-figure" id="gpu">
          <div class="three-head">
            <figcaption><span>Interactive 5.1</span><strong>GPU package cutaway</strong><p>Drag to orbit, scroll to zoom, and select a part. The layout is explanatory, not a proprietary Blackwell floorplan.</p></figcaption>
            <div class="three-controls">
              <button type="button" data-gpu-view="package" class="is-active">Package</button>
              <button type="button" data-gpu-view="die">Compute die</button>
              <button type="button" data-gpu-view="sm">One SM</button>
              <button type="button" data-gpu-reset aria-label="Reset GPU view">Reset view</button>
            </div>
          </div>
          <div class="three-stage">
            <div id="gpu-scene" class="scene-canvas" role="img" aria-label="Interactive 3D GPU package model"></div>
            <div class="scene-inspector" id="gpu-inspector" aria-live="polite">
              <span>Selected / package</span>
              <h3>Accelerator package</h3>
              <p>The package places compute dies beside high-bandwidth memory stacks on a silicon interposer. Packaging is part of the memory system.</p>
              <dl><div><dt>Look for</dt><dd>HBM stacks around logic</dd></div><div><dt>Bottleneck</dt><dd>bytes delivered per operation</dd></div></dl>
            </div>
          </div>
          <div class="scene-key"><span><i class="key-compute"></i> compute</span><span><i class="key-memory"></i> memory</span><span><i class="key-fabric"></i> fabric</span><span>Conceptual geometry</span></div>
          <div class="webgl-fallback" data-webgl-fallback hidden>WebGL is unavailable. The inspector and text below contain the equivalent component map.</div>
        </div>

        <div class="anatomy-list">
          <article><span>01</span><div><h3>Grid → block → warp → thread</h3><p>A kernel launches a grid of thread blocks. Blocks are assigned to SMs. An SM issues instructions for warps—groups of 32 threads on NVIDIA GPUs. Divergent branches serialize paths within a warp.</p></div><code>software hierarchy</code></article>
          <article><span>02</span><div><h3>Warp schedulers and scoreboards</h3><p>Schedulers choose ready warps. The scoreboard tracks dependencies so an instruction waits until operands are available. Occupancy is useful only when the extra resident warps hide a real latency.</p></div><code>control</code></article>
          <article><span>03</span><div><h3>Registers</h3><p>Each active thread owns registers allocated from an on-SM register file. They are the fastest programmer-visible storage, but high per-thread use can reduce resident warps or spill to local memory in device DRAM.</p></div><code>per thread</code></article>
          <article><span>04</span><div><h3>Shared memory / L1</h3><p>On-chip SRAM shared by a thread block stages tiles and enables reuse. Bank conflicts serialize some accesses; asynchronous copy engines and TMA move multidimensional tiles with less thread bookkeeping.</p></div><code>per block</code></article>
          <article><span>05</span><div><h3>CUDA and tensor cores</h3><p>CUDA cores execute scalar/vector arithmetic per lane. Tensor cores perform matrix multiply-accumulate on tiles with supported dtypes. Keeping them fed requires coordinated layout, instruction choice, and pipeline depth.</p></div><code>execution</code></article>
          <article><span>06</span><div><h3>L2, HBM, and coalescing</h3><p>L2 serves the whole GPU. HBM offers enormous bandwidth but far more latency than registers or shared memory. Adjacent lanes should request adjacent addresses so hardware combines transactions.</p></div><code>device memory</code></article>
        </div>

        <figure class="wide-figure roofline-figure">
          <figcaption><span>Figure 5.2</span><strong>The roofline question</strong><p>Move the workload to see whether arithmetic or memory bandwidth sets the ceiling.</p></figcaption>
          <div class="roofline-lab">
            <div class="roofline-chart" data-roofline-chart>
              <div class="roof-memory"></div><div class="roof-compute"></div><div class="roof-point" data-roof-point></div>
              <span class="axis-y">attainable FLOP/s</span><span class="axis-x">arithmetic intensity →</span>
            </div>
            <label>FLOPs per byte <output data-intensity-output>16</output><input type="range" min="1" max="128" value="16" data-intensity /></label>
            <p data-roofline-copy>At this intensity, moving operands is likely to set the ceiling. Fuse operations or reuse tiles before chasing peak FLOPs.</p>
          </div>
        </figure>
      </section>

      <section class="chapter" id="rack" data-chapter="Rack & network">
        <div class="chapter-number">06</div>
        <div class="chapter-title">
          <p class="chapter-kicker">Rack-scale composition</p>
          <h2>GB200 NVL72 turns seventy-two GPUs into one scale-up domain</h2>
          <p class="chapter-summary">The rack is not “a server with more cards.” Compute trays, NVLink switch trays, a copper backplane, power shelves, liquid cooling, storage, management, and a scale-out network form one machine.</p>
        </div>

        <div class="three-lab wide-figure" id="rack-model">
          <div class="three-head">
            <figcaption><span>Interactive 6.1</span><strong>GB200 NVL72 rack exploder</strong><p>Select a tray, isolate the NVLink fabric, or open a Grace–Blackwell compute tray.</p></figcaption>
            <div class="three-controls">
              <button type="button" data-rack-view="rack" class="is-active">Whole rack</button>
              <button type="button" data-rack-view="compute">Compute tray</button>
              <button type="button" data-rack-view="fabric">NVLink fabric</button>
              <button type="button" data-rack-reset aria-label="Reset rack view">Reset view</button>
            </div>
          </div>
          <div class="three-stage rack-stage">
            <div id="rack-scene" class="scene-canvas" role="img" aria-label="Interactive 3D conceptual model of a GB200 NVL72 rack"></div>
            <div class="scene-inspector" id="rack-inspector" aria-live="polite">
              <span>Selected / NVL72</span><h3>Rack-scale NVLink domain</h3>
              <p>18 compute trays × 4 B200 GPUs = 72 GPUs. Nine switch trays contain 18 NVSwitch chips, giving every GPU one NVLink connection to every switch chip.</p>
              <dl><div><dt>Scale up</dt><dd>NVLink + NVSwitch</dd></div><div><dt>Scale out</dt><dd>InfiniBand or Ethernet</dd></div></dl>
            </div>
          </div>
          <div class="scene-key"><span><i class="key-compute"></i> 18 compute trays</span><span><i class="key-fabric"></i> 9 switch trays</span><span><i class="key-power"></i> power / cooling</span><span>Topology based on NVIDIA’s public guides</span></div>
        </div>

        <div class="rack-facts" aria-label="GB200 NVL72 composition">
          <div><strong>72</strong><span>B200 GPUs</span><p>Four per compute tray</p></div>
          <div><strong>36</strong><span>Grace CPUs</span><p>Two per compute tray</p></div>
          <div><strong>18</strong><span>NVSwitch ASICs</span><p>Two per switch tray</p></div>
          <div><strong>130 TB/s</strong><span>aggregate NVLink</span><p>NVIDIA’s rack-level figure</p></div>
        </div>

        <div class="generation-delta">
          <div class="generation-intro"><span>Generation delta · current in 2026</span><h3>Vera Rubin keeps the NVL72 idea and changes the machine beneath it</h3><p>The same seventy-two-GPU rack abstraction now spans Blackwell and Rubin generations. Do not treat “NVL72” as a chip name; it describes the size of the in-rack NVLink domain.</p></div>
          <div class="generation-columns">
            <section><span>GB200 NVL72</span><dl><div><dt>Accelerators</dt><dd>72 B200 GPUs + 36 Grace CPUs</dd></div><div><dt>Scale-up</dt><dd>NVLink 5 · 1.8 TB/s per GPU</dd></div><div><dt>Rack aggregate</dt><dd>130 TB/s NVLink</dd></div><div><dt>Memory</dt><dd>HBM3e on the Blackwell package</dd></div></dl></section>
            <section><span>Vera Rubin NVL72</span><dl><div><dt>Accelerators</dt><dd>72 Rubin GPUs + 36 Vera CPUs</dd></div><div><dt>Scale-up</dt><dd>NVLink 6 · 3.6 TB/s per GPU</dd></div><div><dt>Rack aggregate</dt><dd>260 TB/s NVLink</dd></div><div><dt>GPU memory</dt><dd>288 GB HBM4 · up to 22 TB/s</dd></div></dl></section>
          </div>
          <p class="claim-note"><strong>Source boundary:</strong> Rubin figures are NVIDIA specifications and platform claims published in July 2026. The public DSX reference design names Vera Rubin NVL72, while some detailed integration documents remain behind NVOnline. <a href="https://developer.nvidia.com/blog/inside-nvidia-rubin-gpu-architecture-powering-the-era-of-agentic-ai/" target="_blank" rel="noreferrer">Rubin architecture brief</a></p>
        </div>

        <div class="reading-grid">
          <div class="prose">
            <h3>The path of a tensor across the rack</h3>
            <ol class="numbered-flow">
              <li><span>1</span><p>A kernel writes a shard from registers through the SM data path to HBM or directly into communication buffers.</p></li>
              <li><span>2</span><p>NVLink moves flits over short-reach copper into one of eighteen NVSwitch ASICs.</p></li>
              <li><span>3</span><p>The switch forwards traffic toward a peer GPU without involving its Grace CPU in the data plane.</p></li>
              <li><span>4</span><p>NCCL schedules collectives such as all-reduce, all-gather, reduce-scatter, and all-to-all across this topology.</p></li>
            </ol>
            <p>Beyond the NVL72 domain, ConnectX adapters carry scale-out traffic over InfiniBand or Ethernet. That boundary changes bandwidth, latency, routing, congestion behavior, and failure modes.</p>
          </div>
          <aside class="margin-note">
            <span>Bandwidth is directional</span>
            <p>“1.8 TB/s per GPU” is NVIDIA’s aggregate bidirectional fifth-generation NVLink figure. Always ask whether a number is per direction, bidirectional, payload, signaling, per port, per device, or aggregate.</p>
            <a href="https://docs.nvidia.com/dgx-superpod/reference-architecture-scalable-infrastructure-gb200/latest/network-fabrics.html" target="_blank" rel="noreferrer">NVIDIA fabric guide</a>
          </aside>
        </div>

        <div class="fiber-primer wide-figure">
          <div class="fiber-copy">
            <span>Signal primer</span><h3>Copper inside the rack; optics when reach wins</h3>
            <p>Bits begin as voltage transitions. A SerDes converts parallel chip data into high-rate serial lanes. Copper carries electrical symbols cheaply over short runs. Optical transceivers modulate light for longer reach and better distance–bandwidth, then photodiodes recover an electrical signal.</p>
          </div>
          <div class="fiber-path" aria-label="Electrical to optical signal path">
            <div><i class="die-icon"></i><span>GPU</span><small>parallel data</small></div><b>→</b>
            <div><i class="serdes-icon"></i><span>SerDes</span><small>serial symbols</small></div><b>→</b>
            <div><i class="optic-icon"></i><span>transceiver</span><small>laser modulation</small></div><b class="light-path">⟿</b>
            <div><i class="fiber-icon"></i><span>fiber</span><small>light + loss</small></div><b class="light-path">⟿</b>
            <div><i class="switch-icon"></i><span>switch</span><small>recover + route</small></div>
          </div>
          <dl class="fiber-terms"><div><dt>Lane</dt><dd>One serial transmit/receive path.</dd></div><div><dt>PAM4</dt><dd>Four voltage levels encode two bits per symbol.</dd></div><div><dt>FEC</dt><dd>Redundant coding corrects a bounded number of bit errors.</dd></div><div><dt>Transceiver</dt><dd>Pluggable or co-packaged electrical–optical conversion.</dd></div></dl>
        </div>
      </section>

      <section class="chapter" id="inference" data-chapter="Inference">
        <div class="chapter-number">07</div>
        <div class="chapter-title">
          <p class="chapter-kicker">Inference architecture</p>
          <h2>Prefill is a matrix problem. Decode is a memory-and-scheduling problem.</h2>
          <p class="chapter-summary">A serving engine converts irregular requests into efficient batches, places their KV blocks, chooses kernels, coordinates replicas, and streams tokens while meeting latency targets.</p>
        </div>

        <div class="prefill-decode wide-figure">
          <div class="lab-head"><figcaption><span>Interactive 7.1</span><strong>One request, two operating regimes</strong><p>Step through a prompt, then decode. Watch arithmetic parallelism collapse to one new position per sequence.</p></figcaption><button type="button" data-inference-step>Advance one phase</button></div>
          <div class="phase-track" data-phase-track>
            <div class="phase prefill is-active"><span>Prefill</span><strong>Prompt positions in parallel</strong><div class="token-line"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><small>Large GEMMs · high arithmetic intensity · writes KV</small></div>
            <div class="phase decode"><span>Decode</span><strong>One position, repeatedly</strong><div class="token-line"><i class="cached"></i><i class="cached"></i><i class="cached"></i><i class="cached"></i><i class="new"></i></div><small>Small GEMMs/GEMVs · reads growing KV · latency-sensitive</small></div>
          </div>
          <div class="phase-readout" data-phase-readout><strong>Time to first token (TTFT)</strong><p>Prefill processes the whole prompt and creates a key/value entry for each layer and position. Longer prompts raise TTFT.</p></div>
        </div>

        <div class="kv-lab wide-figure">
          <div class="lab-head"><figcaption><span>Interactive 7.2</span><strong>KV-cache memory calculator</strong><p>Estimate one sequence before allocator overhead and fragmentation.</p></figcaption></div>
          <div class="kv-controls">
            <label>Layers <input type="number" min="1" max="256" value="80" data-kv-layers /></label>
            <label>KV heads <input type="number" min="1" max="128" value="8" data-kv-heads /></label>
            <label>Head dimension <input type="number" min="16" max="512" step="16" value="128" data-kv-dim /></label>
            <label>Context tokens <input type="number" min="1" max="1000000" value="32768" data-kv-tokens /></label>
            <label>Bytes / element <select data-kv-bytes><option value="2">2 · BF16/FP16</option><option value="1">1 · FP8/INT8</option><option value="4">4 · FP32</option></select></label>
          </div>
          <div class="kv-result">
            <div><span>Per token</span><strong data-kv-per-token>320 KiB</strong></div>
            <div><span>Per sequence</span><strong data-kv-total>10.00 GiB</strong></div>
            <div><span>16-token blocks</span><strong data-kv-blocks>2,048</strong></div>
          </div>
          <div class="kv-formula"><code>2 × layers × kv_heads × head_dim × tokens × bytes</code><p>The leading 2 stores both keys and values. GQA lowers <code>kv_heads</code>; MLA and recurrent attention change what is cached.</p></div>
        </div>

        <div class="reading-grid">
          <div class="prose">
            <h3>What vLLM contributes</h3>
            <p>vLLM’s original PagedAttention insight applies operating-system-style paging to KV memory: a sequence owns logical blocks that map to non-contiguous physical blocks. The engine can append, share, and reclaim cache without reserving one large contiguous region per request.</p>
            <p>The modern serving loop also performs continuous batching, selects waiting and running sequences, budgets token work, executes model shards, samples outputs, and returns streams. Prefix caching reuses identical prompt blocks; chunked prefill prevents a very long prompt from monopolizing a scheduling iteration.</p>
          </div>
          <aside class="margin-note">
            <span>Three latency metrics</span>
            <dl><div><dt>TTFT</dt><dd>Arrival to first output token.</dd></div><div><dt>TPOT</dt><dd>Average time between output tokens.</dd></div><div><dt>E2E</dt><dd>Arrival to completed response.</dd></div></dl>
            <p>Throughput without a latency service-level objective is an incomplete serving result.</p>
          </aside>
        </div>

        <figure class="wide-figure vllm-flow">
          <figcaption><span>Figure 7.3</span><strong>A request through a vLLM-style engine</strong><p>Control-plane arrows are thin; the repeated device execution path is blue.</p></figcaption>
          <div class="request-flow">
            <div><span>API</span><small>tokenize + validate</small></div><i>→</i>
            <div><span>scheduler</span><small>token budget</small></div><i>→</i>
            <div><span>block manager</span><small>map logical KV</small></div><i>→</i>
            <div class="active"><span>model executor</span><small>shards + kernels</small></div><i>→</i>
            <div><span>sampler</span><small>choose token</small></div><i class="return-arrow">↶</i>
          </div>
          <div class="omission"><strong>Version boundary:</strong> vLLM internals evolve quickly. This is the stable conceptual request path; exact class names, scheduler policies, and kernel backends depend on the checked-out release.</div>
        </figure>

        <div class="speculative-section">
          <div class="spec-copy">
            <span>Speculative decoding</span><h3>Spend cheap guesses to reduce serial target-model steps</h3>
            <p>A draft proposes several tokens. The target verifies them together. Accepted tokens preserve the target distribution under the algorithm’s sampling rule; a rejection triggers a corrected sample. Speedup depends on acceptance rate, draft cost, verification efficiency, and serving load.</p>
          </div>
          <div class="spec-lab" data-spec-lab>
            <div class="draft-row"><span>draft</span><i>A</i><i>B</i><i>C</i><i>D</i><i>E</i></div>
            <div class="verify-row"><span>target</span><i class="accepted">✓</i><i class="accepted">✓</i><i class="accepted">✓</i><i class="rejected">×</i><i></i></div>
            <label>Acceptance rate <output data-accept-output>70%</output><input type="range" min="10" max="100" value="70" data-acceptance /></label>
            <div class="spec-result"><span>Illustrative effective advance</span><strong data-effective-tokens>3.8 tokens / verify step</strong></div>
          </div>
        </div>

        <div class="code-study">
          <div class="code-heading"><div><span>Serving lab</span><h3>Start a vLLM OpenAI-compatible server</h3></div><button class="copy-button" type="button" data-copy-target="vllm-code">Copy code</button></div>
          <pre id="vllm-code"><code><span class="cm"># Pin a tested release in production; flags change over time.</span>
vllm serve MODEL_ID \\
  --tensor-parallel-size <span class="num">8</span> \\
  --max-model-len <span class="num">32768</span> \\
  --gpu-memory-utilization <span class="num">0.90</span> \\
  --enable-prefix-caching

<span class="cm"># Measure TTFT, TPOT, E2E latency, token throughput, queue time,</span>
<span class="cm"># KV occupancy, preemption/recompute, and per-rank utilization.</span></code></pre>
          <div class="code-notes"><span>Architecture choice</span><p>Tensor parallelism lowers per-GPU weight and compute load but adds a collective inside each layer. Choose it with topology awareness; “more GPUs” can make a latency-sensitive model slower.</p></div>
        </div>
      </section>

      <section class="chapter" id="lpu" data-chapter="LPU">
        <div class="chapter-number">08</div>
        <div class="chapter-title">
          <p class="chapter-kicker">Language Processing Unit</p>
          <h2>The Groq LPU moves the scheduler into the compiler</h2>
          <p class="chapter-summary">The published first-generation Tensor Streaming Processor is a single-core, functionally sliced SIMD machine with a flat, software-addressed SRAM system and deterministic instruction/data movement.</p>
        </div>

        <div class="three-lab wide-figure">
          <div class="three-head">
            <figcaption><span>Interactive 8.1</span><strong>LPU tensor-streaming cutaway</strong><p>Drag to orbit. Select memory, matrix, vector, switch, or instruction slices; run a pulse to see operands cross the chip.</p></figcaption>
            <div class="three-controls"><button type="button" data-lpu-pulse>Run tensor pulse</button><button type="button" data-lpu-view="flow" class="is-active">Data flow</button><button type="button" data-lpu-view="units">Functional slices</button><button type="button" data-lpu-reset>Reset view</button></div>
          </div>
          <div class="three-stage">
            <div id="lpu-scene" class="scene-canvas" role="img" aria-label="Interactive conceptual 3D model of a Groq Tensor Streaming Processor"></div>
            <div class="scene-inspector" id="lpu-inspector" aria-live="polite"><span>Selected / architecture</span><h3>Tensor Streaming Processor</h3><p>Instructions flow vertically through independent control queues while tensor operands flow horizontally through stream registers and functional slices.</p><dl><div><dt>Schedule</dt><dd>cycle-accurate, compile time</dd></div><div><dt>Memory</dt><dd>distributed on-die SRAM</dd></div></dl></div>
          </div>
          <div class="scene-key"><span><i class="key-memory"></i> MEM / SRAM</span><span><i class="key-compute"></i> MXM + VXM</span><span><i class="key-fabric"></i> SXM / streams</span><span>Based on Groq’s 2020 and 2022 ISCA papers</span></div>
        </div>

        <div class="lpu-principles">
          <article><span>Compiler</span><h3>Static placement and time</h3><p>The compiler knows which unit performs each operation, where operands live, and the cycle in which transfers occur. This removes caches, dynamic warp scheduling, and most arbitration from the critical plan.</p></article>
          <article><span>Memory</span><h3>Flat, distributed SRAM</h3><p>The published first-generation chip exposes roughly 220 MiB of globally addressable SRAM (230 MB in the product sheet), physically distributed across memory slices, with no conventional L1/L2/L3 cache hierarchy.</p></article>
          <article><span>Execution</span><h3>Functional slices</h3><p>Matrix units, vector units, memory units, and switch/reshape units form a one-dimensional producer–consumer pipeline. Independent instruction queues drive slices in lockstep.</p></article>
          <article><span>Scale</span><h3>Chip as endpoint and switch</h3><p>Direct chip links extend streams into a software-routed fabric. Adding chips contributes compute, SRAM, and link bandwidth, though very large models necessarily distribute weights and communication.</p></article>
        </div>

        <div class="engine-boundary">
          <div><span>GPU serving</span><h3>vLLM schedules dynamic work onto GPU kernels</h3><p>The engine manages requests, paged KV blocks, batches, model shards, and kernels around GPU HBM and CUDA execution. Scheduling adapts continuously because arrivals and output lengths are unknown.</p></div>
          <div class="boundary-mark" aria-hidden="true"><i></i><span>same model<br/>different execution contract</span><i></i></div>
          <div><span>LPU serving</span><h3>GroqWare compiles tensor flow onto a deterministic fabric</h3><p>The compiler assigns operations, SRAM locations, and transfers to LPU cycles. A cloud service still routes requests and manages admission, but the chip program does not become vLLM merely because both serve an OpenAI-compatible API.</p></div>
        </div>

        <div class="current-hardware-note">
          <span>What is public now</span>
          <p>The detailed cutaway above models the peer-reviewed 2020/2022 TSP. NVIDIA’s 2026 Groq 3 LPX page lists 256 next-generation LPUs per rack, 128 GB of aggregate on-chip SRAM, 40 PB/s SRAM bandwidth, and 315 PFLOPS of FP8 inference compute. A comparable Groq 3 microarchitecture disclosure is not yet public, so this atlas does not project first-generation tile counts onto the new chip.</p>
          <a href="https://groq.com/platform" target="_blank" rel="noreferrer">Current Groq platform specifications</a>
        </div>

        <div class="comparison-table" role="table" aria-label="CPU GPU and LPU architectural comparison">
          <div class="comparison-row table-head"><span>Question</span><span>CPU</span><span>GPU</span><span>Groq LPU / TSP</span></div>
          <div class="comparison-row"><strong>Who schedules?</strong><span>Out-of-order hardware + OS</span><span>Hardware warp schedulers + kernels</span><span>Cycle-aware compiler</span></div>
          <div class="comparison-row"><strong>Primary memory idea</strong><span>Coherent cache hierarchy + DRAM</span><span>Registers/shared/L2 + HBM</span><span>Software-addressed on-chip SRAM</span></div>
          <div class="comparison-row"><strong>Best-shaped work</strong><span>Branchy, serial, control-heavy</span><span>Parallel training and high-throughput inference</span><span>Compiled, regular, low-latency inference</span></div>
          <div class="comparison-row"><strong>Flexibility cost</strong><span>More control silicon</span><span>Dynamic scheduling and memory hierarchy</span><span>Compiler constraints and distributed model placement</span></div>
        </div>

        <div class="claim-box">
          <span>Separate architecture from marketing</span>
          <p>Determinism and explicit SRAM are architectural facts documented in peer-reviewed papers. Token rates, energy advantages, and comparisons to a GPU depend on model, precision, batch, context, system size, software version, and measurement boundary. The atlas records those as dated vendor or benchmark claims—not properties guaranteed by the word “LPU.”</p>
        </div>
      </section>

      <section class="chapter glossary-chapter" id="glossary" data-chapter="Glossary">
        <div class="chapter-number">09</div>
        <div class="chapter-title">
          <p class="chapter-kicker">Working vocabulary</p>
          <h2>The system in one hundred precise terms</h2>
          <p class="chapter-summary">Short definitions for reading papers, profiler traces, architecture guides, and source code. Each term answers both “what is it?” and “why does an inference engineer care?”</p>
        </div>
        <div class="glossary-toolbar" data-glossary-toolbar>
          <label>Find a term<input type="search" placeholder="Search SM, all-reduce, TTFT…" data-glossary-search /></label>
          <div class="glossary-filters" role="group" aria-label="Filter glossary by domain">
            <button type="button" class="is-active" data-glossary-filter="all">All</button>
            <button type="button" data-glossary-filter="hardware">Hardware</button>
            <button type="button" data-glossary-filter="cuda">CUDA</button>
            <button type="button" data-glossary-filter="performance">Performance</button>
            <button type="button" data-glossary-filter="training">Training</button>
            <button type="button" data-glossary-filter="inference">Inference</button>
            <button type="button" data-glossary-filter="network">Network</button>
          </div>
          <span data-glossary-count>Loading terms…</span>
        </div>
        <div class="glossary-list" data-glossary-list></div>
        <div class="glossary-empty" data-glossary-empty hidden>No term matches that filter.</div>
      </section>

      <section class="chapter sources-chapter" id="sources" data-chapter="Sources">
        <div class="chapter-number">10</div>
        <div class="chapter-title">
          <p class="chapter-kicker">Source ledger</p>
          <h2>Read outward from the atlas</h2>
          <p class="chapter-summary">The guide prefers primary papers, model cards, code repositories, and official architecture documentation. “Checked” is when this edition last verified the linked claim.</p>
        </div>

        <div class="source-toolbar">
          <label for="source-search">Filter the ledger</label>
          <input id="source-search" type="search" placeholder="Try attention, rack, vLLM, LPU…" data-source-search />
          <span data-source-count>20 sources</span>
        </div>

        <div class="source-ledger" data-source-ledger>
          <article data-search="transformer attention foundations"><span>Foundations · 2017</span><h3>Attention Is All You Need</h3><p>Original encoder–decoder Transformer and scaled dot-product multi-head attention.</p><a href="https://arxiv.org/abs/1706.03762" target="_blank" rel="noreferrer">Vaswani et al.</a></article>
          <article data-search="tensorflow transformer tutorial code"><span>Framework · checked 2026-09</span><h3>TensorFlow Transformer tutorial</h3><p>Official TensorFlow implementation and shape conventions.</p><a href="https://www.tensorflow.org/text/tutorials/transformer" target="_blank" rel="noreferrer">TensorFlow</a></article>
          <article data-search="flashattention io hbm sram kernel"><span>Kernels · 2022</span><h3>FlashAttention</h3><p>Exact attention organized around IO complexity and SRAM tiling.</p><a href="https://arxiv.org/abs/2205.14135" target="_blank" rel="noreferrer">Dao et al.</a></article>
          <article data-search="gqa grouped query attention kv cache"><span>Architecture · 2023</span><h3>GQA</h3><p>Grouped-query attention between multi-head and multi-query attention.</p><a href="https://arxiv.org/abs/2305.13245" target="_blank" rel="noreferrer">Ainslie et al.</a></article>
          <article data-search="deepseek v3 mla latent attention moe"><span>Architecture · 2024</span><h3>DeepSeek‑V3 Technical Report</h3><p>Multi-head latent attention, fine-grained MoE, and large-scale training system.</p><a href="https://arxiv.org/abs/2412.19437" target="_blank" rel="noreferrer">DeepSeek-AI</a></article>
          <article data-search="sparse attention nsa deepseek long context"><span>Architecture · 2025</span><h3>Native Sparse Attention</h3><p>Hardware-aligned, trainable hierarchical token selection for long context.</p><a href="https://arxiv.org/abs/2502.11089" target="_blank" rel="noreferrer">Yuan et al.</a></article>
          <article data-search="kimi linear kda delta recurrent hybrid mla"><span>Architecture · 2025</span><h3>Kimi Linear</h3><p>KDA recurrent memory, chunkwise algorithm, and hybrid KDA/MLA results.</p><a href="https://arxiv.org/abs/2510.26692" target="_blank" rel="noreferrer">Kimi Team</a></article>
          <article data-search="kimi k3 attention residual moe moonshot"><span>Architecture · 2026</span><h3>Kimi K3 Technical Report</h3><p>KDA + gated MLA, attention residuals, latent MoE, training and post-training.</p><a href="https://github.com/MoonshotAI/Kimi-K3" target="_blank" rel="noreferrer">Moonshot AI</a></article>
          <article data-search="glm 5.3 flash sparse linear attention"><span>Model card · checked 2026-09-03</span><h3>GLM‑5.3 Flash</h3><p>New hybrid sparse/linear architecture and current serving support.</p><a href="https://huggingface.co/zai-org/GLM-5.3-Flash" target="_blank" rel="noreferrer">Z.ai</a></article>
          <article data-search="scaling laws chinchilla tokens compute"><span>Pre-training · 2022</span><h3>Training Compute-Optimal LLMs</h3><p>Compute-budget tradeoff between model size and training tokens.</p><a href="https://arxiv.org/abs/2203.15556" target="_blank" rel="noreferrer">Hoffmann et al.</a></article>
          <article data-search="megatron distributed training tensor pipeline parallel"><span>Training systems · 2021</span><h3>Megatron‑LM at scale</h3><p>Efficient tensor, pipeline, and data-parallel composition.</p><a href="https://arxiv.org/abs/2104.04473" target="_blank" rel="noreferrer">Narayanan et al.</a></article>
          <article data-search="zero optimizer memory sharding training"><span>Training systems · 2019</span><h3>ZeRO</h3><p>Partitioning optimizer states, gradients, and parameters across data-parallel ranks.</p><a href="https://arxiv.org/abs/1910.02054" target="_blank" rel="noreferrer">Rajbhandari et al.</a></article>
          <article data-search="rlhf instructgpt post training human feedback"><span>Post-training · 2022</span><h3>InstructGPT</h3><p>SFT, reward modeling, and PPO-based RLHF pipeline.</p><a href="https://arxiv.org/abs/2203.02155" target="_blank" rel="noreferrer">Ouyang et al.</a></article>
          <article data-search="dpo direct preference optimization post training"><span>Post-training · 2023</span><h3>Direct Preference Optimization</h3><p>A classification-style preference objective derived from the RLHF reward model.</p><a href="https://arxiv.org/abs/2305.18290" target="_blank" rel="noreferrer">Rafailov et al.</a></article>
          <article data-search="deepseek r1 rlvr reasoning post training grpo"><span>Post-training · 2025</span><h3>DeepSeek‑R1</h3><p>Reasoning behavior developed with large-scale reinforcement learning and verifiable tasks.</p><a href="https://arxiv.org/abs/2501.12948" target="_blank" rel="noreferrer">DeepSeek-AI</a></article>
          <article data-search="nvidia blackwell gpu sm architecture cuda programming guide"><span>Hardware · checked 2026-09</span><h3>CUDA Programming Guide</h3><p>Thread hierarchy, execution model, memory spaces, and compute capability.</p><a href="https://docs.nvidia.com/cuda/cuda-c-programming-guide/" target="_blank" rel="noreferrer">NVIDIA</a></article>
          <article data-search="gb200 nvl72 rack nvlink nvswitch grace blackwell"><span>Hardware · checked 2026-09</span><h3>DGX GB200 SuperPOD architecture</h3><p>Compute trays, NVLink switch trays, rack composition, and network fabrics.</p><a href="https://docs.nvidia.com/dgx-superpod/reference-architecture-scalable-infrastructure-gb200/latest/dgx-superpod-components.html" target="_blank" rel="noreferrer">NVIDIA</a></article>
          <article data-search="vera rubin nvl72 nvlink 6 hbm4 gpu architecture"><span>Hardware · checked 2026-09</span><h3>Rubin GPU architecture</h3><p>Rubin SM count, HBM4 capacity and bandwidth, NVLink 6, and Vera Rubin NVL72 context.</p><a href="https://developer.nvidia.com/blog/inside-nvidia-rubin-gpu-architecture-powering-the-era-of-agentic-ai/" target="_blank" rel="noreferrer">NVIDIA</a></article>
          <article data-search="vllm pagedattention kv cache serving"><span>Inference · 2023</span><h3>Efficient Memory Management for LLM Serving</h3><p>The PagedAttention paper underlying vLLM’s original cache-management design.</p><a href="https://arxiv.org/abs/2309.06180" target="_blank" rel="noreferrer">Kwon et al.</a></article>
          <article data-search="speculative decoding draft target inference"><span>Inference · 2022</span><h3>Fast Inference via Speculative Decoding</h3><p>Lossless acceleration using a draft model and parallel target verification.</p><a href="https://arxiv.org/abs/2211.17192" target="_blank" rel="noreferrer">Leviathan et al.</a></article>
          <article data-search="groq lpu tsp tensor streaming processor sram deterministic"><span>Hardware · 2020</span><h3>Think Fast: Tensor Streaming Processor</h3><p>Peer-reviewed first-generation TSP microarchitecture, memory, and programming model.</p><a href="https://doi.org/10.1109/ISCA45697.2020.00023" target="_blank" rel="noreferrer">Abts et al.</a></article>
          <article data-search="groq lpu tsp scale out dragonfly deterministic network"><span>Hardware · 2022</span><h3>Software-defined Tensor Streaming Multiprocessor</h3><p>Multi-chip programming, global SRAM semantics, and deterministic routing.</p><a href="https://doi.org/10.1145/3470496.3527405" target="_blank" rel="noreferrer">Abts et al.</a></article>
          <article data-search="groq 3 lpu lpx rack sram current platform"><span>Hardware · checked 2026-09</span><h3>Groq 3 LPX platform</h3><p>Current rack-level product specifications; architectural details remain limited.</p><a href="https://groq.com/platform" target="_blank" rel="noreferrer">Groq</a></article>
          <article data-search="modal gpu glossary cuda hardware software performance"><span>Coverage reference · checked 2026-09</span><h3>Modal GPU Glossary</h3><p>GPU vocabulary checklist spanning hardware, CUDA software, memory, and performance.</p><a href="https://modal.com/gpu-glossary/readme" target="_blank" rel="noreferrer">Modal</a></article>
        </div>

        <div class="next-edition">
          <span>Editorial status</span>
          <h3>This is the first complete vertical slice, not the end of the textbook.</h3>
          <p>The information architecture, foundational chapters, source discipline, simulations, and three machine models are in place. Subsequent editions deepen each chapter with derivations, exercises, profiler traces, more kernels, exact topology maps, and versioned implementation notes.</p>
          <a href="#top">Return to the top</a>
        </div>
      </section>
    </main>
  </div>

  <footer>
    <p>The Inference Engineering Atlas</p>
    <p>Original explanations and diagrams. Primary sources linked at the claim.</p>
    <p>Edition 0.1 · September 2026</p>
  </footer>
`;
