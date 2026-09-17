# CPU experiments in C

Companion to **Inside a CPU → Read the same matrix in two orders** (`#cpu-practical-lab`). Uses a C11 compiler and POSIX monotonic clock on macOS or Linux; no GPU or extra libraries.

```sh
make check
./cpu_bench rows 1024 20
./cpu_bench columns 1024 20
./cpu_bench chain 1024 20
./cpu_bench independent 1024 20
make assembly
```

The arguments are traversal, square matrix width, and repetitions. Width is limited to 1–4096 and repetitions to 1–1000. The default 1024 × 1024 matrix occupies 8 MiB. Allocation, initialization and one warmup call happen before the reported elapsed time. Each timed call reads the whole matrix; this is a warm repeated experiment, not a cold-memory measurement.

## What to investigate

| Pair | Same work | Difference to inspect |
| --- | --- | --- |
| `rows` / `columns` | Sum every value in the same row-major allocation | Contiguous inner-loop loads versus an N × 8-byte stride |
| `chain` / `independent` | Read contiguous elements and sum every value | One source-level accumulator versus four independent accumulators plus a tail |

Record the CPU model, OS, compiler version, flags, matrix size, power mode, and every repetition. Compare small matrices with arrays larger than the relevant cache, and test widths such as 1023, 1024, and 1025. A power-of-two stride can expose set conflicts as well as poor spatial locality. Hardware prefetch, TLB reach, cache capacity, clock changes and compiler transformations all affect the result. Do not infer the number of DRAM bytes from a traversal's source code.

`make assembly` uses Clang vectorization remarks and writes `kernels.s` for the current build target. Check the load addresses, loop structure, accumulator registers and any vector instructions. Compiler output is the evidence: a compiler may transform a loop, so source-level unrolling does not guarantee the intended machine schedule. The AXPY kernel provides an independent-element vectorization example. Its `restrict` arguments promise nonoverlapping accessed ranges.

The default build does **not** enable `-ffast-math` or link-time optimization. `bench.c` and `kernels.c` are separate translation units so the caller cannot replace repeated kernel calls with one result. Keep that boundary when experimenting. The independent reduction intentionally changes addition order. Its exact equality check is appropriate here because inputs are small, nonnegative integers stored as doubles, and all possible sums with the allowed arguments remain below 2^53. General floating-point workloads need an error criterion suited to their inputs; regrouping is not generally bitwise equivalent.

## Inspect counters on Linux

```sh
perf stat -r 5 -e cycles,instructions,branches,branch-misses,cache-references,cache-misses -- ./cpu_bench rows 1024 20
perf stat -r 5 -e cycles,instructions,branches,branch-misses,cache-references,cache-misses -- ./cpu_bench columns 1024 20
```

Unlike the program's timer, these process-wide counts include initialization and warmup. Generic cache events are platform dependent: check `perf list` and the CPU's PMU documentation before treating an event as an L1, LLC or DRAM measurement. Event permissions depend on system policy. Do not change security settings just to make this example run. On macOS, use Instruments to inspect the process; Linux `perf` and `numactl` commands do not apply directly.

On a Linux host with at least two NUMA nodes, inspect `lscpu -e=CPU,CORE,SOCKET,NODE` and `numactl --hardware` first. Compare `numactl --cpunodebind=0 --membind=0 ./cpu_bench rows 4096 20` with `--membind=1` while keeping the CPU binding on node 0. The explicit memory policy covers the initialization that first touches the allocation. Availability, process affinity and allowed memory nodes constrain the experiment; page placement and bandwidth still need measurement. Do not extrapolate a socket topology from a laptop.

## Correctness checks

`make check` verifies all four reductions at six matrix widths, lengths 0–19 for reduction tails, and the AXPY input and surrounding output values for lengths 0–19. A sanitizer build can additionally detect invalid memory accesses and undefined behavior:

```sh
clang -O1 -g -std=c11 -Wall -Wextra -Wpedantic -fsanitize=address,undefined bench.c kernels.c -o /tmp/cpu_bench_check
/tmp/cpu_bench_check --check
```

This is a teaching experiment, not a comparative benchmark of processor families. It does not pin threads, flush caches, control frequency or measure NUMA placement by itself.
