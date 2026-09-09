import test from "node:test";
import assert from "node:assert/strict";
import {categorical,speculativeMass,speculativeDraw,samplingDistribution,speculativeCost} from "../src/decoding-math.ts";
const close=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`);
test("speculative accepted mass plus repair reconstructs the target exactly",()=>{
  const m=speculativeMass([.1,.4,.2,.3],[.4,.1,.3,.2]);
  close(m.acceptance,.6);close(m.rejected,.4);
  m.output.forEach((v,i)=>close(v,m.target[i]));
  m.residual!.forEach((v,i)=>close(v,[0,.75,0,.25][i]));
});
test("speculative support boundaries include identical and disjoint distributions",()=>{
  assert.equal(speculativeMass([.2,.8],[.2,.8]).residual,null);
  const disjoint=speculativeMass([0,1],[1,0]);
  close(disjoint.acceptance,0);assert.deepEqual(disjoint.residual,[0,1]);
  assert.equal(speculativeDraw([0,1],[1,0],0,.5,.9).token,1);
  assert.equal(categorical([0,1,0],0),1);
});
test("conditional acceptance and residual sampling do not use the draft as the repair distribution",()=>{
  const result=speculativeDraw([.1,.4,.2,.3],[.4,.1,.3,.2],.1,.5,.9);
  assert.equal(result.proposal,0);close(result.threshold,.25);
  assert.equal(result.accepted,false);assert.equal(result.token,3);
});
test("sampling processors are stable, deterministic at ties, and ordered",()=>{
  const p=samplingDistribution([1000,999,998]);
  const shifted=samplingDistribution([0,-1,-2]);
  p.forEach((v,i)=>close(v,shifted[i]));
  assert.deepEqual(samplingDistribution([2,2,1],0),[1,0,0]);
  assert.deepEqual(samplingDistribution([Math.log(.5),Math.log(.3),Math.log(.15),Math.log(.05)],1,2,.6),[1,0,0,0]);
  assert.deepEqual(samplingDistribution([-Infinity,3],1),[0,1]);
});
test("expected prefix length does not by itself guarantee a speculative speedup",()=>{
  close(speculativeCost(1,4,1,8,8).expectedTokens,5);
  close(speculativeCost(0,4,1,8,8).expectedTokens,1);
  assert.ok(speculativeCost(.2,4,4,8,8).speedup<1);
});
test("probability contracts reject impossible values",()=>{
  assert.throws(()=>speculativeMass([.3,.3],[.5,.5]));
  assert.throws(()=>speculativeMass([1],[.5,.5]));
  assert.throws(()=>categorical([1],1));
  assert.throws(()=>samplingDistribution([-Infinity]));
  assert.throws(()=>samplingDistribution([1],1,0,0));
});
test("enumerated rational distribution pairs preserve mass, including zero support",()=>{
  const distributions=[];
  for(let a=0;a<=8;a++) for(let b=0;b<=8-a;b++) distributions.push([a/8,b/8,(8-a-b)/8]);
  for(const p of distributions) for(const q of distributions){
    const m=speculativeMass(p,q);
    close(m.acceptance+m.rejected,1);
    m.output.forEach((v,i)=>close(v,p[i]));
    close(m.acceptance,1-p.reduce((s,v,i)=>s+Math.abs(v-q[i]),0)/2);
  }
});
