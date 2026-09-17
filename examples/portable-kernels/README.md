# Matrix multiplication on CUDA and HIP

`matmul.cpp` implements row-major FP32 `C[M,N] = A[M,K] × B[K,N]`.
Each of 256 logical threads owns one output element. The baseline deliberately
uses scalar arithmetic and global loads: it does not implement the advanced
tensor-unit pipelines shown in the interactive comparison.

From the repository root:

```sh
# Any C++17 host: check grid coverage and arithmetic with sanitizers.
clang++ -std=c++17 -O1 -g -fsanitize=address,undefined \
  examples/portable-kernels/matmul.cpp -o /tmp/atlas-matmul-cpu
/tmp/atlas-matmul-cpu

# NVIDIA H100 host with CUDA installed.
nvcc -x cu -std=c++17 -O2 -lineinfo -arch=sm_90 -DATLAS_CUDA \
  examples/portable-kernels/matmul.cpp -o /tmp/atlas-matmul-h100
/tmp/atlas-matmul-h100
compute-sanitizer --tool memcheck --error-exitcode 1 /tmp/atlas-matmul-h100

# AMD MI300X host with ROCm installed.
hipcc -x hip -std=c++17 -O2 -g --offload-arch=gfx942 -DATLAS_HIP \
  examples/portable-kernels/matmul.cpp -o /tmp/atlas-matmul-mi300x
/tmp/atlas-matmul-mi300x
```

Each binary prints its actual device and runtime lane-group size. Do not infer
that every AMD GPU uses the MI300X wavefront width. The code requires no shuffle,
lane mask or cross-thread reduction, so those portability assumptions are absent.

The harness initializes outputs to NaN, checks singleton/aligned/ragged/cancellation
and zero-input cases, compares to an FP64 outer-product reference, checks launch
and execution errors, and releases device buffers through RAII. Tolerance is
`2e-4 + 2e-4 * abs(reference)` for finite values. Empty dimensions, arbitrary
strides and NaN/Inf input semantics are outside this example's contract.

The CPU path validates launch coverage and host arithmetic. GPU compilation,
sanitizer execution, performance and actual CUDA/HIP numerical results require
the named target environments. Record compiler, runtime and device versions with
their output. A passing CPU run does not establish GPU correctness.

The TPU and Trainium lessons give worked tile mappings and explicitly labeled
pseudocode. They do not claim runnable Pallas/NKI companions or target execution.
