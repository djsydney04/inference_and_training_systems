# Automatic diagram walkthroughs

Lesson diagrams play when their drawing is on screen. Each has Play/Pause and
3-, 6-, or 10-second pacing (default: six seconds). The sidebar pauses every
diagram or changes the default pace; those preferences persist across reloads.
Individual pauses and pace overrides apply to the current session.

Selecting a component, editing a setting, using its keyboard controls or
manipulating a 3D scene pauses that walkthrough. Press Play to continue.
Expanded figures retain their live state. Only the diagram in an open modal
advances; diagrams behind it wait. Wide schematics pan horizontally to reveal
the active operation, without moving the page vertically.

Reduced motion starts playback paused. Readers can explicitly play an example;
CSS movement stays disabled. Enabling reduced motion during a session pauses
all walkthroughs. Automatic updates mute the existing live regions; manual
exploration restores their original announcement behavior.

## Coverage

The September 16, 2026 browser inventory contains 154 playback surfaces:
125 guided flows, 18 setting comparisons and 11 numerical simulations.

- All 88 lesson schematics select their components and corresponding notes.
  The whole network highlights linked operations without navigating away.
  Attention, residual, feed-forward and output graphs use their inspectors.
- Embeddings, compiler flows, recomputation, request lifecycles, label alignment,
  schedules and architecture drawings highlight meaningful rows or stages.
  Independent parallel branches are highlighted together.
- Numerical laboratories use their real step/reset handlers: matrix tiles,
  all-reduce, pipeline schedules, reductions, online softmax, optimizers, weight
  updates, speculative verification and digital circuits. Completed examples
  restart; unbounded teaching updates have bounded replay cycles.
- Comparisons sweep one named setting: attention pattern, layout, stride,
  registers, capacity, state sharding, timing, roofline intensity or cache length.
- Portable kernels follow operand movement, accumulation and storage, advance
  K slices, and continue through H100, MI300X, TPU and Trainium examples.
- System buildout visits its components and four levels. GPU, LPU and rack
  workbenches reuse their sequences. Chip schematics traverse every route and
  available view.

Source photographs and source-image figures stay static. Gallery thumbnails
and the landing package preview are navigation surfaces, not lesson walkthroughs.
Animations describe dependencies and comparisons; their seconds and moving
connectors do not report device latency or measured throughput. Existing source
notes and figure boundaries still apply.

## Implementation and checks

`diagram-walkthroughs.ts` provides explicit adapters, never arbitrary button
clicking, link navigation or dialog opening. `diagram-playback.ts` owns controls
and visibility. One scheduler serves visible walkthroughs. Offscreen, hidden
chapter and background time earns no pending steps; a late timer advances once
without replaying a backlog. Existing Three.js render budgets remain intact.

```sh
npm test
npm run build
npm run test:animations -- --project=desktop --project=mobile
```

Browser checks have a separate server and output directory to avoid collisions
with concurrent layout tests. They exercise autoplay, pause/resume, focus,
reduced motion, modal restoration, hidden chapters, mobile framing, the old
transformer Trace button and 110 advances per diagram. Each advance must produce
a valid caption and keep inputs within their constraints. Coverage fails when
a new lesson diagram lacks a walkthrough.

Clock tests check visibility gating, complete reading intervals, pace changes
and late timers. Each lab's existing arithmetic tests retain responsibility for
its mathematical correctness. Playback is not evidence of GPU execution.

Verification on September 16: 96 Node tests and the TypeScript/Vite build passed.
The complete desktop/mobile playback run passed 18 checks; two additional
desktop/mobile regressions passed for independent pause and live-region
restoration in nested diagrams. The latter fix also passed all 96 Node tests
and a build in a separate clean checkout. Mobile pop-out and active-operation
framing screenshots were inspected at 390 × 844.
