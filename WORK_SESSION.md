# Textbook development record

## September 16 frameworks continuation

Added the Popular frameworks chapter with fourteen lessons and four bridges in
earlier chapters. Thirteen original figures, ten with interactive controls, connect
framework roles, actual derivatives, tracing, causal labels, global objectives,
adapters, artifacts, API/stop/cache contracts, deployment, timing and CUDA replay.
Kept main explanations visible, folded detailed derivations/code, generated all
labels and linked the chapter into training and inference learning paths.

Actual CPU runs passed for PyTorch/JAX loss, every gradient, updates and graph
reuse, and for Transformers/PEFT label alignment, three updates, model/tokenizer
restore, adapter restore and FP32 merge. TensorFlow/Keras comparison and CUDA
replay remain explicitly unexecuted. The final review corrected a directional
learning-rate example and checked fixed-buffer and timing explanations.

Committed separate slices and repeatedly fetched/rebased the isolated worktree
onto GitHub main, including the AI Almanac design and diagram playback through
3de391b, including illustrations and release metadata. The shared checkout and
the other agent's local edits were untouched. 173 Node tests, 14 new Python
checks and the production build pass; 170 production
page/width checks find no overflow, broken anchors, label or title errors. See
the [frameworks audit](docs/FRAMEWORKS_AUDIT_2026-09-16.md) and current verification
record for runtime pins, final UI checks and remaining evidence boundaries.

## September 16 execution-gap continuation

Added fifteen lessons in four coordinated slices: sharded training lifetimes and
updates, quantization/error, MoE execution/gradients, and serving progress/metrics.
The examples include real INT4 byte packing, logical-rank AdamW and resharded
restart, explicit expert permutations, a cache-allocation deadlock, and a complete
delivery-trace denominator. New glossary/gallery entries preserve the learning
path; a source audit records each reference and the local evidence boundary.

Committed slices independently on the isolated `codex/atlas-learning-clarity`
worktree, pulling concurrent GitHub work through `a124515`. Kept the new course
navigation and Programming group. Found and repaired an incoming transient
inspector heading that could create a stale search target.

Validation: 138 Node tests, 23 new Python checks, build, independent numerical
cross-review, actual controls and 160 production page/width checks. Inventory:
163 sections, 175 figures, 77 code listings, 114 checks and 225 sources. No GPU
execution or production benchmark is inferred from these calculations.

## September 16 inference and training pass

Added eleven connected lessons covering modern speculative proposals and draft
training, tree attention, optimal depth under assumed costs, prefill/decode
separation, KV ownership and transfer, fleet bottlenecks, rollout records,
asynchronous actor/learner scheduling and policy correction. Original diagrams
and interactive calculations expose the intermediate state; companion Python
examples exercise handoff ownership and event-driven rollout scheduling.

Saved implementation and glossary checkpoints, pulling and merging concurrent
GitHub work through `b4b8801` on the isolated `codex/atlas-learning-clarity` branch.
Preserved both the new labs and incoming figure tools. Final evidence: 103 Node,
8 inference Python and 6 rollout Python tests; TypeScript/build; 155 production
page/width checks; new-control and narrow-layout reviews. The reader now indexes
142 sections and 199 sources. See the dated inference/training audit for exact
source versions, calculated examples and the unverified target-hardware boundary.

## September 16 clarity pass

Simplified navigation to one chapter picker and outline; removed the duplicate
section toolbar, sidebar modes and sidebar pagination. Shortened chapter/topic
names and rewrote introductions. Kept advanced detail in optional worked
disclosures and added six missing teaching transitions within existing lessons.
Search and deep links reveal folded details, and generated listing numbers stay
out of their fragment IDs. Preserved source dates and replaced a stale
“next chapter” claim with a stable subject link. See the clarity audit and latest
verification record for evidence and limitations.

## Learning layout follow-up

Reworked the reader around a focused chapter outline, a separate full syllabus,
compact consistent headings and a persistent section navigator. Saved learning
paths now drive the chapter sequence. Added canonical numbering for sections,
every captioned figure, code listings and checks; indexed previously omitted
orientation, Transformer, ledger and project material. Stable fragment IDs stay
separate from display numbers. Added `docs/AUTHORING.md` and 13 structural/path
tests; all 80 tests and the production build pass. Browser navigation and label
audits include rapid mobile controls, persistence, history and disclosures.

## September 14, 2026 continuation

Expanded the connected curriculum from 21 to 29 chapters. Added first-principles
probability/gradient learning; C and CUDA with forward/backward kernels; digital
logic, Verilog, FPGA and ASIC foundations; dated accelerator/frontier coverage;
and a train/checkpoint/cache/profile/HTTP capstone. The final review added a
custom CUDA-to-PyTorch autograd bridge with complete update comparisons.

