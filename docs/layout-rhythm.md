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
