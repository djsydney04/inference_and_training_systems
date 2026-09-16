"""CPU protocol sketch: state ownership, not a GPU connector or a KV serializer."""
from dataclasses import dataclass


@dataclass(frozen=True)
class Manifest:
    request: str
    epoch: int
    checkpoint: str
    layout: str
    prefix: tuple[int, ...]
    next_token: int  # sampled by prefill; NOT represented in prefix KV yet


class Handoff:
    def __init__(self, source: Manifest, expected: Manifest, credit: int):
        if source != expected:
            raise ValueError("request, epoch, model, layout and prefix must agree")
        if credit < len(source.prefix):
            raise ValueError("receiver has insufficient token-slot credit")
        self.manifest = source
        self.slots = [None] * len(source.prefix)
        self.phase = "copying"
        self.source_pinned = True
        self.accepted_attempt = (source.request, source.epoch)

    def receive(self, request: str, epoch: int, offset: int, values: tuple):
        if self.phase != "copying" or (request, epoch) != self.accepted_attempt:
            raise ValueError("late transfer or stale attempt")
        if offset < 0 or not values or offset + len(values) > len(self.slots):
            raise ValueError("invalid token range")
        for i, value in enumerate(values, offset):
            if value is None or (self.slots[i] is not None and self.slots[i] != value):
                raise ValueError("conflicting duplicate transfer")
        # Validate the whole write first: failure must not partially change state.
        self.slots[offset:offset + len(values)] = values

    def commit(self):
        if self.phase != "copying" or any(value is None for value in self.slots):
            raise ValueError("cannot publish an incomplete cache")
        self.phase = "ready"
        return tuple(self.slots), self.manifest.next_token

    def acknowledge(self, request: str, epoch: int):
        if self.phase != "ready" or (request, epoch) != self.accepted_attempt:
            raise ValueError("only the completed attempt may release source state")
        self.source_pinned = False
        self.phase = "acknowledged"

    def cancel_after_transport_drained(self):
        # Caller has already proved no in-flight writes can reach recycled slots.
        self.phase = "cancelled"
        self.source_pinned = False
        self.slots = []


if __name__ == "__main__":
    manifest = Manifest("request-7", 2, "weights-A", "all-layers-bf16", (99, 97, 116, 10), 32)
    transfer = Handoff(manifest, manifest, credit=4)
    # Placeholder values stand for each position's state across all layers.
    transfer.receive("request-7", 2, 2, ("KV[2]", "KV[3]"))
    transfer.receive("request-7", 2, 0, ("KV[0]", "KV[1]"))
    cache, pending = transfer.commit()
    print("Published cache:", cache, "pending token:", pending)
    transfer.acknowledge("request-7", 2)
    print("Source pinned:", transfer.source_pinned)
