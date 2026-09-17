import "./figure-layout.css";

const inspections = new WeakSet<HTMLElement>();

/** Keep the live inspector intact: renderers can replace its contents as before. */
function foldInspection(body: HTMLElement, titleSelector: string, trigger: string, root: HTMLElement) {
  if (inspections.has(body)) return;
  inspections.add(body);
  const disclosure = document.createElement("details");
  disclosure.className = "figure-inspection";
  const summary = document.createElement("summary");
  const title = document.createElement("span");
  const action = document.createElement("span");
  action.className = "figure-inspection-action";
  action.textContent = "Details";
  summary.append(title, action);
  const shell = document.createElement("div");
  shell.className = "figure-inspection-shell";
  const links = document.createElement("div");
  links.className = "figure-inspection-links";
  body.before(shell);
  shell.append(disclosure, links);
  disclosure.append(summary, body);
  body.classList.add("figure-inspection-body");
  const observe = () => observer.observe(body, { childList: true, subtree: true, characterData: true });
  const updateTitle = () => {
    observer.disconnect();
    title.textContent = body.querySelector(titleSelector)?.textContent || "Selected part";
    // Keep drill-down actions available while the explanation is folded.
    links.replaceChildren(...body.querySelectorAll("[data-hd-open], [data-chip-open], [data-sb-level]"));
    observe();
  };
  const observer = new MutationObserver(updateTitle);
  updateTitle();
  const inspect = (event: Event) => {
    if (!event.isTrusted || !(event.target instanceof Element) || !event.target.closest(trigger)) return;
    if (event instanceof KeyboardEvent && !["Enter", " "].includes(event.key)) return;
    // A deliberate selection opens its explanation; playback never unfolds prose.
    disclosure.open = true;
  };
  root.addEventListener("click", inspect);
  root.addEventListener("keydown", inspect);
  root.addEventListener("change", inspect);
}

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
    copy.push(...root.querySelectorAll<HTMLElement>(":scope > .figure-boundary, :scope > .nn-boundary, :scope > .omission, :scope > .fiber-terms, :scope > .hd-boundary, :scope > .hd-source, :scope > .sb-boundary, :scope > .sb-source"));
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
        notes.innerHTML = "<summary>Notes</summary>";
        root.append(notes);
      }
      notes.classList.add("figure-notes");
      notes.querySelector("summary")!.textContent = "Notes";
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
    let toolbar = root.querySelector<HTMLElement>(":scope > .figure-toolbar, .figure-heading > .figure-toolbar, .figure-caption > .figure-toolbar");
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

    if (!root.matches(".book-study")) {
      if (!caption.classList.contains("figure-heading")) {
        const title = document.createElement("div");
        title.className = "figure-title";
        title.append(...caption.childNodes);
        caption.append(title);
        caption.classList.add("figure-heading");
      }
      if (toolbar) caption.append(toolbar);
    }

    for (const [selector, title, trigger] of [
      [".lv-selection", "strong", "[data-lv-node]"],
      [".nn-inspector", "strong", "[data-nn-part]"],
      [".hd-inspector", "h4", "[data-hd-part], [data-hd-open]"],
      [".sb-inspector", ".sb-component-title", "[data-system-part]"],
    ]) {
      const body = root.querySelector<HTMLElement>(selector);
      if (body && !body.closest("details")) foldInspection(body, title, trigger, root);
    }
    root.querySelectorAll<HTMLElement>(".chip-view").forEach(panel => {
      const body = panel.querySelector<HTMLElement>(".chip-inspector");
      if (body) foldInspection(body, "h4", "[data-chip-part], [data-chip-picker]", panel);
    });
    const shapes = root.querySelector<HTMLElement>(".nn-shape-notes");
    if (shapes && !shapes.closest("details")) {
      const disclosure = document.createElement("details");
      disclosure.className = "figure-dimensions";
      disclosure.innerHTML = "<summary>Tensor dimensions</summary>";
      shapes.closest(".nn-overview")!.after(disclosure);
      disclosure.append(shapes);
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
