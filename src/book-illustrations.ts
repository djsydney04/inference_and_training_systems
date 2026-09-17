import { chapters } from "./curriculum";
import { chapterStudies, lessonStudies, studies, type Study } from "./illustration-catalog";
export type { Study } from "./illustration-catalog";

/** Original SVG studies are shared by the cover and chapter openers. */
export function studyImage(study: Study, decorative = false) {
  return `<img class="study-image" src="${import.meta.env.BASE_URL}illustrations/${study}-study.svg" width="840" height="560" loading="lazy" decoding="async" alt="${decorative ? "" : studies[study].alt}">`;
}

/** Insert before the reader numbers and indexes figures, without replacing live labs. */
export function prepareBookStudies() {
  for (const { target, study, title, note } of lessonStudies) {
    const lesson = document.getElementById(target);
    if (!lesson || document.getElementById(`study-${target}`)) continue;
    const figure = document.createElement("figure");
    figure.className = "book-study";
    figure.dataset.study = study;
    figure.id = `study-${target}`;
    figure.innerHTML = `<div class="book-study-art">${studyImage(study)}</div><figcaption><span>Illustrated study</span><strong>${title}</strong><p>${note}</p><small>Conceptual illustration</small></figcaption>`;
    // A lab may itself be a figure; keep both figures independent for popouts.
    if (lesson.matches("figure, .three-lab, .wide-figure, .textbook-lab")) lesson.before(figure);
    else {
      const introduction = lesson.querySelector(":scope > p, :scope > .lesson-reading, :scope > .prose");
      const header = lesson.querySelector(":scope > header");
      if (introduction || header) (introduction ?? header)!.after(figure);
      else lesson.prepend(figure);
    }
  }
}

export function initializeBookIllustrations() {
  for (const chapter of chapters) {
    const title = document.querySelector<HTMLElement>(`#${chapter.id} > .chapter-title`);
    if (!title || title.querySelector(".chapter-illustration")) continue;
    const study = chapterStudies[chapter.id] ?? "model";
    const copy = document.createElement("div");
    copy.className = "chapter-opening-copy";
    while (title.firstChild) copy.append(title.firstChild);
    title.append(copy);
    title.insertAdjacentHTML("beforeend", `<div class="chapter-illustration" aria-hidden="true">${studyImage(study, true)}</div>`);
    title.classList.add("illustrated-opening");
  }
}
