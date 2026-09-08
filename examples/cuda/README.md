# Tiled matrix multiplication: a correctness-first kernel

`tiled_matmul.cu` implements row-major FP32 `C[M,N] = A[M,K] @ B[K,N]`.
Each 16×16 block owns an output tile, each thread accumulates one output, and
the block cooperatively stages operand tiles in shared memory. Two barriers
protect production and reuse of those shared arrays. All threads participate,
including threads whose final output lies beyond a matrix edge.

The browser uses the same mathematical schedule at tile sizes 2 and 4 to make
the individual values readable. Its JavaScript arithmetic and geometry do not
simulate GPU rounding, timing, caches, instruction issue, or occupancy.

## Run on a CUDA machine

```bash
nvcc -O3 -lineinfo examples/cuda/tiled_matmul.cu -o /tmp/atlas-tiled-matmul
/tmp/atlas-tiled-matmul
compute-sanitizer --error-exitcode 1 --tool memcheck /tmp/atlas-tiled-matmul
compute-sanitizer --error-exitcode 1 --tool racecheck /tmp/atlas-tiled-matmul
compute-sanitizer --error-exitcode 1 --tool synccheck /tmp/atlas-tiled-matmul
```

The executable identifies the GPU, checks launches and completion, and compares
ten cases with a double-precision CPU reference. Cases include small and awkward
dimensions, an incomplete reduction tile, and signed fractional operands.
Every result must be finite and satisfy `abs(error) <= 1e-4 + 1e-4*abs(reference)`.
The output is poisoned before launch so missing stores cannot pass as zeros.
The sanitizer commands return a nonzero status on detected errors; a clean
correctness comparison alone does not establish race or barrier safety.

This source has **not been compiled or run on a CUDA GPU in the current
verification environment**, an Apple Silicon Mac without `nvcc`. No expected
PASS output or measured speedup is asserted. The browser's numerical state is
covered separately by Node tests; those do not validate CUDA synchronization.

## What this kernel intentionally omits

- Tensor Core instructions, mixed precision, vectorized or asynchronous copies;
- register tiling, warp-specialized pipelines, and overlap between load/compute;
- arbitrary strides, transpose flags, alpha/beta scaling, and batched GEMM;
- performance benchmarking or a claim of optimal coalescing for every shape.

For a performance experiment, first run the correctness and sanitizer checks.
Then document the GPU/toolchain, warm up, time with device events, compare with
cuBLAS under the same numerical contract, and inspect actual memory transactions.
Logical load reduction is not measured HBM bandwidth savings.

References: [CUDA SIMT kernels](https://docs.nvidia.com/cuda/cuda-programming-guide/02-basics/writing-cuda-kernels.html),
[CUDA Best Practices](https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/index.html),
[Compute Sanitizer](https://docs.nvidia.com/compute-sanitizer/ComputeSanitizer/index.html).
