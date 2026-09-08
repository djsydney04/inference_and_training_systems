"""Train the tiny decoder on a deterministic synthetic next-token task."""

import argparse
from dataclasses import asdict
import hashlib
import json
import os
from pathlib import Path

import tensorflow as tf

from tiny_lm import TinyConfig, TinyDecoderLM


def make_dataset(config: TinyConfig, batch_size: int) -> tf.data.Dataset:
    """Create cyclic sequences so correctness is visible within a few updates."""
    sequence = config.context_length + 1
    dataset = tf.data.Dataset.range(config.vocab_size).repeat()
    dataset = dataset.map(
        lambda start: tf.cast(
            (tf.range(sequence, dtype=tf.int64) + start) % config.vocab_size,
            tf.int32,
        ),
        num_parallel_calls=tf.data.AUTOTUNE,
        deterministic=True,
    )
    return dataset.batch(batch_size, drop_remainder=True).prefetch(tf.data.AUTOTUNE)


def atomic_manifest(
    directory: Path, checkpoint_path: str, step: int, config: TinyConfig,
    batch_size: int, accumulation: int,
) -> None:
    """Publish metadata only after TensorFlow has completed all checkpoint shards."""
    payload = {
        "checkpoint": Path(checkpoint_path).name,
        "step": step,
        "config": asdict(config),
        "batch_size": batch_size,
        "accumulation": accumulation,
        "sha256": {
            shard.name: hashlib.sha256(shard.read_bytes()).hexdigest()
            for shard in directory.glob(Path(checkpoint_path).name + ".*")
        },
    }
    temporary = directory / f"manifest.json.tmp-{os.getpid()}"
    temporary.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    os.replace(temporary, directory / "manifest.json")


def verify_manifest(directory: Path, config: TinyConfig, batch_size: int, accumulation: int) -> str | None:
    manifest = directory / "manifest.json"
    if not manifest.exists():
        if any(directory.glob("ckpt-*.index")):
            raise ValueError("Checkpoint shards exist without a committed manifest; use a new output directory.")
        return None
    payload = json.loads(manifest.read_text(encoding="utf-8"))
    if (payload["config"], payload["batch_size"], payload["accumulation"]) != (asdict(config), batch_size, accumulation):
        raise ValueError("Resume requires the same model, batch size, and accumulation settings.")
    if not payload.get("sha256"):
        raise ValueError("Manifest has no shard checksums.")
    for name, checksum in payload["sha256"].items():
        if Path(name).name != name:
            raise ValueError("Checkpoint shard must be a filename inside the checkpoint directory.")
        if hashlib.sha256((directory / name).read_bytes()).hexdigest() != checksum:
            raise ValueError(f"Checkpoint checksum mismatch: {name}")
    checkpoint_name = payload["checkpoint"]
    if Path(checkpoint_name).name != checkpoint_name:
        raise ValueError("Invalid checkpoint name.")
    return str(directory / checkpoint_name)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--updates", type=int, default=200)
    parser.add_argument("--batch-size", type=int, default=8)
    parser.add_argument("--accumulation", type=int, default=4)
    parser.add_argument("--checkpoint-every", type=int, default=50)
    parser.add_argument("--checkpoint-dir", type=Path, default=Path("checkpoints/tiny"))
    args = parser.parse_args()
    if min(args.updates, args.batch_size, args.accumulation, args.checkpoint_every) < 1:
        parser.error("updates, batch size, accumulation, and checkpoint interval must be positive")

    tf.keras.utils.set_random_seed(7)
    tf.config.experimental.enable_op_determinism()
    config = TinyConfig()
    model = TinyDecoderLM(config)
    # Build variables before creating gradient accumulators and checkpoint state.
    model(tf.zeros([1, config.context_length], dtype=tf.int32))
    optimizer = tf.keras.optimizers.AdamW(learning_rate=3e-4, weight_decay=0.1)
    optimizer.build(model.trainable_variables)
    accumulated = [
        tf.Variable(tf.zeros_like(variable), trainable=False)
        for variable in model.trainable_variables
    ]

    checkpoint = tf.train.Checkpoint(
        update=tf.Variable(0, dtype=tf.int64),
        consumed_microbatches=tf.Variable(0, dtype=tf.int64),
        model=model, optimizer=optimizer,
    )
    args.checkpoint_dir.mkdir(parents=True, exist_ok=True)
    manager = tf.train.CheckpointManager(
        checkpoint, str(args.checkpoint_dir), max_to_keep=None
    )
    committed = verify_manifest(args.checkpoint_dir, config, args.batch_size, args.accumulation)
    if committed:
        checkpoint.restore(committed).assert_consumed()
        print(f"resumed {committed} at update {int(checkpoint.update)}")

    @tf.function(jit_compile=False)
    def accumulate_microbatch(tokens: tf.Tensor) -> tf.Tensor:
        with tf.GradientTape() as tape:
            loss = model.next_token_loss(tokens)
            scaled_loss = loss / tf.cast(args.accumulation, loss.dtype)
        gradients = tape.gradient(scaled_loss, model.trainable_variables)
        for buffer, gradient in zip(accumulated, gradients):
            if gradient is not None:
                buffer.assign_add(gradient)
        checkpoint.consumed_microbatches.assign_add(1)
        return loss

    @tf.function(jit_compile=False)
    def apply_update() -> tf.Tensor:
        gradients, global_norm = tf.clip_by_global_norm(accumulated, 1.0)
        optimizer.apply_gradients(zip(gradients, model.trainable_variables))
        for buffer in accumulated:
            buffer.assign(tf.zeros_like(buffer))
        checkpoint.update.assign_add(1)
        return global_norm

    # This source is a deterministic cycle with no shuffle, dropout, or sampling.
    # Skip the already consumed batches so the next optimizer update sees the same data.
    iterator = iter(make_dataset(config, args.batch_size).skip(int(checkpoint.consumed_microbatches)))
    while int(checkpoint.update) < args.updates:
        losses = [accumulate_microbatch(next(iterator)) for _ in range(args.accumulation)]
        gradient_norm = apply_update()
        update = int(checkpoint.update)

        if update == 1 or update % 10 == 0:
            mean_loss = float(tf.reduce_mean(losses))
            tokens = update * args.accumulation * args.batch_size * config.context_length
            print(
                f"update={update:04d} tokens={tokens:09d} "
                f"loss={mean_loss:.4f} grad_norm={float(gradient_norm):.3f}"
            )

        if update % args.checkpoint_every == 0 or update == args.updates:
            saved = manager.save(checkpoint_number=update)
            if saved is None:
                raise RuntimeError("TensorFlow did not return a checkpoint path")
            atomic_manifest(args.checkpoint_dir, saved, update, config, args.batch_size, args.accumulation)


if __name__ == "__main__":
    main()
