import { test } from "node:test";
import assert from "node:assert/strict";
import { tilePlan, tileBounds } from "../src/portable-kernel-math.ts";
import { kernelBackends } from "../src/portable-kernel-data.ts";

test("Hopper teaching tile separates BF16 staging from FP32 accumulators",()=>{
  const plan=tilePlan({m:129,n:257,k:130},kernelBackends[0].tile);
  assert.equal(plan.operandBytes,12*1024);
  assert.equal(plan.accumulatorBytes,32*1024);
  assert.equal(plan.outputTiles,9);
  assert.equal(plan.reductions,5);
  assert.equal(plan.paddedOutputs,40575);
  assert.deepEqual(tileBounds({m:129,n:257,k:130},kernelBackends[0].tile,2,2,4),
    {rowStart:128,rowEnd:129,columnStart:256,columnEnd:257,kStart:128,kEnd:130});
});

test("each backend covers every ragged output and reduction position exactly once",()=>{
  const shape={m:129,n:257,k:130};
  for(const backend of kernelBackends){
    const plan=tilePlan(shape,backend.tile);
    const outputs=new Uint8Array(shape.m*shape.n), reduction=new Uint8Array(shape.k);
    for(let r=0;r<plan.rows;r++)for(let c=0;c<plan.columns;c++){
      const b=tileBounds(shape,backend.tile,r,c,0);
      for(let i=b.rowStart;i<b.rowEnd;i++)for(let j=b.columnStart;j<b.columnEnd;j++)outputs[i*shape.n+j]++;
    }
    for(let step=0;step<plan.reductions;step++){
      const b=tileBounds(shape,backend.tile,0,0,step);
      for(let k=b.kStart;k<b.kEnd;k++)reduction[k]++;
    }
    assert.ok(outputs.every(n=>n===1),backend.id);
    assert.ok(reduction.every(n=>n===1),backend.id);
    assert.equal(plan.operations,8619780);
  }
});

test("tile planning rejects invalid dimensions and out-of-range selections",()=>{
  const shape={m:256,n:256,k:256},tile={m:128,n:128,k:128};
  for(const k of [0,-1,1.5,Infinity,NaN,8193])assert.throws(()=>tilePlan({...shape,k},tile),RangeError);
  for(const indices of [[2,0,0],[0,2,0],[0,0,2],[-1,0,0],[.5,0,0]])
    assert.throws(()=>tileBounds(shape,tile,...indices as [number,number,number]),RangeError);
});
