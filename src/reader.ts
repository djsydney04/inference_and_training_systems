import { chapters, learningPaths, adjacentChapters } from "./curriculum";
import { galleryMarkup, homeMarkup } from "./atlas-home";
import { tiledMatmulLesson, distributedRuntimeLesson } from "./kernel-content";
import { optimizationChapter } from "./method-content";
import {
  dataChapter,
  performanceChapter,
  postChapter,
  projectsChapter,
  servingChapter,
} from "./systems-content";

const escape = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const byId = (id: string) => document.getElementById(id);

export function prepareReader() {
  document.body.classList.add("atlas-reader");
  document.querySelector(".hero")?.remove();
  const main = byId("main-content")!;
  main.insertAdjacentHTML("afterbegin", homeMarkup + galleryMarkup);
  main.insertAdjacentHTML(
    "beforeend",
    dataChapter +
      optimizationChapter +
      postChapter +
      performanceChapter +
      servingChapter +
      projectsChapter,
  );
  const postBody = document.querySelector("[data-post-training-body]")!;
  document.querySelector("#training .chapter-summary")!.textContent =
    "Follow the optimizer update across workers: account for memory, collective communication, numerical state, and a restart that preserves the experiment.";
  [".objective-ladder", "#post-training-loss", "#adapters-rollouts"].forEach(
    (selector) => {
      const element = document.querySelector(selector);
      if (element) postBody.before(element);
    },
  );
  // The pre/post overview belongs in orientation; implementation gets its own chapters.
  const phaseOverview = document.querySelector(".training-phases");
  if (phaseOverview) byId("orientation")!.append(phaseOverview);
  const postResearch = document.createElement("section");
  postResearch.className = "field-notes";
  postResearch.innerHTML =
    '<div class="section-rule-title compact"><span>Research watch · checked 2026-09-03</span><h3>Policy optimization is also a systems problem</h3><p>Read these interventions against the authors’ disclosed training setup, not as universal defaults.</p></div><div class="field-note-grid"></div>';
  document
    .querySelectorAll<HTMLAnchorElement>("#training .field-note-grid a")
    .forEach((link) => {
      if (link.href.includes("2503.14476") || link.href.includes("2507.18071"))
        postResearch
          .querySelector(".field-note-grid")!
          .append(link.closest("article")!);
    });
  postBody.before(postResearch);
  postBody.remove();
  byId("training")!.insertAdjacentHTML("beforeend", distributedRuntimeLesson);
  byId("performance")!.insertAdjacentHTML("beforeend", tiledMatmulLesson);
  chapters.forEach((chapter, index) => {
    const el = byId(chapter.id)!;
    main.append(el);
    el.dataset.chapter = chapter.title;
    el.querySelector(".chapter-number")!.textContent = String(
      index + 1,
    ).padStart(2, "0");
    el.querySelector(".chapter-kicker")!.textContent = chapter.part;
  });
  const index = document.querySelector(".index-inner")!;
  const parts = [...new Set(chapters.map((chapter) => chapter.part))];
  index.innerHTML = `<a class="syllabus-overview" href="#top">Curriculum overview</a><a class="syllabus-overview" href="#gallery">Systems gallery <span>↗</span></a><nav aria-label="Textbook syllabus">${parts
    .map(
      (part) =>
        `<section class="nav-part"><h2>${part}</h2>${chapters
          .filter((c) => c.part === part)
          .map(
            (c) =>
              `<a href="#${c.id}" data-nav-section="${c.id}"><span>${String(chapters.indexOf(c) + 1).padStart(2, "0")}</span>${c.title}</a>`,
          )
          .join("")}</section>`,
    )
    .join(
      "",
    )}</nav><p class="syllabus-foot">Read the mechanism.<br>Build the system. Verify the result.</p>`;
  const brand = document.querySelector<HTMLAnchorElement>(".wordmark")!;
  brand.setAttribute("aria-label", "Machine Learning Systems Atlas, home");
  brand.querySelector("span:last-child")!.innerHTML =
    "Machine Learning Systems <small>Atlas</small>";
  document.querySelector(".topbar-progress")!.innerHTML =
    '<a href="#top">Atlas</a><span class="breadcrumb-divider">/</span><span data-reader-part>Overview</span><span class="breadcrumb-divider">/</span><span data-progress-label>Curriculum</span>';
  document
    .querySelector(".index-toggle")!
    .insertAdjacentHTML(
      "beforebegin",
      '<button class="search-trigger" data-open-search>Search <kbd>⌘ K</kbd></button>',
    );
  document.querySelectorAll(".footer p, footer p").forEach((el) => {
    if (el.textContent?.includes("The Inference Engineering Atlas"))
      el.textContent = "Machine Learning Systems Atlas";
  });
}

