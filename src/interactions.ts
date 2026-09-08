type AttentionMode = "causal" | "sliding" | "sparse" | "hybrid" | "kda";
type ParallelMode = "data" | "tensor" | "pipeline" | "context" | "expert";

const qs = <T extends Element>(selector: string, root: ParentNode = document) =>
  root.querySelector<T>(selector);

const qsa = <T extends Element>(selector: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(selector));

const scrollToId = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
};

function initNavigation() {
  const topbar = qs<HTMLElement>("[data-topbar]");
  const index = qs<HTMLElement>("#chapter-index");
  const toggle = qs<HTMLButtonElement>("[data-index-toggle]");
  const progress = qs<HTMLElement>("[data-progress-bar]");
  const progressLabel = qs<HTMLElement>("[data-progress-label]");
  const links = qsa<HTMLAnchorElement>("[data-nav-section]");
  const sections = qsa<HTMLElement>("[data-chapter]");
  const smallScreen = window.matchMedia("(max-width: 820px)");
  const syncIndexAccess = () => {
    if (index) index.inert = smallScreen.matches && !index.classList.contains("is-open");
  };
  syncIndexAccess();
  smallScreen.addEventListener("change", syncIndexAccess);

  toggle?.addEventListener("click", () => {
    const isOpen = index?.classList.toggle("is-open") ?? false;
    toggle.setAttribute("aria-expanded", String(isOpen));
    syncIndexAccess();
    if (isOpen && smallScreen.matches) links[0]?.focus();
  });

  links.forEach((link) => link.addEventListener("click", () => {
    index?.classList.remove("is-open");
    toggle?.setAttribute("aria-expanded", "false");
    syncIndexAccess();
  }));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && index?.classList.contains("is-open")) {
      index.classList.remove("is-open");
      toggle?.setAttribute("aria-expanded", "false");
      toggle?.focus();
      syncIndexAccess();
    }
  });

  let lastScrollY = window.scrollY;
  let activeChapter = "";
  const updateProgress = () => {
    const doc = document.documentElement;
    const range = Math.max(1, doc.scrollHeight - window.innerHeight);
    const ratio = Math.min(1, window.scrollY / range);
    if (progress) progress.style.width = `${ratio * 100}%`;
    if (topbar) {
      topbar.classList.toggle("is-compact", window.scrollY > lastScrollY && window.scrollY > 180);
      lastScrollY = window.scrollY;
    }
    // Long textbook chapters can exceed an IntersectionObserver's ratio band.
    // Use the last chapter start above the reading line, independent of height.
    const readingLine = Math.min(200, window.innerHeight * 0.25);
    const section = [...sections].reverse().find((item) => item.getBoundingClientRect().top <= readingLine) ?? sections[0];
    if (section && section.id !== activeChapter) {
      activeChapter = section.id;
      links.forEach((link) => {
        const active = link.dataset.navSection === activeChapter;
        link.classList.toggle("is-active", active);
        if (active) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
      if (progressLabel) progressLabel.textContent = section.dataset.chapter ?? "Atlas";
    }
  };
  updateProgress();
  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);
  new ResizeObserver(updateProgress).observe(document.body);
}

function initHero() {
  const stages = qsa<HTMLElement>("[data-stage-target]");
  stages.forEach((stage) => {
    qs<HTMLButtonElement>("button", stage)?.addEventListener("click", () => scrollToId(stage.dataset.stageTarget ?? "top"));
  });

  qsa<HTMLButtonElement>("[data-scroll]").forEach((button) => {
    button.addEventListener("click", () => scrollToId(button.dataset.scroll ?? "top"));
  });

  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    let active = 0;
    window.setInterval(() => {
      stages[active]?.classList.remove("is-active");
      active = (active + 1) % stages.length;
      stages[active]?.classList.add("is-active");
    }, 2000);
  }
}

