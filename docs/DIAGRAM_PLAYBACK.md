# Selective diagram motion

Diagrams stay still by default. Animate when execution order or changing state
helps explain the subject. A diagram does not need playback simply because it
has selectable parts or adjustable values.

Component maps, architecture drawings, lesson schematics, illustrations, and
parameter comparisons have no playback controls or automatic selection changes.
Their existing inspectors, keyboard controls, sliders, and expanded views remain
available. Global animation preferences never start motion in these figures.

Execution traces and stateful examples retain playback: token and instruction
traces, training stages, matrix accumulation, reductions, collectives, pipeline
schedules, optimizers, online softmax, cache allocation, speculative verification,
request admission, KV handoff, and ordered state sliders. Portable-kernel playback
repeats the current backend's execution; it does not change the chosen backend.
Decorative token pulsing is removed from the prefill/decode comparison.

## Playback behavior

Eligible examples play when their drawing is visible. They have Play/Pause and
3-, 6-, or 10-second pacing. Sidebar animation and default-pace preferences persist
across reloads; individual pauses and pace overrides last for the session.

Selecting a component, changing a setting, using keyboard controls, or manipulating
a scene pauses its walkthrough. Play resumes from that state. Expanded figures
retain their live state, and only a figure in an open modal can advance. Wide
execution traces reveal the active operation without scrolling the page vertically.

Reduced motion starts playback paused. Readers can explicitly play an example;
CSS movement remains disabled. Enabling reduced motion during a session pauses
all walkthroughs. Automatic updates mute live regions; manual exploration restores
their announcements. Static inspectors keep their ordinary announcements.

The interval is reading time, not measured device or network latency. Calculation
values, source notes, and figure boundaries retain their original meaning.

## Implementation and checks

`diagram-walkthroughs.ts` contains adapters only for temporal examples. Returning
`null` is normal for a static diagram. New figure families do not need an adapter.
Adapters use existing state transitions; they never navigate, open dialogs, or
cycle unrelated settings. `diagram-playback.ts` owns controls and visibility.
One scheduler serves eligible visible examples, with no catch-up for hidden time.

```sh
npm test
npm run build
npm run test:animations
npm run lint:ui
```

Playback checks cover automatic execution, manual pause, focus, reduced motion,
modal restoration, hidden chapters, mobile framing, persistent preferences, and
110 advances per animated example. They also check that static schematics remain
manually selectable and parameter comparisons keep the reader's values even when
global animations are enabled. Static artwork retains accessible captions and
alternatives. Mathematical correctness remains covered by each lab's own tests.
