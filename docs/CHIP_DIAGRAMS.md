# Chip components and communication paths

The GPU, LPU and rack chapters now include component explorers alongside their
3D cutaways. Stable entry points are `#gpu-chip-anatomy`, `#lpu-chip-anatomy`
and `#network-switch-anatomy`.

## Design and coverage

Keep the existing paper, ink and cobalt reader. The dominant visual is a
directed component schematic: storage cells, arithmetic lanes, control traces
and links have distinct marks. Selecting a part exposes its role, limiting
resource and a worked example. Movement follows explicit route controls;
there is no continuously running diagram animation.

Five views contain 43 selectable components and nine routes:

- GPU package: HBM, controllers, L2, SMs, host interface, copy engines,
  internal fabric and NVLink.
- SM100 execution: TMA, shared memory/L1, Tensor Cores, TMEM, registers,
  arithmetic, load/store, scheduler, dependencies, barriers and special math.
- Published Groq TSP: MEM, streams, MXM, SXM, VXM, result storage,
  instruction dispatch and chip links.
- GPU communication: NVSwitch scale-up versus NIC/leaf/spine scale-out,
  destination placement and management.
- Ethernet switch: ports, parser, lookup, buffering, arbitration, switching
  fabric and egress. A contention experiment accounts for bits/bytes,
  serialization time and burst backlog.

Nine additional component types are selectable in the 3D models. Their
explanations share the schematic data. The expanded SM keeps its partition
labels attached correctly when layers separate.

## Evidence boundaries

These are functional schematics, not proprietary floorplans. The GPU detail
uses the SM100 `tcgen05` storage contract. It does not generalize TMEM to every
Tensor Core instruction or every GPU. The Groq explanation targets the
published 2020/2022 TSP rather than reconstructing Groq 3 silicon.

The Ethernet pipeline is a generic sequence of responsibilities, not a
Spectrum/NVSwitch implementation claim. Real switches can forward before a
complete packet arrives. The fluid contention model assumes equal sharing,
simultaneous equal-rate inputs, no protocol overhead and unlimited buffering;
its backlog is required storage under those assumptions, not actual buffer
capacity or measured latency.

Primary references are linked beside each explorer and discovered by the source
ledger: NVIDIA Blackwell tuning, CUTLASS 4.5.2 `tcgen05`, CUDA asynchronous copy
and execution guides, DGX GB rack hardware/networking, GPUDirect RDMA, Cumulus
RoCE documentation and the Groq ISCA papers. Groq links retain the existing
publication references; direct PDF retrieval was unavailable during this pass.

## Validation

- 92 Node tests and the TypeScript/Vite production build pass.
- Browser: all 43 components, nine routes and 42 route steps checked; previous,
  reset, keyboard selection, three popouts and restoration checked.
- All five views at 1280, 390 and 320 pixels: no document horizontal overflow,
  including enlarged diagrams. Wider schematics scroll within their canvas.
- Deep links into inactive views reveal the view and folded component reference.
  Inspector headings are excluded from search because their content changes.
- Switch controls checked for one/four senders and 400/800 Gb/s outputs.
- All nine new 3D component types select the matching inspector; separated SM
  and LPU views inspected in screenshots. No duplicate DOM IDs or page errors
  were reported by the component/route browser audit.

Screenshots are under ignored `output/playwright/`. These checks establish UI
behavior and illustrative arithmetic, not hardware performance. Vite retains
its non-failing large-chunk advisory.
