#!/usr/bin/env python3
"""Run one explicit loss/gradient/update contract on CPU, then inspect real graph reuse.

--backend all runs each framework in its own fresh subprocess. PyTorch graph
capture uses an eager backend deliberately: it exercises Dynamo, not Inductor.
No downloads, random starting parameters, datasets, GPU timing or performance claim.
"""
from __future__ import annotations

import argparse
import json
import os
import platform
import subprocess
import sys

from execution_reference import (INPUTS, WEIGHTS, BIAS, TARGETS, MASK,
                                 LEARNING_RATE, reference, cases, check)

os.environ["CUDA_VISIBLE_DEVICES"] = "-1"
os.environ["JAX_PLATFORMS"] = "cpu"
os.environ["KERAS_BACKEND"] = "tensorflow"
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")


def run_torch():
    import torch
    torch.set_num_threads(1)

    def objective(w, b, x, targets, mask, reduction="mean"):
        rows = torch.nn.functional.cross_entropy(x @ w + b, targets, reduction="none")
        total = (rows * mask).sum()
        return total / mask.sum() if reduction == "mean" else total

    def tensors(x, targets, mask):
        return (torch.tensor(WEIGHTS, dtype=torch.float64, requires_grad=True),
                torch.tensor(BIAS, dtype=torch.float64, requires_grad=True),
                torch.tensor(x, dtype=torch.float64), torch.tensor(targets, dtype=torch.int64),
                torch.tensor(mask, dtype=torch.float64))

    def evaluate(args, reduction, function=objective):
        w, b, x, target, mask = args
        optimizer = torch.optim.SGD([w, b], lr=LEARNING_RATE)
        optimizer.zero_grad(set_to_none=True)
        loss = function(w, b, x, target, mask, reduction)
        loss.backward()
        actual = {"loss": loss.item(), "dweights": w.grad.tolist(), "dbias": b.grad.tolist()}
        optimizer.step()
        actual.update(next_weights=w.detach().tolist(), next_bias=b.detach().tolist())
        return actual

    checked = []
    for name, x, targets, mask, reduction in cases():
        expected = reference(x=x, targets=targets, mask=mask, reduction=reduction)
        checked.append({"case": name, "error": check(evaluate(tensors(x, targets, mask), reduction), expected)})

    captures = []
    def backend(graph_module, example_inputs):
        captures.append([node.op for node in graph_module.graph.nodes])
        return graph_module.forward
    compiled = torch.compile(objective, backend=backend, fullgraph=True, dynamic=False)
    # Changing only values/mask reuses the first specialization. A new batch shape is separate.
    graph_checks = []
    for x, targets, mask in ((INPUTS, TARGETS, MASK), (INPUTS, TARGETS, [1., 1., 1.]),
                             (INPUTS * 2, TARGETS * 2, MASK * 2)):
        graph_checks.append(check(evaluate(tensors(x, targets, mask), "mean", compiled),
                                  reference(x=x, targets=targets, mask=mask)))
    return {"backend": "pytorch", "version": torch.__version__, "device": "cpu", "dtype": "float64",
            "checks": checked, "graph_errors": graph_checks, "captured_graphs": len(captures),
            "capture_backend": "graph_module.forward; no Inductor code generation"}


def run_jax():
    import jax
    jax.config.update("jax_enable_x64", True)
    import jax.numpy as jnp

    def objective(params, x, targets, mask, reduction="mean"):
        w, b = params
        logp = jax.nn.log_softmax(x @ w + b, axis=-1)
        rows = -jnp.take_along_axis(logp, targets[:, None], axis=-1)[:, 0]
        total = (rows * mask).sum()
        return total / mask.sum() if reduction == "mean" else total

    def arrays(x, targets, mask):
        return ((jnp.array(WEIGHTS, dtype=jnp.float64), jnp.array(BIAS, dtype=jnp.float64)),
                jnp.array(x, dtype=jnp.float64), jnp.array(targets, dtype=jnp.int32),
                jnp.array(mask, dtype=jnp.float64))

    def evaluate(function, args):
        value, grads = function(*args)
        params = jax.tree.map(lambda p, g: p - LEARNING_RATE * g, args[0], grads)
        # Materialization waits for completion. This program does not benchmark dispatch time.
        return {"loss": float(value), "dweights": grads[0].tolist(), "dbias": grads[1].tolist(),
                "next_weights": params[0].tolist(), "next_bias": params[1].tolist()}

    checked = []
    for name, x, targets, mask, reduction in cases():
        function = jax.value_and_grad(lambda p, a, t, m: objective(p, a, t, m, reduction))
        checked.append({"case": name, "error": check(evaluate(function, arrays(x, targets, mask)),
                        reference(x=x, targets=targets, mask=mask, reduction=reduction))})
    traces = []
    def traced(params, x, targets, mask):
        traces.append(tuple(x.shape))  # Diagnostic Python effect at trace time, not training state.
        return objective(params, x, targets, mask)
    compiled = jax.jit(jax.value_and_grad(traced))
    graph_checks = []
    for x, targets, mask in ((INPUTS, TARGETS, MASK), (INPUTS, TARGETS, [1., 1., 1.]),
                             (INPUTS * 2, TARGETS * 2, MASK * 2)):
        graph_checks.append(check(evaluate(compiled, arrays(x, targets, mask)),
                                  reference(x=x, targets=targets, mask=mask)))
    return {"backend": "jax", "version": jax.__version__, "device": jax.default_backend(), "dtype": "float64",
            "checks": checked, "graph_errors": graph_checks, "python_traces": traces,
            "compilation": "jax.jit(value_and_grad), XLA CPU"}


