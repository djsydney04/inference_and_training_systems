import "./atlas-ui.css";
import "./course-guide.css";
import "./landing.css";
import { initializeMachinePlates } from "./machine-plate";
import { initializeCourseGuide } from "./course-guide";

const icon = (name: "search" | "diagram") => {
  const paths = {
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
    diagram: '<rect x="8" y="8" width="8" height="8" rx="1"/><path d="M9 2v6m6-6v6M9 16v6m6-6v6M2 9h6m-6 6h6m8-6h6m-6 6h6"/>',
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
};

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
  initializeCourseGuide();
  initializeMachinePlates(document);
  initializeGalleryFilters();
  const syncPage = () => {
    const page = document.querySelector<HTMLElement>("#main-content > :not([hidden]):is(.chapter, .atlas-home, .atlas-gallery, .atlas-landing)");
    document.body.dataset.atlasPage = page?.id ?? "top";
  };
  document.addEventListener("atlas:chapterchange", syncPage);
  syncPage();
}
