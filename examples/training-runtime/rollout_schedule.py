#!/usr/bin/env python3
"""Dependency-free actor/learner schedule reference; no ML or GPU runtime.

One group produces one update. Groups are consumed FIFO. Generation plus reward
occupies one lane, update plus publication another. In-flight generation retains
an immutable weight snapshot. A new group k may start when k - published <= lag.
Times are declared seconds, not measurements. Publication wins simultaneous
events so a newly starting actor receives the latest available snapshot.
"""
from __future__ import annotations

import argparse
from dataclasses import dataclass
import math
import unittest


@dataclass
class Group:
    index: int
    behavior_version: int
    actor_start: float
    actor_end: float
    learner_start: float = 0.0
    publish_end: float = 0.0
    lag: int = 0


def simulate(groups: int = 6, generation: float = 8.0,
             update_publish: float = 5.0, max_lag: int = 1) -> list[Group]:
    """Event-driven implementation, independent of the browser recurrence."""
    if not isinstance(groups, int) or not 1 <= groups <= 128:
        raise ValueError("groups must be an integer between 1 and 128")
    if not isinstance(max_lag, int) or not 0 <= max_lag <= 128:
        raise ValueError("max_lag must be an integer between 0 and 128")
    if not all(math.isfinite(t) and t > 0 for t in (generation, update_publish)):
        raise ValueError("both stage durations must be finite and positive")

    clock = 0.0
    published = 0
    records: list[Group] = []
    ready: list[Group] = []
    actor: Group | None = None
    learner: Group | None = None

    while published < groups:
        # Commit completed events first. Future launches see the published version.
        if learner is not None and learner.publish_end <= clock:
            published += 1
            learner = None
        if actor is not None and actor.actor_end <= clock:
            ready.append(actor)
            actor = None

        if learner is None and ready:
            learner = ready.pop(0)
            learner.learner_start = clock
            learner.publish_end = clock + update_publish
            learner.lag = published - learner.behavior_version
            assert 0 <= learner.lag <= max_lag

        if actor is None and len(records) < groups and len(records) - published <= max_lag:
            actor = Group(len(records), published, clock, clock + generation)
            records.append(actor)

        events = ([actor.actor_end] if actor else []) + ([learner.publish_end] if learner else [])
        if events:
            clock = min(events)
        elif published < groups:
            raise RuntimeError("invalid schedule deadlock")
    return records


def clipped_surrogate(behavior: float, current: float, advantage: float, epsilon: float = 0.2) -> float:
    """One observed action; a maximization objective, not a complete PPO loss."""
    if not all(math.isfinite(p) and 0 < p <= 1 for p in (behavior, current)):
        raise ValueError("probabilities must be finite and in (0, 1]")
    if not math.isfinite(advantage) or not math.isfinite(epsilon) or not 0 <= epsilon < 1:
        raise ValueError("invalid advantage or clip width")
    ratio = current / behavior
    if not math.isfinite(ratio):
        raise ValueError("ratio exceeds the reference's numeric range")
    return min(ratio * advantage, min(1 + epsilon, max(1 - epsilon, ratio)) * advantage)


class ScheduleTests(unittest.TestCase):
    def test_default_timeline(self):
        rows = simulate()
        self.assertEqual([g.actor_start for g in rows], [0, 8, 16, 24, 32, 40])
        self.assertEqual(rows[-1].publish_end, 53)
        self.assertEqual([g.lag for g in rows], [0, 1, 1, 1, 1, 1])

    def test_sync_and_bottleneck_shift(self):
        self.assertEqual(simulate(max_lag=0)[-1].publish_end, 78)
        self.assertEqual(simulate(generation=4)[-1].publish_end, 34)
        self.assertEqual(simulate(generation=4, max_lag=4)[-1].publish_end, 34)
        self.assertGreater(max(g.lag for g in simulate(generation=4, max_lag=4)), 1)

    def test_publication_wins_ties(self):
        rows = simulate(generation=2, update_publish=2, max_lag=4)
        self.assertEqual([g.behavior_version for g in rows], [0, 0, 1, 2, 3, 4])

    def test_invariants(self):
        for generation in (1.0, 2.5, 8.0, 19.0):
            for update in (1.0, 5.0, 17.5):
                for lag in (0, 1, 2, 5):
                    rows = simulate(10, generation, update, lag)
                    ideal = generation + update + 9 * max(generation, update)
                    self.assertGreaterEqual(rows[-1].publish_end + 1e-9, ideal)
                    for i, row in enumerate(rows):
                        self.assertLessEqual(row.lag, lag)
                        self.assertEqual(row.index - row.behavior_version, row.lag)
                        self.assertGreaterEqual(row.learner_start, row.actor_end)
                        if i:
                            self.assertGreaterEqual(row.actor_start, rows[i - 1].actor_end)
                            self.assertGreaterEqual(row.learner_start, rows[i - 1].publish_end)

    def test_both_advantage_signs(self):
        self.assertAlmostEqual(clipped_surrogate(0.2, 0.3, 2), 2.4)
        self.assertAlmostEqual(clipped_surrogate(0.2, 0.3, -2), -3)
        self.assertAlmostEqual(clipped_surrogate(0.4, 0.2, -2), -1.6)
        self.assertAlmostEqual(clipped_surrogate(0.4, 0.2, 2), 1)

    def test_invalid_inputs(self):
        for kwargs in ({"groups": 0}, {"groups": 1.5}, {"max_lag": -1},
                       {"generation": float("nan")}, {"update_publish": 0}):
            with self.assertRaises(ValueError):
                simulate(**kwargs)
        with self.assertRaises(ValueError):
            clipped_surrogate(0, 0.2, 1)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--self-test", action="store_true")
    parser.add_argument("--lag", type=int, default=1)
    parser.add_argument("--decode-speedup", type=float, default=1.0)
    parser.add_argument("--train-seconds", type=float, default=4.0)
    args = parser.parse_args()
    if args.self_test:
        suite = unittest.defaultTestLoader.loadTestsFromTestCase(ScheduleTests)
        result = unittest.TextTestRunner(verbosity=2).run(suite)
        raise SystemExit(not result.wasSuccessful())
    if not math.isfinite(args.decode_speedup) or args.decode_speedup <= 0:
        parser.error("--decode-speedup must be finite and positive")
    if not math.isfinite(args.train_seconds) or args.train_seconds < 0:
        parser.error("--train-seconds must be finite and nonnegative")
    generation = 1 + 6 / args.decode_speedup + 1
    try:
        records = simulate(generation=generation, update_publish=args.train_seconds + 1, max_lag=args.lag)
    except ValueError as error:
        parser.error(str(error))
    print("group  behavior  generate+score  train+publish  lag")
    for g in records:
        print(f"G{g.index:<5} v{g.behavior_version:<8} {g.actor_start:5.1f}–{g.actor_end:<5.1f}"
              f"    {g.learner_start:5.1f}–{g.publish_end:<5.1f}   {g.lag}")
    print(f"Completion: {records[-1].publish_end:.1f} declared seconds; not a runtime measurement.")


if __name__ == "__main__":
    main()
