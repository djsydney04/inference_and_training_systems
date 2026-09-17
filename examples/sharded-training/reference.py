"""CPU arithmetic reference for state sharding, not a distributed FSDP runtime.

Run `python3 examples/sharded-training/reference.py` from the repository root.
The loss is sum((x @ w - y)**2) / (2 * number_of_examples). Float64 Python
arithmetic tests ownership and normalization; no BF16 kernels or network run.
"""
from __future__ import annotations

from dataclasses import dataclass
import json
import math
from typing import Sequence

Example = tuple[list[float], float]


def loss_and_gradient_sum(weights: Sequence[float], examples: Sequence[Example]):
    loss = 0.0
    gradient = [0.0] * len(weights)
    for x, target in examples:
        if len(x) != len(weights):
            raise ValueError("example width differs from parameter width")
        error = sum(a * b for a, b in zip(x, weights)) - target
        loss += error * error / 2
        for j, value in enumerate(x):
            gradient[j] += value * error
    return loss, gradient


def batch_at(cursor: int, width: int = 4) -> list[Example]:
    return [([float(j == i) for j in range(width)], 0.02 * cursor * (i + 1)) for i in range(width)]


def partition_batch(batch: list[Example], ranks: int) -> list[list[Example]]:
    if ranks == 2 and len(batch) == 4:
        return [batch[:1], batch[1:]]  # Deliberately unequal local counts.
    return [batch[rank::ranks] for rank in range(ranks)]


@dataclass
class Shard:
    start: int
    weights: list[float]
    first_moment: list[float]
    second_moment: list[float]


@dataclass
class ShardedState:
    width: int
    shards: list[Shard]
    step: int = 0
    data_cursor: int = 0

    @classmethod
    def create(cls, weights: Sequence[float], ranks: int):
        if not isinstance(ranks, int) or ranks < 1 or not weights or len(weights) % ranks:
            raise ValueError("nonempty parameter count must divide evenly among ranks")
        chunk = len(weights) // ranks
        return cls(len(weights), [Shard(i, list(weights[i:i + chunk]), [0.0] * chunk, [0.0] * chunk)
                                  for i in range(0, len(weights), chunk)])

    def gather(self, field: str = "weights") -> list[float]:
        values = [0.0] * self.width
        seen = [False] * self.width
        for shard in self.shards:
            part = getattr(shard, field)
            if len(part) != len(shard.weights):
                raise ValueError("optimizer and parameter shard sizes differ")
            for offset, value in enumerate(part):
                index = shard.start + offset
                if not isinstance(index, int) or not 0 <= index < self.width or seen[index]:
                    raise ValueError("overlapping or out-of-range shard")
                if not math.isfinite(value):
                    raise ValueError("non-finite checkpoint value")
                seen[index] = True
                values[index] = value
        if not all(seen):
            raise ValueError("checkpoint is missing parameter coordinates")
        return values

    def update(self, examples_by_rank: list[list[Example]], learning_rate=0.1,
               beta1=0.9, beta2=0.99, epsilon=0.01, decay=0.1):
        if len(examples_by_rank) != len(self.shards):
            raise ValueError("one data partition is required for each logical rank")
        full_weights = self.gather()  # Each logical rank would gather these weights.
        local = [loss_and_gradient_sum(full_weights, examples)[1] for examples in examples_by_rank]
        count = sum(map(len, examples_by_rank))
        if count == 0:
            raise ValueError("global batch cannot be empty")
        self.step += 1
        for shard in self.shards:
            for offset in range(len(shard.weights)):
                index = shard.start + offset
                # Reduce-scatter SUM followed by one global-example division.
                grad = sum(row[index] for row in local) / count
                m = beta1 * shard.first_moment[offset] + (1 - beta1) * grad
                v = beta2 * shard.second_moment[offset] + (1 - beta2) * grad * grad
                corrected_m = m / (1 - beta1 ** self.step)
                corrected_v = v / (1 - beta2 ** self.step)
                shard.weights[offset] *= 1 - learning_rate * decay
                shard.weights[offset] -= learning_rate * corrected_m / (math.sqrt(corrected_v) + epsilon)
                shard.first_moment[offset], shard.second_moment[offset] = m, v
        self.data_cursor += 1

    def checkpoint(self) -> dict:
        return {"format": "atlas-sharded-v1", "tensor": "linear.weight", "shape": [self.width],
                "step": self.step, "data_cursor": self.data_cursor,
                "shards": [{"start": s.start, "weights": s.weights.copy(),
                            "first_moment": s.first_moment.copy(), "second_moment": s.second_moment.copy()}
                           for s in self.shards]}

    @classmethod
    def restore(cls, payload: dict, ranks: int):
        if payload.get("format") != "atlas-sharded-v1" or payload.get("tensor") != "linear.weight":
            raise ValueError("unsupported checkpoint schema or tensor identity")
        if len(payload["shape"]) != 1 or not isinstance(payload["shape"][0], int) or payload["shape"][0] < 1:
            raise ValueError("expected a nonempty one-dimensional logical tensor")
        if any(not isinstance(payload[key], int) or payload[key] < 0 for key in ("step", "data_cursor")):
            raise ValueError("step and data cursor must be nonnegative integers")
        old = cls(payload["shape"][0], [Shard(**item) for item in payload["shards"]], payload["step"], payload["data_cursor"])
        vectors = {field: old.gather(field) for field in ("weights", "first_moment", "second_moment")}
        if any(v < 0 for v in vectors["second_moment"]):
            raise ValueError("second moments cannot be negative")
        new = cls.create(vectors["weights"], ranks)
        new.step, new.data_cursor = old.step, old.data_cursor
        for shard in new.shards:
            end = shard.start + len(shard.weights)
            shard.first_moment = vectors["first_moment"][shard.start:end]
            shard.second_moment = vectors["second_moment"][shard.start:end]
        return new


def main():
    state = ShardedState.create([1, 2, 3, 4], 2)
    for _ in range(2):
        state.update(partition_batch(batch_at(state.data_cursor), len(state.shards)))
    # JSON round-trip exercises serializable metadata without writing a checkpoint.
    restored = ShardedState.restore(json.loads(json.dumps(state.checkpoint())), 4)
    restored.update(partition_batch(batch_at(restored.data_cursor), 4))
    print("Two logical ranks saved at step 2; four logical ranks completed step 3.")
    for rank, shard in enumerate(restored.shards):
        print(f"rank {rank}: coordinate {shard.start}; weight {shard.weights[0]:.9f}; "
              f"m {shard.first_moment[0]:.9f}; v {shard.second_moment[0]:.9f}")
    print("CPU float64 arithmetic only; no process group, accelerator or transport was executed.")


if __name__ == "__main__":
    main()
