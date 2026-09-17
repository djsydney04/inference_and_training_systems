import unittest
from dataclasses import replace
from kv_handoff import Manifest, Handoff


class HandoffTests(unittest.TestCase):
    def setUp(self):
        self.manifest = Manifest("r", 2, "weights-A", "BF16", (1, 2, 3, 4), 5)
        self.handoff = Handoff(self.manifest, self.manifest, 4)

    def test_out_of_order_and_repeated_chunks_publish_once_complete(self):
        h = self.handoff
        h.receive("r", 2, 2, (30, 40))
        with self.assertRaises(ValueError):
            h.commit()
        with self.assertRaises(ValueError):
            h.acknowledge("r", 2)
        self.assertTrue(h.source_pinned)
        h.receive("r", 2, 2, (30, 40))
        h.receive("r", 2, 0, (10, 20))
        cache, pending = h.commit()
        self.assertEqual(cache, (10, 20, 30, 40))
        self.assertEqual(pending, 5)
        self.assertEqual(len(cache), 4)  # token 5 is not yet in the cache
        h.acknowledge("r", 2)
        self.assertFalse(h.source_pinned)

    def test_conflicting_write_is_atomic(self):
        h = self.handoff
        h.receive("r", 2, 1, (20,))
        before = h.slots.copy()
        with self.assertRaises(ValueError):
            h.receive("r", 2, 0, (10, 999))
        self.assertEqual(h.slots, before)

    def test_wrong_identity_or_no_credit_cannot_admit(self):
        for changed in [replace(self.manifest, checkpoint="weights-B"), replace(self.manifest, epoch=3),
                        replace(self.manifest, layout="FP8"), replace(self.manifest, prefix=(4, 3, 2, 1))]:
            with self.assertRaises(ValueError):
                Handoff(changed, self.manifest, 4)
        with self.assertRaises(ValueError):
            Handoff(self.manifest, self.manifest, 3)

    def test_stale_attempt_cancellation_and_early_ack_are_rejected(self):
        h = self.handoff
        with self.assertRaises(ValueError):
            h.receive("r", 1, 0, (10,))
        with self.assertRaises(ValueError):
            h.receive("another-request", 2, 0, (10,))
        h.cancel_after_transport_drained()
        with self.assertRaises(ValueError):
            h.receive("r", 2, 0, (10,))
        with self.assertRaises(ValueError):
            h.commit()
        self.assertEqual(h.slots, [])


if __name__ == "__main__":
    unittest.main()
