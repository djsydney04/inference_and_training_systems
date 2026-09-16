import "./atlas-ui.css";
import { machinePlate } from "./machine-plate";

const icon = (name: "search" | "panel" | "book" | "diagram" | "arrow") => {
  const paths = {
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
    panel: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>',
    book: '<path d="M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Zm0 0v14"/>',
    diagram: '<rect x="8" y="8" width="8" height="8" rx="1"/><path d="M9 2v6m6-6v6M9 16v6m6-6v6M2 9h6m-6 6h6m8-6h6m-6 6h6"/>',
    arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
};

function initializeChapterBrowser() {
  const select = document.querySelector<HTMLSelectElement>("[data-reader-chapter]");
  if (!select) return;
  const groups = [...select.querySelectorAll("optgroup")];
  const picker = document.createElement("button");
  picker.className = "chapter-browser-trigger";
  picker.type = "button";
  picker.setAttribute("aria-haspopup", "dialog");
  picker.innerHTML = `${icon("book")}<span>Browse chapters</span><span aria-hidden="true">⌄</span>`;
  select.before(picker);
  select.hidden = true;
  document.querySelector('label[for="reader-chapter"]')?.setAttribute("hidden", "");
  const dialog = document.createElement("dialog");
  dialog.className = "chapter-browser";
  dialog.setAttribute("aria-labelledby", "chapter-browser-title");
  dialog.innerHTML = `<header><div><h2 id="chapter-browser-title">Chapters</h2><p>Follow the book, or start with a question.</p></div><button type="button" data-close-chapters aria-label="Close chapters">✕</button></header><label class="chapter-query">${icon("search")}<input type="search" aria-label="Find a chapter" placeholder="Find a chapter…" autocomplete="off"></label><div class="chapter-browser-groups"></div><p class="chapter-empty" hidden>No chapters match. Try a broader term.</p>`;
  const list = dialog.querySelector(".chapter-browser-groups")!;
  groups.forEach(group => {
    const section = document.createElement("section");
    const title = document.createElement("h3");
    title.textContent = group.label;
    section.append(title);
    [...group.querySelectorAll("option")].forEach(option => {
      const link = document.createElement("a");
      link.href = `#${option.value}`;
      const number = document.createElement("span");
      number.textContent = option.textContent?.match(/^\d+/)?.[0] ?? "";
      link.append(number, (option.textContent ?? "").replace(/^\d+\s*/, ""));
      section.append(link);
    });
    list.append(section);
  });
  document.body.append(dialog);
  const query = dialog.querySelector<HTMLInputElement>("input")!;
  const filter = () => {
    const term = query.value.trim().toLowerCase();
    let matches = 0;
    list.querySelectorAll("section").forEach(section => {
      let count = 0;
      section.querySelectorAll("a").forEach(link => {
        link.hidden = !`${section.querySelector("h3")?.textContent} ${link.textContent}`.toLowerCase().includes(term);
        if (!link.hidden) count++;
      });
      section.hidden = count === 0;
      matches += count;
    });
    dialog.querySelector<HTMLElement>(".chapter-empty")!.hidden = matches > 0;
  };
  picker.addEventListener("click", () => {
    query.value = "";
    filter();
    list.querySelectorAll("a").forEach(link => {
      if (link.hash === `#${select.value}`) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    dialog.showModal();
    query.focus();
  });
  query.addEventListener("input", filter);
  query.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      list.querySelector<HTMLAnchorElement>("section:not([hidden]) a:not([hidden])")?.click();
    }
  });
  dialog.addEventListener("click", event => {
    const target = event.target as Element;
    if (target.closest("a, [data-close-chapters]")) dialog.close();
    if (target === dialog) {
      const { left, right, top, bottom } = dialog.getBoundingClientRect();
      if (event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom) dialog.close();
    }
  });
  dialog.addEventListener("close", () => {
    // Navigation assigns focus to the destination; cancellation returns to the picker.
    if (!document.getElementById("chapter-index")?.inert && document.activeElement === document.body) picker.focus();
  });
  document.addEventListener("atlas:beforenavigate", () => { if (dialog.open) dialog.close(); });
}

