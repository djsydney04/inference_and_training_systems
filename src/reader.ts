import { chapters, learningPaths } from "./curriculum";
import { galleryMarkup, homeMarkup } from "./atlas-home";
import { landingMarkup } from "./landing";
import { tiledMatmulLesson, distributedRuntimeLesson } from "./kernel-content";
import { optimizationChapter } from "./method-content";
import { decodingChapter } from "./decoding-content";
import { resourceChapter, collectiveChapter } from "./hardware-method-content";
import { parallelChapter } from "./parallel-content";
import { currentLessonIndex } from "./reading-position";
import { foundationsChapter } from "./foundations-content";
import { capstoneChapter } from "./capstone-content";
import { acceleratorChapter } from "./accelerator-content";
import { frontierChapter } from "./frontier-content";
import { programmingChapter, cudaChapter } from "./cuda-content";
import { portableKernelChapter } from "./portable-kernel-content";
import { digitalChapter, fpgaChapter } from "./digital-content";
import { kernelTrainingLesson } from "./kernel-training-content";
import { learningPathForId, readingSequence } from "./learning-path";
import { labelChapterContents, sectionTitle } from "./reader-structure";
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
  main.insertAdjacentHTML("afterbegin", landingMarkup + homeMarkup + galleryMarkup);
  main.insertAdjacentHTML(
    "beforeend",
    foundationsChapter + capstoneChapter + acceleratorChapter + frontierChapter +
      programmingChapter + cudaChapter + portableKernelChapter + digitalChapter + fpgaChapter + dataChapter +
      optimizationChapter +
      decodingChapter +
      resourceChapter +
      collectiveChapter +
      parallelChapter +
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
  byId("cuda-kernels")!.insertAdjacentHTML("beforeend", kernelTrainingLesson);
  chapters.forEach((chapter, index) => {
    const el = byId(chapter.id)!;
    main.append(el);
    el.dataset.chapter = chapter.title;
    el.dataset.chapterNumber = String(index + 1);
    el.querySelector(".chapter-title h2")!.textContent = chapter.title;
    el.querySelector(".chapter-summary")!.textContent = chapter.intro;
    if (chapter.evidenceChecked)
      el.querySelector(".chapter-summary")!.insertAdjacentHTML("afterend", `<p class="chapter-evidence">Sources checked ${escape(chapter.evidenceChecked)}</p>`);
    el.querySelector(".chapter-number")!.textContent = String(
      index + 1,
    ).padStart(2, "0");
    el.querySelector(".chapter-kicker")!.textContent = `${chapter.part} / Chapter ${String(index + 1).padStart(2, "0")}`;
  });
  // Every adjacent lesson citation is also discoverable in the central ledger.
  const ledger = document.querySelector<HTMLElement>("[data-source-ledger]")!;
  const sourceURLs = new Set([...ledger.querySelectorAll<HTMLAnchorElement>("a[href]")].map(a => a.href));
  chapters.filter(c => c.id !== "sources").forEach(chapter => {
    byId(chapter.id)!.querySelectorAll<HTMLAnchorElement>("a.lesson-source").forEach(link => {
      if (sourceURLs.has(link.href)) return;
      sourceURLs.add(link.href);
      const lesson = link.closest<HTMLElement>("[data-lesson]");
      const article = document.createElement("article");
      article.dataset.search = `${chapter.title} ${lesson?.dataset.lesson ?? ""} ${link.textContent} ${link.hostname}`;
      article.innerHTML = `<span>${escape(chapter.part)} · lesson reference</span><h3>${escape(link.textContent ?? link.hostname)}</h3><p>Used in <a href="#${escape(lesson?.id || chapter.id)}">${escape(lesson?.dataset.lesson ?? chapter.title)}</a>.</p><a href="${escape(link.href)}" target="_blank" rel="noreferrer">${escape(link.hostname)}</a>`;
      ledger.append(article);
    });
  });
  const index = document.querySelector(".index-inner")!;
  const parts = [...new Set(chapters.map((chapter) => chapter.part))];
  index.innerHTML = `<div class="syllabus-links"><a class="syllabus-overview" href="#top">Overview</a><a class="syllabus-overview" href="#gallery">Diagrams and labs</a></div><label class="reader-path-label" for="reader-chapter">Chapters</label><select id="reader-chapter" data-reader-chapter><option value="top">Choose a chapter</option>${parts.map(part => `<optgroup label="${escape(part)}">${chapters.filter(c => c.part === part).map(c => `<option value="${c.id}">${String(chapters.indexOf(c) + 1).padStart(2, "0")} ${escape(c.title)}</option>`).join("")}</optgroup>`).join("")}</select><section data-chapter-panel><a class="current-chapter-link" data-current-chapter-link>Chapter overview</a><nav class="chapter-lessons" aria-label="Current chapter sections"></nav></section><details class="reader-path-settings"><summary>Reading path <span data-path-name></span></summary><label class="reader-path-label" for="reader-path">Choose a path</label><select id="reader-path" data-reader-path>${learningPaths.map(path => `<option value="${path.id}">${escape(path.title)}</option>`).join("")}</select><a href="#learning-paths">View this path</a></details><div class="reader-reference-links"><a href="#glossary">Glossary</a><a href="#sources">Sources</a></div>`;
  const brand = document.querySelector<HTMLAnchorElement>(".wordmark")!;
  brand.setAttribute("aria-label", "Machine Learning Systems Atlas, home");
  brand.querySelector("span:last-child")!.innerHTML =
    "Machine Learning Systems <small>Atlas</small>";
  brand.href = "#welcome";
  const sidebarHead = document.createElement("div");
  sidebarHead.className = "sidebar-head";
  sidebarHead.append(brand);
  sidebarHead.insertAdjacentHTML("beforeend", '<button type="button" class="search-trigger" data-open-search>Search <kbd>⌘ K</kbd></button>');
  index.prepend(sidebarHead);
  const toggle = document.querySelector<HTMLButtonElement>("[data-index-toggle]")!;
  toggle.textContent = "Contents";
  document.querySelector(".page-shell")!.before(toggle);
  document.querySelector(".topbar")!.remove();
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
    byId("welcome")!,
    byId("top")!,
    byId("gallery")!,
    ...chapters.map((c) => byId(c.id)!),
  ];
  const syncDrawer = () => {
    index.inert = narrow.matches && !index.classList.contains("is-open");
    main.inert = narrow.matches && index.classList.contains("is-open");
  };
  const closeDrawer = () => {
    index.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.textContent = "Contents";
    syncDrawer();
  };
  syncDrawer();
  narrow.addEventListener("change", syncDrawer);
  const pathSelect = document.querySelector<HTMLSelectElement>("[data-reader-path]")!;
  let savedPath: string | null = null;
  try { savedPath = localStorage.getItem("atlas-reading-path"); } catch { /* Storage can be disabled. */ }
  let selectedPath = learningPathForId(savedPath).id;
  const chapterPanel = index.querySelector<HTMLElement>("[data-chapter-panel]")!;
  const chapterSelect = index.querySelector<HTMLSelectElement>("[data-reader-chapter]")!;
  toggle.addEventListener("click", () => {
    const open = index.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.textContent = open ? "Close contents" : "Contents";
    syncDrawer();
    if (open && narrow.matches)
      (
        [...index.querySelectorAll<HTMLAnchorElement>('a[aria-current="page"]')].find(link => !link.closest("[hidden]")) ??
        index.querySelector<HTMLAnchorElement>("a")
      )?.focus();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Tab" && narrow.matches && index.classList.contains("is-open") && !document.querySelector("dialog[open]")) {
      const controls = [...index.querySelectorAll<HTMLElement>('a[href],button:not(:disabled),select,summary')].filter(element => element.getClientRects().length && !element.closest("[hidden]") && (!element.closest("details:not([open])") || element.tagName === "SUMMARY"));
      controls.unshift(toggle);
      const first = controls[0];
      const last = controls.at(-1);
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    }
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
  const chapterLessons = new Map<string, HTMLElement[]>();
  chapters.forEach((chapter) => {
    const el = byId(chapter.id)!;
    const guide = el.querySelector(".chapter-reading-guide");
    guide?.remove();
    const requirements = chapter.requires
      .map((id) => chapters.find((c) => c.id === id)!)
      .filter(Boolean);
    const lessons = [
      ...el.querySelectorAll<HTMLElement>("[data-lesson], .three-lab[id]"),
    ].filter((lesson) => !lesson.parentElement?.closest("[data-lesson]"));
    chapterLessons.set(
      chapter.id,
      lessons.filter((lesson) => Boolean(lesson.id)),
    );
    labelChapterContents(el, chapters.indexOf(chapter) + 1, chapterLessons.get(chapter.id)!);
    const local = document.createElement("div");
    local.className = "reader-orientation";
    local.innerHTML = `<span>Builds on</span><ul>${requirements.map(c => `<li><a href="#${c.id}">${escape(c.title)}</a></li>`).join("")}</ul>`;
    if (requirements.length) el.querySelector(".chapter-title")!.after(local);
    const footer = document.createElement("nav");
    footer.className = "chapter-pagination";
    footer.setAttribute("aria-label", "Chapter sequence");
    el.append(footer);
    searchEntries.push({
      id: chapter.id,
      title: chapter.title,
      chapter: `${chapter.part} / Chapter ${chapters.indexOf(chapter) + 1}`,
      keywords: `${chapter.intro} ${chapter.outcome} ${chapter.id.replaceAll("-", " ")}`,
    });
    el.querySelectorAll<HTMLElement>("h3").forEach((heading, i) => {
      if (heading.closest(".scene-inspector, .reader-orientation")) return;
      if (!heading.id) heading.id = `${chapter.id}--topic-${i + 1}`;
      const lesson = heading.closest<HTMLElement>("[data-lesson]");
      searchEntries.push({
        id: lesson?.id ?? heading.id,
        title: heading.textContent?.trim() ?? "",
        chapter: `${chapter.title}${heading.closest<HTMLElement>("[data-section-number]") ? ` / Section ${heading.closest<HTMLElement>("[data-section-number]")!.dataset.sectionNumber}` : ""}`,
        keywords: lesson
          ? `${lesson.dataset.lesson} ${lesson.id.replaceAll("-", " ")}`
          : "",
      });
    });
    // Index optional worked detail by its own heading, then reveal it on arrival.
    el.querySelectorAll<HTMLElement>("h4, .deep-dive > summary").forEach((heading) => {
      if (heading.closest(".scene-inspector")) return;
      const headingCopy = heading.cloneNode(true) as HTMLElement;
      headingCopy.querySelectorAll(".code-reference,.check-reference,.section-reference").forEach(label => label.remove());
      const title = headingCopy.textContent?.trim() ?? "";
      if (!heading.id) {
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "detail";
        const base = `${chapter.id}--${slug}`;
        let id = base, suffix = 2;
        while (byId(id)) id = `${base}-${suffix++}`;
        heading.id = id;
      }
      searchEntries.push({ id: heading.id, title, chapter: chapter.title });
    });
  });

  let activePage: HTMLElement | undefined;
  const lessonNav = index.querySelector<HTMLElement>(".chapter-lessons")!;
  let activeLessons: HTMLElement[] = [];
  const sequenceMarkup = (chapterId: string) => {
    const sequence = readingSequence(chapterId, selectedPath);
    const { previous, next } = sequence;
    const context = sequence.inPath ? `${sequence.path.title} · Step ${sequence.position} of ${sequence.total}` : "Outside this path · Book order";
    return `<p class="sequence-context">${escape(context)}</p>${previous ? `<a href="#${previous.id}"><span>Previous chapter</span><strong>${escape(previous.title)}</strong></a>` : '<a href="#top"><span>Back to</span><strong>Curriculum overview</strong></a>'}${next ? `<a href="#${next.id}"><span>Next chapter</span><strong>${escape(next.title)}</strong></a>` : '<a href="#top"><span>End of this sequence</span><strong>Choose another reading path</strong></a>'}`;
  };
  const syncPath = () => {
    const path = learningPathForId(selectedPath);
    pathSelect.value = path.id;
    document.querySelectorAll<HTMLButtonElement>("[data-learning-path]").forEach(button => {
      const active = button.dataset.learningPath === path.id;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    document.querySelector("[data-path-description]")!.textContent = path.description;
    document.querySelector("[data-path-route]")!.innerHTML = path.route.map(id => {
      const chapter = chapters.find(c => c.id === id)!;
      return `<li><a href="#${id}"><span class="path-chapter-number">Chapter ${chapters.indexOf(chapter) + 1}</span>${escape(chapter.title)}</a></li>`;
    }).join("");
    chapters.forEach(chapter => {
      byId(chapter.id)!.querySelector(".chapter-pagination")!.innerHTML = sequenceMarkup(chapter.id);
    });
    index.querySelector("[data-path-name]")!.textContent = path.title;
  };
  const choosePath = (id: string) => {
    selectedPath = learningPathForId(id).id;
    try { localStorage.setItem("atlas-reading-path", selectedPath); } catch { /* Reading still works without storage. */ }
    syncPath();
  };
  pathSelect.addEventListener("change", () => choosePath(pathSelect.value));
  const updateLessonPosition = () => {
    if (document.querySelector("dialog[open]")) return;
    const current = currentLessonIndex(
      activeLessons.map((el) => el.getBoundingClientRect().top),
      Number.parseFloat(getComputedStyle(document.body).getPropertyValue("--topbar")) + 90,
    );
    lessonNav.querySelectorAll<HTMLAnchorElement>("a").forEach((link, i) => {
      link.classList.toggle("is-current", current === i);
      if (current === i) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  };
  const syncLessonNav = (page: HTMLElement) => {
    activeLessons = chapterLessons.get(page.id) ?? [];
    const meta = chapters.find(c => c.id === page.id);
    chapterPanel.hidden = !meta || !activeLessons.length;
    chapterSelect.value = meta?.id ?? "top";
    index.querySelector(".index-inner")!.scrollTop = 0;
    const chapterLink = index.querySelector<HTMLAnchorElement>("[data-current-chapter-link]")!;
    chapterLink.href = `#${page.id}`;
    lessonNav.innerHTML = activeLessons
      .map(
        (lesson) =>
          `<a href="#${lesson.id}"><span>${lesson.dataset.sectionNumber}</span>${escape(sectionTitle(lesson))}</a>`,
      )
      .join("");

  };
  const updateProgress = () => {
    if (activePage) updateLessonPosition();
  };
  let scrollFrame = 0;
  window.addEventListener(
    "scroll",
    () => {
      if (scrollFrame) return;
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = 0;
        updateProgress();
      });
    },
    { passive: true },
  );
  const renderRoute = (focus = false, instant = false) => {
    // Expanded workbenches temporarily move out of their chapters. Restore them
    // synchronously before resolving a deep link or browser-history entry.
    document.dispatchEvent(new Event("atlas:beforenavigate"));
    let id: string;
    try {
      id = decodeURIComponent(location.hash.slice(1)) || "welcome";
    } catch {
      id = "welcome";
    }
    const destination = byId(id) ?? byId("welcome")!;
    const page =
      destination.closest<HTMLElement>(
        ".chapter, .atlas-home, .atlas-gallery, .atlas-landing",
      ) ?? byId("welcome")!;
    document.body.dataset.atlasPage = page.id;
    const changed = activePage !== page;
    topPages.forEach((item) => {
      item.hidden = item !== page;
    });
    let disclosure = destination.closest<HTMLDetailsElement>("details");
    while (disclosure) {
      disclosure.open = true;
      disclosure = disclosure.parentElement?.closest<HTMLDetailsElement>("details") ?? null;
    }
    if (destination.id === "learning-paths")
      page.querySelector<HTMLDetailsElement>(".path-outline")!.open = true;
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
    if (changed) syncLessonNav(page);
    const meta = chapters.find((c) => c.id === page.id);
    document.title = page.id === "welcome"
      ? "Machine Learning Systems Atlas"
      : `${meta?.title ?? (page.id === "gallery" ? "Diagrams and labs" : "Course guide")} | Machine Learning Systems Atlas`;
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
          behavior: instant || changed || motion.matches ? "instant" : "smooth",
        });
      if (focus) {
        const target =
          destination === page
            ? page.querySelector<HTMLElement>("h1,h2")!
            : destination.matches("[data-section-number]")
              ? destination.querySelector<HTMLElement>(":scope > header h3, :scope > h3, .section-reference") ?? destination
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
    // SVG diagram links expose href as SVGAnimatedString and have no .hash.
    const hash = link.getAttribute("href")!;
    if (hash === "#main-content") {
      main.setAttribute("tabindex", "-1");
      main.focus();
      return;
    }
    if (location.hash !== hash) history.pushState(null, "", hash);
    renderRoute(true, true);
  });
  window.addEventListener("hashchange", () => renderRoute());
  document.addEventListener("atlas:navigate", (e) => {
    const id = (e as CustomEvent<string>).detail;
    history.pushState(null, "", `#${id}`);
    renderRoute(true, true);
  });
  new ResizeObserver(updateProgress).observe(main);

  chapterSelect.addEventListener("change", () => {
    document.dispatchEvent(new CustomEvent("atlas:navigate", { detail: chapterSelect.value }));
  });

  document
    .querySelectorAll<HTMLButtonElement>("[data-learning-path]")
    .forEach((button) =>
      button.addEventListener("click", () => {
        choosePath(button.dataset.learningPath!);
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
  syncPath();
  renderRoute();
}
