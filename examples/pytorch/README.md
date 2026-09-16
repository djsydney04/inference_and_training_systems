# Train a byte decoder, prove its cache, serve it locally

From the repository root, use a native Python 3.11–3.13 environment supported by
PyTorch 2.8.0. On Apple Silicon use an arm64 Python, not an Intel/Rosetta Python.
This companion deliberately runs on CPU and downloads no dataset or model.

```sh
python3.12 -m venv .venv
.venv/bin/python -m pip install -r examples/pytorch/requirements.txt
.venv/bin/python -m unittest discover -s examples/pytorch -p 'test_*.py' -v
.venv/bin/python examples/pytorch/train.py --updates 100
.venv/bin/python examples/pytorch/train.py --updates 125 --resume
.venv/bin/python examples/pytorch/profile_decode.py
.venv/bin/python examples/pytorch/serve.py
```

In another terminal:

```sh
curl http://127.0.0.1:8091/health
curl http://127.0.0.1:8091/generate \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"A token ","max_new_tokens":32}'
```

## What you are proving

- Causality: changing future IDs leaves earlier logits unchanged.
- Cached equivalence: a prefix followed by varying decode chunk sizes matches
  one full forward pass; greedy cached and uncached generation agree.
- Backward correctness: a selected attention weight derivative agrees with an
  independent central finite difference in FP64.
- Exact resume: uninterrupted and interrupted CPU training have identical model
  parameters, AdamW state, sampler RNG and global RNG at the same update.
- Learning: loss decreases on a tiny repeated debugging corpus.
- Serving: real HTTP requests generate byte IDs; malformed requests fail;
  concurrent overload returns 503 and capacity is released after completion.
- Evaluation: short final windows are weighted by their actual valid targets.

The model uses learned absolute positions, LayerNorm, GELU and tied embeddings;
the existing TensorFlow companion explores RoPE, RMSNorm and SwiGLU. They are
separate instructional architectures, not interchangeable checkpoints.

The included corpus is original repetitive teaching text. There is no held-out
generalization claim. For a data experiment, pass `--text corpus.txt`, create
document-disjoint training/validation/test files, and pass `--validation-text validation.txt` for token-weighted evaluation
before interpreting the loss as model quality. Evaluation covers every target
byte once, including a short final window, and resets context per window. Training windows are length 32
by default; untrained long position embeddings do not establish 128-token quality.

The cache is append-only and uses `torch.cat`, which copies growing buffers. It
has no paged allocation, continuous batching, speculative decode or GPU kernels.
The server admits one generation at a time and returns HTTP 503 while busy.
Its timing is whole CPU generation, not streamed TTFT or GPU throughput.
`profile_decode.py` records actual CPU operators and compares equal output IDs.
Its clock measurements depend on this machine and do not predict GPU speedups.

Resume is at an update boundary, on the same software/device configuration.
The checkpoint includes corpus hash and sampler state; mismatched data/settings
are rejected. It uses atomic replacement for local publication, not fsync-backed
power-loss durability or a distributed/object-storage commit protocol.
Only load checkpoints whose provenance you trust; `weights_only=True` narrows
the loader contract. No checkpoint-to-vLLM conversion is claimed.
