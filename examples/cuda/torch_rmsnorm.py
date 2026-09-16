"""Train through a custom RMSNorm operation, then compare every update.

CPU: python examples/cuda/torch_rmsnorm.py --device cpu
CUDA: MAX_JOBS=1 python examples/cuda/torch_rmsnorm.py --device cuda

The CPU route validates the analytical gradient and autograd integration. It does
not compile or execute the CUDA extension. The CUDA route needs a CUDA-enabled
PyTorch, an NVIDIA GPU, NVCC, a compatible C++ compiler, and Ninja.
"""
from __future__ import annotations

import argparse
import copy
from functools import lru_cache
import math
from pathlib import Path

import torch
from torch import nn
from torch.autograd.function import once_differentiable


@lru_cache(maxsize=1)
def _extension():
    # Lazy import/build: importing this file and its CPU path requires no toolkit.
    if not torch.cuda.is_available():
        raise RuntimeError("CUDA path requires an NVIDIA GPU and CUDA-enabled PyTorch")
    from torch.utils.cpp_extension import load

    here = Path(__file__).resolve().parent
    return load(
        name="atlas_rmsnorm_cuda",
        sources=[str(here / "torch_rmsnorm.cpp"), str(here / "torch_rmsnorm.cu")],
        extra_cflags=["-O2"],
        extra_cuda_cflags=["-O2", "-lineinfo"],
        verbose=True,
    )


def _validate(x: torch.Tensor, weight: torch.Tensor, epsilon: float) -> None:
    if x.ndim != 2 or weight.ndim != 1 or x.shape[1] != weight.shape[0]:
        raise ValueError("expected x [rows,width] and weight [width]")
    if x.numel() == 0:
        raise ValueError("empty tensors are not supported")
    if not x.is_contiguous() or not weight.is_contiguous():
        raise ValueError("inputs must be contiguous; choose copies explicitly")
    if x.device != weight.device or x.dtype != weight.dtype:
        raise ValueError("inputs must have matching dtype and device")
    if x.dtype not in (torch.float32, torch.float64):
        raise ValueError("reference/analytic paths accept only FP32 or FP64")
    if not math.isfinite(epsilon) or epsilon <= 0:
        raise ValueError("epsilon must be finite and positive")


def reference_rmsnorm(x: torch.Tensor, weight: torch.Tensor, epsilon: float = 1e-5):
    """Ordinary Torch operators: autograd independently builds their derivative."""
    _validate(x, weight, epsilon)
    return x * torch.rsqrt(x.square().mean(dim=1, keepdim=True) + epsilon) * weight


class _RMSNormFunction(torch.autograd.Function):
    @staticmethod
    def forward(ctx, x, weight, epsilon, use_cuda):
        _validate(x, weight, epsilon)
        if use_cuda:
            if x.device.type != "cuda" or x.dtype != torch.float32:
                raise ValueError("custom CUDA RMSNorm requires contiguous CUDA FP32")
            output, inverse = _extension().forward(x, weight, epsilon)
        else:
            inverse = torch.rsqrt(x.square().mean(dim=1) + epsilon)
            output = x * inverse[:, None] * weight
        ctx.save_for_backward(x, weight, inverse)
        ctx.use_cuda = use_cuda
        return output

    @staticmethod
    @once_differentiable
    def backward(ctx, grad_output):
        x, weight, inverse = ctx.saved_tensors
        # Autograd may supply a broadcast (zero-stride) or transposed gradient.
        # This explicit copy satisfies the raw CUDA kernel's layout contract.
        grad_output = grad_output.contiguous()
        if ctx.use_cuda:
            grad_input, grad_weight = _extension().backward(x, weight, inverse, grad_output)
        else:
            inv = inverse[:, None]
            dot = (grad_output * weight * x).sum(dim=1, keepdim=True)
            grad_input = inv * grad_output * weight - x * inv.pow(3) * dot / x.shape[1]
            grad_weight = (grad_output * x * inv).sum(dim=0)
        # One return per forward argument. Epsilon and backend are not trained.
        return grad_input, grad_weight, None, None


