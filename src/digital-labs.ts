import { addWord, encodeSigned, fixedPoint, timingBudget, elasticEdge, emptyElastic, systolicFrame, systolicA, systolicB } from "./digital-math";
import type { ElasticState, MacToken } from "./digital-math";
import "./digital.css";
const binary = (value: number, width = 8) => value.toString(2).padStart(width, "0");
const arrow = (id: string) => `<defs><marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor"/></marker></defs>`;
const table = (caption: string, heads: string[], rows: (string | number)[][]) => `<table><caption>${caption}</caption><thead><tr>${heads.map(h => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${rows.map(row => `<tr>${row.map((v, i) => i ? `<td>${v}</td>` : `<th scope="row">${v}</th>`).join("")}</tr>`).join("")}</tbody></table>`;
export function initializeDigitalLabs() {
  const bits = document.getElementById("digital-bits-lab");
  if (bits) {
    const a = bits.querySelector<HTMLInputElement>("[data-bit-a]")!;
    const b = bits.querySelector<HTMLInputElement>("[data-bit-b]")!;
    const render = () => {
      // Keep empty/partially typed number inputs out of the arithmetic model.
      if (!a.validity.valid || !b.validity.valid || a.value === "" || b.value === "") return;
      const av = +a.value, bv = +b.value;
      const f = addWord(encodeSigned(av, 8), encodeSigned(bv, 8), 8);
      bits.querySelector("[data-bit-output]")!.innerHTML = `<strong>${av} + ${bv} = ${f.exactSigned}</strong><span>Stored: ${binary(f.word)} = ${f.signed} signed · carry out ${f.carryOut} · signed overflow ${f.overflow ? "yes" : "no"}</span>`;
      bits.querySelector("[data-bit-svg]")!.innerHTML = `<svg viewBox="0 0 760 260" role="img" aria-label="Eight full adders. Carry flows from bit zero on the right toward bit seven on the left.">${arrow("digital-carry-arrow")}<text x="28" y="25" class="digital-label">Most significant bit</text><text x="565" y="25" class="digital-label">Least significant bit</text>${f.bits.map(bit => {
        const x = 46 + (7 - bit.index) * 86;
        return `<g><text x="${x+30}" y="57" text-anchor="middle">a ${bit.a} · b ${bit.b}</text><path d="M ${x+30} 65 V 89" class="digital-wire"/><rect x="${x}" y="90" width="64" height="58" rx="2" class="digital-cell ${bit.carryOut ? "is-active" : ""}"/><text x="${x+32}" y="114" text-anchor="middle">bit ${bit.index}</text><text x="${x+32}" y="136" text-anchor="middle">carry ${bit.carryIn}</text><path d="M ${x+32} 149 V 180" class="digital-wire"/><text x="${x+32}" y="207" text-anchor="middle" class="digital-value">${bit.sum}</text>${bit.index < 7 ? `<path d="M ${x} 118 H ${x-22}" class="digital-wire ${bit.carryOut ? "is-active" : ""}" marker-end="url(#digital-carry-arrow)"/>` : ""}</g>`;
      }).join("")}<text x="380" y="247" text-anchor="middle" class="digital-label">${f.overflow ? "The exact signed result needs another bit." : "The exact signed result fits in eight bits."} Carry is a separate unsigned fact.</text></svg>`;
    };
    [a,b].forEach(el => el.addEventListener("input", render)); render();
  }
  const fixed = document.getElementById("fixed-point-lab");
  if (fixed) {
    const input = fixed.querySelector<HTMLInputElement>("[data-fixed-value]")!;
    const fraction = fixed.querySelector<HTMLSelectElement>("[data-fixed-fraction]")!;
    const render = () => {
      if (!input.validity.valid || input.value === "") return;
      const f = fixedPoint(+input.value, 8, +fraction.value);
      fixed.querySelector("[data-fixed-output]")!.innerHTML = `<strong>${binary(f.word)} → ${f.reconstructed}</strong><span>Raw signed integer ${f.raw} ÷ ${2 ** +fraction.value} · error ${f.error.toFixed(6)} · ${f.saturated ? "saturated to an endpoint" : "nearest/even rounding"}</span>`;
      fixed.querySelector("[data-fixed-table]")!.innerHTML = table("An explicit 8-bit signed fixed-point contract", ["Quantity", "Value"], [["Fractional bits",fraction.value],["Grid spacing",f.step],["Representable interval",`${f.min} to ${f.max}`],["Requested value",input.value],["Reconstructed value",f.reconstructed]]);
    };
    input.addEventListener("input",render); fraction.addEventListener("change",render); render();
  }
  const timing = document.getElementById("digital-timing-lab");
  if (timing) {
    const period = timing.querySelector<HTMLInputElement>("[data-timing-period]")!;
    const delay = timing.querySelector<HTMLInputElement>("[data-timing-delay]")!;
    const skew = timing.querySelector<HTMLInputElement>("[data-timing-skew]")!;
    const render = () => {
      const p = { period:+period.value, logicMax:+delay.value, logicMin:0.08, clockQMax:0.12, clockQMin:0.04, setup:0.08, hold:0.05, skew:+skew.value, uncertainty:0.03 };
      const f = timingBudget(p);
      const x = (ns:number) => 72 + ns * 134;
      timing.querySelector("[data-timing-output]")!.innerHTML = `<strong>Setup ${f.setupSlack.toFixed(2)} ns · hold ${f.holdSlack.toFixed(2)} ns</strong><span>${(1000/p.period).toFixed(0)} MHz requested · ${f.setupSlack >= 0 && f.holdSlack >= 0 ? "both constraints pass in this model" : "timing fails in this model"} · capture skew ${p.skew.toFixed(2)} ns</span>`;
      timing.querySelector("[data-timing-svg]")!.innerHTML = `<svg viewBox="0 0 820 280" role="img" aria-label="Separate maximum-delay setup and minimum-delay hold constraints in nanoseconds."><text x="28" y="25" class="digital-label">Setup: latest arrival must precede the next capture deadline</text><path d="M 72 84 H 770" class="digital-wire"/><rect x="${x(0)}" y="67" width="${p.clockQMax*134}" height="34" class="digital-cell"/><rect x="${x(p.clockQMax)}" y="67" width="${p.logicMax*134}" height="34" class="digital-cell is-active"/><path d="M ${x(f.setupDeadline)} 50 V 120" class="digital-limit"/><text x="${x(f.latestArrival)}" y="145" text-anchor="middle">arrives ${f.latestArrival.toFixed(2)}</text><text x="${x(f.setupDeadline)}" y="46" text-anchor="middle">deadline ${f.setupDeadline.toFixed(2)}</text><text x="28" y="181" class="digital-label">Hold: earliest arrival must follow this edge's hold deadline (expanded scale below)</text><path d="M 72 222 H 770" class="digital-wire"/><circle cx="${250+f.earliestArrival*800}" cy="222" r="7" class="digital-dot"/><path d="M ${250+f.holdDeadline*800} 199 V 243" class="digital-limit"/><text x="${250+f.earliestArrival*800}" y="268" text-anchor="middle">arrival ${f.earliestArrival.toFixed(2)}</text><text x="${250+f.holdDeadline*800}" y="195" text-anchor="middle">deadline ${f.holdDeadline.toFixed(2)}</text></svg>`;
      timing.querySelector("[data-timing-table]")!.innerHTML = table("Delays in ns; positive skew means the capture clock arrives later", ["Constraint", "Substitution", "Slack"], [["Setup",`${p.period.toFixed(2)} + ${p.skew.toFixed(2)} − 0.08 − 0.03 − 0.12 − ${p.logicMax.toFixed(2)}`,f.setupSlack.toFixed(2)],["Hold",`0.04 + 0.08 − ${p.skew.toFixed(2)} − 0.05 − 0.03`,f.holdSlack.toFixed(2)]]);
    };
    [period,delay,skew].forEach(el=>el.addEventListener("input",render)); render();
  }
  const elastic = document.getElementById("elastic-pipeline-lab");
  if (elastic) {
    let state: ElasticState = emptyElastic(), nextId=0, cycle=0;
    let history: (string|number)[][]=[];
    let explanation="Empty registers can accept a token even when the consumer is stalled.";
    const ready=elastic.querySelector<HTMLInputElement>("[data-elastic-ready]")!;
    const input=(): MacToken => ({id:nextId,a:[-3,8,-128,7][nextId%4],b:[7,4,-128,-6][nextId%4],c:[5,-2,1,9][nextId%4]});
    const render=()=>{
      const token=input(), preview=elasticEdge(state,token,ready.checked);
      elastic.querySelector("[data-elastic-output]")!.innerHTML=`<strong>After ${cycle} clock edges · ${[state.product,state.result].filter(Boolean).length} / 2 slots occupied</strong><span>Source ready ${Number(preview.inputReady)} · stage 2 ready ${Number(preview.resultReady)} · consumer ready ${Number(ready.checked)}</span><p>${explanation}</p>`;
      const nodes=[{title:"Source",value:`#${token.id}: ${token.a} × ${token.b} + ${token.c}`,sub:"Offer held until accepted",active:true},{title:"Product register",value:state.product?`#${state.product.id}: ${state.product.product}`:"empty",sub:state.product?`addend ${state.product.c} travels with it`:"valid = 0",active:!!state.product},{title:"Result register",value:state.result?`#${state.result.id}: ${state.result.result}`:"empty",sub:state.result?"valid = 1":"valid = 0",active:!!state.result},{title:"Consumer",value:ready.checked?"accepting":"stalled",sub:"Consumes old result at edge",active:ready.checked}];
      elastic.querySelector("[data-elastic-svg]")!.innerHTML=`<svg viewBox="0 0 860 200" role="img" aria-label="Two elastic pipeline registers. Ready propagates upstream; valid data moves downstream only at a clock edge.">${arrow("elastic-arrow")}${nodes.map((n,i)=>`<g><rect x="${12+i*218}" y="35" width="180" height="100" rx="2" class="digital-cell ${n.active?"is-active":""}"/><text x="${102+i*218}" y="58" text-anchor="middle" class="digital-label">${n.title}</text><text x="${102+i*218}" y="92" text-anchor="middle">${n.value}</text><text x="${102+i*218}" y="119" text-anchor="middle" class="digital-small">${n.sub}</text>${i<3?`<path d="M ${194+i*218} 79 H ${226+i*218}" class="digital-wire" marker-end="url(#elastic-arrow)"/>`:""}</g>`).join("")}<path d="M 750 165 H 100" class="digital-wire" marker-end="url(#elastic-arrow)"/><text x="420" y="191" text-anchor="middle" class="digital-label">Readiness is a combinational decision before the next edge.</text></svg>`;
      elastic.querySelector("[data-elastic-table]")!.innerHTML=table("Transfers at each edge, newest first; values move exactly once",["Edge","Input accepted","Product advanced","Output consumed"],history.length?history:[["—","—","—","—"]]);
    };
    ready.addEventListener("change",render);
    elastic.querySelector("[data-elastic-next]")!.addEventListener("click",()=>{
      const f=elasticEdge(state,input(),ready.checked);
      history.unshift([++cycle,f.accepted?`#${nextId}`:"stalled",f.advanced?`#${state.product!.id}`:"none",f.consumed?`#${f.consumed.id} = ${f.consumed.result}`:"none"]);
      history=history.slice(0,8);
      explanation=f.consumed?`The consumer took token #${f.consumed.id}. Registers may replace their old tokens on that same edge.`:!f.inputReady?"Both registers were full and the consumer was stalled. Every valid payload stayed unchanged.":"Available capacity moved the token forward; the consumer did not take an output on this edge.";
      if(f.accepted) nextId++; state=f.next; render();
    });
    elastic.querySelector("[data-elastic-reset]")!.addEventListener("click",()=>{state=emptyElastic();nextId=0;cycle=0;history=[];explanation="Reset discards in-flight tokens and clears both valid bits.";render();});
    render();
  }
  const systolic=document.getElementById("digital-systolic-lab");
  if(systolic){
    let step=-1;
    const render=()=>{
      const f=systolicFrame(step);
      systolic.querySelector("[data-systolic-output]")!.innerHTML=`<strong>${step<0?"Before injection":`Cycle ${step+1} / 7`} · ${f.active} / 9 PEs active</strong><span>${f.accumulatedMacs} / 27 multiply-accumulates completed · operands meet at k = cycle index − row − column</span>`;
      systolic.querySelector("[data-systolic-svg]")!.innerHTML=`<svg viewBox="0 0 790 530" role="img" aria-label="A three by three systolic array with current operand pairs and accumulated outputs.">${arrow("systolic-arrow")}<text x="400" y="24" text-anchor="middle" class="digital-label">B moves down; column j begins j cycles later.</text>${[0,1,2].map(j=>`<text x="${290+j*180}" y="62" text-anchor="middle">B[:,${j}]</text><path d="M ${290+j*180} 71 V 92" class="digital-wire" marker-end="url(#systolic-arrow)"/>`).join("")}${[0,1,2].map(i=>`<text x="55" y="${153+i*139}" class="digital-label">A[${i},:] →</text><path d="M 136 ${151+i*139} H 205" class="digital-wire" marker-end="url(#systolic-arrow)"/>`).join("")}${f.cells.map(c=>{const x=210+c.j*180,y=96+c.i*139;return `<g><rect x="${x}" y="${y}" width="160" height="110" rx="2" class="digital-cell ${c.active?"is-active":""} ${c.complete?"is-complete":""}"/><text x="${x+80}" y="${y+23}" text-anchor="middle" class="digital-label">C[${c.i},${c.j}] · ${c.completed}/3 terms</text><text x="${x+80}" y="${y+53}" text-anchor="middle">${c.active?`${c.a} × ${c.b} at k=${c.k}`:c.complete?"complete":"waiting"}</text><text x="${x+80}" y="${y+87}" text-anchor="middle" class="digital-value">${c.partial}</text>${c.j<2?`<path d="M ${x+161} ${y+55} H ${x+178}" class="digital-wire" marker-end="url(#systolic-arrow)"/>`:""}${c.i<2?`<path d="M ${x+80} ${y+111} V ${y+137}" class="digital-wire" marker-end="url(#systolic-arrow)"/>`:""}</g>`;}).join("")}<text x="400" y="517" text-anchor="middle" class="digital-label">Each accumulator stays in its PE; valid tags distinguish padding from real zero operands.</text></svg>`;
      systolic.querySelector("[data-systolic-table]")!.innerHTML=table("Exact matrix operands and completed reference result",["Row","A","B","Expected C"],systolicA.map((row,i)=>[i,`[${row.join(", ")}]`,`[${systolicB[i].join(", ")}]`,`[${f.expected[i].join(", ")}]`]));
      systolic.querySelector<HTMLButtonElement>("[data-systolic-prev]")!.disabled=step<0;
      systolic.querySelector<HTMLButtonElement>("[data-systolic-next]")!.disabled=step===6;
    };
    systolic.querySelector("[data-systolic-prev]")!.addEventListener("click",()=>{step=Math.max(-1,step-1);render();});
    systolic.querySelector("[data-systolic-next]")!.addEventListener("click",()=>{step=Math.min(6,step+1);render();});
    systolic.querySelector("[data-systolic-reset]")!.addEventListener("click",()=>{step=-1;render();});render();
  }
}