function initializeGalleryFilters() {
  const gallery = document.querySelector<HTMLElement>(".atlas-gallery");
  if (!gallery) return;
  const entries = [...gallery.querySelectorAll<HTMLElement>(".gallery-entry")];
  const toolbar = document.createElement("div");
  toolbar.className = "gallery-toolbar";
  toolbar.innerHTML = `<div class="gallery-filters" role="group" aria-label="Diagram type"><button type="button" data-gallery-kind="all" aria-pressed="true">All diagrams</button><button type="button" data-gallery-kind="3d" aria-pressed="false">3D workbenches</button><button type="button" data-gallery-kind="lab" aria-pressed="false">Labs</button><button type="button" data-gallery-kind="project" aria-pressed="false">Projects</button></div><label class="gallery-search">${icon("search")}<input type="search" aria-label="Find a diagram" placeholder="Find a diagram…"></label>`;
  gallery.querySelector("header")!.after(toolbar);
  const status = document.createElement("p");
  status.className = "gallery-status";
  status.setAttribute("role", "status");
  toolbar.after(status);
  const empty = document.createElement("div");
  empty.className = "gallery-empty";
  empty.innerHTML = '<h2>No diagrams found</h2><p>Try another topic or show all diagrams.</p><button type="button">Clear filters</button>';
  gallery.append(empty);
  let kind = "all";
  const input = toolbar.querySelector<HTMLInputElement>("input")!;
  const filter = () => {
    let shown = 0;
    entries.forEach(entry => {
      const type = entry.querySelector(".gallery-preview + div > span")?.textContent ?? "";
      const category = /3D/.test(type) ? "3d" : /runtime|project/i.test(type) ? "project" : "lab";
      entry.hidden = (kind !== "all" && category !== kind) || !(entry.textContent ?? "").toLowerCase().includes(input.value.trim().toLowerCase());
      if (!entry.hidden) shown++;
    });
    status.textContent = `${shown} ${shown === 1 ? "diagram" : "diagrams"}`;
    empty.hidden = shown > 0;
    toolbar.querySelectorAll<HTMLButtonElement>("[data-gallery-kind]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.galleryKind === kind)));
  };
  toolbar.addEventListener("click", event => {
    const button = (event.target as Element).closest<HTMLButtonElement>("[data-gallery-kind]");
    if (button) { kind = button.dataset.galleryKind!; filter(); }
  });
  input.addEventListener("input", filter);
  empty.querySelector("button")!.addEventListener("click", () => { kind = "all"; input.value = ""; filter(); input.focus(); });
  filter();
}

export function initializeAtlasUI() {
  document.body.classList.add("atlas-ui");
  document.querySelector(".wordmark-mark")!.innerHTML = icon("diagram");
  const search = document.querySelector(".search-trigger");
  search?.insertAdjacentHTML("afterbegin", icon("search"));
  document.querySelectorAll(".syllabus-overview").forEach((link, index) => link.insertAdjacentHTML("afterbegin", icon(index ? "diagram" : "book")));
  const focus = document.createElement("button");
  focus.type = "button";
  focus.className = "reader-focus-toggle";
  focus.setAttribute("aria-label", "Hide navigation");
  focus.setAttribute("aria-pressed", "false");
  focus.title = "Hide navigation";
  focus.innerHTML = icon("panel");
  search?.before(focus);
  focus.addEventListener("click", () => {
    const active = document.body.classList.toggle("reader-focus");
    focus.setAttribute("aria-pressed", String(active));
    focus.setAttribute("aria-label", active ? "Show navigation" : "Hide navigation");
    focus.title = active ? "Show navigation" : "Hide navigation";
    const rail = document.querySelector<HTMLElement>(".chapter-index");
    if (rail) rail.inert = active;
  });
  window.matchMedia("(max-width: 820px)").addEventListener("change", () => {
    if (document.body.classList.contains("reader-focus")) {
      document.body.classList.remove("reader-focus");
      focus.setAttribute("aria-pressed", "false");
      focus.setAttribute("aria-label", "Hide navigation");
      const rail = document.querySelector<HTMLElement>(".chapter-index");
      if (rail) rail.inert = matchMedia("(max-width: 820px)").matches && !rail.classList.contains("is-open");
    }
  });
  const home = document.querySelector(".home-intro");
  if (home) {
    home.querySelector(".home-description")!.textContent = "From the first weight update to the machine underneath. Read, inspect, and build your way through the stack.";
    home.querySelector(".home-kicker")!.textContent = "The interactive systems atlas";
    const copy = document.createElement("div");
    copy.className = "home-intro-copy";
    copy.append(...home.childNodes);
    home.append(copy);
    home.insertAdjacentHTML("beforeend", machinePlate());
    document.querySelector(".home-feature")?.remove();
    const descriptions: Record<string, string> = {
      compute: "Compute dies execute the model’s matrix and vector operations.",
      memory: "Memory stacks supply weights, activations, and cached state.",
      fabric: "The interconnect carries data between memory and compute.",
    };
    home.querySelectorAll<HTMLButtonElement>("[data-plate-layer]").forEach(button => {
      button.addEventListener("click", () => {
        const layer = button.dataset.plateLayer!;
        home.querySelector(".machine-plate")!.setAttribute("data-layer", layer);
        home.querySelectorAll<HTMLButtonElement>("[data-plate-layer]").forEach(item => item.setAttribute("aria-pressed", String(item === button)));
        home.querySelector(".plate-description")!.textContent = descriptions[layer];
      });
    });
  }
  initializeChapterBrowser();
  initializeGalleryFilters();
  const syncPage = () => {
    const page = document.querySelector<HTMLElement>("#main-content > :not([hidden]):is(.chapter, .atlas-home, .atlas-gallery)");
    document.body.dataset.atlasPage = page?.id ?? "top";
    if (document.body.classList.contains("reader-focus")) document.querySelector<HTMLElement>(".chapter-index")!.inert = true;
  };
  document.addEventListener("atlas:chapterchange", syncPage);
  syncPage();
}
