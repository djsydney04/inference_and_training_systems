import { classifierContract, frameworkExample, frameworkCalls, traceSignatureCalls } from "./framework-execution-math";

const n = (v: number) => Math.abs(v) < 1e-12 ? "0" : Number(v.toFixed(6)).toString();
const vector = (row: number[]) => `[${row.map(n).join(", ")}]`;
const value = (root: Element, key: string) => root.querySelector<HTMLSelectElement>(`[data-fw-${key}]`)!.value;
const table = (caption: string, heads: string[], rows: string[][]) => `<table><caption>${caption}</caption><thead><tr>${heads.map(h=>`<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${rows.map(row=>`<tr><th scope="row">${row[0]}</th>${row.slice(1).map(cell=>`<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody></table>`;

type Stage = { title: string; detail: string };
function execution(engine: string, phase: string): {stages: Stage[]; explanation: string} {
  const torch = engine === "torch", jax = engine === "jax";
  if (phase === "eager") return {stages: [
    {title:"Python call",detail:"inputs + parameters"},
    {title:jax ? "value_and_grad" : torch ? "Eager + autograd" : "Eager + tape", detail:jax ? "transform derivative" : "record dependencies"},
    {title:"Framework operations",detail:"forward + backward"},
    {title:"Explicit update",detail:jax ? "return new tree" : "optimizer changes state"}],
    explanation:jax ? "JAX value_and_grad supplies loss and derivative arrays without wrapping the whole function in jit. JAX operations still use its dispatch machinery. The example retains the new parameter tree; differentiation itself does not apply SGD." : torch ? "PyTorch records tracked eager tensor operations, backward accumulates leaf gradients, then SGD changes parameters. Python can run again on every call. This view is not a claim that each operation finishes before the next Python line." : "TensorFlow eager operations execute under GradientTape, tape.gradient returns derivatives, and Keras SGD updates variables. The tape's derivative dependencies are distinct from a tf.function compiler boundary."};
  if (phase === "branch") return {stages:[
    {title:"Python function",detail:"if x.sum() > 0"},
    {title:torch ? "Capture boundary" : jax ? "Abstract condition" : "Source conversion",detail:torch ? "graph break or error" : jax ? "no Python boolean" : "AutoGraph if supported"},
    {title:"Declare control flow",detail:torch ? "supported tensor branch" : jax ? "jax.lax.cond" : "tf.cond / AutoGraph"},
    {title:"Check both branches",detail:"values + derivatives"}],
    explanation:torch ? "Data-dependent Python if commonly breaks Dynamo capture; fullgraph=True raises for unsupported breaks. Supported tensor control-flow operators can express a runtime branch, subject to their restrictions. Capturing one observed Python branch is not proof the other branch works." : jax ? "A traced array condition cannot be converted to an ordinary Python boolean. jax.lax.cond expresses a runtime choice; its branches must meet JAX's shape/type contract. Making arbitrary array values static is not a general replacement." : "AutoGraph may convert a supported Python conditional when its source is available. With autograph=False, as in the companion, use explicit TensorFlow control flow for tensor conditions. Conversion has limits; inspect both branches and their gradients."};
  const first = phase === "first";
  return {stages:[{title:"Python entry",detail:first ? "new signature" : "compatible arguments"},
    {title:first ? (torch ? "Dynamo capture" : "Trace operations") : "Reuse check",detail:first ? "record supported work" : torch ? "guards pass" : "cached specialization"},
    {title:first ? (torch ? "Chosen backend" : jax ? "XLA compilation" : "Graph construction") : "Graph execution",detail:first ? torch ? "eager backend in demo" : jax ? "CPU executable in demo" : "XLA disabled in demo" : "new tensor values"},
    {title:"Loss + derivatives",detail:"then explicit SGD"}],
    explanation:first ? torch ? "Dynamo captures the objective. Our counting backend returns graph_module.forward, so this particular experiment checks capture and numerical parity without Inductor compilation. A graph may contain many operations." : jax ? "The first compatible jax.jit(value_and_grad) call traces the differentiable calculation and compiles an XLA executable. Trace-time Python diagnostics are separate from executable model work." : "tf.function builds a graph for a compatible input signature. Our companion disables AutoGraph and XLA for its straight-line objective. GradientTape differentiates through the graph call." : torch ? "When its guards pass, the captured PyTorch region can run with new tensor values. Surrounding Python and optimizer work may still run outside that region. Failed guards can cause another capture or a configured fallback." : jax ? "A compatible cached JAX executable runs with the new array values. Ordinary trace-time Python effects do not run again on cache hits. This statement concerns the jitted function, not all Python in its caller." : "A compatible TensorFlow ConcreteFunction executes its graph with new inputs. Ordinary trace-time Python effects are not per-step effects; TensorFlow operations placed in the graph can be."};
}
function diagram(stages: Stage[]) {
  return `<svg viewBox="0 0 900 164" role="img" aria-label="${stages.map(s=>`${s.title}: ${s.detail}`).join("; then ")}">${stages.map((s,i)=>`<g class="framework-stage"><rect x="${10+i*225}" y="36" width="198" height="86"/><text x="${23+i*225}" y="65">${s.title}</text><text class="framework-stage-detail" x="${23+i*225}" y="93">${s.detail}</text></g>${i<3 ? `<path class="framework-arrow" d="M${208+i*225} 79h24m-6-5 6 5-6 5"/>` : ""}`).join("")}</svg>`;
}

export function initializeFrameworkExecutionLabs() {
  const update = document.getElementById("framework-update-lab");
  if (update && !update.dataset.initialized) {
    update.dataset.initialized="true";
    const render=()=>{
      const mask=value(update,"mask").split("").map(Number), summary=update.querySelector("[data-fw-update-summary]")!;
      if(!mask.some(Boolean)) {
        summary.textContent="No valid targets: skip this update explicitly. The mean denominator would be zero; W and b remain at their starting values. This workbench also skips the empty summed-loss case.";
        update.querySelector("[data-fw-update-rows]")!.innerHTML="";
        update.querySelector("[data-fw-update-weights]")!.innerHTML=table("Unchanged parameters after an explicit skip",["Parameter","Value"], [...frameworkExample.weights.map((row,d)=>[`W row ${d}`,vector(row)]),["b",vector(frameworkExample.bias)]]);
        return;
      }
      const result=classifierContract({...frameworkExample,mask,reduction:value(update,"reduction") as "mean"|"sum",learningRate:Number(value(update,"lr"))});
      summary.textContent=`${result.valid} valid targets; denominator ${result.denominator}. Loss ${n(result.loss)}. Learning rate ${value(update,"lr")}; each updated value equals its starting value minus η times its derivative.`;
      update.querySelector("[data-fw-update-rows]")!.innerHTML=table("Forward scores and backward derivatives",["Row","Included","Logits","Probabilities","Row CE","∂L/∂Z"], result.logits.map((row,t)=>[String(t),mask[t] ? "Yes" : "No",vector(row),vector(result.probabilities[t]),n(result.losses[t]),vector(result.dLogits[t])]));
      update.querySelector("[data-fw-update-weights]")!.innerHTML=table("One plain SGD update; all quantities shown",["Parameter","Starting value","Derivative","Updated value"],[...frameworkExample.weights.map((row,d)=>[`W row ${d}`,vector(row),vector(result.dWeights[d]),vector(result.nextWeights[d])]),["b",vector(frameworkExample.bias),vector(result.dBias),vector(result.nextBias)]]);
    };update.addEventListener("change",render);render();
  }
  const map=document.getElementById("framework-execution-map");
  if(map && !map.dataset.initialized) {
    map.dataset.initialized="true";
    const render=()=>{const result=execution(value(map,"engine"),value(map,"phase"));map.querySelector("[data-fw-execution-map]")!.innerHTML=diagram(result.stages);map.querySelector("[data-fw-execution-description]")!.textContent=result.explanation;};
    map.addEventListener("change",render);render();
  }
  const cache=document.getElementById("framework-trace-cache-lab");
  if(cache && !cache.dataset.initialized) {
    cache.dataset.initialized="true";
    const render=()=>{
      const rows=traceSignatureCalls(frameworkCalls.slice(0,Number(value(cache,"call"))),value(cache,"signature")==="variable"), last=rows.at(-1)!;
      cache.querySelector("[data-fw-cache-summary]")!.textContent=`${rows.length} calls, ${last.totalGraphs} distinct signatures, ${rows.filter(r=>!r.traced).length} cache hits. Last call ${last.traced ? "creates" : "reuses"} graph ${last.graph}. Values alone are not a key in this declared policy.`;
      cache.querySelector("[data-fw-cache-table]")!.innerHTML=table("Declared signature ledger",["Call","What changed","Cache key","Action"],rows.map(r=>[String(r.call),r.values,r.signature,`${r.traced ? "Create" : "Reuse"} graph ${r.graph}`]));
    };cache.addEventListener("change",render);render();
  }
}
