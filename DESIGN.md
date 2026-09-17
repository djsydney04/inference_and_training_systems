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

Content plan: AI Almanac → concise introduction and one entry action → interactive
package drawing → three stages of learning → edition and release notes. The
reader presents a grouped syllabus, one chapter, its local outline, then the
next chapter. There is no horizontal top bar.

Interaction thesis: short transitions acknowledge selection and navigation.
The landing drawing responds to manual layer selection. Guided lesson playback
remains local to the chapters, pauses for inspection, and respects reduced motion.

## Diagrams

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
