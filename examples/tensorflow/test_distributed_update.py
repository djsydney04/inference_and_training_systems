"""Isolate TF device configuration from the rest of the companion suite."""

import json
from pathlib import Path
import subprocess
import sys
import unittest


class DistributedUpdateTests(unittest.TestCase):
    def test_real_two_replica_updates_match_reference(self):
        run = subprocess.run(
            [sys.executable, str(Path(__file__).with_name("distributed_update.py"))],
            capture_output=True, text=True, timeout=90, check=True,
        )
        report = json.loads(run.stdout)
        self.assertEqual(report["replicas"], 2)
        self.assertEqual(report["updates"], 4)
        self.assertEqual(report["global_valid_targets"], 11)
        for metric in ("max_gradient_error", "max_weight_error", "max_optimizer_error"):
            self.assertLess(report[metric], 2e-7)


if __name__ == "__main__":
    unittest.main()
