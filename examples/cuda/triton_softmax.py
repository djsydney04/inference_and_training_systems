"""Triton forward/backward row softmax; compares with independent torch autograd.

Requires compatible PyTorch/Triton and an NVIDIA GPU. Not executed on this Mac.
Run: python examples/cuda/triton_softmax.py
"""
import torch
import triton
import triton.language as tl


@triton.jit
def forward(X, Y, N: tl.constexpr, BLOCK: tl.constexpr):
    row = tl.program_id(0)
    column = tl.arange(0, BLOCK)
    value = tl.load(X + row * N + column, mask=column < N, other=-float("inf"))
    exponential = tl.exp(value - tl.max(value, axis=0))
    probability = exponential / tl.sum(exponential, axis=0)
    tl.store(Y + row * N + column, probability, mask=column < N)


@triton.jit
def backward(Y, DY, DX, N: tl.constexpr, BLOCK: tl.constexpr):
    row = tl.program_id(0)
    column = tl.arange(0, BLOCK)
    y = tl.load(Y + row * N + column, mask=column < N, other=0)
    dy = tl.load(DY + row * N + column, mask=column < N, other=0)
    dot = tl.sum(y * dy, axis=0)
    tl.store(DX + row * N + column, y * (dy - dot), mask=column < N)


def check(rows, columns, offset=0.0):
    x = (torch.randn(rows, columns, device="cuda", dtype=torch.float32) + offset).requires_grad_()
    dy = torch.randn_like(x)
    expected = torch.softmax(x, dim=-1)
    (expected * dy).sum().backward()
    y, dx = torch.empty_like(x), torch.empty_like(x)
    block = triton.next_power_of_2(columns)
    forward[(rows,)](x, y, columns, block, num_warps=4)
    backward[(rows,)](y, dy, dx, columns, block, num_warps=4)
    torch.testing.assert_close(y, expected, atol=2e-6, rtol=2e-4)
    torch.testing.assert_close(dx, x.grad, atol=2e-6, rtol=3e-4)
    torch.testing.assert_close(y.sum(-1), torch.ones(rows, device="cuda"), atol=2e-6, rtol=2e-6)
    print(f"PASS {rows}x{columns} shift={offset}: forward and backward agree")


if __name__ == "__main__":
    if not torch.cuda.is_available():
        raise SystemExit("A compatible GPU runtime is required; no CPU fallback is claimed.")
    torch.manual_seed(17)
    for width in (1, 7, 31, 32, 33, 255, 257, 1025, 4097):
        check(3, width)
    check(2, 257, 1000.0)
    torch.cuda.synchronize()
