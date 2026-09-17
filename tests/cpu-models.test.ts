import { test } from 'node:test';
import assert from 'node:assert/strict';
import { issueSchedule, cpuOperations, cacheTrace, cacheAddresses, branchTrace, branchOutcomes } from '../src/cpu-models.ts';

test('ready issue overlaps an independent chain but retirement stays ordered', () => {
  const ready = issueSchedule('ready'), ordered = issueSchedule('ordered');
  assert.ok(ready.starts[2] < ready.finishes[0]);
  assert.ok(ready.retireTimes[2] >= ready.retireTimes[1]);
  assert.ok(ready.cycles < ordered.cycles);
  for (const s of [ready, ordered]) {
    for (const [i, op] of cpuOperations.entries()) {
      for (const dep of op.deps) assert.ok(s.starts[i] >= s.finishes[dep]);
      assert.equal(s.finishes[i] - s.starts[i], op.latency);
      assert.ok(s.retireTimes[i] >= s.finishes[i]);
      if (i) assert.ok(s.retireTimes[i] >= s.retireTimes[i-1]);
    }
    for (const frame of s.frames) {
      assert.equal(new Set(frame.issued.map(i=>cpuOperations[i].unit)).size, frame.issued.length);
      assert.ok(frame.retired.length <= 2);
    }
    assert.deepEqual(s.frames.at(-1)!.status, Array(6).fill('retired'));
  }
});
test('cache locality, conflicts and capacity have distinct outcomes at fixed byte capacity', () => {
  assert.equal(cacheTrace(cacheAddresses('sequential'),1).misses,1);
  assert.equal(cacheTrace(cacheAddresses('sequential'),1).hits,15);
  assert.equal(cacheTrace(cacheAddresses('conflict'),1).misses,12);
  for (const ways of [2,4]) assert.equal(cacheTrace(cacheAddresses('conflict'),ways).misses,2);
  assert.equal(cacheTrace(cacheAddresses('capacity'),4).misses,15);
  const a=cacheTrace([260],2).accesses[0];
  assert.deepEqual(a,{address:260,line:4,set:0,tag:2,offset:4,hit:false,evicted:null});
  assert.equal(cacheTrace([],4).bytesFetched,0);
});
test('LRU uses a hit to update recency and partial cache traces do not include future work', () => {
  const trace=cacheTrace([0,64,0,128,192,256],4);
  assert.equal(trace.accesses.at(-1)!.evicted,1);
  assert.deepEqual(trace.sets,[[0,2,3,4]]);
  assert.deepEqual(cacheTrace([0,256],1,1).sets,[[0],[],[],[]]);
  assert.throws(()=>cacheTrace([0],3));assert.throws(()=>cacheTrace([-1],1));assert.throws(()=>cacheTrace([0],1,2));
});
test('the two-bit counter saturates and needs two opposite outcomes to reverse a strong prediction', () => {
  assert.deepEqual(branchTrace([false,false],3).map(x=>[x.before,x.predicted,x.after]),[[3,true,2],[2,true,1]]);
  assert.equal(branchTrace([true,true],3).at(-1)!.after,3);
  assert.equal(branchTrace([false,false],0).at(-1)!.after,0);
  assert.equal(branchTrace(branchOutcomes('alternating')).filter(x=>x.correct).length,0);
  assert.equal(branchTrace(branchOutcomes('loop')).filter(x=>!x.correct).length,3);
  assert.throws(()=>branchTrace([],4));
});