def run_tensorflow():
    import tensorflow as tf
    import keras
    tf.config.set_visible_devices([], "GPU")
    tf.config.threading.set_inter_op_parallelism_threads(1)
    tf.config.threading.set_intra_op_parallelism_threads(1)

    def objective(w, b, x, targets, mask, reduction="mean"):
        rows = tf.nn.sparse_softmax_cross_entropy_with_logits(labels=targets, logits=x @ w + b)
        total = tf.reduce_sum(rows * mask)
        return total / tf.reduce_sum(mask) if reduction == "mean" else total

    def tensors(x, targets, mask):
        return (tf.Variable(WEIGHTS, dtype=tf.float64), tf.Variable(BIAS, dtype=tf.float64),
                tf.constant(x, dtype=tf.float64), tf.constant(targets, dtype=tf.int32),
                tf.constant(mask, dtype=tf.float64))

    def evaluate(args, reduction, function=objective):
        w, b, x, target, mask = args
        with tf.GradientTape() as tape:
            loss = function(w, b, x, target, mask, reduction)
        dw, db = tape.gradient(loss, [w, b])
        optimizer = keras.optimizers.SGD(learning_rate=LEARNING_RATE)
        optimizer.apply_gradients([(dw, w), (db, b)])
        return {"loss": float(loss), "dweights": dw.numpy().tolist(), "dbias": db.numpy().tolist(),
                "next_weights": w.numpy().tolist(), "next_bias": b.numpy().tolist()}

    checked = []
    for name, x, targets, mask, reduction in cases():
        checked.append({"case": name, "error": check(evaluate(tensors(x, targets, mask), reduction),
                        reference(x=x, targets=targets, mask=mask, reduction=reduction))})
    traces = {"exact": [], "variable_batch": []}
    graph_checks = []
    for mode in traces:
        def traced(w, b, x, targets, mask):
            traces[mode].append(x.shape.as_list())
            return objective(w, b, x, targets, mask)
        signature = [tf.TensorSpec([2, 2], tf.float64), tf.TensorSpec([2], tf.float64),
                     tf.TensorSpec([None, 2], tf.float64), tf.TensorSpec([None], tf.int32),
                     tf.TensorSpec([None], tf.float64)] if mode == "variable_batch" else None
        compiled = tf.function(traced, input_signature=signature, autograph=False, jit_compile=False)
        for x, targets, mask in ((INPUTS, TARGETS, MASK), (INPUTS, TARGETS, [1., 1., 1.]),
                                 (INPUTS * 2, TARGETS * 2, MASK * 2)):
            args = tensors(x, targets, mask)
            # Tensor arguments avoid specializing on a newly-created Variable's resource identity.
            with tf.GradientTape() as tape:
                value = compiled(args[0].read_value(), args[1].read_value(), *args[2:])
            dw, db = tape.gradient(value, args[:2])
            actual = {"loss": float(value), "dweights": dw.numpy().tolist(), "dbias": db.numpy().tolist(),
                      "next_weights": (args[0]-LEARNING_RATE*dw).numpy().tolist(),
                      "next_bias": (args[1]-LEARNING_RATE*db).numpy().tolist()}
            graph_checks.append(check(actual, reference(x=x, targets=targets, mask=mask)))
    layer = keras.layers.Dense(2, dtype="float64")
    layer.build((None, 2))
    layer.set_weights([tf.constant(WEIGHTS, dtype=tf.float64).numpy(), tf.constant(BIAS, dtype=tf.float64).numpy()])
    x, target, mask = tensors(INPUTS, TARGETS, MASK)[2:]
    with tf.GradientTape() as tape:
        loss = tf.reduce_sum(tf.nn.sparse_softmax_cross_entropy_with_logits(labels=target, logits=layer(x)) * mask) / tf.reduce_sum(mask)
    dw, db = tape.gradient(loss, layer.trainable_variables)
    keras.optimizers.SGD(learning_rate=LEARNING_RATE).apply_gradients(zip((dw, db), layer.trainable_variables))
    keras_result = {"loss": float(loss), "dweights": dw.numpy().tolist(), "dbias": db.numpy().tolist(),
                    "next_weights": layer.kernel.numpy().tolist(), "next_bias": layer.bias.numpy().tolist()}
    return {"backend": "tensorflow", "version": tf.__version__, "keras": keras.__version__, "device": "CPU:0", "dtype": "float64",
            "checks": checked, "graph_errors": graph_checks, "python_traces": traces,
            "keras_dense_error": check(keras_result, reference()), "compilation": "tf.function graph; jit_compile=False"}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--backend", choices=("reference", "torch", "jax", "tensorflow", "all"), default="reference")
    args = parser.parse_args()
    if args.backend == "all":
        reports = []
        for backend in ("torch", "jax", "tensorflow"):
            completed = subprocess.run([sys.executable, __file__, "--backend", backend], check=True, capture_output=True, text=True)
            reports.append(json.loads(completed.stdout))
        print(json.dumps(reports, indent=2))
        return
    result = reference() if args.backend == "reference" else {"torch": run_torch, "jax": run_jax, "tensorflow": run_tensorflow}[args.backend]()
    result["python"] = platform.python_version()
    result["architecture"] = platform.machine()
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
