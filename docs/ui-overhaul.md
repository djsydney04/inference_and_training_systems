# Atlas UI and course navigation

The reader uses simple, flat surfaces, square figure frames, fine borders, and
minimal corner rounding on controls. Depth belongs to the machine diagrams.
There are no blurred overlays or decorative panel shadows.

The root URL opens a separate landing page with a clear **Open the atlas** action,
an interactive package drawing, and a short introduction. It leads into the course
guide at `#top`. Chapter and section links still open directly, and the sidebar
identity returns to the landing page at `#welcome`.

The horizontal top bar has been removed. Identity and search now live in the
sidebar, and the reader starts at the top of the viewport. On mobile, a compact
Contents button opens the full-height navigation drawer.

The landing markup and headerless shell live in `src/landing.ts` and
`src/landing.css`. The shared figure styles live in `src/atlas-ui.css`; the course guide and visible
navigation live in `src/course-guide.ts` and `src/course-guide.css`.
`src/atlas-ui.ts` integrates these without changing lesson calculations.

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

- `npm test`: 90 tests passed during the landing-page pass.
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

Screenshots are in the ignored `output/playwright/` folder. Landing-page references:
`landing-desktop.png`, `landing-mobile.png`, `reader-no-topbar.png`,
`reader-mobile-no-topbar.png`, and `reader-mobile-contents.png`.

Only the UI files and their integration lines were included in the UI commits.
Other pending curriculum and rendering work in the shared checkout was preserved.
