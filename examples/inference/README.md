# Discrete speculative-sampling reference

Run with Python 3.11 or newer; only the standard library is required.

```bash
python examples/inference/speculative_sampling.py
python -m unittest discover -s examples/inference -p 'test_*.py' -v
```

The reference proposes a short continuation, scores its prefixes, accepts a
contiguous prefix, and emits either a residual correction or a target bonus.
A two-token Markov toy makes the conditional output distribution calculable:
`P(00)=0.12`, `P(01)=0.48`, `P(10)=0.28`, `P(11)=0.12`.

Checked September 9, 2026: four tests pass. The 50,000-sample, seed-23 experiment
has a maximum absolute frequency difference of 0.00226. This is empirical
support for the program's control flow, not a proof or universal tolerance.
The browser's Node suite separately verifies exact mass identities, including
2,025 pairs of rational distributions and zero-support cases.

This example runs no Transformer, GPU kernels, KV cache or network service.
Target scoring is serial Python for readability, not accelerated verification.
EOS handling, token limits and provisional-cache rollback are implementation
obligations discussed in the chapter, not features of this small reference.

Primary sources: [Leviathan et al.](https://arxiv.org/abs/2211.17192),
[Chen et al.](https://arxiv.org/abs/2302.01318).
