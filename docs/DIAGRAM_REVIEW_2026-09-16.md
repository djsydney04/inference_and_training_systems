# 2D drawing review — 16 September 2026

The reader now uses 2D drawings for the three former hardware scenes. There is
no runtime import of the Three.js scene module. Hardware drawings remain live
when expanded, support keyboard component selection, and join the shared
automatic walkthrough system.

## References and drawing boundaries

| Drawing | Reference | What is represented |
| --- | --- | --- |
| GH100 / H100 SXM | [NVIDIA Hopper architecture, figures 3–4](https://developer.nvidia.com/blog/nvidia-hopper-architecture-in-depth/) | 8 GPCs, 72 TPCs, 144 physical SMs; separately labeled 132 enabled SMs and 50 MB L2 for H100 SXM. Disabled-unit locations are not inferred. |
| H100 SM | [NVIDIA Hopper architecture, figure 4](https://developer.nvidia.com/blog/nvidia-hopper-architecture-in-depth/) | Four scheduler partitions, register files, Tensor Cores and the combined L1/shared-memory structure. Resource boxes summarize function, not throughput or physical area. |
| MI300X | [AMD chiplet overview](https://instinct.docs.amd.com/projects/amdgpu-docs/en/latest/gpu-partitioning/mi300x/overview.html) | Eight XCDs over four I/O dies and eight HBM3 stacks. Product-enabled compute units are distinguished from the physical design. Interposer wiring is abstracted. |
| NVL72 front | [NVIDIA DGX GB200 hardware guide](https://docs.nvidia.com/dgx/dgxgb200-user-guide/hardware.html) | Published front order: 2 management switches, 4 power shelves, 10 compute trays, 9 switch trays, 8 compute trays, 4 power shelves. Faceplate port glyphs are illustrative. |
| GB200 tray top | [NVIDIA compute-tray top view](https://docs.nvidia.com/dgx/dgxgb200-user-guide/hardware.html#compute-tray) | Rear compute zone, CPU/GPU pairing, network adapters, fan-bank region and front service zone. Outlines and cable routes are simplified; fan symbols are not inventory. |
| Groq TSP | [Abts et al., ISCA 2020](https://doi.org/10.1109/ISCA45697.2020.00023) | Functional slices, horizontal operand streams and vertical instruction distribution. Neither a physical floorplan nor a specification for a newer Groq product. |

Every hardware view includes its own source link, scope note and component
explanations. Blackwell Tensor Memory remains in the separate Blackwell anatomy
lesson; it is not attributed to H100.

## Lesson review

All 88 lesson schematics use the revised renderer. Wrapped labels, consistent
rules and restrained highlights replace decorative internals. Memory diagrams no
longer draw arbitrary ten-cell allocations, and generic operator diagrams no
longer imply a fixed matrix tile shape. Comparison diagrams do not imply dataflow.

Five topics had misleading graph structure: training/validation/generation,
sequence/context/expert ownership, adapter/rollout budgets, FPGA resources, and
stationary-operand dataflows. Their connectors now match their stated relationship.
The autodiff example explicitly uses half squared error so its gradient of 4 is
consistent with its loss definition.

The matrix reading lesson shows a numerical 2×3 by 3×4 product and highlights a
complete dot product. Embedding lookup copies declared toy values exactly into
the output. Attention includes a triangular causal mask and per-head tensor
shapes. SwiGLU shows 24 expanded channels and the return to eight channels.
The tensor overview replaces its perspective planes with exact [2, 3, 4]
activation tables, contiguous FP32 byte offsets and two channel shards. Prefill
and decode show the same eight prompt positions, then one new decode position.
The five chip-anatomy views use named resource categories rather than arbitrary
cell patterns. The system overview uses flat rack elevations and shares the
corrected tray grouping with the detailed hardware drawing.

## Validation

The browser review covers each chapter and all 88 generated schematics, plus the
network, chip, hardware and system drawing families. Layout checks include
320, 390, 768 and 1440 pixel viewports. Hardware browser checks cover inventories,
keyboard inspection, opening a nested view, popout restoration and automatic
view changes. Existing animation checks cover repeated walkthrough cycles,
manual pause, reduced motion, hidden chapters and expanded figures.

Playback eligibility reads the current drawing bounds rather than retaining an
IntersectionObserver snapshot after a live figure moves into a dialog. Hidden
chapters, off-screen drawings and figures behind a modal still stop advancing.
A new selected component cancels the previous horizontal pan before deciding
whether another pan is needed. Automatic horizontal repositioning is immediate,
so overlapping compositor animations cannot hide a newly selected operation. The test clock starts before page navigation, as
required by the [Playwright clock API](https://playwright.dev/docs/clock). Static
engraved chapter studies are excluded from interactive walkthrough coverage.

These are teaching drawings. They do not substitute for a device floorplan,
mechanical service drawing, measured hardware trace or facility sizing document.

### Completed checks

- Production build and release metadata checks passed.
- 174 Node tests passed after integrating the concurrent framework and serving labs.
- 24 production-browser checks passed across 320, 390, 768 and 1440 px.
- 20 animation checks passed on desktop and mobile, including 110 adapter
  advances per authored diagram, reduced motion and off-screen behavior.
- Integrated runtime inventory is 190 walkthroughs: 133 flows, 41 comparisons and
  16 numerical simulations. Decorative illustrations are counted separately.
- Reviewed captures for all 88 lesson schematics, the additional live figure
  families, every new hardware view, and representative phone/popout views.
