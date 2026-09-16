"""Compare equal outputs and export a real CPU operator trace of cached decode."""
import argparse
import json
from pathlib import Path
import statistics
import time
import torch
from train import load_model


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--checkpoint", default="checkpoints/byte-decoder.pt")
    parser.add_argument("--trace", default="checkpoints/decode-trace.json")
    args = parser.parse_args()
    torch.set_num_threads(1)
    model = load_model(args.checkpoint)
    prompt = torch.tensor([list(b"A token is a number. A tensor ")])
    count, repetitions = 24, 7
    baseline = model.generate(prompt, count, False)
    cached = model.generate(prompt, count, True)
    assert torch.equal(baseline, cached), "cache changed greedy output IDs"
    for use_cache in [False, True]:
        model.generate(prompt, count, use_cache)  # warmup outside measured interval
        elapsed = []
        for _ in range(repetitions):
            start = time.perf_counter()
            model.generate(prompt, count, use_cache)
            elapsed.append(time.perf_counter()-start)
        print(json.dumps(dict(device="cpu", threads=1, cached=use_cache,
                              prompt_tokens=prompt.shape[1], output_tokens=count,
                              repeats=repetitions, median_seconds=statistics.median(elapsed),
                              min_seconds=min(elapsed), max_seconds=max(elapsed))))
    trace = Path(args.trace)
    trace.parent.mkdir(parents=True, exist_ok=True)
    with torch.profiler.profile(activities=[torch.profiler.ProfilerActivity.CPU],
                                record_shapes=True, profile_memory=True) as profile:
        with torch.profiler.record_function("cached_byte_decode"):
            model.generate(prompt, count, True)
    profile.export_chrome_trace(str(trace))
    print(f"CPU operator trace: {trace}")
