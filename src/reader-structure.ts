import { buildChapterOutline, figureCaptionLabel, itemLabel, sectionCaptionLabel } from "./reader-labels";

export function sectionTitle(section: HTMLElement): string {
  return section.dataset.lesson ||
    section.querySelector(":scope > header h3, :scope > h3")?.textContent?.trim() ||
    section.querySelector("figcaption strong")?.textContent?.trim() ||
    section.dataset.lesson || "Workbench";
}

/** Run after content has been moved into its final chapter, before indexing it. */
export function labelChapterContents(chapter: HTMLElement, number: number, sections: HTMLElement[]) {
  const outline = buildChapterOutline(number, sections.map(section => ({ id: section.id, title: sectionTitle(section) })));
  sections.forEach((section, i) => {
    section.dataset.sectionNumber = outline[i].number;
    const header = section.querySelector<HTMLElement>(":scope > header");
    let marker = header?.querySelector<HTMLElement>(":scope > span");
    const original = section.dataset.lesson ?? marker?.textContent ?? "";
    if (!marker) {
      marker = document.createElement("span");
      (header ?? section).prepend(marker);
    }
    marker.classList.add("section-reference");
    marker.textContent = sectionCaptionLabel(number, i + 1, original);
    marker.dataset.sectionLabel = outline[i].label;
  });
  chapter.querySelectorAll<HTMLElement>("figcaption").forEach((caption, i) => {
    let marker = caption.querySelector<HTMLElement>(":scope > span:first-child");
    if (!marker) {
      marker = document.createElement("span");
      caption.prepend(marker);
    }
    const label = figureCaptionLabel(number, i + 1, marker.textContent ?? "");
    const reference = itemLabel("figure", number, i + 1);
    marker.textContent = reference;
    marker.classList.add("figure-reference");
    const descriptor = label.slice(reference.length).replace(/^ · /, "");
    if (descriptor) {
      const kind = document.createElement("small");
      kind.textContent = descriptor;
      marker.append(document.createTextNode(" "), kind);
    }
    caption.dataset.figureLabel = reference;
  });
  chapter.querySelectorAll<HTMLElement>("pre").forEach((pre, i) => {
    const label = document.createElement("span");
    label.className = "code-reference";
    label.textContent = itemLabel("code", number, i + 1);
    pre.dataset.codeLabel = label.textContent;
    const disclosure = pre.closest("details");
    if (disclosure?.matches(".lesson-code, .manual-code-details, .digital-source-code") && disclosure.querySelector("summary"))
      disclosure.querySelector("summary")!.prepend(label, document.createTextNode(" "));
    else pre.before(label);
  });
  chapter.querySelectorAll<HTMLElement>(".knowledge-check").forEach((check, i) => {
    const summary = check.querySelector("summary");
    if (!summary) return;
    const label = document.createElement("span");
    label.className = "check-reference";
    label.textContent = itemLabel("check", number, i + 1);
    check.dataset.checkLabel = label.textContent;
    summary.prepend(label, document.createTextNode(" "));
  });
}
