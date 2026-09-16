# CUDA kernel laboratory

## Build and check correctness

The baseline requires C++17, the NVIDIA CUDA Toolkit and an NVIDIA GPU. These
commands are for a CUDA host; an Apple GPU cannot execute CUDA. CUDA compilation,
execution, sanitizers and performance measurements have **not** been verified on
the development Mac. Node derivative/model tests and the C exercise are separate
evidence; they do not validate device code.

```sh
mkdir -p /tmp/atlas-cuda
nvcc -std=c++17 -O2 -lineinfo -Xptxas=-v examples/cuda/row_primitives.cu -o /tmp/atlas-cuda/row_primitives
/tmp/atlas-cuda/row_primitives
compute-sanitizer --tool memcheck --error-exitcode 1 /tmp/atlas-cuda/row_primitives
compute-sanitizer --tool racecheck --error-exitcode 1 /tmp/atlas-cuda/row_primitives
compute-sanitizer --tool synccheck --error-exitcode 1 /tmp/atlas-cuda/row_primitives
compute-sanitizer --tool initcheck --error-exitcode 1 /tmp/atlas-cuda/row_primitives
```

Specify `-arch=sm_XX` for your actual GPU and a toolkit supporting it when comparing
architectures. Read `nvcc --list-gpu-code`; the default target is not a portable
performance baseline. Keep the output from compiler resource reports with tests.

`row_primitives.cu` includes:

- Grid-stride AXPY and a two-launch global sum.
- Stable finite-logit softmax, including row widths 1, 7, 31, 32, 33, 255, 256,
  257 and 1025. Columns outside the row contribute reduction identities.
- Softmax backward as a vector-Jacobian product.
- RMSNorm forward, saved inverse RMS, input backward, per-row weight-gradient
  contributions and a separate reduction over rows for shared weights.
- Double-precision CPU references, explicit finite checks and a declared
  absolute-plus-relative tolerance of `3e-4 + 3e-4 * abs(reference)`.
- Zero-input RMSNorm and a large-logit softmax case.

The harness deliberately synchronizes after each launch to attribute failures.
It is not a production stream schedule or benchmark. Finite-input softmax excludes
fully masked rows, NaNs and infinities: define those policies before extending it.
RMSNorm expects finite FP32 inputs with finite squared sums and positive epsilon.
The weight-gradient reduction is simple and deterministic in its loop order, but
does not scale efficiently to a large number of rows.

## Independent derivative checks

```sh
node --experimental-strip-types --test tests/cuda-math.test.ts
```

These use central finite differences of the scalar objective `sum(output * dy)`
for softmax and RMSNorm. Both input and weight derivatives are checked. They
validate the mathematics in JavaScript double precision, not the CUDA binary.
On the GPU, compare the kernels with a framework's autograd implementation as a
second reference, including the dtype, epsilon and reduction convention.

## Inspect the compiler and profiler

```sh
nvcc -std=c++17 -O2 -ptx examples/cuda/row_primitives.cu -o /tmp/atlas-cuda/row_primitives.ptx
cuobjdump --dump-sass /tmp/atlas-cuda/row_primitives
nsys profile --trace=cuda,nvtx -o /tmp/atlas-cuda/row-timeline /tmp/atlas-cuda/row_primitives
ncu --set basic --launch-count 1 -o /tmp/atlas-cuda/row-kernel /tmp/atlas-cuda/row_primitives
```

Select the desired kernel and launch when profiling: the first launch here is
AXPY. Kernel replay, warmup, compilation, page migration, input/output copies,
allocation and CPU checking are separate measurement boundaries. For benchmarking
enqueue warmups, record start and stop CUDA events in the measured stream around
many launches, synchronize the stop event, and divide elapsed time by repeats.
The supplied correctness harness is intentionally not presented as timing data.

## Optimization experiments with a proof obligation

1. Replace the shared-memory tree with warp shuffles. Show that every lane named
   in a synchronization mask participates and that reads never consume inactive
   source lanes. Re-run every odd-width and sanitizer case.
2. Keep one row's exponentials in registers. Compare eliminated loads/exp work
   with register count, spills and block residency as row width increases.
3. Fuse a residual addition into RMSNorm and specify which intermediate backward
   must save or recompute. Check gradients before measuring bandwidth.
4. Fuse bias/ReLU into the existing `tiled_matmul.cu` epilogue. Derive its gradient
   (including the chosen convention at zero), test ragged M/N/K, and compare a
   matched cuBLASLt/CUTLASS configuration before making a performance claim.
5. Read a CUTLASS GEMM: name its CTA tile, warp tile, instruction shape, pipeline
   stages, shared layout and epilogue. Then compare two architectures; no single
   Tensor Core instruction contract is universal.

Primary sources:
[CUDA compiler](https://docs.nvidia.com/cuda/cuda-compiler-driver-nvcc/index.html),
[Compute Sanitizer](https://docs.nvidia.com/compute-sanitizer/ComputeSanitizer/index.html),
[Nsight Compute guide](https://docs.nvidia.com/nsight-compute/ProfilingGuide/index.html),
[CUTLASS efficient GEMM](https://docs.nvidia.com/cutlass/latest/media/docs/cpp/efficient_gemm.html).
