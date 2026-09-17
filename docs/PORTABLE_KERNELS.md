# Programming and accelerator examples

CUDA and profiling now belong to **Programming**, after the hardware chapters
that explain their prerequisites. The separate **Kernel programming** reading
path includes the new cross-platform chapter. Existing chapter and lesson
fragment IDs remain stable. Introductory C stays in Foundations, where both the
software and circuit paths use it.

`#portable-kernels` adds five lessons:

| Lesson | Concrete example |
| --- | --- |
| `#portable-matmul-contract` | Four-backend workbench: output ownership, reduction steps, masked edges and storage arithmetic |
| `#h100-kernel-example` | Hopper scalar CUDA baseline, H100 SXM memory example, and a separate TMA/warpgroup pipeline |
| `#mi300x-kernel-example` | The same matrix contract compiled with HIP for gfx942; wavefront assumptions and LDS staging |
| `#tpu-kernel-example` | A 256-square product divided into four 128-square outputs and two K steps using the Pallas tile model |
| `#trainium-kernel-example` | Stationary [K,M] and moving [K,N] operands, SBUF staging and PSUM accumulation |

The four device lessons have selectable schematics, worked notes and pop-outs.
The comparison also appears in the diagram gallery, and hardware comparison
links lead to the corresponding programming lessons. Primary vendor/compiler
documentation is cited beside claims and collected in the source ledger.

The interactive diagram models BF16 tile operands and FP32 accumulation. Its
tile choices are illustrative. It does not estimate occupancy, time, or measured
device performance. The CUDA/HIP companion is deliberately a separate scalar
FP32 baseline with its own numerical contract. TPU/NKI snippets are labeled
pseudocode and link to executable official tutorials.

## Verification, September 16, 2026

- 90 JavaScript/TypeScript tests passed, including exhaustive coverage of every
  valid output and K index for all four ragged tile plans.
- TypeScript and production build passed. A clean archive of `b8d5cd3` also passed
  all 90 tests and its build independently of the other agent's working changes.
- The C++ companion compiled with Clang C++17, `-Wall -Wextra -Werror`, AddressSanitizer
  and UndefinedBehaviorSanitizer. All five CPU cases passed; the largest observed
  absolute error was approximately 3.76e-6.
- Browser: four backend selections, both shapes, every stage through keyboard
  activation, final output tiles, final K steps, pop-out navigation/restoration,
  course-guide grouping and all internal fragment targets passed.
- The five lessons and the comparison pop-out were checked at 390px and 320px;
  no document/dialog horizontal overflow. Desktop and mobile captures were
  visually inspected in `output/playwright/portable-*.png` (ignored local files).

No H100/MI300X runtime, GPU compilation, GPU sanitizer result, TPU run or Trainium
run was available in this session. CPU emulation and browser arithmetic do not
establish those results. The companion README records target build commands and
the exact tested numerical scope.