export function initializeReader() {
  const main = byId("main-content")!;
  const index = byId("chapter-index")!;
  const toggle = document.querySelector<HTMLButtonElement>(
    "[data-index-toggle]",
  )!;
  const narrow = window.matchMedia("(max-width: 820px)");
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const topPages = [
    byId("top")!,
    byId("gallery")!,
    ...chapters.map((c) => byId(c.id)!),
  ];
  const syncDrawer = () => {
    index.inert = narrow.matches && !index.classList.contains("is-open");
  };
  const closeDrawer = () => {
    index.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    syncDrawer();
  };
  syncDrawer();
  narrow.addEventListener("change", syncDrawer);
  toggle.addEventListener("click", () => {
    const open = index.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
    syncDrawer();
    if (open && narrow.matches)
      index.querySelector<HTMLAnchorElement>("a")?.focus();
  });
  document.addEventListener("keydown", (e) => {
    if (
      e.key === "Escape" &&
      index.classList.contains("is-open") &&
      !document.querySelector("dialog[open]")
    ) {
      closeDrawer();
      toggle.focus();
    }
  });

  const searchEntries: {
    id: string;
    title: string;
    chapter: string;
    keywords?: string;
  }[] = [];
  chapters.forEach((chapter) => {
    const el = byId(chapter.id)!;
    // Figure numbers follow the reader's chapter order, including moved lessons.
    let figureNumber = 0;
    el.querySelectorAll<HTMLElement>("figcaption > span:first-child").forEach(
      (label) => {
        const kind = label.textContent?.match(
          /^(Figure|Interactive)\s+\d/,
        )?.[1];
        if (kind)
          label.textContent = `${kind} ${chapters.indexOf(chapter) + 1}.${++figureNumber}`;
      },
    );
    const guide = el.querySelector(".chapter-reading-guide");
    guide?.remove();
    const requirements = chapter.requires
      .map((id) => chapters.find((c) => c.id === id)!)
      .filter(Boolean);
    const lessons = [
      ...el.querySelectorAll<HTMLElement>("[data-lesson], .three-lab[id]"),
    ].filter((lesson) => !lesson.parentElement?.closest("[data-lesson]"));
    const local = document.createElement("div");
    local.className = "reader-orientation";
    local.innerHTML = `<p><span>After this chapter</span>${chapter.outcome}</p>${requirements.length ? `<div class="prerequisite-line">Builds on ${requirements.map((c) => `<a href="#${c.id}">${c.title}</a>`).join("<span> / </span>")}</div>` : ""}${lessons.length ? `<nav aria-label="In this chapter"><span>In this chapter</span>${lessons.map((lesson) => `<a href="#${lesson.id}">${lesson.dataset.lesson ?? lesson.querySelector("figcaption strong")?.textContent ?? "3D workbench"}</a>`).join("")}</nav>` : ""}`;
    el.querySelector(".chapter-title")!.after(local);
    const { previous, next } = adjacentChapters(chapter.id);
    const footer = document.createElement("nav");
    footer.className = "chapter-pagination";
    footer.setAttribute("aria-label", "Chapter sequence");
    footer.innerHTML = `${previous ? `<a href="#${previous.id}"><span>Previous chapter</span><strong>← ${previous.title}</strong></a>` : '<a href="#top"><span>Back to</span><strong>Curriculum overview</strong></a>'}${next ? `<a href="#${next.id}"><span>Next chapter</span><strong>${next.title} →</strong></a>` : '<a href="#projects"><span>Put it into practice</span><strong>Engineering projects →</strong></a>'}`;
    el.append(footer);
    searchEntries.push({
      id: chapter.id,
      title: chapter.title,
      chapter: chapter.part,
    });
    el.querySelectorAll<HTMLElement>("h3").forEach((heading, i) => {
      if (heading.closest(".scene-inspector")) return;
      if (!heading.id) heading.id = `${chapter.id}--topic-${i + 1}`;
      const lesson = heading.closest<HTMLElement>("[data-lesson]");
      searchEntries.push({
        id: heading.id,
        title: heading.textContent?.trim() ?? "",
        chapter: chapter.title,
        keywords: lesson
          ? `${lesson.dataset.lesson} ${lesson.id.replaceAll("-", " ")}`
          : "",
      });
    });
  });

  let activePage: HTMLElement | undefined;
  const progress = document.createElement("div");
  progress.className = "reader-progress";
  progress.setAttribute("aria-hidden", "true");
  document.querySelector(".topbar")!.append(progress);
  const updateProgress = () => {
    if (!activePage) return;
    const range = Math.max(1, activePage.offsetHeight - innerHeight + 64);
    progress.style.width = `${Math.max(0, Math.min(1, scrollY / range)) * 100}%`;
  };
  window.addEventListener("scroll", updateProgress, { passive: true });
  const renderRoute = (focus = false) => {
    // Expanded workbenches temporarily move out of their chapters. Restore them
    // synchronously before resolving a deep link or browser-history entry.
    document.dispatchEvent(new Event("atlas:beforenavigate"));
    let id: string;
    try {
      id = decodeURIComponent(location.hash.slice(1)) || "top";
    } catch {
      id = "top";
    }
    const destination = byId(id) ?? byId("top")!;
    const page =
      destination.closest<HTMLElement>(
        ".chapter, .atlas-home, .atlas-gallery",
      ) ?? byId("top")!;
    const changed = activePage !== page;
    topPages.forEach((item) => {
      item.hidden = item !== page;
    });
    // A search result must remain reachable after using a reference-page filter.
    if (
      destination.closest(
        ".glossary-entry[hidden], [data-source-ledger] article[hidden]",
      )
    ) {
      page
        .querySelectorAll<HTMLInputElement>('input[type="search"]')
        .forEach((input) => {
          input.value = "";
          input.dispatchEvent(new Event("input"));
        });
      page
        .querySelector<HTMLButtonElement>('[data-glossary-filter="all"]')
        ?.click();
    }
    activePage = page;
    const meta = chapters.find((c) => c.id === page.id);
    document.title = `${meta?.title ?? (page.id === "gallery" ? "Systems gallery" : "Training, hardware & inference")} | Machine Learning Systems Atlas`;
    document.querySelector("[data-reader-part]")!.textContent =
      meta?.part ?? "Overview";
    document.querySelector("[data-progress-label]")!.textContent =
      meta?.title ?? (page.id === "gallery" ? "Systems gallery" : "Curriculum");
    index.querySelectorAll<HTMLAnchorElement>("a").forEach((a) => {
      const active = a.hash === `#${page.id}`;
      a.classList.toggle("is-active", active);
      if (active) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    closeDrawer();
    requestAnimationFrame(() => {
      if (destination === page)
        window.scrollTo({ top: 0, behavior: "instant" });
      else
        destination.scrollIntoView({
          block: "start",
          behavior: changed || motion.matches ? "instant" : "smooth",
        });
      if (focus) {
        const target =
          destination === page
            ? page.querySelector<HTMLElement>("h1,h2")!
            : destination;
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      }
      updateProgress();
      document.dispatchEvent(
        new CustomEvent("atlas:chapterchange", { detail: page.id }),
      );
    });
  };
  document.addEventListener("click", (e) => {
    const link = (e.target as Element).closest<HTMLAnchorElement>(
      'a[href^="#"]',
    );
    if (
      !link ||
      e.ctrlKey ||
      e.metaKey ||
      e.shiftKey ||
      e.altKey ||
      e.button !== 0
    )
      return;
    e.preventDefault();
    if (link.hash === "#main-content") {
      main.setAttribute("tabindex", "-1");
      main.focus();
      return;
    }
    if (location.hash !== link.hash) history.pushState(null, "", link.hash);
    renderRoute(true);
  });
  window.addEventListener("hashchange", () => renderRoute());
  document.addEventListener("atlas:navigate", (e) => {
    const id = (e as CustomEvent<string>).detail;
    history.pushState(null, "", `#${id}`);
    renderRoute(true);
  });
  new ResizeObserver(updateProgress).observe(main);

  document
    .querySelectorAll<HTMLButtonElement>("[data-learning-path]")
    .forEach((button) =>
      button.addEventListener("click", () => {
        const path = learningPaths.find(
          (p) => p.id === button.dataset.learningPath,
        )!;
        document
          .querySelectorAll<HTMLButtonElement>("[data-learning-path]")
          .forEach((b) => {
            b.classList.toggle("is-active", b === button);
            b.setAttribute("aria-pressed", String(b === button));
          });
        document.querySelector("[data-path-description]")!.textContent =
          path.description;
        document.querySelector("[data-path-route]")!.innerHTML = path.route
          .map(
            (id) =>
              `<li><a href="#${id}">${chapters.find((c) => c.id === id)!.title}</a></li>`,
          )
          .join("");
      }),
    );

  const dialog = document.createElement("dialog");
  dialog.className = "search-dialog";
  dialog.setAttribute("aria-label", "Search the textbook");
  dialog.innerHTML =
    '<form method="dialog"><label for="atlas-search">Search the textbook</label><button aria-label="Close search">Esc</button></form><input id="atlas-search" type="search" placeholder="Try gradient, register, checkpoint…" autocomplete="off"/><p data-search-status aria-live="polite"></p><div data-search-results></div>';
  document.body.append(dialog);
  const input = dialog.querySelector<HTMLInputElement>("input")!;
  const search = () => {
    const query = input.value.toLocaleLowerCase().trim();
    const results = searchEntries
      .filter((entry) =>
        `${entry.title} ${entry.chapter} ${entry.keywords ?? ""}`
          .toLocaleLowerCase()
          .includes(query),
      )
      .slice(0, 18);
    dialog.querySelector("[data-search-status]")!.textContent = query
      ? results.length
        ? `${results.length} matching topics${results.length === 18 ? " shown" : ""}`
        : "No matching topics. Try a broader term."
      : "Chapters and topics";
    dialog.querySelector("[data-search-results]")!.innerHTML = results
      .map(
        (entry) =>
          `<a href="#${escape(entry.id)}"><span>${escape(entry.chapter)}</span><strong>${escape(entry.title)}</strong></a>`,
      )
      .join("");
  };
  const openSearch = () => {
    search();
    dialog.showModal();
    input.focus();
  };
  document
    .querySelector("[data-open-search]")!
    .addEventListener("click", openSearch);
  input.addEventListener("input", search);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      dialog
        .querySelector<HTMLAnchorElement>("[data-search-results] a")
        ?.click();
    }
  });
  dialog.addEventListener("click", (e) => {
    if ((e.target as Element).closest("a") || e.target === dialog)
      dialog.close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && dialog.open) {
      e.preventDefault();
      dialog.close();
      return;
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      if (!dialog.open) openSearch();
    }
  });
  document.addEventListener("atlas:chapterchange", () => {
    if (dialog.open) dialog.close();
  });
  renderRoute();
}
