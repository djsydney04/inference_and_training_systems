import { chapters } from "./curriculum";

export type Study = "model" | "silicon" | "systems";

const descriptions: Record<Study, string> = {
  model: "Token vectors flow into a causal attention matrix and onward to a prediction. Hatched cells mark future positions; blue picks out a path through the calculation.",
  silicon: "A top-down accelerator study: a field of compute tiles, memory banks on either side, and fine interconnect traces. Blue follows data between them.",
  systems: "Eight compute nodes joined by a web of communication paths. A blue route traces data moving between machines.",
};

/** Original SVG studies are shared by the cover and chapter openers. */
export function studyImage(study: Study, decorative = false) {
  return `<img class="study-image" src="${import.meta.env.BASE_URL}illustrations/${study}-study.svg" width="840" height="560" loading="lazy" decoding="async" alt="${decorative ? "" : descriptions[study]}">`;
}

export function initializeBookIllustrations() {
  for (const chapter of chapters) {
    if (chapter.part === "Reference") continue;
    const title = document.querySelector<HTMLElement>(`#${chapter.id} > .chapter-title`);
    if (!title || title.querySelector(".chapter-illustration")) continue;
    const distributed = ["orientation", "training", "parallel-training", "rack", "collectives"].includes(chapter.id);
    const study: Study = distributed || ["Inference", "Practice"].includes(chapter.part)
      ? "systems"
      : ["Hardware", "Programming"].includes(chapter.part) || chapter.id === "programming" ? "silicon" : "model";
    const copy = document.createElement("div");
    copy.className = "chapter-opening-copy";
    while (title.firstChild) copy.append(title.firstChild);
    title.append(copy);
    title.insertAdjacentHTML("beforeend", `<div class="chapter-illustration" aria-hidden="true">${studyImage(study, true)}</div>`);
    title.classList.add("illustrated-opening");
  }
}