Added five prerequisite-complete paths, broader glossary terms, gallery entries
and automatic discovery of adjacent citations in the source ledger. Preserved
the pre-existing reader/render-budget changes and verified the integrated site.

Evidence: 67 Node tests, 10 PyTorch tests, independent RMSNorm gradient/update
checks, C sanitizers, four RTL simulations and their synthesized-netlist reruns,
production build and 90 reader-width checks. Detailed results and limits are in
`VERIFICATION.md`; primary-source corrections are in
`docs/SOURCE_AUDIT_2026-09-14.md`. No remote publication is claimed by this record.

## Historical five-hour pass

Requested: deepen training methods, inference methods, and hardware; break dense
sections into clearer lessons; keep iterating with verified checkpoints.

Session start: 2026-09-09 00:47:20 UTC (September 8, 5:47 pm Pacific).
Five-hour boundary: 2026-09-09 05:47:20 UTC (September 8, 10:47 pm Pacific).
Starting commit: `b4e4029`.

## Working sequence

1. Audit the curriculum; split overloaded chapters while preserving old anchors.
2. Derive optimizer, clipping, mixed-precision and activation-memory contracts;
   add numerical examples and a runnable TensorFlow comparison.
3. Explain sampling, exact speculative decoding and serving scheduling with
   stateful diagrams and distribution-equivalence tests.
4. Deepen SM resource limits, roofline reasoning, collectives and rack topology;
   distinguish analytical models from measured hardware behavior.
5. Expand post-training methods and connect objectives to rollout, evaluation,
   data provenance and failure modes.
6. Review sources, code, accessibility, navigation and visual consistency;
   update verification and push scoped checkpoints throughout the session.

Each iteration must produce an explanatory or verification improvement. The
timebox is not a claim that the whole textbook is complete. Do not invent GPU
measurements, provision paid compute, copy whole external sites, or silently
advance source-check dates.

## Evidence log

- Initial worktree is clean and matches the previous pushed checkpoint.
- The existing product goal is blocked and cannot be replaced while unfinished;
  this file records the bounded session without falsifying that goal's status.
- Iteration 1: added the optimization chapter (17 total), a stateful optimizer
  gallery lab (12 entries total), five Node tests and four TensorFlow numerical
  contract tests. Build passes. Desktop and 320-pixel screenshots inspected;
  first AdamW update is (1.92, 0.92), loss 6.9216. CPU recomputation gradients
  match exactly in the tested example; an infinite scaled gradient skips the
  update without changing the inner optimizer state.
- Iteration 1 pushed as `fe4e572`; all 14 TensorFlow tests pass together.
- Iteration 2: added sampling/speculative decoding as a separate chapter (18
  total), a probability-mass lab (13 gallery entries), seven Node tests (28
  total), and a pure-Python conditional speculative-round reference with four
  passing tests. The 50,000-sample toy check has maximum frequency error 0.00226.
  Desktop and 320-pixel browser checks cover normal, identical and disjoint
  distributions; no page errors observed. No model/GPU speedup is asserted.
- Iteration 2 pushed as `7754d05`.
- Iteration 3: split GPU resource limits and collective ownership into their own
  chapters (20 total), with a fifth Three.js workbench and 15 gallery entries.
  All 35 Node tests pass. Browser checks trace all six ring steps, exact final
  values and sent-byte accounting; the occupancy cliff and cannot-fit cases
  agree with tests. Desktop/mobile diagrams inspected; corrected oversized
  vertical transfer labels. No hardware throughput claim is made.
- Iteration 3 pushed as `26a9441`.
- Iteration 4: parallel training methods become a separate chapter (21 total),
  with a pipeline timeline and rank-group map (16 gallery entries). Five new
  Node tests bring the total to 40, covering schedule causality, saved-state
  ownership, ideal bubbles and dense rank groups. Four TensorFlow tests pass
  for tensor-parallel forward/all-gradient equivalence and counterexamples.
  Desktop and 320-pixel browser checks match the GPipe/1F1B arithmetic; no page
  errors or document overflow observed. Screenshots inspected.
- Iteration 4 pushed as `87d69e1`. The full 18-test TensorFlow suite passes.
- Iteration 5: added current-section links beneath the active chapter and
  bounded, event-invalidated 3D rendering. Four new Node tests bring the total
  to 44. Browser instrumentation observed 213 WebGL draw calls before and after
  a one-second idle interval, then 608 after stepping the ring. Section links
  follow scroll position and the mobile drawer remains inert when closed.
- The overarching product goal is now active again; development continues
  against its unchanged textbook scope. The five-hour session boundary remains
  2026-09-09 05:47:20 UTC.
