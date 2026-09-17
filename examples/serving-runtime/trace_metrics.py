"""CPU arithmetic on an explicit finite cohort; no network or model execution."""
from __future__ import annotations

import argparse
import json
import math
from pathlib import Path


def nonnegative(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value) and value >= 0


def summarize(document):
    start, end = document["window_ms"]
    if not all(map(nonnegative, (start, end))) or end <= start:
        raise ValueError("window must have positive duration")
    objective = document["objective_ms"]
    if set(objective) != {"ttft", "max_gap", "completion"} or not all(map(nonnegative, objective.values())):
        raise ValueError("objective must define three finite nonnegative thresholds")
    rows, identities = [], set()
    for trace in document["requests"]:
        identity = trace["id"]
        if not isinstance(identity, str) or not identity or identity in identities:
            raise ValueError("each attempt needs a unique ID")
        identities.add(identity)
        arrival, sent, terminal = (trace[k] for k in ("arrival_ms", "sent_ms", "terminal_ms"))
        if not all(map(nonnegative, (arrival, sent, terminal))) or not start <= arrival <= sent <= terminal <= end:
            raise ValueError("request boundaries must fit the declared window")
        times = trace["token_receipts_ms"]
        if not isinstance(times, list) or not all(map(nonnegative, times)):
            raise ValueError("token receipts must be finite timestamps")
        if any(a > b for a, b in zip([sent] + times, times + [terminal])):
            raise ValueError("token receipts must be ordered within request boundaries")
        status = trace["status"]
        if status not in {"complete", "failed", "cancelled"} or status == "complete" and not times:
            raise ValueError("completion requires at least one known output token")
        gaps = [b - a for a, b in zip(times, times[1:])]
        ttft = times[0] - arrival if times else None
        # Endpoint form is independent of the browser's sum-of-gaps calculation.
        tpot = (times[-1] - times[0]) / (len(times) - 1) if len(times) > 1 else None
        max_gap = max(gaps) if gaps else None
        completion = terminal - arrival
        compliant = (status == "complete" and ttft <= objective["ttft"]
                     and (max_gap is None or max_gap <= objective["max_gap"])
                     and completion <= objective["completion"])
        rows.append({"id": identity, "status": status, "ttft_ms": ttft,
                     "tpot_ms": tpot, "max_gap_ms": max_gap,
                     "completion_ms": completion, "client_queue_ms": sent - arrival,
                     "compliant": compliant})
    seconds = (end - start) / 1000
    completed = sum(r["status"] == "complete" for r in rows)
    compliant = sum(r["compliant"] for r in rows)
    return {"offered": len(rows), "completed": completed,
            "failed": sum(r["status"] == "failed" for r in rows),
            "cancelled": sum(r["status"] == "cancelled" for r in rows),
            "compliant": compliant, "throughput_rps": completed / seconds,
            "goodput_rps": compliant / seconds,
            "attainment": compliant / len(rows) if rows else None, "requests": rows}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=Path(__file__).with_name("example-trace.json"))
    args = parser.parse_args()
    print(json.dumps(summarize(json.loads(args.input.read_text())), indent=2, allow_nan=False))


if __name__ == "__main__":
    main()
