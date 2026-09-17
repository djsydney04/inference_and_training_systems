# Layout rhythm

Visual thesis: an open technical field guide, with paper for reading, cool working
surfaces for diagrams, and small blue signals for interaction.

Palette: paper `#f5f5f1`, ink `#151817`, secondary `#515954`, diagram ground
`#e9eeec`, selected explanation `#e8eef9`, quiet notes `#eeeee7`.
Keep IBM Plex Sans for navigation and labels, Source Serif 4 for reading.

Composition: keep the chapter opening left aligned; separate lessons with a
larger vertical interval; group each diagram as a continuous surface; indent
supporting notes into a quieter surface. Course groups use spacing and shaded
chapter lists. The existing machine drawing becomes an open visual interlude.

```
chapter title + introduction          syllabus
prerequisites

lesson heading
reading
┌ continuous diagram surface ─────────────────┐
│ caption / controls                         │
│ diagram                         explanation│
└────────────────────────────────────────────┘
quiet note


next lesson
```

Interaction thesis: one short chapter entrance; native disclosure reveals;
selection and link feedback. Respect reduced motion. Do not animate every
lesson on scroll or add continuous animation to the reader chrome.

Brief review: replacing each border with a colored box would preserve the same
clutter. Keep prose and lesson headings open. Use color only to distinguish
working figures and optional material. Preserve axes, wires, table rules,
progress indicators, and focus outlines where they communicate meaning.

Overflow policy: allow grid and flex children to shrink; wrap long labels and
inline technical strings; reflow captions and controls at narrow widths. Keep
code and intentionally wide diagrams scrollable at their readable size.

Work is isolated on `codex/layout-rhythm`. Content and numerical behavior remain
owned by their existing modules.

## Implementation and review

- Added `src/layout.css` as the final shared layout layer, keeping content-module
  changes limited to moving timing labels below their duration bars.
- Reflowed captions and toolbars; removed glossary minimum-column overflow;
  wrapped reference links; retained readable, scrollable code and diagrams.
- Replaced repeated lesson and figure borders with spacing and continuous
  surfaces. Added restrained chapter entrance and disclosure animation under
  `prefers-reduced-motion: no-preference`.
- Rebased onto the shared illustrated-book work and retained its original
  landing and chapter illustrations.
- Production build, release metadata check, and 101 unit tests passed. Browser inspection covered desktop
  and mobile chapter openings, diagram surfaces, the course guide, and the
  illustrated landing sections. A DOM overflow audit passed 198 combinations:
  33 pages at 320, 390, 768, 900, 1024, and 1440px. Duration-bar labels deliberately
  sit below their bars; code and wide diagram viewports retain local scrolling.

- All 12 existing UI tests passed using an isolated production preview on port
  4198, including four viewport widths, schematic label bounds, keyboard
  selection, numerical completion, and release-footer navigation.
- Expanded disclosures passed 99 additional page/viewport combinations at 320,
  900, and 1440px. A live figure popout fit its container and Escape restored
  focus to its opener. The chapter entrance computed to 280ms in normal mode
  and no animation under reduced motion. Popouts omit the inter-figure margin.
- Visual artifacts and the additional audit scripts are in the worktree's
  ignored `output/playwright/` directory. The development preview uses port
  4197; the shared checkout and other agents' servers were not modified.

## Illustrated scale ladder

Visual thesis: six small technical drawings form one open sequence, using ink,
quiet material shading and a blue value or connection to distinguish each scale.
The palette stays with paper `#f8f9f4`, pale structure `#e2e7e0`, shaded structure
`#c1cac0`, deep ink `#303d37`, data blue `#2559d6` and blue fill `#c6d6ff`.
IBM Plex Sans carries the labels; monospace is reserved for the example value.

Composition: scalar → array → operation graph → compute and memory → rack →
connected domains. All six share a baseline on wide screens, three columns on
tablets and two on phones. Labels stay in HTML, and each illustration is a native
lesson link. The scope note identifies dimensions and component counts as
conceptual. This is an orientation drawing, not a hardware specification.

Motion: one short assembly sequence when the figure first enters view; a small
lift and tray movement on hover or keyboard focus; a revealed navigation arrow.
Reduced motion removes the assembly and movement. The drawing remains visible
without JavaScript. No animation runs continuously.

Review: desktop and mobile screenshots inspected; six widths from 320 to 2048px
show no element or page overflow. All six links navigate by keyboard, and reduced
motion has zero active animations and no lift transition. Review artifacts are
in `output/playwright/scale-ladder-*`.
