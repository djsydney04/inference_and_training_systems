# Figure composition review

The shared layout now covers 224 numbered figures. A single heading and compact
controls lead into an open drawing surface. Short labels are shown by default;
88 lesson schematics expose secondary annotations on demand. Matrix values stay
visible regardless of the annotation setting.

Component explanations fold beneath a selected-part label. A deliberate click
or keyboard selection opens the explanation; drill-down actions remain available
while it is folded. The layout moves existing elements, preserving state, event
handlers and the live figure used by popouts. Chip explorers group component
search, zoom, routes and references below the drawing. Tensor dimensions and
hardware sources remain accessible in disclosures.

Attention now uses aligned projections and longer connecting paths without a
large background enclosure or repeated Q/K/V labels. Feed-forward annotations
are shorter. Lesson flow, cycle, fork and row layouts reserve space between
nodes and grow to fit expanded annotations. Hardware and system drawings use
the same heading, navigation and inspection alignment.

Visual review also found and fixed a legacy flex style placing rollout notes
beside the drawing, and a roofline chart with overlapping text and controls.
The normalized schematic roofline now uses one explicit curve and matching
marker coordinates. Its axes are logarithmic; it is not measured performance.

Validation:

- TypeScript and production build passed.
- 181 unit tests passed.
- All 24 production browser checks passed at 320, 390, 768 and 1440 pixels.
- After the final legacy-layout fixes, the four all-chapter layout checks passed
  again at every viewport.
- All 20 desktop/mobile animation checks passed.
- Expanded-label bounds checked for all 88 lesson schematics, with no clipping.
- Screenshot review covered 52 structural layout variants plus attention,
  feed-forward, hardware and roofline views on desktop and mobile.
- Manual selection, keyboard inspection, drill-down actions, popouts and Escape
  restoration checked in the browser.

Wide technical drawings retain an explicit horizontal scrolling surface on
phones so their labels remain readable. The existing production bundle-size
warning remains; it does not fail the build.

## Expanded-view follow-up

Expanded diagrams now use one numbered heading. Their original captions remain
accessible, embedded figures keep their own titles, and closing restores the
in-page layout and keyboard focus. Expanded illustrations no longer leave an
empty caption band. Figure-note introductions now use a reading column instead
of inheriting the narrow label column intended for worked examples.

Verified on the integrated CPU-chapter revision:

- Production build and all 185 unit tests passed.
- All 24 UI checks passed at 320, 390, 768 and 1440 pixels.
- Eight focused browser checks passed for expanded playback, static component
  selection, Escape restoration and keyboard focus across the same viewports.
- Opened 233 figure-note disclosures at each of 320, 390 and 1440 pixels;
  no page overflow or narrow introductory text columns were found.
- Reviewed desktop and phone captures, plus an expanded illustration and a
  calculator containing its own schematic; embedded headings stay visible.

## Optimizer diagram

The optimizer lab now pairs its parameter trajectory with a loss-history plot.
Shaded contours are exact level sets of the existing quadratic objective, with
equal scales on the parameter axes. Start, current position and minimum are
distinguished; neither plot invents future updates. Current values stay visible,
while moment buffers and the full update table sit in disclosures. The plots
redraw at their available width, including in the expanded view.

Validation: 185 unit tests, all 40 playback checks and all four chapter-layout
checks passed. The final axis-label adjustment also passed the production build
and a browser sweep of all 18 optimizer/rate/decay combinations, at updates 0–20,
at 320, 390, 768 and 1440 pixels (1,512 rendered states). No clipped labels or
markers, invalid readouts or page overflow were found. Expanded views and
keyboard focus restoration were checked separately.

## Simpler captions and varied diagram forms

All 101 lesson schematics now use short captions, compact Labels/Expand controls,
and one Notes disclosure. Clicking or keyboard-selecting a part opens its
explanation in that disclosure. Worked examples, assumptions, exact values and
source boundaries remain available. Mobile scroll hints are shortened throughout
the figure families.

Fifteen schematics now draw the subject directly: tensor mixing axes, row/column
traversal, probability bars, an address strip, signed bit patterns, nested system
scale and CUDA launch dimensions, partitioned matrices, vector lanes, a two-thread
publication protocol, NUMA pages, translation/cache examples, a weighted value
read, and tile reuse. Feedback cycles use circular paths; independent comparisons
use open columns or a two-by-two arrangement. Actual ordered processes retain
flow arrows. The schematic catalog now uses 22 drawing forms.

The miniatures state their scope in Notes. For example, the NUMA diagrams keep
six pages fixed while changing placement; the 4 × 4 traversal sums 0–15 to 120;
the CUDA launch shows four 256-thread blocks covering 1000 valid indices. Their
geometries do not claim vendor floorplans or measured timings. Shared selection
styles apply to the node boundary rather than recoloring every data cell.

The global playback control and its persisted preference are removed. Each
animated example retains its own Play/Pause control, reduced-motion behavior,
manual-inspection pause and live popout state. Static schematics stay still.

Verification:

- 185 unit tests and the production build pass.
- All 24 production UI checks pass at 320, 390, 768 and 1440 pixels; the four
  complete chapter-layout checks also pass after the final drawing corrections.
- All 20 desktop/mobile playback checks pass, including legacy global-preference
  handling and 110 transitions per animated example.
- All 101 schematics pass label and canvas bounds checks both with and without
  annotations.
- Desktop and mobile screenshots cover the subject-specific drawings, cycles,
  comparisons and nested views. Keyboard inspection opens Notes; changing Labels
  preserves selection; expanded figures preserve Notes and restore focus on Escape.
- The live document has no duplicate IDs, missing internal links or page overflow.

Concurrent optimizer landscape/history changes from main are included. The
existing production bundle-size advisory remains.

## Training illustration

The shared training artwork now shows a batch, parameterized model layers, loss,
matching gradient tensors, and a weight-update loop. The ten existing placements
use the same static SVG. Captions and alternative text describe the computation;
cell counts and layer counts are explicitly illustrative. The numerical optimizer
lab continues to plot its calculated states.

The production build and all four chapter-layout checks pass at 320, 390, 768
and 1440 pixels. Desktop, phone and expanded-view captures were reviewed. SVG
labels stay within the canvas; expansion preserves the figure and restores
keyboard focus. The illustration has no playback controls.
