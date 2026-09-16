import "./lesson-visuals.css";
import type { LessonVisual } from "./lesson-visual-data";
import { allLessonVisuals } from "./lesson-visual-catalog";
const escape = (value: string) => value.replace(/[&<>"']/g, char => ({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"})[char]!);

function diagram(topic: LessonVisual, detailed = true, selected = 0) {
  const n = topic.steps.length;
  const arrow = `${topic.id}-visual-arrow`;
  const positions = topic.steps.map((_, i): [number, number, number, number] => {
    if (topic.kind === "cycle") return [[34,32,302,76],[478,32,302,76],[478,180,302,76],[34,180,302,76]][i] as [number,number,number,number];
    if (topic.kind === "fork") return [[18,104,218,82],[300,24,218,82],[300,188,218,82],[582,104,218,82]][i] as [number,number,number,number];
    if (topic.kind === "memory") return [28, 18 + i * (260 / n), 764, 240 / n];
    if (topic.kind === "timeline") return [34 + i * (530 / n), 20 + i * (240 / n), 230, 58];
    if (topic.kind === "hierarchy") return [28 + i * 62, 16 + i * (248 / n), 700 - i * 100, 56];
    return [18 + i * (800 / n), 70, 760 / n, topic.kind === "matrix" ? 150 : 126];
  });
  const wire = (points: string) => `<path class="lv-wire" d="${points}" marker-end="url(#${arrow})"/>`;
  let wires = "";
  if (topic.kind === "fork") wires = wire("M236 145H266V65H298")+wire("M266 145V229H298")+wire("M518 65H550V145H580")+wire("M518 229H550V145");
  else if (topic.kind === "cycle") wires = wire("M336 70H476")+wire("M628 108V178") + (n === 4 ? wire("M478 218H338")+wire("M184 180V110") : wire("M478 218H184V110"));
  else if (!["memory","compare"].includes(topic.kind)) positions.slice(0,-1).forEach(([x,y,w,h],i)=>{
    const [nx,ny] = positions[i+1];
    wires += topic.kind === "hierarchy" || topic.kind === "timeline" ? wire(`M${x+18} ${y+h}V${ny+28}H${nx-2}`) : wire(`M${x+w} ${y+h/2}H${nx-2}`);
  });
  const nodes = topic.steps.map((step,i)=>{
    const [x,y,w,h]=positions[i];
    const compact = ["memory","hierarchy","timeline"].includes(topic.kind);
    let internal="";
    if(detailed && topic.kind === "matrix") internal=Array.from({length:12},(_,cell)=>`<rect class="lv-cell" x="${x+w/2-40+(cell%4)*21}" y="${y+57+Math.floor(cell/4)*19}" width="17" height="15"/>`).join("");
    if(detailed && topic.kind === "memory") internal=Array.from({length:10},(_,cell)=>`<rect class="lv-cell" x="${x+w-268+cell*24}" y="${y+h/2-9}" width="19" height="18"/>`).join("");
    const labelX=compact?x+16:x+w/2;
    return `<g class="lv-node ${selected===i?"is-selected":""}" role="button" tabindex="0" data-lv-node="${i}" aria-label="Inspect ${escape(step.label)}" aria-pressed="${selected===i}"><title>${escape(step.note)}</title><rect x="${x}" y="${y}" width="${w}" height="${h}"/><text x="${labelX}" y="${compact?y+23:y+32}" text-anchor="${compact?"start":"middle"}" class="lv-label">${escape(step.label)}</text>${detailed?`<text x="${labelX}" y="${compact?y+43:topic.kind==="matrix"?y+134:y+57}" text-anchor="${compact?"start":"middle"}" class="lv-detail">${escape(step.detail)}</text>`:""}${internal}${!compact&&topic.kind!=="matrix"?`<path class="lv-detail-line" d="M${x+22} ${y+h-24}H${x+w-22}"/>`:""}</g>`;
  }).join("");
  return `<svg viewBox="0 0 820 300" class="lv-svg" aria-labelledby="${topic.id}-visual-title"><title id="${topic.id}-visual-title">${escape(topic.title)}. ${escape(topic.relationship)}.</title><defs><marker id="${arrow}" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7" fill="#2559d6"/></marker></defs>${topic.kind==="timeline"?positions.map(([,y])=>`<path class="lv-time-lane" d="M20 ${y+58}H800"/>`).join(""):""}${wires}${nodes}</svg>`;
}

function markup(topic: LessonVisual) {
  return `<figure class="lesson-visual" data-lv-topic="${topic.id}" id="${topic.id}-visual"><figcaption><span>Interactive schematic</span><strong>${escape(topic.title)}</strong><p>${escape(topic.relationship)}. Select a part to inspect its role.</p></figcaption><div class="lv-toolbar"><button type="button" data-lv-depth aria-pressed="true">Hide internals</button><span>${topic.kind==="timeline"?"Dependency order · widths are not durations":"Conceptual relationships · not physical scale"}</span></div><div class="lv-canvas" tabindex="0" aria-label="Interactive diagram; scroll horizontally on narrow screens">${diagram(topic)}</div><div class="lv-selection" aria-live="polite"><strong>${escape(topic.steps[0].label)}</strong><p>${escape(topic.steps[0].note)}</p></div><details class="lv-notes"><summary>Worked note and assumptions</summary><div><h4>Keep this true</h4><p>${escape(topic.invariant)}</p><h4>Work through it</h4><p>${escape(topic.example)}</p></div></details></figure>`;
}

