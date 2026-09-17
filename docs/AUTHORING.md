# Adding to the atlas

The curriculum owns the reading order. Content owns stable links, teaching text,
sources and evidence boundaries. The reader derives display numbers after the
final chapter contents have been assembled and moved into place.

## Chapters and sections

1. Add one entry to `src/curriculum.ts` with a stable `id`, canonical `title`,
   plain-language `intro`, curriculum `part`, concrete learning `outcome`, and
   prerequisite IDs. The title and intro drive the reader directly. Use
   `evidenceChecked` for a chapter-wide source-audit date when needed; do not hide
   that date in an authored introduction that the reader replaces.
2. Give every meaningful top-level lesson a stable ID and a concise `data-lesson`
   title. Preserve existing IDs when editing or reordering content; bookmarks and
   citations depend on them. A title can evolve without changing its link.
3. Use `data-lesson` on the existing reading container, including an independent
   workbench or project when that is the section. Do not also mark its nested
   figure as a separate lesson. A section may contain several diagrams, code
   examples and checks.
4. Use a short topic name for `data-lesson`, usually two to five words. It appears
   in the outline and the numbered section label. The `h3` can state the fuller
   teaching claim. Keep assumptions and evidence qualifications in the body or
   figure caption; the generated section label replaces the header span.
5. Add the chapter to `prepareReader()` if it is a new exported content module.
   Its prerequisite paths are constructed by the curriculum. Check the complete
   path and any specialist path that should reach the new material.

```html
<section class="lesson" id="cache-lifetime" data-lesson="Cache ownership and lifetime">
  <header><span>State ownership</span><h3>Who may reuse this block?</h3></header>
  <p>State the mechanism, its assumptions, and an example.</p>
</section>
```

`reader-labels.ts` takes **one-based** chapter and item positions. Use
`buildChapterOutline()` or `itemNumber()` for section positions, and reuse that
same position in the chapter outline, navigation and section heading. Do not
create another independent numbering scheme in a new component.

## Figures, code and checks

Explain the core mechanism before dense notation. Define symbols and work one
small example with the explanation visible. Use `details.deep-dive` for optional
derivations or implementation detail, with a descriptive summary. Search indexes
these summaries and subheadings, and direct navigation opens their containing
disclosures. Prefer an authored stable ID when a detail needs a permanent citation.
Never put generated chapter/listing numbers into a fragment ID.

- Every figure needs a caption with a concrete title. Give interactive diagrams
  useful control labels, a readable result, keyboard operation and an explicit
  model boundary. A descriptive caption span may say `Interactive`, `Original
  schematic`, or `Source image`; leave out numeric positions.
- All figure types share one chapter-relative sequence, including photographs,
  schematics and workbenches. `figureCaptionLabel()` supplies `Figure 12.3` and
  retains the authored description. It also normalizes legacy labels while older
  content is migrated. A figure moved between chapters takes its new chapter
  number without changing its stable link.
- A code block is a **Code** listing, not an automatically verified executable.
  Label the language, purpose and file where available. Import full companion
  examples with `?raw` so the page cannot silently diverge from the source. Keep
  commands distinct from a full implementation. Retain a useful caption on
  folded code so the reader can choose whether to open it.
- A worked question is a **Check**. Keep its answer folded until requested. A
  numbered check does not record completion or mastery; do not infer either from
  scrolling or opening the answer.
- Figure, code and check sequences are independent. Section 12.3 can contain
  Figure 12.1 and Code 12.2. Prefixes make those scopes explicit.
- Do not hardcode atlas chapter or figure numbers in explanatory prose. Link to
  a stable fragment using its subject: `the cache ownership diagram`. References
  to a source publication's own figure or section number should retain that
  source's number and link, because those belong to the publication.

```html
<figure class="textbook-lab" id="cache-ownership-diagram">
  <figcaption>
    <span>Original schematic</span>
    <strong>Two requests share an immutable prefix</strong>
    <p>Describe how to read the marks and arrows.</p>
  </figcaption>
  <!-- Diagram and controls -->
  <p class="figure-boundary">Logical ownership model; no timing is simulated.</p>
</figure>
```

## Citations and evidence

Place primary-source links beside the claims they support, using
`sourceLink()` / `.lesson-source` so the central source ledger also discovers
them. Distinguish a paper's measured result, a vendor specification, an announced
product and an illustrative calculation. Record the date and version for claims
whose meaning depends on an edition or implementation.

Display numbering is not evidence. A browser simulator, CPU test, GPU execution,
RTL simulation, generic synthesis and FPGA board result establish different
things. Keep that boundary explicit next to the example. An author-reported
speedup does not become a locally reproduced result because it appears in an
interactive figure. Record actual execution and its limitations in
`VERIFICATION.md`.

## Before finishing an addition

Record changes to the material under `## Unreleased` in
[CONTENT_CHANGELOG.md](../CONTENT_CHANGELOG.md). Use Added, Expanded, Corrected
or References, explain what a reader can now learn, and link directly to the
affected lesson. Include substantive diagram and executable-example changes.
Keep layout, navigation, tooling and release automation in the technical
changelog. Use `feat(content):` for additions and expansions or `fix(content):`
for corrections so a material-only change can trigger the appropriate release.
The release workflow supplies the version and date; do not invent a future
version or move entries out of Unreleased yourself.

Diagrams stay still by default; manual interaction does not require animation.
Use playback only when a sequence or changing state helps explain the subject,
such as token execution, accumulation, or scheduling. Component maps, static
relationships, illustrations, and parameter comparisons need no playback.
For a temporal example, add an explicit adapter in `diagram-walkthroughs.ts`,
preserve calculation and reset semantics, and never navigate or open dialogs. See
[Diagram playback](DIAGRAM_PLAYBACK.md) for visibility and accessibility
rules. Run `npm run test:animations -- --project=desktop --project=mobile` when
changing motion; its audit validates animated examples and manual static figures.

Catalog artwork uses the separate `figure.book-study` form: a captioned external
image with meaningful alt text. These conceptual studies remain static. The
coverage audit validates their image/caption and rejects embedded simulation
controls. Inline mechanism diagrams and live labs can also stay still while
responding to manual input. Playback timing is presentation time, not device or
network time.

Run `npm test` and `npm run build`. The label tests check chapter declarations
against the curriculum, duplicate authored section IDs, missing section titles,
stable links under reordering, and legacy caption normalization. They scan the
current literal markup plus the `lesson()` and `project()` helpers; update that
inventory if a new content-generation helper is introduced.

Then inspect the assembled reader in a browser. The source tests cannot prove
that runtime assembly places a section in the correct chapter. Check that:

- Chapter title, section marker and navigation agree after deep-link navigation.
- Every section and figure has exactly one display number in the correct order.
- Descriptive captions, source attribution and model boundaries remain visible.
- Internal links resolve, stable IDs are unique, and new sections are searchable.
- The page remains readable on narrow screens; wide diagrams and code scroll
  inside their own region with a clear cue, without making the whole page wider.
- A folded example can be opened, read, copied and reached by keyboard.

Run the companion program's relevant correctness checks when its behavior
changes. Report the runtime and hardware used, and retain explicit unverified
boundaries when the target device is unavailable.
