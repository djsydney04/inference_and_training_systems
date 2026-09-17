import { escapeCode } from "./lesson-template";
import { TextStopFilter, reusableServingPrefix, type ServingPrefix } from "./framework-serving-math";

const quoted = (value: string) => escapeCode(JSON.stringify(value));

export function initializeFrameworkServingLabs() {
  const stopLab = document.getElementById("framework-stop-lab");
  if (stopLab && !stopLab.dataset.initialized) {
    stopLab.dataset.initialized = "true";
    const find = <T extends HTMLElement>(selector: string) => stopLab.querySelector<T>(selector)!;
    const render = () => {
      const scenario = find<HTMLSelectElement>("[data-serving-stop-scenario]").value;
      const delivery = find<HTMLSelectElement>("[data-serving-stop-chunks]").value;
      const pieces = scenario === "match" ? ["Hel", "lo ", "<EN", "D>ignored"] : scenario === "unfinished" ? ["Hel", "lo ", "<EN"] : ["Hel", "lo ", "<EN", "O>"];
      const allText = pieces.join("");
      const chunks = delivery === "whole" ? [allText] : delivery === "characters" ? Array.from(allText) : pieces;
      const stepInput = find<HTMLInputElement>("[data-serving-stop-step]");
      stepInput.max = String(chunks.length + 1);
      stepInput.value = String(Math.min(Number(stepInput.value), chunks.length + 1));
      const steps = Number(stepInput.value), filter = new TextStopFilter(["<END>"]);
      const rows: string[] = [];
      let visible = "", pending = "", emitted = "", matched: string | null = null, terminal = false;
      for (let i = 0; i <= chunks.length; i++) {
        const eof = i === chunks.length;
        if (i < steps) {
          const previousTerminal = terminal;
          const update = eof ? filter.finish() : filter.push(chunks[i]);
          emitted = update.emitted; pending = update.pending; matched = update.matched; terminal = update.stopped;
          visible += emitted;
          rows.push(`<tr><th scope="row">${eof ? "EOF" : i + 1}</th><td><code>${eof ? "Normal end" : quoted(chunks[i])}</code></td><td><code>${quoted(emitted)}</code></td><td><code>${quoted(pending)}</code></td><td>${previousTerminal ? "Already terminal" : matched ? "Stop matched" : eof ? "Normal end" : pending ? "Holding suffix" : "Released"}</td></tr>`);
        } else rows.push(`<tr class="framework-serving-future"><th scope="row">${eof ? "EOF" : i + 1}</th><td><code>${eof ? "Normal end" : quoted(chunks[i])}</code></td><td>—</td><td>—</td><td>Not processed</td></tr>`);
      }
      find<HTMLOutputElement>("[data-serving-stop-step-value]").value = `${steps} of ${chunks.length + 1}, including EOF`;
      find("[data-serving-stop-emitted]").textContent = JSON.stringify(emitted);
      find("[data-serving-stop-held]").textContent = JSON.stringify(pending);
      find("[data-serving-stop-visible]").textContent = JSON.stringify(visible);
      find("[data-serving-stop-result]").textContent = matched ? `Matched ${JSON.stringify(matched)}. The delimiter and later text are excluded; the adapter is terminal.` : terminal ? "Normal end-of-input. Any incomplete delimiter has been released; the adapter is terminal." : pending ? `${JSON.stringify(pending)} may still become <END>, so it is held back.` : steps ? "All currently received text is safe to release. More input may arrive." : "No text has arrived. Advance the control to process the first chunk.";
      find("[data-serving-stop-trace]").innerHTML = `<table><caption>Original decoded-text trace · empty strings mean zero released or held characters</caption><thead><tr><th scope="col">Arrival</th><th scope="col">Input</th><th scope="col">Newly released</th><th scope="col">Held suffix</th><th scope="col">State</th></tr></thead><tbody>${rows.join("")}</tbody></table>`;
    };
    stopLab.querySelectorAll("select").forEach(select => select.addEventListener("change", render));
    stopLab.querySelector("input")!.addEventListener("input", render); render();
  }

  const cacheLab = document.getElementById("framework-cache-lab");
  if (cacheLab && !cacheLab.dataset.initialized) {
    cacheLab.dataset.initialized = "true";
    const find = <T extends HTMLElement>(selector: string) => cacheLab.querySelector<T>(selector)!;
    const baseline: ServingPrefix = {
      tokenIds: [1, 2, 71, 12, 3, 4, 53, 15, 21, 8], positions: Array.from({length: 10}, (_, i) => i),
      context: {weightsRevision: "weights-v1", adapterRevision: "adapter-v1", attentionConfig: "dense-causal-rope-v1", cacheFormat: "FP16-layout-v1", cacheNamespace: "namespace-a"},
    };
    const explanations: Record<string, string> = {
      same: "The token IDs, positions and context agree. Only complete blocks are eligible; the final partial block is excluded.",
      token: "Token index 3 changes from 12 to 99. All later block identities depend on that ancestor, even where their own token IDs match.",
      adapter: "The same token IDs were evaluated with different adapter weights. The context identity rejects every cached block.",
      weights: "A new model-weight revision changes the computation. Matching text and token IDs do not preserve the old state.",
      positions: "Every position is shifted by one. The reference requires matching positions as well as matching token IDs.",
      format: "The consumer's cache representation changed. Direct reuse is disallowed; this model does not implement a layout or dtype conversion.",
      namespace: "The numerical inputs agree, but a different namespace deliberately isolates the entries. Policy can forbid otherwise valid sharing.",
      sampling: "Temperature changed from 0 to 0.8. It acts on output logits, so this fixed model's already evaluated prompt KV is unchanged. Newly generated histories may differ.",
    };
    const render = () => {
      const mode = find<HTMLSelectElement>("[data-serving-cache-case]").value;
      const blockSize = Number(find<HTMLSelectElement>("[data-serving-cache-block]").value);
      const incoming: ServingPrefix = {tokenIds: [...baseline.tokenIds], positions: [...baseline.positions], context: {...baseline.context}};
      if (mode === "token") incoming.tokenIds = incoming.tokenIds.map((id, i) => i === 3 ? 99 : id);
      if (mode === "adapter") incoming.context.adapterRevision = "adapter-v2";
      if (mode === "weights") incoming.context.weightsRevision = "weights-v2";
      if (mode === "positions") incoming.positions = incoming.positions.map(position => position + 1);
      if (mode === "format") incoming.context.cacheFormat = "FP8-layout-v2";
      if (mode === "namespace") incoming.context.cacheNamespace = "namespace-b";
      const result = reusableServingPrefix(baseline, incoming, blockSize);
      const groups = (prefix: ServingPrefix, isIncoming: boolean) => Array.from({length: Math.ceil(prefix.tokenIds.length / blockSize)}, (_, block) => {
        const start = block * blockSize, ids = prefix.tokenIds.slice(start, start + blockSize);
        const reusable = start + blockSize <= result.reusableTokens;
        const partial = ids.length < blockSize;
        return `<div class="framework-cache-block ${reusable ? "is-reusable" : ""} ${partial ? "is-partial" : ""}"><strong>Block ${block} · ${partial ? "partial" : reusable ? "eligible" : "no reuse"}</strong><div>${ids.map((id, offset) => `<span class="framework-cache-token ${isIncoming && id !== baseline.tokenIds[start + offset] ? "is-changed" : ""}"><b>${id}</b><small>pos ${prefix.positions[start + offset]}</small></span>`).join("")}</div></div>`;
      }).join("");
      find("[data-serving-cache-diagram]").innerHTML = `<div class="framework-cache-rows"><div class="framework-cache-row"><strong>Cached evaluated prefix</strong><div>${groups(baseline, false)}</div></div><div class="framework-cache-row"><strong>Incoming request</strong><div>${groups(incoming, true)}</div></div><p class="framework-cache-legend">Blue border: eligible complete block · dashed border: incomplete tail · orange token: changed ID. Block and position indices begin at zero.</p></div>`;
      find("[data-serving-cache-result]").textContent = `${result.commonTokens} of 10 leading token/position pairs match. ${result.reusableBlocks} complete blocks (${result.reusableTokens} tokens) are eligible for reuse.${result.mismatches.length ? ` Context mismatch: ${result.mismatches.join(", ")}.` : " Context identity matches."}`;
      find("[data-serving-cache-explanation]").textContent = explanations[mode];
    };
    cacheLab.querySelectorAll("select").forEach(select => select.addEventListener("change", render)); render();
  }
}