/** Assemble before reader numbering and search indexing. */
export function prepareLessonVisuals() {
  allLessonVisuals.forEach(topic=>{
    const lesson=document.getElementById(topic.id);
    if(!lesson || lesson.querySelector("[data-lv-topic]")) return;
    const introduction=lesson.querySelector(":scope > p, :scope > .lesson-reading, :scope > .prose");
    if(introduction) introduction.insertAdjacentHTML("afterend",markup(topic));
    else lesson.insertAdjacentHTML("beforeend",markup(topic));
  });
}

export function initializeLessonVisuals() {
  document.querySelectorAll<HTMLElement>("[data-lv-topic]").forEach(figure=>{
    const topic=allLessonVisuals.find(item=>item.id===figure.dataset.lvTopic)!;
    let selected=0, detailed=true;
    const canvas=figure.querySelector<HTMLElement>(".lv-canvas")!;
    const render=()=>{
      canvas.innerHTML=diagram(topic,detailed,selected);
      figure.querySelector(".lv-selection")!.innerHTML=`<strong>${escape(topic.steps[selected].label)}</strong><p>${escape(topic.steps[selected].note)}</p>`;
    };
    const select=(node: Element)=>{
      selected=Number(node.getAttribute("data-lv-node"));
      canvas.querySelectorAll("[data-lv-node]").forEach(el=>{
        el.setAttribute("aria-pressed",String(el===node));
        el.classList.toggle("is-selected",el===node);
      });
      figure.querySelector(".lv-selection")!.innerHTML=`<strong>${escape(topic.steps[selected].label)}</strong><p>${escape(topic.steps[selected].note)}</p>`;
    };
    canvas.addEventListener("click",event=>{const node=(event.target as Element).closest("[data-lv-node]");if(node)select(node);});
    canvas.addEventListener("keydown",event=>{
      const node=(event.target as Element).closest("[data-lv-node]");
      if(node && ["Enter"," "].includes(event.key)){event.preventDefault();select(node);}
    });
    figure.querySelector("[data-lv-depth]")!.addEventListener("click",event=>{
      detailed=!detailed;
      const button=event.currentTarget as HTMLButtonElement;
      button.setAttribute("aria-pressed",String(detailed));
      button.textContent=detailed?"Hide internals":"Show internals";
      render();
    });
  });
}

/** Move the live figure into one modal; do not clone IDs, canvases or listeners. */
export function initializeFigurePopouts() {
  const dialog=document.createElement("dialog");
  dialog.className="figure-popout";
  dialog.setAttribute("aria-label","Expanded diagram");
  dialog.innerHTML='<header><strong data-popout-title></strong><button type="button" data-popout-close aria-label="Close expanded diagram">Close <kbd>Esc</kbd></button></header><div data-popout-body></div>';
  document.body.append(dialog);
  let moved:HTMLElement|null=null, placeholder:Comment|null=null, opener:HTMLButtonElement|null=null;
  let navigating=false;
  const restore=()=>{
    if(moved && placeholder){placeholder.replaceWith(moved);moved.classList.remove("is-popped-out");}
    const focus=opener;
    moved=null;placeholder=null;opener=null;
    document.body.classList.remove("figure-popout-open");
    window.dispatchEvent(new Event("resize"));
    if(!navigating && focus?.isConnected)focus.focus({preventScroll:true});
  };
  dialog.querySelector("[data-popout-close]")!.addEventListener("click",()=>dialog.close());
  dialog.addEventListener("close",restore);
  dialog.addEventListener("click",event=>{if(event.target===dialog)dialog.close();});
  document.addEventListener("atlas:beforenavigate",()=>{
    if(!dialog.open)return;
    navigating=true;restore();dialog.close();navigating=false;
  });
  const hosts=[...document.querySelectorAll<HTMLElement>("figure, .textbook-lab, .nn-figure, .architecture-figure, .wide-figure")];
  hosts.filter(host=> !host.closest(".three-lab") && !host.closest(".atlas-home, .atlas-gallery") &&
    !hosts.some(parent=>parent!==host&&parent.contains(host)) &&
    !!host.querySelector("svg, canvas, input, select, [data-lv-topic], .block-pipeline, .fiber-path, .request-flow, .token-line, .lab-controls, img")).forEach(host=>{
    const caption=host.querySelector("figcaption");
    const title=caption?.querySelector("strong")?.textContent ?? host.querySelector("h3,h4")?.textContent ?? "Lesson diagram";
    const tools=document.createElement("div");tools.className="figure-tools";
    const button=document.createElement("button");button.type="button";button.textContent="Open figure";button.setAttribute("aria-haspopup","dialog");
    tools.append(button);
    const note=caption?.querySelector("p")?.textContent;
    const boundary=host.querySelector(".nn-boundary, .figure-boundary, .omission")?.textContent;
    if((note||boundary)&&!host.matches(".lesson-visual")){
      const notes=document.createElement("details");notes.className="figure-reading-notes";
      notes.innerHTML=`<summary>Reading notes</summary>${note?`<p>${escape(note)}</p>`:""}${boundary?`<p>${escape(boundary)}</p>`:""}`;
      tools.append(notes);
    }
    host.prepend(tools);
    button.addEventListener("click",()=>{
      moved=host;opener=button;placeholder=document.createComment("expanded figure position");host.before(placeholder);
      dialog.querySelector("[data-popout-title]")!.textContent=title;
      dialog.querySelector("[data-popout-body]")!.append(host);
      host.classList.add("is-popped-out");document.body.classList.add("figure-popout-open");
      dialog.showModal();window.dispatchEvent(new Event("resize"));
      (dialog.querySelector("[data-popout-close]") as HTMLButtonElement).focus();
    });
  });
}
