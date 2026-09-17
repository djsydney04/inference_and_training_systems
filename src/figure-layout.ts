import "./figure-layout.css";

const hostSelector = "figure, .textbook-lab, .nn-figure, .architecture-figure, .wide-figure";

/** Reuse live nodes so figure controls, calculations, and popouts keep their state. */
export function refreshFigureLayouts() {
  const roots = document.querySelectorAll<HTMLElement>(`.chapter :is(${hostSelector}), .figure-popout :is(${hostSelector})`);
  for (const root of roots) {
    const caption = [...root.querySelectorAll<HTMLElement>("figcaption")].find(item => item.closest(hostSelector) === root);
    if (!caption || !caption.querySelector("strong")) continue;
    root.classList.add("figure-layout");
    caption.classList.add("figure-caption");

    // A figure number and title are sufficient; type labels repeat the surrounding lesson.
    caption.querySelector(".figure-reference small")?.remove();
    const copy = [...caption.querySelectorAll<HTMLElement>(":scope > p")].filter(p => !p.querySelector("button, input, select, [aria-live]"));
    const illustrationScope = caption.querySelector<HTMLElement>(":scope > small");
    if (root.matches(".book-study") && illustrationScope) copy.push(illustrationScope);
    copy.push(...root.querySelectorAll<HTMLElement>(":scope > .figure-boundary, :scope > .nn-boundary, :scope > .omission, :scope > .fiber-terms"));
    const scope = root.querySelector<HTMLElement>(":scope > .lv-toolbar > span");
    if (scope) copy.push(scope);
    const playback = root.querySelector<HTMLElement>(":scope > .diagram-playback");
    const stepNote = playback?.querySelector<HTMLElement>(".playback-caption");
    if (stepNote) copy.push(stepNote);
    const traceNote = root.querySelector<HTMLElement>(":scope > .transformer-controls > [data-transformer-status]");
    if (traceNote) copy.push(traceNote);

    let notes = root.querySelector<HTMLDetailsElement>(":scope > .figure-notes, :scope > .lv-notes");
    if (copy.length || notes) {
      if (!notes) {
        notes = document.createElement("details");
        notes.innerHTML = "<summary>Figure notes</summary>";
        root.append(notes);
      }
      notes.classList.add("figure-notes");
      notes.querySelector("summary")!.textContent = "Figure notes";
      let body = notes.querySelector<HTMLElement>(":scope > .figure-notes-copy");
      if (!body) {
        body = document.createElement("div");
        body.className = "figure-notes-copy";
        notes.querySelector("summary")!.after(body);
      }
      body.append(...copy);
      // The old popout toolbar cloned caption prose into a second disclosure.
      root.querySelectorAll(":scope > .figure-tools > .figure-reading-notes").forEach(item => item.remove());
    }

    const controls = [...root.querySelectorAll<HTMLElement>(":scope > .diagram-playback, :scope > .lv-toolbar, :scope > .figure-tools, :scope > .three-head > .three-controls, :scope > .transformer-controls, :scope > .lab-head > button")];
    let toolbar = root.querySelector<HTMLElement>(":scope > .figure-toolbar");
    if (controls.length && !toolbar) {
      toolbar = document.createElement("div");
      toolbar.className = "figure-toolbar";
      toolbar.setAttribute("role", "group");
      toolbar.setAttribute("aria-label", "Figure controls");
      const heading = caption.parentElement === root ? caption : caption.parentElement!;
      heading.after(toolbar);
    }
    if (toolbar) {
      toolbar.append(...controls);
      // Playback first, diagram-specific options next, expansion at the end.
      for (const selector of [".diagram-playback", ".lv-toolbar", ".three-controls", ".transformer-controls", "button", ".figure-tools"]) {
        const control = toolbar.querySelector<HTMLElement>(`:scope > ${selector}`);
        if (control) toolbar.append(control);
      }
    }

    if (root.matches(".book-study")) {
      const art = root.querySelector(".book-study-art")!;
      // Let the drawing fill the width; its short caption sits beneath it.
      root.prepend(art);
      art.after(caption);
      if (toolbar) caption.append(toolbar);
    }
  }
}
