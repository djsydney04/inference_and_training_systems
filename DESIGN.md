# Machine Learning Systems Atlas — direction

## Clarity pass

Visual thesis: keep the paper, ink and cobalt reader, with a single navigation
hierarchy and plain topic names that leave attention for the lesson.

Content plan: a short explanation before symbols, a concrete worked example,
then deeper derivations on request. Keep the core mechanism and its assumptions
visible. Fill missing transitions within existing lessons instead of increasing
chapter count. Chapter titles and introductions come from the curriculum.

Interaction thesis: one chapter picker opens every chapter; one short outline
tracks the current section; optional worked details open beside their explanation.
The selected path still controls the next chapter. Remove the second fixed bar,
the two contents modes and the duplicate sidebar pagination.

Review: the previous layout made the labels consistent but duplicated navigation
and used long thesis statements as menu items. This pass keeps stable references
while reducing the number of controls, labels and repeated introductory blocks.

## Learning layout and labels

Visual thesis: a quiet technical reader with a clear place in the curriculum,
readable lesson text, and enough width to inspect a machine or a derivation.

Keep the existing paper `#f4f1e8`, figure ground `#faf9f5`, ink `#242925`,
secondary ink `#59625b`, rule `#d0cec3`, and cobalt `#2559d6`. Source Serif 4
carries explanations; IBM Plex Sans carries navigation and labels.

Content plan: canonical chapter title → learning outcome and prerequisites →
numbered sections → worked figures/code/checks → the next chapter in the chosen
reading path. The sidebar switches between the current chapter and the full
curriculum. A compact section navigator remains available while reading.

Interaction thesis: selecting a section updates the reading position; switching
the syllabus view reveals the wider curriculum; choosing a path changes the
chapter sequence. Motion only follows these actions and respects reduced motion.

Review: retain the atlas identity, reduce duplicate contents and oversized
headings, keep prose to a comfortable measure, and let figures use the full
reading surface. Chapter, section, figure, code and check references derive from
the assembled curriculum so future additions cannot leave stale display numbers.

## September 14 expansion

Visual thesis: retain the paper/ink/cobalt textbook and make each new figure an
instrument that reveals exact values, ownership or timing constraints.

Content plan: beginner prediction and gradient → C/storage → training →
digital logic and RTL → GPU kernels and accelerators → frontier serving →
an executable train/cache/profile/HTTP capstone. Prerequisite closure drives
every focused path, and adjacent lesson citations populate the source ledger.

Interaction thesis: update six weights; trace addresses, carries and ready/valid
edges; advance a systolic wavefront; change capacity/precision and recalculate
state-transfer cost. Motion follows controls and honors reduced-motion settings.
Wide circuit diagrams preserve readable labels with horizontal inspection on
small screens; numerical tables remain available beside the visual state.

Review: preserve the requested engineering atlas rather than introduce a new
brand. Full source listings live in expandable disclosures. Source dates and
measurement boundaries remain attached to the relevant claims and experiments.

Visual thesis: an offwhite engineering textbook with the precision of a technical
workbench; the machines are inspectable explanations, not decorative objects.

Palette: paper `#f4f1e8`, figure ground `#faf9f5`, ink `#242925`, secondary ink
`#59625b`, rule `#d0cec3`, active data `#2559d6`. Amber remains reserved for
execution/power semantics in existing diagrams, not general interface chrome.

Type: Source Serif 4 for reading and chapter titles; IBM Plex Sans for controls,
navigation and diagram labels. Monospace is reserved for code and equations.

Layout: persistent grouped syllabus at left, one chapter in the reading surface,
local contents beneath its title, next/previous and related lessons at its end.
An overview introduces the full curriculum and a visual gallery indexes the labs.

```text
Machine Learning Systems Atlas     section / chapter       Search
----------------------------------------------------------------
Overview                    | Chapter title
Systems gallery             | Prerequisites / learning outcome
Foundations                 | Local contents
Training                    | Reading + full-width instrument
Hardware                    | Worked problem / source
Inference                   | Previous / next chapter
Engineering projects        |
Reference                   |
```

Content plan: overview → connected foundations → training and adaptation →
machines and performance → serving → projects that produce reviewable evidence.
Readers can take the full sequence or enter a focused route without losing the
shared foundations. A career route is a curriculum, not an employer endorsement
or a guarantee of hiring readiness.

Interaction thesis: chapter routing preserves deep links and browser history;
step controls synchronize 3D geometry with a causal explanation; exploded layers
and labels reveal ownership and data movement. User actions drive motion.

Review against brief: retain the explicitly requested offwhite character, but
remove the long landing-page scroll and undifferentiated slabs. Spend visual
detail on registers, banks, partitions, routes and operand tiles. Do not add
ornamental card grids, fake silicon photography, or autonomous spinning models.

## Next implementation slice: an update and a tile

Visual thesis: turn the existing workbench into a readable memory experiment,
with actual operand values and a selected output carried through every stage.
Keep the established paper/ink/cobalt palette and serif/sans roles.

Content plan: establish the mathematical contract → run a tiny implementation →
inspect state transitions → account for bytes and synchronization → test limits.
Add these as lessons inside distributed training and profiling, not new top-level
chapters. Gallery links provide direct entry without duplicating the lesson.

Interaction thesis: user-stepped load/barrier/accumulate transitions; output-cell
selection that synchronizes arithmetic and geometry; an expandable 3D view that
shares exactly the same tested numerical state. No autonomous playback is needed.

Review: the matrix workbench must show values, masks, and lifetimes—not merely
more chip boxes. The CPU-replica run is runtime evidence, but not GPU, NCCL,
network, throughput, or multi-host evidence. Label those boundaries next to it.

## Five-hour expansion: methods, state, and physical limits

Visual thesis: keep the established paper/ink/cobalt textbook, with interactive
figures that expose the quantities an engineer must reconcile.

Content plan: separate training objectives from update mechanics and parallel
execution; separate inference probability rules from request scheduling; connect
hardware resources to both. Preserve existing anchors during chapter splits.

Interaction thesis: parameter changes recompute a visible numerical contract;
stepped probability mass and collective ownership diagrams reveal what moved;
the current lesson appears in the syllabus without repeating the whole chapter.

Review: the brief asks for depth and flow, not a new visual brand. Keep long
derivations in readable lessons, concise control labels, and original code-native
figures with accessible tabular equivalents. Avoid a larger undifferentiated feed.
