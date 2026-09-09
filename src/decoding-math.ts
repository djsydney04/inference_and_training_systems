export function validateDistribution(values: number[]) {
  if (!values.length || values.some(v => !Number.isFinite(v) || v < 0) || Math.abs(values.reduce((a,b)=>a+b,0)-1) > 1e-10)
    throw new Error("Probabilities must be finite, nonnegative, and sum to one");
}
export function categorical(probabilities: number[], uniform: number) {
  validateDistribution(probabilities);
  if (!Number.isFinite(uniform) || uniform < 0 || uniform >= 1) throw new Error("Use a uniform variate in [0,1)");
  let mass=0, lastPositive=-1;
  for(let i=0;i<probabilities.length;i++) {
    if(probabilities[i]>0) lastPositive=i;
    mass+=probabilities[i];
    if(uniform<mass) return i;
  }
  return lastPositive; // Only a rounding-size deficit can reach this branch.
}
export function speculativeMass(target: number[], draft: number[]) {
  validateDistribution(target); validateDistribution(draft);
  if(target.length!==draft.length) throw new Error("Target and draft need the same vocabulary");
  const accepted = target.map((p,i)=>Math.min(p,draft[i]));
  const acceptance = accepted.reduce((s,v)=>s+v,0);
  const repair = target.map((p,i)=>Math.max(0,p-draft[i]));
  const rejected = repair.reduce((s,v)=>s+v,0);
  const residual = rejected > 0 ? repair.map(v=>v/rejected) : null;
  const output = accepted.map((v,i)=>v+repair[i]);
  return { target:[...target], draft:[...draft], accepted, acceptance, repair, rejected, residual, output };
}
export function speculativeDraw(target: number[], draft: number[], proposalUniform: number, acceptanceUniform: number, residualUniform: number) {
  const mass=speculativeMass(target,draft), proposal=categorical(draft,proposalUniform);
  if(!Number.isFinite(acceptanceUniform)||acceptanceUniform<0||acceptanceUniform>=1) throw new Error("Acceptance variate must be in [0,1)");
  if(!Number.isFinite(residualUniform)||residualUniform<0||residualUniform>=1) throw new Error("Residual variate must be in [0,1)");
  const threshold=Math.min(1,target[proposal]/draft[proposal]);
  const accepted=acceptanceUniform<threshold;
  if(!accepted&&!mass.residual) throw new Error("A zero-rejection distribution cannot reject");
  return { proposal, threshold, accepted, token:accepted?proposal:categorical(mass.residual!,residualUniform) };
}

/** Explicit processor order: temperature -> top-k -> renormalize -> top-p. */
export function samplingDistribution(logits: number[], temperature=1, topK=0, topP=1) {
  if(!logits.length||logits.some(v=>!Number.isFinite(v)&&v!==-Infinity)||logits.every(v=>v===-Infinity)||!Number.isFinite(temperature)||temperature<0||!Number.isInteger(topK)||topK<0||topK>logits.length||!Number.isFinite(topP)||topP<=0||topP>1)
    throw new Error("Invalid logits or sampling settings");
  const order=logits.map((_,i)=>i).sort((a,b)=>logits[b]-logits[a]||a-b);
  if(temperature===0) return logits.map((_,i)=>i===order[0]?1:0);
  const maximum=logits[order[0]];
  const values=logits.map(v=>Math.exp((v-maximum)/temperature));
  if(topK) for(const i of order.slice(topK)) values[i]=0;
  const total=values.reduce((a,b)=>a+b,0);
  const normalized=values.map(v=>v/total);
  let cumulative=0;
  const keep=new Set<number>();
  for(const i of order) {
    if(normalized[i]===0) continue;
    keep.add(i); cumulative+=normalized[i];
    if(cumulative>=topP) break;
  }
  return normalized.map((v,i)=>keep.has(i)?v/cumulative:0);
}
export function speculativeCost(alpha: number, draftLength: number, draftMs: number, verifyMs: number, baselineMs: number) {
  if(![alpha,draftMs,verifyMs,baselineMs].every(Number.isFinite)||alpha<0||alpha>1||!Number.isInteger(draftLength)||draftLength<1||draftLength>64||draftMs<0||verifyMs<=0||baselineMs<=0) throw new Error("Invalid speculative cost model");
  const expectedTokens=Array.from({length:draftLength+1},(_,i)=>alpha**i).reduce((a,b)=>a+b,0);
  const roundMs=draftLength*draftMs+verifyMs;
  return {expectedTokens,roundMs,speedup:expectedTokens*baselineMs/roundMs};
}
