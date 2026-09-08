"""Numerical and resume-contract checks; run with unittest from this directory."""
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

import numpy as np
import tensorflow as tf

from tiny_lm import TinyConfig, TinyDecoderLM
from train_tiny_lm import atomic_manifest, verify_manifest


class TinyLMTests(unittest.TestCase):
    def test_manifest_rejects_corruption_and_incompatible_resume(self):
        config = TinyConfig()
        with tempfile.TemporaryDirectory(prefix="atlas-manifest-") as temporary:
            folder = Path(temporary)
            checkpoint = tf.train.Checkpoint(value=tf.Variable(3.0))
            saved = checkpoint.save(str(folder / "ckpt"))
            atomic_manifest(folder, saved, 1, config, 2, 2)
            self.assertEqual(verify_manifest(folder, config, 2, 2), saved)
            with self.assertRaisesRegex(ValueError, "same model"):
                verify_manifest(folder, config, 4, 2)
            # A newer but uncommitted save must not supersede the manifest.
            checkpoint.save(str(folder / "ckpt"))
            self.assertEqual(verify_manifest(folder, config, 2, 2), saved)
            Path(saved + ".index").write_bytes(b"truncated test checkpoint")
            with self.assertRaisesRegex(ValueError, "checksum mismatch"):
                verify_manifest(folder, config, 2, 2)

    def test_causal_prefix_and_finite_gradients(self):
        tf.keras.utils.set_random_seed(7)
        model = TinyDecoderLM(TinyConfig(width=32, heads=4, layers=1, context_length=8))
        tokens = tf.constant([[1, 2, 3, 4, 5, 6, 7, 8]], dtype=tf.int32)
        altered = tf.constant([[1, 2, 3, 4, 99, 98, 97, 96]], dtype=tf.int32)
        np.testing.assert_allclose(model(tokens).numpy()[:, :4], model(altered).numpy()[:, :4], atol=1e-6)
        with tf.GradientTape() as tape:
            loss = model.next_token_loss(tokens)
        gradients = tape.gradient(loss, model.trainable_variables)
        self.assertTrue(all(gradient is not None for gradient in gradients))
        self.assertTrue(all(np.isfinite(tf.convert_to_tensor(gradient).numpy()).all() for gradient in gradients))

    def test_resumed_training_matches_uninterrupted_training(self):
        script = Path(__file__).with_name("train_tiny_lm.py")
        def run(folder, updates):
            subprocess.run([sys.executable, str(script), "--updates", str(updates), "--batch-size", "2", "--accumulation", "2", "--checkpoint-every", "3", "--checkpoint-dir", str(folder)], check=True, capture_output=True, text=True, env={**os.environ, "TF_CPP_MIN_LOG_LEVEL": "2"})
        with tempfile.TemporaryDirectory(prefix="atlas-resume-") as temporary:
            full, resumed = Path(temporary) / "full", Path(temporary) / "resumed"
            run(full, 8); run(resumed, 3); run(resumed, 8)
            left = tf.train.load_checkpoint(str(full / "ckpt-8"))
            right = tf.train.load_checkpoint(str(resumed / "ckpt-8"))
            compared = 0
            for name in left.get_variable_to_shape_map():
                if name.startswith("save_counter") or name == "_CHECKPOINTABLE_OBJECT_GRAPH":
                    continue
                np.testing.assert_allclose(left.get_tensor(name), right.get_tensor(name), rtol=1e-6, atol=1e-6, err_msg=name)
                compared += 1
            self.assertGreater(compared, 20)


if __name__ == "__main__":
    unittest.main()
