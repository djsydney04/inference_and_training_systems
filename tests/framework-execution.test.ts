import test from "node:test";
import assert from "node:assert/strict";
import { classifierContract, frameworkExample, frameworkCalls, traceSignatureCalls } from "../src/framework-execution-math.ts";

const close = (a: number, b: number, eps = 1e-10) => assert.ok(Math.abs(a-b)<eps, `${a} != ${b}`);

test("framework classifier derivative matches independent finite differences", () => {
  const state = structuredClone(frameworkExample), result = classifierContract(state), eps = 1e-5;
  // Binary cross entropy computed via softplus of the competing logit difference.
  const objective = (s: typeof state) => s.inputs.reduce((sum, x, t) => {
    const z = s.bias.map((b,c)=>b+x.reduce((v,xt,d)=>v+xt*s.weights[d][c],0));
    return sum + s.mask[t] * Math.log1p(Math.exp(z[1-s.targets[t]]-z[s.targets[t]]));
  },0)/s.mask.reduce((a,b)=>a+b,0);
  close(result.loss, objective(state));
  for(let d=0;d<2;d++)for(let c=0;c<2;c++){
    const p=structuredClone(state),m=structuredClone(state);p.weights[d][c]+=eps;m.weights[d][c]-=eps;
    close((objective(p)-objective(m))/(2*eps),result.dWeights[d][c],1e-8);
  }
  for(let c=0;c<2;c++){
    const p=structuredClone(state),m=structuredClone(state);p.bias[c]+=eps;m.bias[c]-=eps;
    close((objective(p)-objective(m))/(2*eps),result.dBias[c],1e-8);
  }
});

test("masked rows have zero influence, while mean and sum scale by the valid count", () => {
  const mean=classifierContract(frameworkExample), sum=classifierContract({...frameworkExample,reduction:"sum"});
  close(sum.loss,mean.loss*2);
  mean.dWeights.forEach((row,d)=>row.forEach((v,c)=>close(sum.dWeights[d][c],2*v)));
  const changed=structuredClone(frameworkExample);changed.inputs[2]=[123,-456];changed.targets[2]=1;
  close(classifierContract(changed).loss,mean.loss);
  assert.deepEqual(classifierContract(changed).dWeights,mean.dWeights);
  mean.dLogits[2].forEach(v=>close(v,0));
});

test("duplicating all valid examples preserves the mean update but doubles a sum update", () => {
  const s=frameworkExample, twice={...s,inputs:[...s.inputs,...s.inputs],targets:[...s.targets,...s.targets],mask:[...s.mask,...s.mask]};
  const one=classifierContract(s),two=classifierContract(twice);
  close(one.loss,two.loss);
  one.nextWeights.forEach((row,d)=>row.forEach((v,c)=>close(v,two.nextWeights[d][c])));
  const oneSum=classifierContract({...s,reduction:"sum"}),twoSum=classifierContract({...twice,reduction:"sum"});
  close(twoSum.loss,2*oneSum.loss);
  oneSum.dWeights.forEach((row,d)=>row.forEach((v,c)=>close(twoSum.dWeights[d][c],2*v)));
});

test("large common logit shifts preserve stable loss and update", () => {
  const a=classifierContract(frameworkExample), b=classifierContract({...frameworkExample,bias:frameworkExample.bias.map(v=>v+1000)});
  close(a.loss,b.loss,1e-12);
  a.dWeights.forEach((row,d)=>row.forEach((v,c)=>close(v,b.dWeights[d][c],1e-12)));
});

test("declared signature cache distinguishes values, shape, dtype and static mode", () => {
  const exact=traceSignatureCalls(frameworkCalls,false), variable=traceSignatureCalls(frameworkCalls,true);
  assert.deepEqual(exact.map(r=>r.traced),[true,false,true,true,true,false]);
  assert.deepEqual(variable.map(r=>r.traced),[true,false,false,true,true,false]);
  assert.equal(exact[5].graph,1);assert.equal(variable[5].graph,1);
  assert.equal(exact[5].totalGraphs,4);assert.equal(variable[5].totalGraphs,3);
});

test("empty masks, invalid even-masked targets and inconsistent shapes fail visibly", () => {
  assert.throws(()=>classifierContract({...frameworkExample,mask:[0,0,0]}));
  assert.throws(()=>classifierContract({...frameworkExample,targets:[0,1,-100]}));
  assert.throws(()=>classifierContract({...frameworkExample,bias:[0]}));
  assert.throws(()=>classifierContract({...frameworkExample,learningRate:NaN}));
  assert.throws(()=>traceSignatureCalls([{...frameworkCalls[0],batch:0}],false));
});
