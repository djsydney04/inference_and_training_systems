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