function initTensorFigure() {
  const stack = qs<HTMLElement>(".tensor-stack");
  const caption = qs<HTMLElement>("[data-tensor-caption]");
  const copy: Record<string, string> = {
    shape: "Each plane is one token position; features run across, sequences run into the page.",
    layout: "The same logical tensor can be row-major, tiled, transposed, or padded. Kernels care because contiguous requests combine into fewer memory transactions.",
    shard: "A distributed tensor adds a device-mesh mapping: each color owns a slice, while collectives reconstruct or reduce the logical value."
  };
  qsa<HTMLButtonElement>("[data-tensor-view]").forEach((button) => {
    button.addEventListener("click", () => {
      const view = button.dataset.tensorView ?? "shape";
      qsa<HTMLButtonElement>("[data-tensor-view]").forEach((item) => item.classList.toggle("is-active", item === button));
      if (stack) stack.dataset.view = view;
      if (caption) caption.textContent = copy[view] ?? copy.shape;
    });
  });
}

function initTransformerTrace() {
  const button = qs<HTMLButtonElement>("[data-transformer-play]");
  const nodes = qsa<HTMLButtonElement>("[data-step]");
  const rail = qs<HTMLElement>(".pipeline-rail i");
  const status = qs<HTMLElement>("[data-transformer-status]");
  const readout = qs<HTMLElement>("[data-pipeline-readout]");
  const steps = [
    ["Residual stream", "Shape stays [B, T, D]. This shared stream carries token representations through every layer."],
    ["RMS normalization", "Normalize magnitude before the sub-layer so depth remains numerically stable; learned scales preserve channel control."],
    ["Causal attention", "Project Q, K, and V, apply position handling and a causal mask, then mix information from allowed prior positions."],
    ["Residual addition", "Add the attention update to the original stream. The sub-layer proposes a change instead of replacing state."],
    ["Second normalization", "Prepare the updated stream for the token-wise feed-forward transformation."],
    ["SwiGLU feed-forward", "Expand each token independently, gate the hidden channels, then project back to width D."],
    ["Next layer", "Add the MLP update. The tensor keeps shape [B, T, D] and advances to the next block or final normalization."]
  ];
  let running = false;

  const showStep = (step: number) => {
    nodes.forEach((node, index) => {
      node.classList.toggle("is-active", index === step);
      node.classList.toggle("is-done", index < step);
    });
    if (rail) rail.style.width = `${(step / Math.max(1, nodes.length - 1)) * 100}%`;
    if (status) status.textContent = steps[step]?.[0] ?? "Ready";
    if (readout && steps[step]) readout.innerHTML = `<strong>${steps[step][0]}</strong><p>${steps[step][1]}</p>`;
  };

  nodes.forEach((node, index) => node.addEventListener("click", () => showStep(index)));
  button?.addEventListener("click", async () => {
    if (running) return;
    running = true;
    button.disabled = true;
    for (let step = 0; step < nodes.length; step += 1) {
      showStep(step);
      await new Promise((resolve) => window.setTimeout(resolve, 620));
    }
    button.disabled = false;
    button.textContent = "Trace again";
    running = false;
  });
}