def rmsnorm(x, weight, epsilon=1e-5, *, backend="cuda"):
    """Select CUDA, analytical teaching backward, or pure Torch reference."""
    if backend == "reference":
        return reference_rmsnorm(x, weight, epsilon)
    if backend not in ("cuda", "analytic"):
        raise ValueError("backend must be cuda, analytic or reference")
    return _RMSNormFunction.apply(x, weight, epsilon, backend == "cuda")


class RMSNorm(nn.Module):
    """Normalize the last axis; contiguous leading axes become independent rows."""
    def __init__(self, width: int, *, epsilon: float = 1e-5, backend: str = "cuda"):
        super().__init__()
        if not isinstance(width, int) or isinstance(width, bool) or width <= 0:
            raise ValueError("width must be a positive integer")
        self.weight = nn.Parameter(torch.ones(width))
        self.epsilon = epsilon
        self.backend = backend

    def forward(self, x):
        if x.ndim < 2 or x.shape[-1] != self.weight.numel() or not x.is_contiguous():
            raise ValueError("expected contiguous [...,width] with at least two axes")
        flat = x.view(-1, self.weight.numel())
        return rmsnorm(flat, self.weight, self.epsilon, backend=self.backend).view_as(x)


def _close(actual, expected, *, gpu=False):
    torch.testing.assert_close(actual, expected, rtol=4e-4 if gpu else 1e-9,
                               atol=4e-5 if gpu else 1e-10, equal_nan=False)


def check_forward_backward(device: torch.device, backend: str):
    gpu = device.type == "cuda"
    dtype = torch.float32 if gpu else torch.float64
    cases = [(1, 1), (3, 7), (2, 33), (5, 257), (2, 1025), (2, 4097)]
    for rows, width in cases:
        x = torch.randn(rows, width, dtype=dtype, device=device, requires_grad=True)
        weight = torch.randn(width, dtype=dtype, device=device, requires_grad=True)
        xr = x.detach().clone().requires_grad_()
        wr = weight.detach().clone().requires_grad_()
        # Strided upstream derivative exercises the wrapper's contiguous copy.
        upstream = torch.randn(width, rows, dtype=dtype, device=device).t()
        actual = rmsnorm(x, weight, backend=backend)
        expected = reference_rmsnorm(xr, wr)
        actual.backward(upstream)
        expected.backward(upstream)
        for left, right in ((actual, expected), (x.grad, xr.grad), (weight.grad, wr.grad)):
            _close(left, right, gpu=gpu)
    # Zero rows remain numerically defined because epsilon is positive. A sum
    # loss also provides the broadcast upstream derivative common in training.
    x = torch.zeros(2, 33, dtype=dtype, device=device, requires_grad=True)
    weight = torch.ones(33, dtype=dtype, device=device, requires_grad=True)
    rmsnorm(x, weight, backend=backend).sum().backward()
    _close(x.grad, torch.full_like(x, 1 / math.sqrt(1e-5)), gpu=gpu)
    _close(weight.grad, torch.zeros_like(weight), gpu=gpu)


