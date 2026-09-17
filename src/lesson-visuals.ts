import { lessonDiagram } from "./lesson-diagram-renderer";
import "./lesson-visuals.css";
import type { LessonVisual } from "./lesson-visual-data";
import { allLessonVisuals } from "./lesson-visual-catalog";
const escape = (value: string) => value.replace(/[&<>"']/g, char => ({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"})[char]!);

const diagram = lessonDiagram;

function markup(topic: LessonVisual) {
  return `<figure class="lesson-visual" data-lv-topic="${topic.id}" id="${topic.id}-visual"><figcaption><span>Interactive schematic</span><strong>${escape(topic.title)}</strong><p>${escape(topic.relationship)}. Select a part to inspect its role.</p></figcaption><div class="lv-toolbar"><button type="button" data-lv-depth aria-pressed="false">Show annotations</button><span>${topic.kind==="timeline"?"Dependency order · widths are not durations":"Conceptual relationships · not physical scale"}</span></div><div class="lv-canvas" tabindex="0" aria-label="Interactive diagram; scroll horizontally on narrow screens">${diagram(topic)}</div><div class="lv-selection" aria-live="polite"><strong>${escape(topic.steps[0].label)}</strong><p>${escape(topic.steps[0].note)}</p></div><details class="lv-notes"><summary>Worked note and assumptions</summary><div><h4>Keep this true</h4><p>${escape(topic.invariant)}</p><h4>Work through it</h4><p>${escape(topic.example)}</p></div></details></figure>`;
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
    let selected=0, detailed=false;
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
      button.textContent=detailed?"Hide annotations":"Show annotations";
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
  const close=()=>{dialog.close();restore();};
  dialog.querySelector("[data-popout-close]")!.addEventListener("click",close);
  // Restore synchronously: a queued close event must not move a newly opened figure.
  dialog.addEventListener("cancel",event=>{event.preventDefault();close();});
  dialog.addEventListener("close",()=>{if(!dialog.open&&moved)restore();});
  dialog.addEventListener("click",event=>{if(event.target===dialog)close();});
  document.addEventListener("atlas:beforenavigate",()=>{
    if(!dialog.open)return;
    navigating=true;close();navigating=false;
  });
  const hosts=[...document.querySelectorAll<HTMLElement>("figure, .textbook-lab, .nn-figure, .architecture-figure, .wide-figure")];
  hosts.filter(host=> !host.closest(".three-lab") && !host.closest(".atlas-home, .atlas-gallery, .atlas-landing") &&
    !hosts.some(parent=>parent!==host&&parent.contains(host)) &&
    !!host.querySelector("svg, canvas, input, select, [data-lv-topic], .block-pipeline, .fiber-path, .request-flow, .token-line, .tensor-stack, .lab-controls, img")).forEach(host=>{
    const caption=host.querySelector("figcaption");
    const title=caption?.querySelector("strong")?.textContent ?? host.querySelector("h3,h4")?.textContent ?? "Lesson diagram";
    const tools=document.createElement("div");tools.className="figure-tools";
    const button=document.createElement("button");button.type="button";button.textContent="Open figure";button.setAttribute("aria-haspopup","dialog");
    tools.append(button);
    const note=caption?.querySelector("p")?.textContent;
    const boundary=host.querySelector(".nn-boundary, .figure-boundary, .omission")?.textContent;
    if((note||boundary)&&!host.matches(".lesson-visual, .book-study")){
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
      dialog.showModal();dialog.scrollTop=0;window.dispatchEvent(new Event("resize"));
      (dialog.querySelector("[data-popout-close]") as HTMLButtonElement).focus();
    });
  });
}