function initAttentionLab() {
  const canvas = qs<HTMLCanvasElement>("[data-attention-canvas]");
  const modeInput = qs<HTMLSelectElement>("[data-attention-mode]");
  const tokenInput = qs<HTMLInputElement>("[data-token-count]");
  const tokenOutput = qs<HTMLOutputElement>("[data-token-output]");
  const pairOutput = qs<HTMLElement>("[data-pair-count]");
  const complexityOutput = qs<HTMLElement>("[data-complexity]");
  const description = qs<HTMLElement>("[data-attention-description]");
  if (!canvas || !modeInput || !tokenInput) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const descriptions: Record<AttentionMode, [string, string]> = {
    causal: ["O(T²)", "Every query reads all earlier keys. Exact and general, but score work and KV traffic grow with context."],
    sliding: ["O(T × W)", "Each query reads a fixed recent window. Cost grows linearly with sequence length, but distant exact recall needs another path."],
    sparse: ["O(T × K)", "A small learned or rule-based set of keys is selected per query. The indexer adds work and can miss a useful token."],
    hybrid: ["mixed", "Three cheap recurrent mixers are followed by one content-addressed attention layer: a common way to restore lookup while containing cost."],
    kda: ["O(T × state)", "History is compressed into a fixed-size recurrent matrix state. Decode updates the state rather than revisiting every cached key."],
  };

  const canRead = (mode: AttentionMode, query: number, key: number, tokens: number) => {
    if (key > query) return false;
    if (mode === "causal") return true;
    if (mode === "sliding") return query - key < Math.max(3, Math.floor(tokens / 5));
    if (mode === "sparse") return key === 0 || query - key < 2 || ((key * 7 + query * 3) % Math.max(3, Math.floor(tokens / 4)) === 0);
    if (mode === "hybrid") return query % 4 === 3 ? true : key === 0 || key === query;
    return key === query;
  };

  const render = () => {
    const mode = modeInput.value as AttentionMode;
    const tokens = Number(tokenInput.value);
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    // A hybrid is a schedule across layers, not a different policy per query row.
    if (mode === "hybrid") {
      const left = 68;
      const step = (rect.width - left - 22) / tokens;
      ctx.font = "11px IBM Plex Sans, sans-serif";
      ctx.fillStyle = "#626760";
      ctx.fillText("token positions →", left, 28);
      for (let layer = 0; layer < 4; layer += 1) {
        const y = 64 + layer * 60;
        ctx.fillStyle = "#173b99";
        ctx.fillText(layer < 3 ? `KDA ${layer + 1}` : "Full 4", 12, y + 15);
        for (let token = 0; token < tokens; token += 1) {
          ctx.fillStyle = layer < 3 ? "#b9caff" : "#2559d6";
          ctx.fillRect(left + token * step + 1, y, Math.max(2, step - 3), 24);
          if (layer < 3 && token < tokens - 1) {
            ctx.strokeStyle = "#173b99"; ctx.beginPath();
            ctx.moveTo(left + (token + 1) * step - 2, y + 12);
            ctx.lineTo(left + (token + 1) * step + 1, y + 12); ctx.stroke();
          }
        }
      }
      ctx.fillStyle = "#626760"; ctx.font = "10px IBM Plex Sans, sans-serif";
      ctx.fillText("Each token passes through all four layers.", 16, 305);
      ctx.fillText("KDA: state. Full: causal access to prior K/V.", 16, 324);
      if (tokenOutput) tokenOutput.value = String(tokens);
      if (pairOutput) pairOutput.textContent = "3 recurrent + 1 full";
      if (complexityOutput) complexityOutput.textContent = "layer hybrid";
      if (description) description.textContent = descriptions.hybrid[1];
      return;
    }

    const padding = Math.max(32, Math.min(rect.width, rect.height) * 0.1);
    const size = Math.min(rect.width - padding * 2, rect.height - padding * 1.55);
    const cell = size / tokens;
    const originX = (rect.width - size) / 2;
    const originY = (rect.height - size) / 2 + 5;
    let pairs = 0;

    ctx.fillStyle = "#626760";
    ctx.font = "10px IBM Plex Sans, sans-serif";
    ctx.fillText("key position →", originX, Math.max(15, originY - 19));
    ctx.save();
    ctx.translate(Math.max(13, originX - 24), originY + size);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("query position", 0, 0);
    ctx.restore();

    for (let query = 0; query < tokens; query += 1) {
      for (let key = 0; key < tokens; key += 1) {
        const active = canRead(mode, query, key, tokens);
        if (active) pairs += 1;
        ctx.fillStyle = active ? (mode === "kda" ? "#173b99" : "#2559d6") : "rgba(98,103,96,.09)";
        const gap = tokens > 28 ? 0.5 : 1;
        ctx.fillRect(originX + key * cell + gap, originY + query * cell + gap, Math.max(1, cell - gap * 2), Math.max(1, cell - gap * 2));
      }
    }

    if (mode === "kda") {
      const stateX = Math.min(rect.width - 35, originX + size + 15);
      ctx.strokeStyle = "#2559d6";
      ctx.fillStyle = "#dbe5ff";
      ctx.fillRect(stateX, originY, 18, size);
      ctx.strokeRect(stateX, originY, 18, size);
      ctx.save();
      ctx.fillStyle = "#173b99";
      ctx.font = "9px IBM Plex Sans, sans-serif";
      ctx.translate(stateX + 15, originY + size / 2 + 28);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText("recurrent state", 0, 0);
      ctx.restore();
    }

    if (tokenOutput) tokenOutput.value = String(tokens);
    if (pairOutput) pairOutput.textContent = mode === "kda" ? `${tokens} state updates` : pairs.toLocaleString();
    if (complexityOutput) complexityOutput.textContent = descriptions[mode][0];
    if (description) description.textContent = descriptions[mode][1];
  };

  modeInput.addEventListener("change", render);
  tokenInput.addEventListener("input", render);
  new ResizeObserver(render).observe(canvas);
  render();
}

