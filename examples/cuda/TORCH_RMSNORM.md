# Use your CUDA kernel in a trainable PyTorch network

This companion connects a first-order RMSNorm CUDA implementation to PyTorch
autograd. It includes a pure PyTorch reference and a CPU implementation of the
analytical backward so the mathematics and training harness can be checked
without a GPU. The CUDA path is separate and must be verified on CUDA hardware.

## CPU checks

Use the Python/PyTorch environment from `examples/pytorch/README.md`:

```sh
python examples/cuda/torch_rmsnorm.py --device cpu
```

This checks:

- FP64 analytical derivatives against PyTorch autograd and finite differences;
- widths 1, 7, 33, 257, 1025 and 4097, plus zero inputs;
- noncontiguous and broadcast upstream derivatives;
- rejected layouts, empty inputs, invalid epsilon and dtype mismatch;
- saved-tensor version checks and rejection of unsupported double backward;
- three AdamW steps at widths 7, 33 and 257, comparing loss, input gradients,
  every parameter gradient, updated parameters, step counters and moments.

The losses use different random targets each step. They are a comparison of two
implementations, not a claim that this tiny network learns a general task.

## CUDA build and checks

Requires an NVIDIA GPU, CUDA-enabled PyTorch 2.8.0, a locally installed compatible
CUDA toolkit providing `nvcc`, a supported host C++ compiler, and Ninja. A CPU-only
PyTorch wheel or the CUDA runtime bundled with a wheel does not supply the full
extension compiler toolchain. Consult the installed framework/toolkit support
matrix when selecting versions; this source has no verified GPU build in the
current Apple Silicon workspace.

```sh
python -m pip install ninja
MAX_JOBS=1 python examples/cuda/torch_rmsnorm.py --device cuda
```

The extension builds lazily into PyTorch's extension cache. The CUDA mode runs
the CPU contract checks, then compares the CUDA forward/backward and complete
training updates against native PyTorch FP32 on a non-default CUDA stream. A
CUDA request fails explicitly when CUDA is unavailable; it does not silently
fall back to the CPU implementation.

The stream experiment allocates and uses its tensors on that same side stream.
It does not test arbitrary cross-stream handoffs or multiple devices. Callers
that introduce those must establish completion and storage lifetime separately,
using the documented wait/record-stream contracts where appropriate.

After the first build, run the same workload under the CUDA correctness tools:

```sh
compute-sanitizer --tool memcheck --error-exitcode=1 python examples/cuda/torch_rmsnorm.py --device cuda
compute-sanitizer --tool racecheck --error-exitcode=1 python examples/cuda/torch_rmsnorm.py --device cuda
compute-sanitizer --tool synccheck --error-exitcode=1 python examples/cuda/torch_rmsnorm.py --device cuda
```

These commands are instructions, not recorded successful CUDA checks. Keep
compiler versions, build logs, GPU name, compute capability and sanitizer output
with any resulting report. A correct comparison is not a performance benchmark.

## Import the module

Make `examples/cuda` available on the Python import path, then:

```python
from torch_rmsnorm import RMSNorm
from torch import nn

model = nn.Sequential(
    nn.Linear(33, 33),
    RMSNorm(33, backend="cuda"),
    nn.Linear(33, 5),
).cuda()
```

`backend="reference"` uses ordinary differentiable Torch operations.
`backend="analytic"` uses the teaching `autograd.Function` with its explicit
analytical derivative. `backend="cuda"` invokes the compiled extension. Switch
only the backend while keeping the same parameter state, inputs and optimizer
to isolate an implementation change.

RMSNorm and LayerNorm are different mathematical operations. Do not replace the
LayerNorm in the byte decoder and claim to have preserved its model. First
compare native and custom implementations of the *same* RMSNorm network, as this
harness does. A decoder experiment should introduce the same RMSNorm architecture
in both reference and custom branches and then compare those branches.

## Contract and source boundaries

The raw operator accepts nonempty contiguous CUDA FP32 `x[rows,width]` and
`weight[width]` on the same device. The `nn.Module` flattens contiguous leading
dimensions and restores the output shape. Finite, reasonably scaled input values
are assumed; FP32 squaring/reduction can overflow for extreme inputs. This is
not an arbitrary-stride, arbitrary-dtype, mixed-precision or fully masked API.

The CUDA host functions validate tensor metadata, guard the tensor's device,
allocate results through ATen and launch on PyTorch's current CUDA stream. They
check launch errors without synchronizing every operation. The harness waits for
completion before reporting success. The weight-gradient kernel has one writer
per column and sums rows serially; it is deliberately simple and can be slow for
large row counts.

`save_for_backward` preserves the input, trainable scale and row inverse RMS.
`once_differentiable` declares the first-order backward boundary. AMP, forward
mode, double backward, `torch.compile`, export, CUDA graph capture and distributed
integration are not implemented or validated here. The pybind extension plus
`autograd.Function` demonstrates eager integration; a dispatcher-registered
operator needs further schema, backend, fake/meta and autograd registration.

Primary documentation checked September 14, 2026:

- [PyTorch 2.8 custom autograd functions](https://docs.pytorch.org/docs/2.8/notes/extending.html)
- [PyTorch 2.8 extension builds](https://docs.pytorch.org/docs/2.8/cpp_extension.html)
- [PyTorch 2.8 CUDA stream and allocator semantics](https://docs.pytorch.org/docs/2.8/notes/cuda.html)
- [PyTorch 2.8 current-stream declaration](https://github.com/pytorch/pytorch/blob/v2.8.0/c10/cuda/CUDAStream.h)
- [PyTorch 2.8 device guard](https://github.com/pytorch/pytorch/blob/v2.8.0/c10/cuda/CUDAGuard.h)
- [PyTorch custom-operator registration tutorial](https://docs.pytorch.org/tutorials/advanced/cpp_custom_ops.html)
