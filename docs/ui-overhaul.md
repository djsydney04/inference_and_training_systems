# Atlas UI and course navigation

The reader uses simple, flat surfaces, square figure frames, fine borders, and
minimal corner rounding on controls. Depth belongs to the machine diagrams.
There are no blurred overlays or decorative panel shadows.

The shared figure styles live in `src/atlas-ui.css`; the course guide and visible
navigation live in `src/course-guide.ts` and `src/course-guide.css`.
`src/atlas-ui.ts` integrates these without changing lesson calculations.

- The front page explains the starting point, the first three chapters, the full
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

- `npm test`: 87 tests passed in the final navigation pass.
- `npm run build`: TypeScript and Vite passed. The existing bundle-size warning
  remains; this change does not restructure curriculum loading.
- `git diff --check`: passed.
- Local development URL returned HTTP 200.
- Browser checks passed for the first-chapter action, group expansion, current
  chapter and section highlighting, nested outlines, search, preserved reading
  path controls, and package layer selection.
- Mobile checks passed for the contents drawer, chapter navigation, main-content
  focus recovery, and Escape returning focus to Contents at 390px.
- The prior pass also verified camera tools, inspector/grid toggles, expanded-view
  restoration, and gallery filters.
- No horizontal page overflow on the checked overview widths of 320, 390, 768,
  and 1440px, or the GPU and gallery pages at 390px.
- Reduced-motion preferences disable UI animation.
- Browser console: no application errors in the final review session.

Screenshots are in the ignored `output/playwright/` folder. Final references:
`course-guide-final.png`, `course-guide-mobile.png`,
`course-navigation-mobile.png`, and `course-gpu-navigation.png`.

Only the UI files and their integration lines were included in the UI commits.
Other pending curriculum and rendering work in the shared checkout was preserved.
