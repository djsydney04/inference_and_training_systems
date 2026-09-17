import copy
import json
from pathlib import Path
import unittest

from trace_metrics import summarize


class TraceTests(unittest.TestCase):
    def setUp(self):
        self.data = json.loads(Path(__file__).with_name("example-trace.json").read_text())

    def test_worked_cohort_and_gap_counterexample(self):
        r = summarize(self.data)
        self.assertEqual((r["offered"], r["completed"], r["compliant"], r["failed"]), (4, 3, 2, 1))
        self.assertEqual((r["throughput_rps"], r["goodput_rps"], r["attainment"]), (3, 2, .5))
        a, b, c, d = r["requests"]
        self.assertEqual((a["tpot_ms"], b["tpot_ms"]), (20, 20))
        self.assertEqual((a["max_gap_ms"], b["max_gap_ms"]), (20, 80))
        self.assertEqual(a["client_queue_ms"], 20)
        self.assertIsNone(c["tpot_ms"])
        self.assertFalse(d["compliant"])

    def test_time_translation_and_observation_window(self):
        moved = copy.deepcopy(self.data)
        moved["window_ms"] = [500, 1500]
        for t in moved["requests"]:
            for key in ("arrival_ms", "sent_ms", "terminal_ms"):
                t[key] += 500
            t["token_receipts_ms"] = [v + 500 for v in t["token_receipts_ms"]]
        self.assertEqual(summarize(moved), summarize(self.data))
        moved["window_ms"][1] = 2500
        self.assertEqual(summarize(moved)["goodput_rps"], 1)

    def test_buffering_moves_latency_instead_of_speeding_completion(self):
        self.data["requests"][1]["token_receipts_ms"] = [180, 184, 188, 192, 196, 200]
        b = summarize(self.data)["requests"][1]
        self.assertEqual((b["ttft_ms"], b["max_gap_ms"], b["completion_ms"]), (180, 4, 250))
        self.assertFalse(b["compliant"])

    def test_failures_cancellation_empty_and_single_token(self):
        self.data["requests"][0].update(status="cancelled", token_receipts_ms=[])
        r = summarize(self.data)
        self.assertEqual((r["cancelled"], r["offered"], r["compliant"]), (1, 4, 1))
        self.data["requests"] = []
        self.assertEqual(summarize(self.data)["goodput_rps"], 0)
        self.assertIsNone(summarize(self.data)["attainment"])

    def test_reject_ambiguous_and_invalid_traces(self):
        mutations = [
            lambda d: d["requests"].append(copy.deepcopy(d["requests"][0])),
            lambda d: d["requests"][0].update(token_receipts_ms=[120, 100]),
            lambda d: d["requests"][0].update(token_receipts_ms=[]),
            lambda d: d["requests"][0].update(sent_ms=-1),
            lambda d: d["requests"][0].update(terminal_ms=1100),
            lambda d: d["objective_ms"].update(ttft=float("nan")),
        ]
        for mutate in mutations:
            changed = copy.deepcopy(self.data)
            mutate(changed)
            with self.assertRaises(ValueError):
                summarize(changed)


if __name__ == "__main__":
    unittest.main()
