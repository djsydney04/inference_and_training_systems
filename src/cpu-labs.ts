import './cpu.css';
import { cpuOperations, issueSchedule, cacheAddresses, cacheTrace, branchOutcomes, branchTrace } from './cpu-models';
import type { IssueMode, CachePattern, BranchPattern } from './cpu-models';

const table = (headers: string[], rows: (string | number)[][], caption: string) => `<table><caption>${caption}</caption><thead><tr>${headers.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map((v,i)=>`<${i?'td':'th scope="row"'}>${v}</${i?'td':'th'}>`).join('')}</tr>`).join('')}</tbody></table>`;
const svg = (id: string, height: number, title: string, body: string) => `<svg viewBox="0 0 880 ${height}" role="img" aria-labelledby="${id}-title"><title id="${id}-title">${title}</title>${body}</svg>`;
const text = (x:number,y:number,value:string|number,cls='',active=false) => `<text${active?' data-cpu-active':''} x="${x}" y="${y}" class="${cls}">${value}</text>`;
const rect = (x:number,y:number,w:number,h:number,cls='') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" class="${cls}"/>`;

function wireLab(id: string, kind: string, draw: (root: HTMLElement, step: number) => number) {
  const root=document.getElementById(id);if(!root)return;
  let step=0;
  const next=root.querySelector<HTMLButtonElement>(`[data-cpu-${kind}-next]`)!;
  const render=()=> { const limit=draw(root,step); next.disabled=step>=limit; };
  next.addEventListener('click',()=>{step++;render();});
  root.querySelector(`[data-cpu-${kind}-reset]`)!.addEventListener('click',()=>{step=0;render();});
  root.querySelectorAll('select').forEach(input=>input.addEventListener('change',()=>{step=0;render();}));
  render();
}

