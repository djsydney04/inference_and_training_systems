# TensorFlow companion: one complete training slice

This example connects the atlas’s tensor, Transformer, and training-system
chapters in one deliberately small program. It includes:

- a pre-normalized decoder with causal multi-head attention, RoPE, RMSNorm,
  SwiGLU, residual connections, and tied embeddings;
- explicit next-token label shifting;
- gradient accumulation and global-norm clipping;
- deterministic synthetic data whose loss should visibly fall;
- checkpoint restore plus an atomically published manifest.
- response-only SFT, sequence log likelihoods, DPO, and a minimal LoRA layer;
- numerical, gradient, checkpoint-integrity, and resume-equivalence tests.

It is educational code. It materializes the complete attention matrix and does
not contain distributed sharding, FlashAttention, mixed-precision policy,
production input storage, or high-performance fused kernels.

## Run it

Use Python 3.11 in a virtual environment (the verified configuration):

```bash
python -m pip install -r examples/tensorflow/requirements.txt
python examples/tensorflow/train_tiny_lm.py --updates 200
```

The default model has laptop-scale dimensions. Tested on 2026-09-08 with native
Apple Silicon Python 3.11.5, TensorFlow 2.20.0, Keras 3.15.1, and NumPy 2.4.6.
Those package versions are pinned in `requirements.txt`. This run used CPU
execution, not a Metal plug-in or a CUDA GPU. TensorFlow wheel availability
depends on the Python version and platform; use an environment it supports.

For a shorter run and an explicit resume:

```bash
python examples/tensorflow/train_tiny_lm.py --updates 30 --batch-size 2 --accumulation 2 --checkpoint-every 10 --checkpoint-dir checkpoints/lesson
python examples/tensorflow/train_tiny_lm.py --updates 120 --batch-size 2 --accumulation 2 --checkpoint-every 10 --checkpoint-dir checkpoints/lesson
```

`--updates` is the final total update count, not additional updates. The measured
example went from loss 4.9707 at update 1 to 2.8363 at update 120. Individual batch
losses were not monotonic. This cyclic synthetic task demonstrates the learning
and checkpoint path; it is not evidence of natural-language capability or a
training-throughput benchmark.

## Read the shapes

Inside `CausalSelfAttention.call`:

```text
tokens             [B, T]
embedding          [B, T, D]
q, k, v            [B, H, T, Dh]
attention scores   [B, H, T, T]
mixed heads        [B, T, D]
logits             [B, T, vocabulary]
```

The score tensor is why this implementation is not a long-context kernel.
FlashAttention preserves the mathematical result, up to floating-point effects, while tiling the work so
that the full score matrix is not written to HBM.

## Checkpoint contract

TensorFlow writes the checkpoint's data and index shards first. The example
hashes those shards and publishes `manifest.json` using a same-directory temporary
file and `os.replace`. Restore follows this committed manifest, not TensorFlow's
newest-file pointer. It checks hashes and the model/batch/accumulation settings
before loading variables.

Checkpoints are taken only after complete optimizer updates. They contain the
model, AdamW state, update number, and consumed-microbatch cursor. The source is
deterministic and has no shuffle, dropout, or stochastic sampling: resuming skips
the consumed microbatches. This narrow contract is what the equivalence test
checks. Changing the code, environment, or hardware can change numerical results.

All checkpoint generations are retained so a failed publication cannot delete
the last committed generation. For a real job, add retention *after* publishing
the new manifest. Atomic rename protects visibility on a local filesystem; this
demo does not provide power-loss durability (`fsync`) or object-store/distributed
transaction semantics. A real trainer also needs all RNG streams, scheduler and
loss-scaler state, versioned datasets, rank coordination, and a resharding plan.

## Test it

```bash
python -m unittest discover -s examples/tensorflow -p 'test_*.py' -v
```

The suite checks causal-prefix invariance, finite gradients, interrupted versus
uninterrupted training, corrupted and uncommitted checkpoints, response masks,
known DPO values and gradient signs, and the zero-initialized LoRA update.

## Token weighting across partitions

`token_objective.py` separates a local loss sum from the global valid-target
count. `local_contribution` supports either summed or averaged worker gradients.
The count must span every worker and accumulation microbatch in one optimizer
update; accumulation then sums contributions without dividing again.

```bash
python examples/tensorflow/token_objective.py
```

The worked example prints 1.50 for the incorrect mean of worker means and 1.75
for the global token mean. Three tests compare partitioned and full-batch
gradients, exercise both reducer conventions and unequal padding, allow an empty
local shard, and reject an empty global update. These are CPU algebra tests, not
a distributed runtime or a replacement for testing an actual multi-device loop.

## Post-training kernels

`post_training.py` deliberately separates the objective from the training loop:

- `sft_loss`: valid response-token mean across the whole batch.
- `sequence_log_probs`: response-token sums, as used by standard DPO.
- `dpo_loss`: stable softplus loss with a stop-gradient reference.
- `LoRALinear`: frozen base projection plus trainable low-rank matrices.

Labels and response masks are already shifted to match logit positions. Every
label, even an ignored one, must be a valid vocabulary ID; don't pass `-100` to
TensorFlow's sparse cross entropy. Each example must contain at least one
response target. These loss kernels do not construct the model's attention mask.

The LoRA demonstration starts with a randomly initialized base projection. Assign
compatible pretrained weights before using it for adaptation. There is no reward
model, rollout service, or PPO/GRPO trainer in this example.
