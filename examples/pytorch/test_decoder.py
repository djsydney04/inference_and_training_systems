import contextlib
import io
import json
from pathlib import Path
import tempfile
import threading
import unittest
from urllib.error import HTTPError
from urllib.request import Request, urlopen
import torch
from tiny_decoder import Config, TinyDecoder
from train import train, load_model, evaluate
from serve import make_server

torch.set_num_threads(1)


class DecoderContracts(unittest.TestCase):
    def setUp(self):
        torch.manual_seed(3)
        self.config = Config(context=32, width=16, heads=2, layers=2)
        self.model = TinyDecoder(self.config).eval()

    def test_causal_prefix_is_unchanged_by_future(self):
        tokens = torch.randint(256, (2, 11))
        changed = tokens.clone()
        changed[:, 6:] = (changed[:, 6:] + 71) % 256
        torch.testing.assert_close(self.model(tokens)[0][:, :6],
                                   self.model(changed)[0][:, :6], rtol=0, atol=0)

    def test_full_attention_equals_prefill_then_chunked_decode(self):
        tokens = torch.randint(256, (2, 13))
        full = self.model(tokens)[0]
        cache, outputs, offset = None, [], 0
        for count in [4, 1, 3, 5]:
            logits, cache = self.model(tokens[:, offset:offset+count], cache)
            outputs.append(logits)
            offset += count
            for k, v in cache:
                self.assertEqual(k.shape, (2, 2, offset, 8))
                self.assertEqual(k.shape, v.shape)
        torch.testing.assert_close(torch.cat(outputs, dim=1), full, rtol=1e-5, atol=1e-6)

    def test_generation_cache_preserves_greedy_outputs(self):
        prompt = torch.tensor([list(b"A token")])
        self.assertTrue(torch.equal(self.model.generate(prompt, 10, True),
                                    self.model.generate(prompt, 10, False)))
        with self.assertRaises(ValueError):
            self.model.generate(prompt, 40)

    def test_inconsistent_cache_lengths_are_rejected(self):
        _, cache = self.model(torch.tensor([[1, 2, 3]]))
        k, v = cache[1]
        cache[1] = (k[:, :, :2], v[:, :, :2])
        with self.assertRaises(ValueError):
            self.model(torch.tensor([[4]]), cache)

    def test_backward_matches_finite_difference(self):
        model = self.model.double()
        tokens = torch.tensor([list(b"A byte.")])
        model.loss(tokens).backward()
        weight = model.blocks[0].attention.qkv.weight
        index = (9, 4)
        gradient = weight.grad[index].item()
        original = weight[index].item()
        epsilon = 1e-5
        with torch.no_grad():
            weight[index] = original + epsilon
            plus = model.loss(tokens).item()
            weight[index] = original - epsilon
            minus = model.loss(tokens).item()
            weight[index] = original
        self.assertAlmostEqual(gradient, (plus-minus)/(2*epsilon), places=7)

    def test_resume_matches_uninterrupted_parameters_optimizer_and_rng(self):
        with tempfile.TemporaryDirectory() as directory, contextlib.redirect_stdout(io.StringIO()):
            first, second = Path(directory)/"full.pt", Path(directory)/"resume.pt"
            train(7, first, config=self.config, length=12, batch=2)
            train(3, second, config=self.config, length=12, batch=2)
            train(7, second, resume=True, config=self.config, length=12, batch=2)
            a, b = [torch.load(p, weights_only=True) for p in (first, second)]
            for name in a["model"]:
                self.assertTrue(torch.equal(a["model"][name], b["model"][name]), name)
            for param, state in a["optimizer"]["state"].items():
                for name, value in state.items():
                    torch.testing.assert_close(value, b["optimizer"]["state"][param][name], rtol=0, atol=0)
            self.assertTrue(torch.equal(a["sampler_rng"], b["sampler_rng"]))
            self.assertTrue(torch.equal(a["torch_rng"], b["torch_rng"]))
            load_model(second)
            with self.assertRaises(ValueError):
                train(8, second, resume=True, corpus="different text "*20,
                      config=self.config, length=12, batch=2)

    def test_can_overfit_a_tiny_debugging_corpus(self):
        with contextlib.redirect_stdout(io.StringIO()):
            _, _, losses = train(45, corpus="abc abc abc abc "*16,
                                  config=self.config, length=12, batch=4)
        self.assertLess(sum(losses[-5:])/5, losses[0]*0.45)

    def test_validation_counts_tail_tokens_once_and_restores_training_mode(self):
        self.model.train()
        text = "A small held-out sentence."
        result = evaluate(self.model, text, length=7)
        self.assertEqual(result["target_tokens"], len(text.encode())-1)
        self.assertTrue(self.model.training)
        data = torch.tensor([list(text.encode())])
        nll = 0.0
        with torch.no_grad():
            for start in range(0, data.shape[1]-1, 7):
                sequence = data[:, start:start+8]
                logits, _ = self.model(sequence[:, :-1])
                logp = logits.log_softmax(-1)
                nll -= logp.gather(-1, sequence[:, 1:, None]).sum().item()
        self.assertAlmostEqual(result["loss"], nll/result["target_tokens"], places=6)

    def test_http_generation_and_invalid_request(self):
        server = make_server(self.model, port=0)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        base = f"http://127.0.0.1:{server.server_port}"
        try:
            with urlopen(base+"/health", timeout=5) as response:
                self.assertEqual(json.load(response)["status"], "ready")
            def request(data):
                return urlopen(Request(base+"/generate", json.dumps(data).encode(),
                                       {"Content-Type": "application/json"}), timeout=10)
            with request({"prompt": "A", "max_new_tokens": 4}) as response:
                result = json.load(response)
                self.assertEqual(result["output_tokens"], 4)
                self.assertEqual(len(result["output_byte_ids"]), 4)
            for invalid in [{"prompt": ""}, {"prompt": "A", "max_new_tokens": True}, []]:
                with self.assertRaises(HTTPError) as error:
                    request(invalid)
                self.assertEqual(error.exception.code, 400)
                error.exception.close()
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=5)

    def test_busy_worker_returns_503_and_releases_after_completion(self):
        entered, release = threading.Event(), threading.Event()
        model = self.model
        original = model.generate
        def slow_generate(*args, **kwargs):
            entered.set()
            if not release.wait(timeout=10):
                raise RuntimeError("test did not release worker")
            return original(*args, **kwargs)
        model.generate = slow_generate
        server = make_server(model, port=0)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        url = f"http://127.0.0.1:{server.server_port}/generate"
        def request():
            return urlopen(Request(url, b'{"prompt":"A","max_new_tokens":1}',
                                   {"Content-Type": "application/json"}), timeout=10)
        results = []
        def first_request():
            try:
                with request() as response:
                    results.append(response.status)
            except Exception as error:
                results.append(error)
        client = threading.Thread(target=first_request, daemon=True)
        client.start()
        try:
            self.assertTrue(entered.wait(timeout=5))
            with self.assertRaises(HTTPError) as error:
                request()
            self.assertEqual(error.exception.code, 503)
            error.exception.close()
            release.set()
            client.join(timeout=10)
            self.assertEqual(results, [200])
            with request() as response:
                self.assertEqual(response.status, 200)
        finally:
            release.set()
            client.join(timeout=10)
            server.shutdown()
            server.server_close()
            thread.join(timeout=5)


if __name__ == "__main__":
    unittest.main()