def check_training_updates(device: torch.device, backend: str):
    """Compare losses, upstream/input gradients, parameters AND AdamW state."""
    gpu = device.type == "cuda"
    dtype = torch.float32 if gpu else torch.float64
    for width in (7, 33, 257):
        # The preceding Linear must receive a correct derivative through RMSNorm.
        reference = nn.Sequential(nn.Linear(width, width), RMSNorm(width, backend="reference"),
                                  nn.Linear(width, 5)).to(device=device, dtype=dtype)
        candidate = copy.deepcopy(reference)
        candidate[1].backend = backend
        optimizers = [torch.optim.AdamW(network.parameters(), lr=1e-3, eps=1e-6,
                                       weight_decay=0.01, foreach=False)
                      for network in (reference, candidate)]
        losses = []
        for _ in range(3):
            batch = torch.randn(2, 3, width, device=device, dtype=dtype)
            target = torch.randn(2, 3, 5, device=device, dtype=dtype)
            inputs, step_losses = [], []
            for network, optimizer in zip((reference, candidate), optimizers):
                optimizer.zero_grad(set_to_none=True)
                x = batch.detach().clone().requires_grad_()
                loss = (network(x) - target).square().mean()
                loss.backward()
                inputs.append(x)
                step_losses.append(loss.detach())
            _close(step_losses[1], step_losses[0], gpu=gpu)
            _close(inputs[1].grad, inputs[0].grad, gpu=gpu)
            for a, b in zip(reference.parameters(), candidate.parameters()):
                _close(b.grad, a.grad, gpu=gpu)
            for optimizer in optimizers:
                optimizer.step()
            for a, b in zip(reference.parameters(), candidate.parameters()):
                _close(b, a, gpu=gpu)
                state_a, state_b = optimizers[0].state[a], optimizers[1].state[b]
                assert state_a.keys() == state_b.keys()
                for key in state_a:
                    _close(state_b[key], state_a[key], gpu=gpu)
            losses.append(float(step_losses[1]))
        print(f"  width={width}: three AdamW updates agree; losses={losses}")


def check_cpu_contracts():
    x = torch.randn(2, 5, dtype=torch.float64, requires_grad=True)
    weight = torch.randn(5, dtype=torch.float64, requires_grad=True)
    assert torch.autograd.gradcheck(lambda a, b: rmsnorm(a, b, backend="analytic"),
                                   (x, weight), eps=1e-6, atol=1e-5, rtol=1e-4)
    invalid = [(x.t(), torch.ones(2, dtype=x.dtype), 1e-5),
               (x, weight, 0.0), (x, weight, float("nan")),
               (x[:0], weight, 1e-5), (x, weight.float(), 1e-5)]
    for a, b, epsilon in invalid:
        try:
            rmsnorm(a, b, epsilon, backend="analytic")
        except ValueError:
            pass
        else:
            raise AssertionError("invalid contract was accepted")
    # Saved-variable version checking must detect modifying a saved parameter.
    output = rmsnorm(x, weight, backend="analytic")
    with torch.no_grad():
        weight.add_(1)
    try:
        output.sum().backward()
    except RuntimeError as error:
        assert "modified by an inplace operation" in str(error)
    else:
        raise AssertionError("saved parameter mutation was not detected")
    # A custom first derivative is not automatically a second derivative.
    x = x.detach().clone().requires_grad_()
    weight = weight.detach().clone().requires_grad_()
    y = rmsnorm(x, weight, backend="analytic")
    first, = torch.autograd.grad(y.square().sum(), x, create_graph=True)
    try:
        first.sum().backward()
    except RuntimeError:
        pass
    else:
        raise AssertionError("unsupported double backward was accepted")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--device", choices=("cpu", "cuda"), default="cpu")
    args = parser.parse_args()
    torch.manual_seed(23)
    torch.set_num_threads(1)
    check_cpu_contracts()
    device = torch.device(args.device)
    backend = "cuda" if args.device == "cuda" else "analytic"
    if args.device == "cuda":
        if not torch.cuda.is_available():
            parser.error("CUDA unavailable. Use --device cpu for analytical reference checks only.")
        _extension()  # Build before the stream experiment; no compilation timing claim.
        torch.backends.cuda.matmul.allow_tf32 = False
        stream = torch.cuda.Stream()
        stream.wait_stream(torch.cuda.current_stream())
        with torch.cuda.stream(stream):
            check_forward_backward(device, backend)
            check_training_updates(device, backend)
        stream.synchronize()  # Required before reporting asynchronous work complete.
        print("CUDA extension forward/backward and training comparisons passed on a non-default stream.")
    else:
        check_forward_backward(device, backend)
        check_training_updates(device, backend)
        print("CPU analytical/autograd checks passed. CUDA was not compiled or executed.")
    print("No performance, autocast, torch.compile, forward-mode or double-backward claim.")


if __name__ == "__main__":
    main()
