import { chapters } from "./curriculum";
import { machinePlate } from "./machine-plate";
import { studyImage } from "./book-illustrations";
import { partStudies } from "./illustration-catalog";

const escape = (text: string) => text.replace(/[&<>"']/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[character]!);
const number = (id: string) => String(chapters.findIndex(chapter => chapter.id === id) + 1).padStart(2, "0");
const parts = [...new Set(chapters.filter(chapter => chapter.part !== "Reference").map(chapter => chapter.part))];
const partDescriptions: Record<string, string> = {
  Foundations: "Understand a prediction, follow the math, and learn how the numbers are stored.",
  "Training and generation": "Use the model on real data: learn its weights, distribute updates, generate tokens and refine its behavior.",
  "Accelerator designs": "Compare scheduled dataflow and accelerator families after understanding the workloads they execute.",
  Hardware: "Follow the computation through circuits, processors, memory, and networks.",
  Programming: "Write kernels, port operations between backends, and use profiles to improve the software.",
  Inference: "Generate tokens and serve requests within a memory and latency budget.",
  Practice: "Put the pieces together in a working model and a measured experiment.",
};

function buildCourseGuide() {
  const home = document.getElementById("top");
  if (!home) return;
  // Preserve the existing path controls and their reader event listeners.
  const pathSection = home.querySelector<HTMLElement>(".path-section");
  const first = chapters[0];
  home.innerHTML = `<header class="guide-intro illustrated-guide-intro"><div class="guide-intro-copy"><p class="guide-eyebrow">Course guide</p><h1 id="home-title">Machine learning systems</h1><p>Understand how a language model works, how it learns, and how the hardware runs it.</p></div><div class="guide-cover-art" aria-hidden="true">${studyImage("systems", true)}</div></header>
    <section class="guide-start" aria-labelledby="guide-start-title">
      <div class="guide-start-copy"><span class="guide-label">New to the subject?</span><h2 id="guide-start-title">Start with the foundations.</h2><p>Begin with text and token IDs. Build the arithmetic and probability tools, calculate a weight update, then follow the model into hardware and larger systems.</p><a class="primary-action" href="#${first.id}">Begin chapter ${number(first.id)} <span aria-hidden="true">→</span></a><p class="guide-prerequisites">No machine learning background required. Arithmetic and notation are explained before the equations; programming is introduced along the way.</p></div>
      <ol class="guide-first-lessons" aria-label="Your first three chapters">${chapters.slice(0,3).map((chapter, index) => `<li><a href="#${chapter.id}"><span class="guide-chapter-number">${number(chapter.id)}</span><div><strong>${escape(chapter.title)}</strong><p>${[
        "See how the model, program, and machine fit together.",
        "Understand token IDs, learned vectors, training and prompting.",
        "Start with numbers and functions; build toward probability and derivatives.",
      ][index]}</p></div><span aria-hidden="true">↗</span></a></li>`).join("")}</ol>
    </section>
    <section class="guide-course" aria-labelledby="guide-course-title"><header><h2 id="guide-course-title">The course, in order</h2><p>Each chapter builds on the ones before it. Open any chapter to see its prerequisites.</p></header><div class="guide-course-parts">${parts.map((part, index) => {
      const members = chapters.filter(chapter => chapter.part === part);
      return `<section class="guide-part" aria-labelledby="guide-part-${index}"><div class="guide-part-intro"><span>Part ${index + 1}</span><h3 id="guide-part-${index}">${escape(part)}</h3><p>${escape(partDescriptions[part] ?? "Apply the ideas in worked examples and projects.")}</p><div class="guide-part-art" aria-hidden="true">${studyImage(partStudies[part] ?? "model", true)}</div></div><ol>${members.map(chapter => `<li><a href="#${chapter.id}"><span>${number(chapter.id)}</span><strong>${escape(chapter.title)}</strong><span aria-hidden="true">↗</span></a></li>`).join("")}</ol></section>`;
    }).join("")}</div></section>
    <section class="guide-visual" aria-labelledby="guide-visual-title"><div><span class="guide-label">Learn by inspecting</span><h2 id="guide-visual-title">Open a diagram.<br>Follow the work.</h2><p>Every diagram belongs to a lesson. Select a component, step through an operation, then read the explanation around it.</p><nav aria-label="Suggested diagrams"><a href="#first-weight-update">Watch a weight update <span aria-hidden="true">↗</span></a><a href="#gpu">Inspect a GPU <span aria-hidden="true">↗</span></a><a href="#gallery">All diagrams and labs <span aria-hidden="true">↗</span></a></nav></div>${machinePlate()}</section>
    <section class="guide-how" aria-labelledby="guide-how-title"><h2 id="guide-how-title">How to use a chapter</h2><ol><li><strong>Read the explanation</strong><p>Start with the question and its worked example.</p></li><li><strong>Try the diagram</strong><p>Change an input or select a component to see what happens.</p></li><li><strong>Check your understanding</strong><p>Predict the result, open the answer, then continue to the next chapter.</p></li></ol></section>`;
  if (pathSection) {
    const paths = document.createElement("details");
    paths.className = "guide-paths";
    paths.innerHTML = "<summary>Already have a focus? Choose a reading path</summary>";
    paths.append(pathSection);
    home.append(paths);
  }
}

export function initializeCourseGuide() {
  buildCourseGuide();
  const rail = document.querySelector<HTMLElement>(".index-inner")!;
  const chapterPanel = rail.querySelector<HTMLElement>("[data-chapter-panel]");
  const select = rail.querySelector<HTMLSelectElement>("[data-reader-chapter]");
  if (select) select.hidden = true;
  rail.querySelector('label[for="reader-chapter"]')?.setAttribute("hidden", "");
  const overview = rail.querySelector<HTMLAnchorElement>('.syllabus-overview[href="#top"]');
  if (overview) overview.textContent = "Start here";
  const diagramLink = rail.querySelector<HTMLAnchorElement>('.syllabus-overview[href="#gallery"]');
  if (diagramLink) diagramLink.textContent = "Diagrams and labs";
  rail.querySelector<HTMLElement>(".reader-path-settings")?.setAttribute("hidden", "");
  const nav = document.createElement("nav");
  nav.className = "course-navigation";
  nav.setAttribute("aria-label", "Course chapters");
  nav.innerHTML = `<p class="course-nav-label">Chapters</p>${parts.map((part, index) => {
    const members = chapters.filter(chapter => chapter.part === part);
    return `<details class="course-nav-part" data-course-part="${escape(part)}" ${index === 0 ? "open" : ""}><summary><span>${escape(part)}</span><small>${number(members[0].id)}–${number(members.at(-1)!.id)}</small></summary><div>${members.map(chapter => `<div data-course-chapter="${chapter.id}"><a class="course-chapter-link" href="#${chapter.id}"><span>${number(chapter.id)}</span><strong>${escape(chapter.title)}</strong></a></div>`).join("")}</div></details>`;
  }).join("")}`;
  const links = rail.querySelector(".syllabus-links");
  if (links) links.after(nav);
  else rail.prepend(nav);
  // The reader owns this outline. Move the same node beneath its current chapter.
  // Keeping it inside the rail preserves the existing drawer and section tracking.
  const panelHome = document.createElement("div");
  panelHome.hidden = true;
  nav.after(panelHome);
  if (chapterPanel) panelHome.append(chapterPanel);
  let previous = "";
  const sync = () => {
    const page = document.querySelector<HTMLElement>("#main-content > :not([hidden]):is(.chapter, .atlas-home, .atlas-gallery, .atlas-landing, .atlas-publication)");
    const id = page?.id ?? "top";
    const chapter = chapters.find(item => item.id === id);
    nav.querySelectorAll<HTMLAnchorElement>(".course-chapter-link").forEach(link => {
      if (link.hash === `#${id}`) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    if (id !== previous) {
      nav.querySelectorAll<HTMLDetailsElement>("details").forEach(group => {
        group.open = group.dataset.coursePart === (chapter?.part ?? "Foundations");
      });
      const current = nav.querySelector<HTMLElement>(`[data-course-chapter="${id}"]`);
      if (chapterPanel) (current ?? panelHome).append(chapterPanel);
      if (current) {
        const offset = current.getBoundingClientRect().top - rail.getBoundingClientRect().top;
        // Scroll only the navigation, never displace the reader's deep link.
        if (offset > rail.clientHeight - 130 || offset < 0) rail.scrollTop += offset - 100;
      }
      previous = id;
    }
    const activeGroup = nav.querySelector<HTMLDetailsElement>(`[data-course-part="${chapter?.part ?? "Foundations"}"]`);
    if (activeGroup) activeGroup.open = true;
    if (id === "top") {
      document.title = "Course guide | AI Almanac";
    }
  };
  document.addEventListener("atlas:chapterchange", sync);
  sync();
}
