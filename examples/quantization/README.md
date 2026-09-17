# Quantization contracts on a CPU

Run from the repository root with Python 3 (standard library only):

```sh
python3 examples/quantization/reference.py
python3 -m unittest discover -s examples/quantization -p 'test_*.py' -v
```

`reference.py` implements scalar affine quantization, symmetric grouped weights,
an invertible channel transform, actual INT4 packing, and scalar attention.
Python's `round` uses nearest with exact ties to even. Rounding occurs **before**
adding the integer zero point. This distinction matters for odd zero points.

The grouped weight format is deliberately explicit: `W[output,input]`, groups
along the input dimension, signed codes `[-(2^(bits-1)-1), +(2^(bits-1)-1)]`, and
one scale per group. The most-negative two's-complement code is unused. An
all-zero group uses scale 1. Partial final groups are supported.

Packing is implemented for four-bit codes only. The earlier code goes in the low
nibble; an odd-length payload ends with a zero high nibble. Logical element count,
shape, grouping and scales are separate metadata. The printed payload is real;
the script does not serialize a complete model format.

Tests cover a hand-encoded payload plus all 225 pairs of legal INT4 codes, signed
rounding ties, tail groups, a calibration shift, K/V error paths, and a concrete
case where lower weight MSE produces nine times more squared output error.

All calculations use Python float arithmetic. This is a numerical and packing
reference, not GPTQ, AWQ, SmoothQuant, KIVI, an INT4 matrix kernel, or a quality /
throughput benchmark. The browser uses the same examples in TypeScript; it does
not claim to simulate FP16/FP32 arithmetic or hardware accumulator behavior.
