# Reading and prerequisite gaps addressed

This pass improves the path into existing material. It does not claim that every
possible topic is covered or that illustrative hardware models establish measured
device behavior.

| Gap | Change | Where |
| --- | --- | --- |
| Batch, sequence and feature axes appeared before a concrete picture | Two byte sequences, explicit axis meanings, parameter/activation distinction and a six-weight projection | `#math-reading-kit` |
| The loss appeared before the input/target pairing was clear | A three-row shifted-byte example, permitted prefixes, generation contrast and mean-loss arithmetic | `#probability-and-loss` |
| Grid-stride loops preceded a first thread ownership example | Ten outputs mapped to three four-thread blocks, then an optional larger-input derivation | `#cuda-first-launch` |
| Clocked updates had no complete state trace | Two-register Verilog module and edge table, followed by a paused dot-product trace | `#registers-and-fsm` |
| Training, evaluation and generation modes blurred together | Mode comparison, concrete prefill/decode calls, and `eval()` versus gradient-recording controls | `#capstone-forward` |
| A user's token rate and system throughput were easy to confuse | Worked rates, latency units, batching and distinct work/memory budgets | `#load-test` |

Each change keeps its existing lesson link. New claims cite primary sources
beside their explanations. The examples were checked with arithmetic, the actual
PyTorch CPU companion, or Icarus simulation as appropriate. GPU execution and
board timing are separate validation steps.

## Navigation and labeling

- One chapter picker and one outline replace competing navigation modes.
- Canonical chapter titles and introductions use plain language.
- Short topic names match the visible section references; fuller teaching claims
  remain in the main headings.
- Chapter, figure, code and check numbering still follows final assembled order.
- Optional derivations remain searchable. Navigation opens closed ancestors before
  scrolling to a target; generated display numbers do not become link identifiers.
- The accelerator and frontier chapters retain the September 14 source-audit date.

## Remaining boundaries

The site still contains advanced sections that assume their listed prerequisites.
The CPU/RTL checks establish the specific examples executed, not GPU speed,
multi-host scaling, target FPGA timing or complete ASIC signoff. The dated source
ledger distinguishes mechanisms, measured results and vendor announcements.
