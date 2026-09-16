import test from "node:test";
import assert from "node:assert/strict";
import { addWord, encodeSigned, signedValue, fixedPoint, roundTiesEven, timingBudget, elasticEdge, emptyElastic, systolicFrame } from "../src/digital-math.ts";

test("every 8-bit signed integer round-trips; width contracts reject ambiguous inputs", () => {
  for (let value=-128;value<=127;value++) assert.equal(signedValue(encodeSigned(value,8),8),value);
  for(const invalid of [-129,128,1.2,NaN]) assert.throws(()=>encodeSigned(invalid,8));
  assert.throws(()=>signedValue(256,8));
  assert.throws(()=>encodeSigned(0,1));
});
test("full-adder carry chain matches exact addition and signed overflow for every 8-bit pair", () => {
  for(let a=0;a<256;a++) for(let b=0;b<256;b++) {
    const f=addWord(a,b,8), exact=signedValue(a,8)+signedValue(b,8);
    assert.equal(f.word+f.carryOut*256,a+b);
    assert.equal(f.overflow,exact < -128 || exact > 127);
    assert.equal(f.bits.reduce((sum,bit)=>sum+bit.sum*2**bit.index,0),f.word);
    for(let i=1;i<8;i++) assert.equal(f.bits[i].carryIn,f.bits[i-1].carryOut);
  }
  assert.equal(addWord(127,1,8).carryOut,0);
  assert.equal(addWord(127,1,8).overflow,true);
  assert.equal(addWord(255,1,8).carryOut,1);
  assert.equal(addWord(255,1,8).overflow,false);
});
test("fixed point specifies signed range, nearest/even ties, error, and endpoint saturation", () => {
  assert.deepEqual([-2.5,-1.5,-0.5,0.5,1.5,2.5].map(roundTiesEven),[-2,-2,0,0,2,2]);
  const a=fixedPoint(1.3125,8,4);
  assert.equal(a.raw,21); assert.equal(a.word,21); assert.equal(a.error,0);
  const b=fixedPoint(-1.3125,8,4);
  assert.equal(b.word,235); assert.equal(b.reconstructed,-1.3125);
  const c=fixedPoint(8.5,8,4);
  assert.equal(c.reconstructed,7.9375); assert.equal(c.saturated,true);
  for(let f=0;f<8;f++) for(let raw=-128;raw<128;raw++) assert.equal(fixedPoint(raw/2**f,8,f).raw,raw);
  assert.throws(()=>fixedPoint(1,8,8)); assert.throws(()=>fixedPoint(Infinity,8,4));
});
const timing={period:1,clockQMax:0.12,clockQMin:0.04,logicMax:0.7,logicMin:0.08,setup:0.08,hold:0.05,skew:0,uncertainty:0.03};
test("setup depends on period; hold does not; positive capture skew trades setup for hold",()=>{
  const base=timingBudget(timing),slower=timingBudget({...timing,period:2}),skewed=timingBudget({...timing,skew:0.1});
  assert.ok(Math.abs(base.setupSlack-0.07)<1e-12);
  assert.ok(Math.abs(base.holdSlack-0.04)<1e-12);
  assert.ok(Math.abs(slower.setupSlack-base.setupSlack-1)<1e-12);
  assert.equal(slower.holdSlack,base.holdSlack);
  assert.ok(Math.abs(skewed.setupSlack-base.setupSlack-0.1)<1e-12);
  assert.ok(Math.abs(skewed.holdSlack-base.holdSlack+0.1)<1e-12);
  assert.throws(()=>timingBudget({...timing,logicMin:3}));
});
test("elastic pipeline has two slots, holds under stalls, and preserves each token exactly once",()=>{
  for(let schedule=0;schedule<256;schedule++){
    let state=emptyElastic(),next=0;
    const expected:number[]=[],received:number[]=[];
    for(let cycle=0;cycle<30;cycle++){
      const input=cycle<16?{id:next,a:next-8,b:-3,c:2}:null;
      const ready=cycle>=16 || !!(schedule & (1<<(cycle%8)));
      const edge=elasticEdge(state,input,ready);
      if(state.result && !ready) assert.deepEqual(edge.next.result,state.result);
      if(edge.accepted){expected.push((next-8)*-3+2);next++;}
      if(edge.consumed) received.push(edge.consumed.result);
      assert.equal(expected.length-received.length,[edge.next.product,edge.next.result].filter(Boolean).length);
      state=edge.next;
    }
    assert.deepEqual(received,expected);
    assert.deepEqual(state,emptyElastic());
  }
});
test("both elastic stages update from pre-edge state, allowing one token per cycle after fill",()=>{
  const a={id:0,a:2,b:3,c:1},b={id:1,a:-2,b:4,c:10};
  const e1=elasticEdge(emptyElastic(),a,true);
  assert.equal(e1.next.result,null);assert.equal(e1.consumed,null);
  const e2=elasticEdge(e1.next,b,true);
  assert.equal(e2.next.result?.result,7);assert.equal(e2.next.product?.id,1);assert.equal(e2.consumed,null);
  const e3=elasticEdge(e2.next,null,true);
  assert.equal(e3.consumed?.id,0);assert.equal(e3.next.result?.result,2);
});
test("systolic valid alignment produces exact C and counts useful MACs including real zero operands",()=>{
  const activity:number[]=[];
  let macs=0;
  for(let step=0;step<=6;step++){
    const f=systolicFrame(step);activity.push(f.active);macs+=f.active;
    assert.equal(f.accumulatedMacs,macs);
    for(const c of f.cells) if(c.active) assert.equal(c.k+c.i+c.j,step);
  }
  assert.deepEqual(activity,[1,3,6,7,6,3,1]);
  assert.equal(macs,27);
  const done=systolicFrame(6);
  assert.deepEqual(done.expected,[[5,5,8],[14,14,17],[23,23,26]]);
  for(const cell of done.cells){assert.equal(cell.partial,done.expected[cell.i][cell.j]);assert.equal(cell.complete,true);}
  assert.equal(systolicFrame(-1).accumulatedMacs,0);
  assert.throws(()=>systolicFrame(7));
});
