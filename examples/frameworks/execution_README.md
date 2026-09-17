# Framework execution: one numerical contract

Begin with the atlas's `framework-same-update` lesson. This example connects
matrix multiplication, masked cross entropy, reverse-mode differentiation and
one SGD update to PyTorch, JAX and TensorFlow/Keras APIs.

## Files and contract

- `execution_reference.py`: Python standard-library arithmetic, explicit
  derivatives, input validation and recursive numerical comparison.
- `test_execution_reference.py`: independent binary-loss finite differences,
  masked rows, reduction scaling and invalid-input checks.
- `execution_contract.py`: optional CPU framework runners and graph diagnostics.
- `execution_requirements.txt`: pinned optional packages for the runners.

The row-vector convention is `Z = X @ W + b`, with X `[3,2]`, W `[2,2]`,
b `[2]`, targets `[0,1,0]` and mask `[1,1,0]`. All floating arrays use float64;
JAX explicitly enables x64. The mean denominator is the number of valid targets,
not the number of allocated rows. SGD uses learning rate 0.125, no momentum and
no weight decay. The binary-exact learning rate also avoids an accidental
float32 learning-rate rounding discrepancy in the Keras optimizer.

The default loss is `0.7668395487183368`. Its weight gradient is approximately
`[[0.632150523,-0.632150523],[-0.563345401,0.563345401]]`. See the browser
workbench or reference JSON for all parameters and intermediate values.

All target IDs must be valid, including excluded rows: each backend computes
sparse cross entropy before masking. The reference rejects an empty valid-target
batch and the browser explicitly skips its update. The framework runner uses
only validated, nonempty cases; it is not a general production loss wrapper.

## Run without framework dependencies

From the repository root:

```sh
python3 examples/frameworks/test_execution_reference.py
python3 examples/frameworks/execution_contract.py --backend reference
node --experimental-strip-types --test tests/framework-execution.test.ts
```

The Python tests compare all six parameter derivatives against central finite
differences of a separately expressed binary cross entropy. The TypeScript tests
also check large common logit shifts, masked-row invariance and the declared
signature-cache model. The cache model is not a measurement of any framework.

## Optional framework execution

Use a native Python 3.11 environment compatible with the selected package
wheels. The pinned packages are teaching versions, not latest-release claims.
Install only the framework you want to exercise, or the full requirements when
the platform and available disk space permit it.

```sh
python3.11 -m venv .venv-frameworks
.venv-frameworks/bin/python -m pip install -r examples/frameworks/execution_requirements.txt
.venv-frameworks/bin/python examples/frameworks/execution_contract.py --backend torch
.venv-frameworks/bin/python examples/frameworks/execution_contract.py --backend jax
.venv-frameworks/bin/python examples/frameworks/execution_contract.py --backend tensorflow
.venv-frameworks/bin/python examples/frameworks/execution_contract.py --backend all
```

`all` launches each backend in a fresh subprocess. Missing packages fail
explicitly; no backend is silently skipped. No Hub model, dataset, or network
download occurs while running the program. Installation is the separate network
step. The runner disables CUDA, selects JAX CPU, and selects Keras's TensorFlow
backend before imports. Apple Silicon users launching a universal Python from
an Intel terminal may need `arch -arm64` before the interpreter.

Every backend checks masked mean, masked sum, all targets included, only the
last target included, and a duplicated batch. It compares loss, all weight/bias
gradients, and all updated weights/biases against the scalar reference using
absolute and relative tolerance `1e-10`; this is numerical agreement, not a
bitwise-equality contract.

## Actual execution evidence — September 16, 2026

Executed with native arm64 Python 3.11.5 on the development Mac, CPU float64:

| Path | Actual result | Graph evidence |
| --- | --- | --- |
| PyTorch 2.8.0 | Five cases passed; maximum absolute error `2.220446049250313e-16` | Three graph calls passed; two Dynamo captures |
| JAX / jaxlib 0.6.2 | Five cases passed; maximum absolute error `2.220446049250313e-16` | Three graph calls passed; Python trace shapes `[3,2]`, `[6,2]` |
| TensorFlow 2.20.0 / Keras 3.11.3 | **Not executed** | Temporary installation exhausted available disk; the incomplete TensorFlow package was removed |
| Python reference tests | Three tests passed | Independent finite-difference and mask checks |
| TypeScript contract tests | Six tests passed | Independent derivatives, invariances and declared cache policy |

The PyTorch graph path uses `torch.compile(..., fullgraph=True, dynamic=False)`
with a custom backend returning `graph_module.forward`. It tests Dynamo capture
and gradients through captured work, **not Inductor code generation**. A changed
mask reuses the first shape specialization; a doubled batch creates a second.
Gradients and updates also match the reference on these calls.

The JAX path compiles `jax.jit(jax.value_and_grad(...))` with XLA CPU. Its
trace-time list append is an intentional diagnostic effect, not persistent
training state. Converting results to Python values waits for completion. No
execution time is measured.

The unexecuted TensorFlow path compares exact signatures with a variable-batch
`TensorSpec([None,2], float64)`, uses `autograph=False, jit_compile=False`, and
checks gradients through each graph call. It also includes a Keras Dense + SGD
check. Expected counts for its three calls are two exact traces and one
variable-batch trace; these are expectations until that path is run successfully.

None of these checks validates CUDA execution, distributed training, asynchronous
timing, mixed precision, Adam state, compiler speedups or model quality. They are
a small contract to establish before adding those dimensions.

## Primary sources

Sources were checked September 16, 2026. Documentation editions may differ from
the explicitly recorded runtime versions above.

- [PyTorch 2.14 autograd mechanics](https://docs.pytorch.org/docs/2.14/notes/autograd.html)
- [PyTorch 2.14 graph breaks](https://docs.pytorch.org/docs/2.14/user_guide/torch_compiler/compile/programming_model.graph_breaks_index.html)
- [PyTorch 2.14 recompilation and guards](https://docs.pytorch.org/docs/2.14/user_guide/torch_compiler/compile/programming_model.recompilation.html)
- [JAX automatic differentiation](https://docs.jax.dev/en/latest/automatic-differentiation.html)
- [JAX JIT and tracing](https://docs.jax.dev/en/latest/jit-compilation.html)
- [TensorFlow automatic differentiation](https://www.tensorflow.org/guide/autodiff)
- [TensorFlow function tracing and signatures](https://www.tensorflow.org/guide/function)
- [Keras 3 portability and state](https://keras.io/guides/migrating_to_keras_3/)
- [Flax NNX modules and state](https://flax.readthedocs.io/en/latest/why.html)
- [Optax transformations and optimizer state](https://optax.readthedocs.io/en/latest/getting_started.html)