export function initializeCpuLabs() {
  wireLab('cpu-issue-lab','issue',(root,step)=>{
    const mode=root.querySelector<HTMLSelectElement>('[data-cpu-issue-mode]')!.value as IssueMode;
    const schedule=issueSchedule(mode), frame=schedule.frames[Math.min(step,schedule.frames.length-1)];
    const cell=35, x0=210, width=16;
    let drawing=text(24,24,'Program order')+text(x0,24,'Cycle boundary');
    for(let cycle=0;cycle<width;cycle++)drawing+=text(x0+cycle*cell+10,53,cycle,'cpu-mono',cycle===frame.cycle);
    cpuOperations.forEach((op,i)=>{
      const y=76+i*52;
      drawing+=text(24,y+20,`${i+1}. ${op.name}`)+text(24,y+39,op.deps.length?`needs ${op.deps.map(d=>d+1).join(', ')}`:'independent','cpu-small');
      for(let cycle=0;cycle<width;cycle++){
        const running=cycle<=frame.cycle&&cycle>=schedule.starts[i]&&cycle<schedule.finishes[i];
        const done=cycle<=frame.cycle&&cycle>=schedule.finishes[i]&&cycle<schedule.retireTimes[i];
        const retired=cycle===schedule.retireTimes[i]&&cycle<=frame.cycle;
        const cls=running?'cpu-running':done?'cpu-complete':retired?'cpu-retired':'cpu-empty';
        drawing+=rect(x0+cycle*cell,y,31,32,cls)+(retired?text(x0+cycle*cell+9,y+22,'R','cpu-white'):done?text(x0+cycle*cell+10,y+22,'·'):'');
      }
    });
    drawing+=text(24,418,'Blue: executing')+text(225,418,'Pale: complete, waiting')+text(510,418,'R: retire in order');
    root.querySelector('[data-cpu-drawing]')!.innerHTML=svg('cpu-issue-chart',448,'Instruction execution and in-order retirement by cycle',drawing);
    const completed=frame.status.filter(s=>s==='retired').length;
    root.querySelector('[data-cpu-result]')!.innerHTML=`<strong>Cycle ${frame.cycle} · ${completed} / 6 retired</strong><span>${frame.issued.length?`Issue: ${frame.issued.map(i=>cpuOperations[i].name).join(', ')}`:completed===6?'All operations retired.':'No new operation can issue at this boundary.'}</span>`;
    root.querySelector('[data-cpu-ledger]')!.innerHTML=table(['Operation','Issue','Complete','Retire','Now'],cpuOperations.map((op,i)=>[`${i+1}. ${op.name}`,schedule.starts[i]<=frame.cycle?schedule.starts[i]:'—',schedule.finishes[i]<=frame.cycle?schedule.finishes[i]:'—',schedule.retireTimes[i]<=frame.cycle?schedule.retireTimes[i]:'—',frame.status[i]]),'Events reached so far; a one-cycle operation issued at 0 completes at 1');
    return schedule.frames.length-1;
  });
  wireLab('cpu-cache-lab','cache',(root,step)=>{
    const pattern=root.querySelector<HTMLSelectElement>('[data-cpu-cache-pattern]')!.value as CachePattern;
    const ways=Number(root.querySelector<HTMLSelectElement>('[data-cpu-cache-ways]')!.value), addresses=cacheAddresses(pattern);
    const f=cacheTrace(addresses,ways,Math.min(step,addresses.length)), last=f.accesses.at(-1);
    let drawing=text(24,30,'Address trace · bytes');
    addresses.forEach((a,i)=>{const x=24+i*51;drawing+=rect(x,48,46,36,i===step-1?'cpu-running':i<step?'cpu-complete':'cpu-empty')+text(x+7,72,a,i===step-1?'cpu-white cpu-mono':'cpu-mono',i===step-1);});
    drawing+=text(24,134,last?`Byte ${last.address} → line ${last.line} · set ${last.set} · tag ${last.tag} · offset ${last.offset}`:'Four cache lines total · 64 bytes per line');
    f.sets.forEach((set,i)=>{
      const y=176+i*62;drawing+=text(24,y+25,`Set ${i}`);
      for(let way=0;way<ways;way++){
        const x=140+way*174,line=set[way];
        drawing+=rect(x,y,154,42,line===last?.line&&i===last?.set?'cpu-running':'cpu-empty')+text(x+14,y+27,line===undefined?'Empty':`Line ${line} · tag ${Math.floor(line/f.sets.length)}`,line===last?.line&&i===last?.set?'cpu-white':'');
      }
    });
    drawing+=text(24,176+f.sets.length*62+24,'Within a set: least recent on the left, most recent on the right.','cpu-small');
    root.querySelector('[data-cpu-drawing]')!.innerHTML=svg('cpu-cache-chart',228+f.sets.length*62,'Cache address decomposition and set contents',drawing);
    root.querySelector('[data-cpu-result]')!.innerHTML=`<strong>${f.hits} ${f.hits===1?'hit':'hits'} · ${f.misses} ${f.misses===1?'miss':'misses'}</strong><span>${last?`${last.hit?'Hit':'Miss'} at byte ${last.address}${last.evicted!==null?` · evict line ${last.evicted}`:''} · ${f.bytesFetched} bytes fetched`:'Read the first address to fill the cold cache.'}</span>`;
    root.querySelector('[data-cpu-ledger]')!.innerHTML=table(['Access','Byte','Line','Set','Tag','Result','Evicted'],f.accesses.map((a,i)=>[i+1,a.address,a.line,a.set,a.tag,a.hit?'hit':'miss',a.evicted??'—']),'Exact access history at the modeled cache boundary');
    return addresses.length;
  });
  wireLab('cpu-branch-lab','branch',(root,step)=>{
    const pattern=root.querySelector<HTMLSelectElement>('[data-cpu-branch-pattern]')!.value as BranchPattern;
    const trace=branchTrace(branchOutcomes(pattern)), reached=trace.slice(0,step), last=reached.at(-1), state=last?.after??1;
    const names=['Strong not taken','Weak not taken','Weak taken','Strong taken'];
    let drawing=text(24,28,'Current predictor state');
    names.forEach((name,i)=>{const x=24+i*215;drawing+=rect(x,58,190,74,i===state?'cpu-running':'cpu-empty')+text(x+15,85,`${i} · ${name}`,i===state?'cpu-white':'')+text(x+15,112,`Predict ${i>=2?'taken':'not taken'}`,i===state?'cpu-white cpu-small':'cpu-small');});
    drawing+=text(24,173,'Taken moves right; not taken moves left. End states saturate.','cpu-small');
    drawing+=text(24,221,'Resolved outcomes');
    trace.forEach((entry,i)=>{
      const x=24+i*51, visible=i<step;
      drawing+=rect(x,244,46,48,visible?(entry.correct?'cpu-complete':'cpu-miss'):'cpu-empty')+text(x+16,267,visible?(entry.taken?'T':'N'):'·','cpu-mono',i===step-1)+(visible?text(x+12,285,entry.correct?'✓':'×','cpu-small'):'');
    });
    drawing+=text(24,332,'T: taken · N: not taken · ✓ correct · × incorrect','cpu-small');
    root.querySelector('[data-cpu-drawing]')!.innerHTML=svg('cpu-branch-chart',358,'Two-bit saturating branch predictor and resolved outcomes',drawing);
    const misses=reached.filter(e=>!e.correct).length;
    root.querySelector('[data-cpu-result]')!.innerHTML=`<strong>${step} / ${trace.length} resolved · ${misses} ${misses===1?'misprediction':'mispredictions'}</strong><span>${last?`Predicted ${last.predicted?'taken':'not taken'}; actual ${last.taken?'taken':'not taken'}. State ${last.before} → ${last.after}.`:'Initially weakly not taken. Predict, resolve, then update.'}</span>`;
    root.querySelector('[data-cpu-ledger]')!.innerHTML=table(['Branch','Before','Prediction','Outcome','After','Correct'],reached.map((e,i)=>[i+1,e.before,e.predicted?'T':'N',e.taken?'T':'N',e.after,e.correct?'yes':'no']),'Every counter update; no hidden history');
    return trace.length;
  });
}
