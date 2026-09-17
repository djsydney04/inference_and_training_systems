# Sharded training and checkpoint reference

Run with Python 3.10 or newer; no third-party packages are required.

```sh
python3 -m unittest discover -s examples/sharded-training -p 'test_*.py' -v
python3 examples/sharded-training/reference.py
```

The CPU reference implements a four-coordinate linear model with objective
`sum((x @ w - y)^2) / (2 * number_of_examples)`. Data partitions deliberately
contain one versus three examples for two ranks. Their gradient **sums** are
combined before global normalization. Each logical rank then updates only its
parameter and AdamW moment coordinates.

The main program performs two updates with two owners, serializes a checkpoint
through JSON, restores with four owners, and performs the next update. The tests
compare five complete updates against a monolithic AdamW reference; independently
check analytical gradients using finite differences; verify save/reshard/resume;
and reject missing, overlapping or inconsistent checkpoint chunks. A separate
test counts actual small FP32 and 16-bit buffer payloads to validate byte units.

## Interpretation

- Logical ranks are Python objects in one process. There is no collective or
  distributed transport, and no GPU/FSDP runtime was executed.
- Arithmetic uses Python float64. A 16-bit array in the byte test represents
  storage width, not BF16 arithmetic or a supported optimizer configuration.
- Checkpoints identify a logical tensor, shape and chunk offsets. They also keep
  first/second moments, optimizer step and deterministic data cursor. This tiny
  program has no RNG; a real stochastic run must preserve the required RNG state.
- The program reconstructs full tiny vectors while resharding. It does not model
  distributed checkpoint I/O or prove that full-vector materialization is safe
  for a large model.
- The JSON schema is an original teaching format, not PyTorch DCP compatibility.
- The browser's memory diagram counts explicitly declared live tensor payloads,
  not reserved CUDA allocator memory. Timing inputs are invented milliseconds.

## Primary sources checked September 16, 2026

- [Original ZeRO paper](https://arxiv.org/abs/1910.02054)
- [PyTorch 2.14 FSDP2](https://docs.pytorch.org/docs/2.14/distributed.fsdp.fully_shard.html)
- [PyTorch 2.14 distributed collectives](https://docs.pytorch.org/docs/2.14/distributed.html#torch.distributed.reduce_scatter_tensor)
- [PyTorch 2.14 AdamW](https://docs.pytorch.org/docs/2.14/generated/torch.optim.AdamW.html)
- [PyTorch 2.14 Distributed Checkpoint](https://docs.pytorch.org/docs/2.14/distributed.checkpoint.html)

The examples teach ownership and numerical equivalence. Real runtime validation
still requires checking actual collective ordering, memory peaks, mixed-precision
errors, checkpoint behavior and step timing on the intended devices.
