"""Deterministic CPU training with corpus identity and exact update-boundary resume."""
import argparse
from dataclasses import asdict
import hashlib
import json
import math
import os
from pathlib import Path
import torch
from tiny_decoder import Config, TinyDecoder

# Original data written for this exercise. Repetition is a debugging task,
# not evidence of general language understanding or held-out generalization.
CORPUS = ("A token is a number. A tensor has a shape. A model predicts the next token.\n"
          "A register holds a value. Memory moves bytes. A kernel performs a calculation.\n"
          "A gradient changes a weight. A checkpoint preserves a training state.\n"
          "A cache stores past keys and values. A server schedules requests.\n") * 16


def train(updates=100, checkpoint=None, resume=False, corpus=CORPUS,
          config=Config(), batch=8, length=32, seed=17):
    if updates < 0 or batch < 1 or length < 1 or length > config.context:
        raise ValueError("invalid training dimensions")
    if resume and checkpoint is None:
        raise ValueError("resume needs a checkpoint path")
    torch.set_num_threads(1)
    torch.manual_seed(seed)
    data = torch.tensor(list(corpus.encode("utf-8")), dtype=torch.long)
    if len(data) <= length:
        raise ValueError("corpus needs at least length+1 bytes")
    digest = hashlib.sha256(corpus.encode("utf-8")).hexdigest()
    contract = dict(config=asdict(config), batch=batch, length=length,
                    corpus_sha256=digest, learning_rate=0.003, seed=seed)
    model = TinyDecoder(config)
    optimizer = torch.optim.AdamW(model.parameters(), lr=contract["learning_rate"],
                                 weight_decay=0.01, foreach=False)
    generator = torch.Generator().manual_seed(seed + 1)
    start = 0
    if resume:
        saved = torch.load(checkpoint, map_location="cpu", weights_only=True)
        if saved["contract"] != contract:
            raise ValueError("checkpoint corpus, model or training contract changed")
        model.load_state_dict(saved["model"])
        optimizer.load_state_dict(saved["optimizer"])
        generator.set_state(saved["sampler_rng"])
        torch.set_rng_state(saved["torch_rng"])
        start = saved["update"]
        if updates < start:
            raise ValueError("target updates precede saved update")
    history = []
    for update in range(start, updates):
        positions = torch.randint(len(data) - length, (batch,), generator=generator)
        sequences = torch.stack([data[i:i + length + 1] for i in positions])
        optimizer.zero_grad(set_to_none=True)
        loss = model.loss(sequences)
        if not torch.isfinite(loss):
            raise RuntimeError("nonfinite training loss")
        loss.backward()
        norm = torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0,
                                             error_if_nonfinite=True)
        optimizer.step()
        history.append(float(loss.detach()))
        if update == start or (update + 1) % 25 == 0:
            print(json.dumps(dict(update=update + 1, loss=history[-1],
                                  grad_norm=float(norm), tokens=(update + 1)*batch*length)))
    if checkpoint is not None:
        path = Path(checkpoint)
        path.parent.mkdir(parents=True, exist_ok=True)
        temporary = path.with_suffix(path.suffix + ".tmp")
        torch.save(dict(model=model.state_dict(), optimizer=optimizer.state_dict(),
                        contract=contract, update=updates, sampler_rng=generator.get_state(),
                        torch_rng=torch.get_rng_state(), torch_version=str(torch.__version__)), temporary)
        os.replace(temporary, path)
    return model, optimizer, history


def load_model(path):
    saved = torch.load(path, map_location="cpu", weights_only=True)
    model = TinyDecoder(Config(**saved["contract"]["config"]))
    model.load_state_dict(saved["model"])
    model.eval()
    return model


@torch.inference_mode()
def evaluate(model, corpus, length=32):
    """Token-weighted NLL over independent contiguous windows, including a tail.

    Every target byte after the first is counted once. Positions reset in each
    window; this is not a full-document sliding-cache evaluation.
    """
    if length < 1 or length > model.config.context:
        raise ValueError("evaluation window must fit context")
    data = torch.tensor(list(corpus.encode("utf-8")), dtype=torch.long)
    if len(data) < 2:
        raise ValueError("evaluation text needs at least two bytes")
    was_training = model.training
    model.eval()
    total, targets = 0.0, 0
    try:
        for start in range(0, len(data)-1, length):
            sequence = data[start:start+length+1][None, :]
            count = sequence.shape[1]-1
            total += model.loss(sequence).item()*count
            targets += count
    finally:
        model.train(was_training)
    nll = total/targets
    return dict(target_tokens=targets, loss=nll, perplexity=math.exp(nll),
                corpus_sha256=hashlib.sha256(corpus.encode()).hexdigest(), window=length)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--updates", type=int, default=100)
    parser.add_argument("--checkpoint", default="checkpoints/byte-decoder.pt")
    parser.add_argument("--resume", action="store_true")
    parser.add_argument("--text", type=Path)
    parser.add_argument("--validation-text", type=Path)
    args = parser.parse_args()
    model, _, _ = train(args.updates, args.checkpoint, args.resume,
                        CORPUS if args.text is None else args.text.read_text())
    if args.validation_text is not None:
        print(json.dumps({"validation": evaluate(model, args.validation_text.read_text())}))
    prompt = torch.tensor([list(b"A token ")])
    print(bytes(model.generate(prompt, 60)[0].tolist()).decode("utf-8", errors="replace"))
