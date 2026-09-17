import { frameworkCausalLoss, frameworkExampleLogits, frameworkIdentityDifferences, frameworkLabels,
  frameworkLora, frameworkMatvec, frameworkReduction, frameworkTokens } from "./framework-training-math";
import type { FrameworkMask } from "./framework-training-math";
import { roundTiesToEven } from "./quantization-math";

const number = (value: number) => value.toFixed(4).replace(/\.?0+$/, "");
const vector = (values: number[]) => `[${values.map(number).join(", ")}]`;
const colors = { context: "#e7e7df", assistant: "#27649a", end: "#4d8063", padding: "#f1eee7" };

export function initializeFrameworkTrainingLabs() {
  const labels = document.getElementById("framework-label-lab");
  if (labels) {
    const render = () => {
      const get = (name: string) => labels.querySelector<HTMLSelectElement>(`[data-framework-${name}]`)!.value;
      const length = Number(get("length")), tokens = frameworkTokens.slice(0, length), mask = get("mask") as FrameworkMask;
      const preShift = get("shift") === "twice", aligned = frameworkLabels(tokens, mask, preShift);
      const result = frameworkCausalLoss(frameworkExampleLogits(length), aligned);
      labels.querySelector("[data-framework-label-result]")!.innerHTML = result.mean === null
        ? "<strong>No valid response targets remain.</strong><p>This truncation cannot produce a token-mean training loss. Reject or rebuild the batch; do not report a successful zero-loss update.</p>"
        : `<strong>${result.count} target${result.count === 1 ? "" : "s"} · loss sum ${number(result.lossSum)} · token mean ${number(result.mean)}</strong><p>${preShift ? "Two shifts: the collator moved labels, then the model moved their prediction alignment again." : "The model owns the single shift: logit row i predicts aligned label i+1."} ${mask === "token-id" ? "The ID-based mask also removed the genuine EOS target." : mask === "all" ? "Context targets now join the objective; this is a different training mask." : "Only the declared assistant answer and real end token are targets."}</p>`;
      const cell = (i: number, y: number, text: string, active = false, fill = colors.context) => {
        const lines = text.split(" · "), inverse = active && (fill === colors.assistant || fill === colors.end) ? 'class="framework-white"' : "";
        return `<rect x="${180 + i * 78}" y="${y}" width="69" height="38" fill="${active ? fill : colors.padding}" stroke="currentColor" stroke-opacity=".15"/><text x="${214.5 + i * 78}" y="${y + (lines.length > 1 ? 15 : 24)}" text-anchor="middle" ${inverse}>${lines[0]}</text>${lines.length > 1 ? `<text x="${214.5 + i * 78}" y="${y + 31}" text-anchor="middle" ${inverse}>ID ${lines[1]}</text>` : ""}`;
      };
      labels.querySelector("[data-framework-label-chart]")!.innerHTML = `<svg viewBox="0 0 830 263" role="img" aria-labelledby="framework-label-title framework-label-description"><title id="framework-label-title">Token positions, aligned labels and causal prediction edges</title><desc id="framework-label-description">${result.count} scored pairs: ${result.pairs.map(p => `${tokens[p.position].name} input at ${p.position} predicts token ID ${p.target}`).join("; ") || "none"}. The table gives every selected loss.</desc><text x="12" y="30">Position in the array</text>${tokens.map((_, i) => `<text x="${214.5 + i * 78}" y="30" text-anchor="middle">${i}</text>`).join("")}<text x="12" y="76">Input token</text>${tokens.map((t,i) => cell(i,52,`${t.name} · ${t.id}`,t.role !== "padding",colors[t.role])).join("")}<text x="12" y="133">Attention validity</text>${tokens.map((t,i) => cell(i,109,t.role === "padding" ? "0" : "1")).join("")}<text x="12" y="229">API labels</text>${aligned.map((label,i) => cell(i,205,label === -100 ? "ignore" : String(label),label !== -100,colors.assistant)).join("")}${result.pairs.map(p => `<path d="M${214.5 + p.position * 78} 148L${214.5 + p.labelPosition * 78} 201" stroke="#27649a" stroke-width="2"/><circle cx="${214.5 + p.labelPosition * 78}" cy="201" r="3" fill="#27649a"/>`).join("")}<text x="12" y="181">Model's i → i+1 shift</text></svg>`;
      labels.querySelector("[data-framework-label-table]")!.innerHTML = `<table><caption>Scored prediction pairs after the model's internal shift</caption><thead><tr><th scope="col">Logit row / input</th><th scope="col">Target ID</th><th scope="col">Target probability</th><th scope="col">−log probability</th></tr></thead><tbody>${result.pairs.map(p => `<tr><th scope="row">${p.position} / ${tokens[p.position].name}</th><td>${p.target} / ${frameworkTokens.find(t => t.id === p.target)!.name}</td><td>${number(p.probability)}</td><td>${number(p.loss)}</td></tr>`).join("") || '<tr><td colspan="4">No scored pairs: rebuild or reject this batch.</td></tr>'}</tbody></table>`;
    };
    labels.querySelectorAll("select").forEach(control => control.addEventListener("change", render)); render();
  }
  const reduction = document.getElementById("framework-reduction-lab");
  if (reduction) {
    const render = () => {
      const reducer = reduction.querySelector<HTMLSelectElement>("[data-framework-reducer]")!.value as "sum" | "mean";
      const divisor = Number(reduction.querySelector<HTMLSelectElement>("[data-framework-divisor]")!.value);
      const result = frameworkReduction([[1,5],[0,15]],[[1,2],[0,3]],reducer,divisor);
      reduction.querySelector("[data-framework-reduction-result]")!.innerHTML = `<strong>Submit each local sum × ${number(result.scale)} → final gradient ${number(result.reduced)}</strong><p>Global count is 6. Declared backward division: ${divisor}; rank reduction division: ${result.rankDivisor}. Omitting compensation for an enabled division scales down the update.</p>`;
      reduction.querySelector("[data-framework-reduction-chart]")!.innerHTML = `<svg viewBox="0 0 850 254" role="img" aria-labelledby="framework-reduction-title framework-reduction-description"><title id="framework-reduction-title">Follow four local gradient sums through two automatic divisions</title><desc id="framework-reduction-description">Rank zero raw sums 1 and 5; rank one 0 and 15. Scale each by ${result.scale}, divide backward contributions by ${divisor}, then divide the rank sum by ${result.rankDivisor}. Result 3.5 equals direct 21 divided by 6.</desc><text x="20" y="26">Local derivative sums</text><text x="230" y="26">Submit × ${number(result.scale)}</text><text x="465" y="26">Backward ÷ ${divisor}</text><text x="704" y="26">Reducer ÷ ${result.rankDivisor}</text>${[[1,5],[0,15]].map((row,r) => `<text x="20" y="${87 + r * 87}">Rank ${r}: ${vector(row)}</text><path d="M176 ${81 + r * 87}H215M412 ${81 + r * 87}H451M638 ${81 + r * 87}L687 122" fill="none" stroke="currentColor" opacity=".5"/><rect x="222" y="${55 + r * 87}" width="185" height="49" fill="#e5edf1"/><text x="314" y="${86 + r * 87}" text-anchor="middle">${vector(result.submitted[r])}</text><rect x="459" y="${55 + r * 87}" width="175" height="49" fill="#e5edf1"/><text x="546" y="${86 + r * 87}" text-anchor="middle">${number(result.afterBackward[r])}</text>`).join("")}<rect x="690" y="97" width="139" height="49" fill="#27649a"/><text class="framework-white" x="759" y="128" text-anchor="middle">${number(result.reduced)}</text><text x="20" y="228">Counts [1,2] and [0,3] → 6 valid targets; one empty local microbatch still participates.</text></svg>`;
    };
    reduction.querySelectorAll("select").forEach(control => control.addEventListener("change", render)); render();
  }
  const adapter = document.getElementById("framework-adapter-lab");
  if (adapter) {
    const render = () => {
      const alpha = Number(adapter.querySelector<HTMLInputElement>("[data-framework-alpha]")!.value);
      const wrongBase = adapter.querySelector<HTMLSelectElement>("[data-framework-base]")!.value === "changed";
      const roundMerged = adapter.querySelector<HTMLSelectElement>("[data-framework-round]")!.value === "yes";
      const w = [[wrongBase ? 1.25 : 1,2],[-1,.5]], a = [[1,-1]], b = [[.5],[1]], x = [2,1];
      const result = frameworkLora(w,a,b,alpha,x);
      const servedWeights = roundMerged ? result.mergedWeights.map(row => row.map(roundTiesToEven)) : result.mergedWeights;
      const served = frameworkMatvec(servedWeights,x);
      const reference = frameworkLora([[1,2],[-1,.5]],a,b,alpha,x).separate;
      const expected = {baseRevision:"base-a",tokenizerDigest:"vocab-a",templateDigest:"template-a",targetModule:"q_proj"};
      const mismatches = frameworkIdentityDifferences(expected,{...expected,baseRevision:wrongBase ? "base-b" : "base-a"});
      adapter.querySelector("[data-framework-alpha-value]")!.textContent = `α=${number(alpha)}, rank=1, scale=${number(alpha)}`;
      adapter.querySelector("[data-framework-adapter-result]")!.innerHTML = `<strong>Separate path ${vector(result.separate)} · served merged path ${vector(served)}</strong><p>Expected output on the declared base: ${vector(reference)}. ${mismatches.length ? "Base revision mismatch: a strict loader would reject this attachment. The calculation shows what ignoring that check would do." : "Base, tokenizer, template and target-module identities match this teaching manifest."} ${roundMerged ? "Merged weights were additionally rounded to the nearest integer, ties to even. That conversion changes the numerical contract." : "With no new rounding, merging agrees with the separate path on the same base."}</p>`;
      const stage = (xpos: number,y: number,width: number,fill: string,text: string) => `<rect x="${xpos}" y="${y}" width="${width}" height="44" fill="${fill}"/><text x="${xpos + width/2}" y="${y + 28}" text-anchor="middle">${text}</text>`;
      adapter.querySelector("[data-framework-adapter-chart]")!.innerHTML = `<svg viewBox="0 0 850 264" role="img" aria-labelledby="framework-adapter-title framework-adapter-description"><title id="framework-adapter-title">Separate adapter branch and merged matrix execute the same linear expression before new rounding</title><desc id="framework-adapter-description">Input 2,1. Base output ${vector(result.base)}. Adapter branch ${vector(result.adapter)}. Sum ${vector(result.separate)}. Merged served output ${vector(served)}.</desc><path d="M146 89H186V53H221M186 89V132H221M410 53H452V89H497M410 132H452V89M146 89V215H221M603 215H657" fill="none" stroke="currentColor" opacity=".45"/>${stage(12,67,134,"#e7e7df","x = [2,1]")}${stage(221,31,189,"#e5edf1",`Wx = ${vector(result.base)}`)}${stage(221,110,189,"#e5edf1",`α B(Ax) = ${vector(result.adapter)}`)}${stage(497,67,332,"#e7eee7",`Add = ${vector(result.separate)}`)}${stage(221,193,382,"#e5edf1",`${roundMerged ? "round(W + α BA)" : "(W + α BA)"}x`)}${stage(657,193,172,"#e7eee7",vector(served))}<text x="20" y="259">W[out,in], A[1,in], B[out,1] · all matrices and the input are original toy values.</text></svg>`;
      adapter.querySelector("[data-framework-adapter-table]")!.innerHTML = `<table><caption>Matrices for the selected execution path; each listed vector is one output row</caption><thead><tr><th scope="col">Tensor</th><th scope="col">Row 0</th><th scope="col">Row 1</th></tr></thead><tbody><tr><th scope="row">Base W</th><td>${vector(w[0])}</td><td>${vector(w[1])}</td></tr><tr><th scope="row">Adapter update αBA</th><td>${vector(result.delta[0])}</td><td>${vector(result.delta[1])}</td></tr><tr><th scope="row">Merged / served weights</th><td>${vector(servedWeights[0])}</td><td>${vector(servedWeights[1])}</td></tr></tbody></table>`;
    };
    adapter.querySelectorAll("select").forEach(control => control.addEventListener("change", render));
    adapter.querySelector("input")!.addEventListener("input",render); render();
  }
}