function initTrainingLoop() {
  const readout = qs<HTMLElement>("[data-training-readout]");
  const details: Record<string, [string, string]> = {
    batch: ["Batch and input pipeline", "Tokenized, shuffled, deduplicated sequences must arrive quickly enough that accelerators never wait. Packing reduces padding waste."],
    forward: ["Forward activations", "Weights are read and intermediate activations are produced. Attention scores, MLP intermediates, and residuals dominate memory unless recomputed."],
    loss: ["Loss and reductions", "Per-token cross entropy must be normalized consistently across masks, sequence shards, microbatches, and data-parallel ranks."],
    backward: ["Gradients", "Reverse-mode autodiff revisits the graph. Collective communication can overlap with gradient production when buckets become ready."],
    optimizer: ["Optimizer state", "AdamW updates weights from gradients plus first and second moments. Sharding removes redundant state at the cost of communication."],
  };
  qsa<HTMLButtonElement>("[data-training-stage]").forEach((button) => {
    const activate = () => {
      qsa<HTMLButtonElement>("[data-training-stage]").forEach((item) => item.classList.toggle("is-active", item === button));
      const detail = details[button.dataset.trainingStage ?? "batch"];
      if (readout && detail) readout.innerHTML = `<strong>${detail[0]}</strong><p>${detail[1]}</p>`;
    };
    button.addEventListener("mouseenter", activate);
    button.addEventListener("focus", activate);
    button.addEventListener("click", activate);
  });
}

