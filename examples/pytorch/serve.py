"""Local JSON server for the trained byte decoder; one bounded CPU worker.

This is a transparent cache/generation exercise, not a production serving engine.
Only loopback is bound. /generate returns the whole response, not token streaming.
"""
import argparse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import threading
import time
import torch
from train import load_model


def make_server(model, port=8091):
    slot = threading.BoundedSemaphore(1)

    class Handler(BaseHTTPRequestHandler):
        def respond(self, status, data):
            body = json.dumps(data).encode()
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self):
            self.respond(200 if self.path == "/health" else 404,
                         {"status": "ready"} if self.path == "/health" else {"error": "not found"})

        def do_POST(self):
            if self.path != "/generate":
                return self.respond(404, {"error": "not found"})
            try:
                size = int(self.headers.get("Content-Length", "0"))
                if size < 1 or size > 8192:
                    raise ValueError("body must be 1..8192 bytes")
                self.connection.settimeout(5)
                request = json.loads(self.rfile.read(size))
                if not isinstance(request, dict) or not isinstance(request.get("prompt"), str):
                    raise ValueError("prompt must be a string")
                prompt = list(request["prompt"].encode("utf-8"))
                count = request.get("max_new_tokens", 32)
                if type(count) is not int or not 1 <= count <= 64:
                    raise ValueError("max_new_tokens must be 1..64")
                if not prompt or len(prompt) + count > model.config.context:
                    raise ValueError("nonempty prompt plus output must fit context in bytes")
            except (ValueError, TypeError, OSError) as error:
                return self.respond(400, {"error": str(error)})
            if not slot.acquire(blocking=False):
                return self.respond(503, {"error": "worker busy; retry with backoff"})
            try:
                start = time.perf_counter()
                tokens = torch.tensor([prompt], dtype=torch.long)
                result = model.generate(tokens, count)
                elapsed = time.perf_counter() - start
                generated = result[0, len(prompt):].tolist()
                self.respond(200, dict(text=bytes(generated).decode("utf-8", errors="replace"),
                                      output_byte_ids=generated, input_tokens=len(prompt),
                                      output_tokens=count, generation_seconds=elapsed))
            finally:
                slot.release()

        def log_message(self, *_):
            pass

    return ThreadingHTTPServer(("127.0.0.1", port), Handler)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--checkpoint", default="checkpoints/byte-decoder.pt")
    parser.add_argument("--port", type=int, default=8091)
    args = parser.parse_args()
    torch.set_num_threads(1)
    server = make_server(load_model(args.checkpoint), args.port)
    print(f"Local byte decoder: http://127.0.0.1:{args.port}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
