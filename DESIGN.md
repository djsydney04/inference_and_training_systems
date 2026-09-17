# AI Almanac — visual direction

## September 2026 edition

Visual thesis: a precise technical field guide with the contrast, generous space,
large product presentation, and quiet navigation seen in Anduril’s current site.
The landing page is a dark, open composition; the reader stays light and legible.

Reference: https://www.anduril.com/ (reviewed September 16, 2026). This is an
original interface and original teaching diagrams, not a copy of their assets.

Palette: dark stage `#0e1110`, paper `#f5f5f1`, ink `#151817`, secondary text
`#515954`, rule `#c9ceca`, active numerical data `#2559d6`. Monochrome carries
navigation and structure. Blue identifies data, relationships, and active work.

Type: IBM Plex Sans for identity, headings, navigation, and diagram labels;
Source Serif 4 for extended explanations. Monospace is reserved for code and
numerical values. The brand leads the landing page, with generous empty space.

Content plan: AI Almanac and the interactive package drawing → short introduction
→ three illustrated spreads for models, machines, and systems → reading action
→ edition and release notes. Alternate light paper, dark green, and pale green
to separate these subjects without enclosing them in cards. The reader presents
a grouped syllabus, an illustrated chapter opening, its lessons, then the next
chapter. There is no horizontal top bar.

Interaction thesis: short transitions acknowledge selection and navigation.
The landing drawing responds to manual layer selection. Guided lesson playback
remains local to the chapters, pauses for inspection, and respects reduced motion.

## Illustration language

The sixteen original SVG studies in `public/illustrations/` use fine ink lines,
repeated cells, hatching, and a restrained blue path. Subjects include token
vectors, gradients, data preparation, circuits, memory, compilation, scheduling,
caches, sampling, and connected machines.
They are conceptual illustrations, not numerical results or vendor floorplans.
HTML captions provide readable context on narrow screens; descriptive alternatives
explain the artwork without requiring color perception.

`src/illustration-catalog.ts` connects each subject to its chapters, lessons,
course parts, and library previews. `src/book-illustrations.ts` shares the assets
between the landing spreads, 30 chapters, and two reference pages. Chapter images
are decorative, selected by subject,
and omitted from the accessibility tree so they do not repeat the introduction.
Use external, lazy-loaded SVGs with intrinsic dimensions to keep layout stable
and share the browser cache. `src/illustrated-book.css` owns this visual layer.

Twenty-nine larger illustrated studies sit beside the relevant explanation.
They are assembled before reader numbering, so they have ordinary figure labels
and use the existing accessible popout. Present these as full-width drawings on
the page, with a short HTML caption below and their conceptual scope in Figure
notes. The six course parts
and all library previews also use the shared collection.

The same pale green paper, fine engraved corners, square borders, and quiet
captions appear in the interactive lesson schematics. Blue retains its existing
meaning for selected data and connections. Decoration must not encode invented
values, replace meaningful labels, or compete with an active calculation.

## Diagrams

`src/figure-layout.ts` and `src/figure-layout.css` apply the shared figure layout
after numbering and control initialization. Use one compact heading, one control
strip, and generous space around the drawing. Move introductory prose, scope
boundaries, and walkthrough commentary into the Figure notes disclosure. Keep
selected-part explanations, exact values, and calculation controls visible.
Move existing nodes rather than recreating them so state and event handlers
survive layout changes and expansion. Refresh after lazy workbench initialization.

Choose the representation that makes the relationship easiest to read. Matrix
values, reduction ownership, and algorithm stages use 2D. Physical package,
rack, and functional-slice layouts may use 3D when depth explains something.

The matrix and ring workbenches read the existing numerical state; they never
reimplement the calculation in a renderer. Native buttons support keyboard
selection. Keep exact values, masked edges, sources, and ownership visible.
Do not shrink labels to make a diagram fit a phone. Reflow or provide an explicit
scrolling figure surface. Keep popouts tied to the same live figure.

## Release identity

`package.json` owns the version. `src/release.ts` owns the publication date and
notes; the edition is derived from the date. Landing metadata, release notes,
and the shared footer read these sources. Change the package version, date,
and notes together when preparing a new edition.

## UI lint

`npm run lint:ui` uses Playwright to inspect every chapter, the landing page,
course guide, diagram library, and reference pages at 320, 390, 768, and 1440px.
It checks page overflow, content clipped outside the viewport, SVG labels inside
schematic nodes, keyboard selection and numerical completion of the 2D labs,
and the footer/release-note relationship. Screenshot review remains necessary
for visual hierarchy, density, and the quality of the drawings.