function initParallelism() {
  const mesh = qs<HTMLElement>("[data-device-mesh]");
  const title = qs<HTMLElement>("[data-parallel-title]");
  const copy = qs<HTMLElement>("[data-parallel-copy]");
  const collective = qs<HTMLElement>("[data-parallel-collective]");
  if (!mesh) return;
  mesh.innerHTML = Array.from({ length: 8 }, (_, index) => `<div class="device-tile" data-gpu="${index}" style="--slice:${index + 1}"><span>replica ${index}</span></div>`).join("");

  const content: Record<ParallelMode, [string, string, string]> = {
    data: ["Data parallelism", "Every worker has the model and consumes different examples. Gradients are reduced before the optimizer step.", "collective: all-reduce / reduce-scatter"],
    tensor: ["Tensor parallelism", "One layer’s matrices are sliced across devices. Partial outputs communicate inside almost every Transformer block.", "collective: all-reduce / all-gather"],
    pipeline: ["Pipeline parallelism", "Consecutive layer groups live on different stages. Microbatches keep stages busy while activations cross stage boundaries.", "point-to-point: send / receive"],
    context: ["Context parallelism", "Sequence positions are split across devices. Attention requires ring or all-to-all-style exchange of key/value information.", "collective: ring exchange / all-to-all"],
    expert: ["Expert parallelism", "MoE experts are distributed. The router sends each token to selected experts and returns outputs to original positions.", "collective: all-to-all"],
  };

  const render = (mode: ParallelMode) => {
    const tiles = qsa<HTMLElement>(".device-tile", mesh);
    tiles.forEach((tile, index) => {
      tile.className = "device-tile";
      const label = qs<HTMLElement>("span", tile);
      if (!label) return;
      if (mode === "data") label.textContent = `model replica · batch ${index}`;
      if (mode === "tensor") { label.textContent = `weight shard ${index + 1}/8`; tile.classList.add("is-shard"); }
      if (mode === "pipeline") { label.textContent = `layers ${index * 10}–${index * 10 + 9}`; tile.classList.toggle("is-paired", index % 2 === 0); }
      if (mode === "context") { label.textContent = `tokens ${index}/8`; tile.classList.add("is-shard"); }
      if (mode === "expert") { label.textContent = `experts ${index * 8}–${index * 8 + 7}`; tile.classList.toggle("is-paired", index === 1 || index === 5); }
    });
    const detail = content[mode];
    if (title) title.textContent = detail[0];
    if (copy) copy.textContent = detail[1];
    if (collective) collective.textContent = detail[2];
  };

  qsa<HTMLButtonElement>("[data-parallel-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      qsa<HTMLButtonElement>("[data-parallel-mode]").forEach((item) => item.classList.toggle("is-active", item === button));
      render((button.dataset.parallelMode ?? "data") as ParallelMode);
    });
  });
  render("data");
}

function initRoofline() {
  const input = qs<HTMLInputElement>("[data-intensity]");
  const output = qs<HTMLOutputElement>("[data-intensity-output]");
  const point = qs<HTMLElement>("[data-roof-point]");
  const copy = qs<HTMLElement>("[data-roofline-copy]");
  if (!input || !point) return;
  const render = () => {
    const value = Number(input.value);
    const normalized = Math.log2(value) / 7;
    point.style.left = `${8 + normalized * 82}%`;
    const onSlope = normalized < 0.58;
    point.style.top = onSlope ? `${82 - normalized * 98}%` : "24%";
    if (output) output.value = String(value);
    if (copy) copy.textContent = onSlope
      ? "At this intensity, moving operands is likely to set the ceiling. Fuse operations or reuse tiles before chasing peak FLOPs."
      : "At this intensity, arithmetic throughput is more likely to set the ceiling. Improve instruction mix and tensor-core utilization.";
  };
  input.addEventListener("input", render);
  render();
}

