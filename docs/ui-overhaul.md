# Atlas UI overhaul

The reader uses simple, flat surfaces, square figure frames, fine borders, and
minimal corner rounding on controls. Depth belongs to the machine diagrams.
There are no blurred overlays or decorative panel shadows.

The visual system lives in `src/atlas-ui.css`. `src/atlas-ui.ts` enhances the
existing reader without changing curriculum data or lesson calculations.

- A searchable chapter browser preserves existing deep links and reading paths.
- A focus control hides the desktop navigation and removes it from keyboard focus.
- The diagram library supports type filters, text search, and empty states.
- The overview package drawing highlights compute, memory, and interconnect.
- Every 3D workbench receives zoom, fit, isometric/top views, grid visibility,
  and inspector visibility through `src/scene-navigation.ts`.
- Page scrolling remains available over models. Zoom uses explicit controls.
- Expanded workbenches retain the existing modal and navigation restoration.

## Verification on September 16, 2026

- `npm test`: 85 tests passed.
- `npm run build`: TypeScript and Vite passed. The existing bundle-size warning
  remains; this change does not restructure curriculum loading.
- `git diff --check`: passed.
- Local development URL returned HTTP 200.
- Browser checks passed for camera tools, inspector/grid toggles, expanded-view
  restoration, chapter filtering and Enter navigation, search and empty states,
  focus mode, gallery filters, and package layer selection.
- Mobile checks passed for the contents drawer, chapter navigation, focus recovery,
  expanded models, and gallery filtering at 390px.
- No horizontal page overflow on the checked overview widths of 320, 390, 768,
  and 1440px, or the GPU and gallery pages at 390px.
- Keyboard Escape returns focus from the chapter browser. The hidden navigation
  is inert. Reduced-motion preferences disable UI animation.
- Browser console: zero errors and zero warnings in the final review session.

Screenshots are in the ignored `output/playwright/` folder. Final references:
`overview-final.png`, `workbench-final.png`, `chapter-browser-final.png`, and
`gallery-final.png`.

Only the UI files and their integration lines were included in the UI commits.
Other pending curriculum and rendering work in the shared checkout was preserved.
