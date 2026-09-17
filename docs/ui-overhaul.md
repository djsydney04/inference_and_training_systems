# AI Almanac UI and course navigation

The landing page uses a spacious dark stage, a large AI Almanac wordmark, and an
interactive package drawing. The restrained contrast and product presentation
are inspired by [Anduril](https://www.anduril.com/), reviewed September 16, 2026.
The reader stays light, with square figure frames, fine borders, and quiet
navigation. There are no blurred overlays or decorative panel shadows.

The root URL opens a separate landing page with a clear **Open the almanac** action,
an interactive package drawing, and a short introduction. It leads into the course
guide at `#top`. Chapter and section links still open directly, and the sidebar
identity returns to the landing page at `#welcome`.

The landing page continues through three illustrated spreads: models, machines,
and systems. Original vector studies break up the page with fine linework,
hatched detail, and alternating paper and dark-green backgrounds. Their links
lead directly to the relevant chapters; a final reading action opens the guide.

The expanded collection contains sixteen distinct drawings. It introduces all
28 chapters and both reference pages with artwork selected by subject, supplies
29 larger illustrated studies inside the lessons, and appears in all six course
parts and 25 diagram-library previews. Lesson studies are numbered before reader
indexing and share its accessible figure popout.
The shared schematic styles use matching pale-green surfaces, engraved corners,
and more generous captions. `src/book-illustrations.ts` and
`src/illustrated-book.css` connect this artwork to the book. The original SVGs and
their conceptual scope are documented in `public/illustrations/README.md`.

The horizontal top bar has been removed. Identity and search now live in the
sidebar, and the reader starts at the top of the viewport. On mobile, a compact
Contents button opens the full-height navigation drawer.

The landing markup and headerless shell live in `src/landing.ts` and
`src/landing.css`. The shared figure styles live in `src/atlas-ui.css`; the course guide and visible
navigation live in `src/course-guide.ts` and `src/course-guide.css`.
`src/almanac-design.css` applies the shared design direction;
`src/ui-refinements.css` fixes measured layout issues. `src/atlas-ui.ts`
integrates these without changing lesson calculations.

The edition footer appears on both the landing page and the reader. Its version
comes from `package.json`; its date, derived edition number, and notes come from
`src/release.ts`. Release-note links reveal the matching disclosure.

Matrix multiplication and all-reduce now use interactive 2D diagrams in
`src/numerical-diagrams.ts`. Exact values, selected operands, padded cells, and
contributing ranks stay visible. Both reuse the existing math/state and support
keyboard selection. Their obsolete 3D renderers have been removed. Physical
GPU, rack, and LPU workbenches retain 3D views.

The audit fixed mobile overflow in the Transformer explanation and narrow-screen
attention case studies. The landing preview is excluded from automatic lesson
playback so it stays uncluttered and responds to manual layer selection.

- The course guide explains the starting point, the first three chapters, the full
  course sequence, and how to read and interact with a chapter.
- Chapter groups are visible directly in the sidebar. The active chapter contains
  its section outline; deep links expand the relevant group automatically.
- The chapter picker and navigation-hiding control have been removed.
- Reading paths remain available as an optional disclosure on the course guide.
- The diagram library supports type filters, text search, and empty states.
- The package drawing remains in the guide's diagram introduction and highlights
  compute, memory, and interconnect.
- Every 3D workbench receives zoom, fit, isometric/top views, grid visibility,
  and inspector visibility through `src/scene-navigation.ts`.
- Page scrolling remains available over models. Zoom uses explicit controls.
- Expanded workbenches retain the existing modal and navigation restoration.

## Verification on September 16, 2026

- `npm test`: 101 tests passed after the expanded illustration pass.
- `npm run lint:ui`: all 12 checks passed at 320, 390, 768, and 1440px.
- `npm run build`: TypeScript and Vite passed. The existing bundle-size warning
  remains; this change does not restructure curriculum loading.
- `git diff --check`: passed.
- Local development URL returned HTTP 200.
- The landing action, browser back/forward, return-home link, direct chapter links,
  and unknown-route fallback were checked in the browser. The landing page has no
  reader sidebar or lesson toolbar; the reader has no horizontal header gap.
- Browser checks passed for the first-chapter action, group expansion, current
  chapter and section highlighting, nested outlines, search, preserved reading
  path controls, and package layer selection.
- Mobile checks passed for the contents drawer, chapter navigation, main-content
  focus recovery, and Escape returning focus to Contents at 390px.
- Mobile Tab and Shift+Tab stay in the open drawer, including its close button.
  Closing the drawer restores interaction with the chapter. Search is available
  in the sidebar and through the keyboard shortcut from either page.
- The prior pass also verified camera tools, inspector/grid toggles, expanded-view
  restoration, and gallery filters.
- No horizontal page overflow on the checked overview widths of 320, 390, 768,
  and 1440px, or the GPU and gallery pages at 390px.
- Reduced-motion preferences disable UI animation.
- Browser console: no application errors in the final review session.
- The illustration pass reran all 96 unit tests, all 12 UI checks, and the build.
  Desktop and mobile screenshots verified the new landing spreads and chapter
  openings. All three image assets loaded, their chapter links worked, and a
  restyled schematic retained keyboard selection and open/close behavior.
- Screenshot review caught and fixed caption contrast on the dark spread,
  disconnected network lines, and the cover caption's inherited right alignment.
- The expanded pass verified 29 numbered lesson studies, 30 illustrated chapter
  and reference openings, six course-part drawings, and 25 library previews.
  All 12 layout checks passed with image decoding enabled. On mobile, opening
  and closing an illustrated figure restored keyboard focus to its opener;
  library search and type filters continued to work.

`npm run lint:ui` runs the checks against an isolated production build, avoiding
live reloads from other agents. It covers chapter/reference layouts, schematic
labels, keyboard and numerical behavior, and release metadata at four widths.
It also decodes every illustration on each page, including those below the fold,
to catch missing or invalid SVG assets. For simultaneous agent sessions, set
`ALMANAC_UI_PORT` to a free port; build and result directories get the same port
suffix, keeping independent runs separate.

Screenshots are in the ignored `output/playwright/` folder. Current references:
`illustrated-landing-full.png`, `illustrated-model-mobile.png`,
`illustrated-silicon-mobile.png`, `illustrated-chapter-desktop.png`,
`illustrated-chapter-mobile.png`, and `illustrated-schematic-desktop.png`.
The numerical workbench review is recorded in `almanac-matmul-2d.png` and
`almanac-ring-2d.png`.
The expanded collection is recorded in `illustration-collection.png`,
`illustrated-library-desktop.png`, `illustrated-library-mobile.png`,
`illustrated-guide-desktop.png`, `gradient-study-desktop.png`,
`logic-study-mobile.png`, and `cache-study-mobile.png`.

Only the UI files and their integration lines were included in the UI commits.
Other pending curriculum and rendering work in the shared checkout was preserved.