function initInferenceLabs() {
  const stepButton = qs<HTMLButtonElement>("[data-inference-step]");
  const phases = qsa<HTMLElement>(".phase", qs("[data-phase-track]") ?? document);
  const readout = qs<HTMLElement>("[data-phase-readout]");
  let phase = 0;
  const details = [
    ["Time to first token (TTFT)", "Prefill processes the whole prompt and creates a key/value entry for each layer and position. Longer prompts raise TTFT."],
    ["Time per output token (TPOT)", "Decode repeatedly reads weights and the growing cache to produce one position per active sequence. Batching amortizes weight reads but can add queueing."],
  ];
  stepButton?.addEventListener("click", () => {
    phase = (phase + 1) % 2;
    phases.forEach((item, index) => item.classList.toggle("is-active", index === phase));
    if (readout) readout.innerHTML = `<strong>${details[phase][0]}</strong><p>${details[phase][1]}</p>`;
    stepButton.textContent = phase === 0 ? "Advance one phase" : "Return to prefill";
  });

  const layers = qs<HTMLInputElement>("[data-kv-layers]");
  const heads = qs<HTMLInputElement>("[data-kv-heads]");
  const dimension = qs<HTMLInputElement>("[data-kv-dim]");
  const tokens = qs<HTMLInputElement>("[data-kv-tokens]");
  const bytes = qs<HTMLSelectElement>("[data-kv-bytes]");
  const perToken = qs<HTMLElement>("[data-kv-per-token]");
  const total = qs<HTMLElement>("[data-kv-total]");
  const blocks = qs<HTMLElement>("[data-kv-blocks]");
  const formatBytes = (amount: number) => {
    if (amount >= 1024 ** 3) return `${(amount / 1024 ** 3).toFixed(2)} GiB`;
    if (amount >= 1024 ** 2) return `${(amount / 1024 ** 2).toFixed(2)} MiB`;
    return `${(amount / 1024).toFixed(1)} KiB`;
  };
  const renderKV = () => {
    const values = [layers, heads, dimension, tokens, bytes].map((input) => Number(input?.value ?? 0));
    const tokenBytes = 2 * values[0] * values[1] * values[2] * values[4];
    if (perToken) perToken.textContent = formatBytes(tokenBytes);
    if (total) total.textContent = formatBytes(tokenBytes * values[3]);
    if (blocks) blocks.textContent = Math.ceil(values[3] / 16).toLocaleString();
  };
  [layers, heads, dimension, tokens, bytes].forEach((input) => input?.addEventListener("input", renderKV));
  renderKV();

  const acceptance = qs<HTMLInputElement>("[data-acceptance]");
  const acceptOutput = qs<HTMLOutputElement>("[data-accept-output]");
  const effective = qs<HTMLElement>("[data-effective-tokens]");
  const resultCells = qsa<HTMLElement>(".verify-row i");
  const renderSpec = () => {
    const rate = Number(acceptance?.value ?? 70) / 100;
    const expected = 1 + rate + rate ** 2 + rate ** 3 + rate ** 4 + rate ** 5;
    if (acceptOutput) acceptOutput.value = `${Math.round(rate * 100)}%`;
    if (effective) effective.textContent = `${expected.toFixed(1)} tokens / verify step`;
    const acceptedCount = Math.round(rate * resultCells.length);
    resultCells.forEach((cell, index) => {
      cell.className = index < acceptedCount ? "accepted" : index === acceptedCount ? "rejected" : "";
      cell.textContent = index < acceptedCount ? "✓" : index === acceptedCount ? "×" : "";
    });
  };
  acceptance?.addEventListener("input", renderSpec);
  renderSpec();
}

function initSources() {
  const input = qs<HTMLInputElement>("[data-source-search]");
  const ledger = qs<HTMLElement>("[data-source-ledger]");
  const output = qs<HTMLElement>("[data-source-count]");
  if (!input || !ledger) return;
  const entries = qsa<HTMLElement>("article", ledger);
  const render = () => {
    const query = input.value.trim().toLowerCase();
    let visible = 0;
    entries.forEach((entry) => {
      const haystack = `${entry.dataset.search ?? ""} ${entry.textContent ?? ""}`.toLowerCase();
      const match = !query || haystack.includes(query);
      entry.hidden = !match;
      if (match) visible += 1;
    });
    if (output) output.textContent = `${visible} source${visible === 1 ? "" : "s"}`;
  };
  input.addEventListener("input", render);
  render();
}

function initCopyButtons() {
  qsa<HTMLButtonElement>("[data-copy-target]").forEach((button) => {
    button.addEventListener("click", async () => {
      const target = document.getElementById(button.dataset.copyTarget ?? "");
      if (!target) return;
      const original = button.textContent;
      try {
        await navigator.clipboard.writeText(target.textContent ?? "");
        button.textContent = "Copied";
      } catch {
        button.textContent = "Select code to copy";
      }
      window.setTimeout(() => { button.textContent = original; }, 1400);
    });
  });
}

export function initializeInteractions() {
  initNavigation();
  initHero();
  initTensorFigure();
  initTransformerTrace();
  initAttentionLab();
  initTrainingLoop();
  initParallelism();
  initRoofline();
  initInferenceLabs();
  initSources();
  initCopyButtons();
}
