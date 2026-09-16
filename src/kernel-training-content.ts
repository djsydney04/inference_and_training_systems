import { sourceLink as ref, workedCheck as check, escapeCode } from "./lesson-template";
import python from "../examples/cuda/torch_rmsnorm.py?raw";
import binding from "../examples/cuda/torch_rmsnorm.cpp?raw";
import kernel from "../examples/cuda/torch_rmsnorm.cu?raw";

const listing = (title: string, text: string) => `<details class="lesson-code"><summary>${title}</summary><pre><code>${escapeCode(text)}</code></pre></details>`;

export const kernelTrainingLesson = `
<section class="lesson" id="cuda-framework-training" data-lesson="Custom kernels in training">
<header><span>Connect the kernel to the model</span><h3>Your backward kernel must teach the preceding layer too</h3></header>
<p>A CUDA executable proves one computation in isolation. A trainable operation must also accept framework-owned tensors, preserve values needed by differentiation, return derivatives for its inputs and parameters, and respect the framework's execution order. This companion puts custom RMSNorm between two learned linear layers, then compares complete AdamW updates with an otherwise identical native PyTorch network.</p>
<figure class="textbook-lab cuda-lab"><figcaption><span>Figure K.6 · implementation bridge</span><strong>Follow both directions through one trainable operation</strong></figcaption><div class="cuda-pipeline" role="img" aria-label="Forward: learned input projection, custom RMSNorm, output projection and loss. Backward returns through output projection, custom input and weight derivatives, then input projection before AdamW updates all parameters."><span>Input projection<br>learned weights</span><b>→</b><span>Custom RMSNorm<br>CUDA forward + saved state</span><b>→</b><span>Output projection<br>loss</span></div><p><strong>Backward:</strong> loss derivative → output projection → RMSNorm input/scale derivatives → input projection. <strong>Update:</strong> AdamW consumes the accumulated parameter gradients.</p><p class="figure-boundary">The CPU mode checks analytical differentiation and integration. The separate CUDA mode compiles and executes the GPU kernels; no GPU result is inferred from a CPU pass.</p></figure>

<h4>Write the mathematical contract before the binding</h4>
<p>For one row of width D, let <code>r = (Σⱼxⱼ²/D + ε)<sup>−1/2</sup></code> and <code>yⱼ = xⱼ r wⱼ</code>. If the upstream derivative is g, then <code>dxⱼ = r gⱼ wⱼ − xⱼ r³(Σₖgₖwₖxₖ)/D</code>. The shared scale gradient is <code>dwⱼ = Σrows gⱼxⱼr</code>. The row reduction in dx and the cross-row reduction in dw have different owners. Returning correct dw while losing dx would stop learning in earlier layers.</p>
<p>The raw extension accepts nonempty contiguous FP32 <code>x[rows,D]</code> and <code>w[D]</code> on one CUDA device. The module reshapes contiguous leading batch/token dimensions into rows. It rejects unsupported inputs. Finite, reasonably scaled values are assumed; squaring extremely large finite FP32 values can overflow. The explicit contract avoids silently interpreting a transposed view as contiguous storage.</p>

<h4>Keep tensor ownership inside the framework</h4>
<p>The C++ binding exposes forward and backward functions. Their CUDA host wrappers check metadata before using pointers, guard the input device, allocate outputs through ATen, and use <code>c10::cuda::getCurrentCUDAStream</code>. No tensor pointer is freed with <code>cudaFree</code>. A device pointer identifies storage; its owning tensor and allocator control that storage's lifetime.</p>
${ref("https://github.com/pytorch/pytorch/blob/v2.8.0/c10/cuda/CUDAStream.h", "PyTorch 2.8 source: current CUDA stream")}
${ref("https://github.com/pytorch/pytorch/blob/v2.8.0/c10/cuda/CUDAGuard.h", "PyTorch 2.8 source: device guard")}
<p>Launching onto stream zero would be wrong when the preceding projection runs on a different current stream. Same-stream order preserves the dependency. Moving tensors between streams also needs producer/consumer synchronization and allocator-lifetime handling. This extension creates no private side stream. Its launch checks detect launch errors without a device-wide wait; the harness synchronizes before declaring completion.</p>
${ref("https://docs.pytorch.org/docs/2.8/notes/cuda.html", "PyTorch 2.8: streams, backward execution and allocator semantics")}

<h4>Connect an explicit derivative to autograd</h4>
<p>The custom <code>autograd.Function</code> saves x, w and the row inverse RMS with <code>save_for_backward</code>. Its backward receives the derivative of the loss with respect to y and returns derivatives in forward-argument order. Epsilon and the backend selector receive <code>None</code>. The wrapper makes an explicit contiguous copy of a strided or broadcast upstream gradient before passing it to the raw kernel.</p>
<p><code>once_differentiable</code> marks the first-order boundary: an implementation of dx does not automatically implement derivatives of dx. Saved-tensor version checks detect in-place changes that invalidate backward. An <code>nn.Module</code> owns the learnable scale as an <code>nn.Parameter</code>; an optimizer discovers that parameter through the module. These pieces connect storage, derivative bookkeeping and update state.</p>
${ref("https://docs.pytorch.org/docs/2.8/notes/extending.html", "PyTorch 2.8: custom functions, saved tensors and double-backward declarations")}

<h4>Run a controlled training comparison</h4>
<div class="lesson-code"><pre><code>python examples/cuda/torch_rmsnorm.py --device cpu
# On a compatible CUDA/PyTorch system with NVCC, C++ compiler and Ninja:
MAX_JOBS=1 python examples/cuda/torch_rmsnorm.py --device cuda</code></pre></div>
<p>The CPU route checks an analytical backward against native autograd and FP64 finite differences. The CUDA route builds the separate extension lazily and tests on a non-default stream. Extension compilation needs the toolkit and compatible host compiler; a runtime-only installation is insufficient. Keep first-build time separate from repeated operation time.</p>
${ref("https://docs.pytorch.org/docs/2.8/cpp_extension.html", "PyTorch 2.8: JIT extension building, CUDA toolchain and build cache")}
<p>The harness covers odd widths through 4097, zero inputs and noncontiguous upstream gradients. It clones the same network state and compares three updates at widths 7, 33 and 257: outputs, input derivatives, every parameter gradient, updated parameters and AdamW moments/counters. Targets vary across steps; the printed losses establish implementation agreement, not a learning curve or a generalization result.</p>
<p>RMSNorm and LayerNorm are different operations. Replacing the byte decoder's LayerNorm changes its architecture. For a decoder extension, put the same RMSNorm mathematics into both reference and custom branches before comparing them. Then add causal/full-cache equivalence, checkpoint restart, representative batch shapes and complete training-update comparisons to the acceptance criteria.</p>

<h4>Extend the integration contract deliberately</h4>
<p>This eager pybind/function path does not establish support for autocast, forward-mode differentiation, double backward, export or <code>torch.compile</code>. A dispatcher-integrated operator additionally needs an operator schema, backend implementations, fake/meta behavior, an autograd registration and registration checks. Use the framework tutorial for that next layer; a Python-importable extension alone does not supply it.</p>
${ref("https://docs.pytorch.org/tutorials/advanced/cpp_custom_ops.html", "PyTorch: dispatcher registration, fake kernels, autograd and opcheck")}
<p>The weight-gradient kernel sums rows serially per column to give each output one writer. This simplifies correctness but can limit throughput. A staged parallel reduction is a useful next change: first preserve the same full-update tests, then measure large-row workloads and temporary-storage costs. Keep sanitizer results and profiler evidence separate from the analytical CPU checks.</p>
${check("Worked derivative: one row x=(3,4), w=(1,1), g=(1,1), ε=0. What are the two input derivatives?", "For this nonzero mathematical example, r=1/√12.5≈0.282843 and the row dot is 7. Thus dx₀=r−3r³×7/2≈0.045255 and dx₁=r−4r³×7/2≈−0.033941. The cross-channel term matters. The runnable interface requires positive epsilon so zero rows are defined.")}
${check("An implementation matches the loss and scale gradient but the preceding projection's weights never change. What should the test inspect?", "Inspect RMSNorm's returned input derivative, its position in backward's return tuple, the preceding projection's parameter gradients and the optimizer's parameter list. A local weight-gradient check cannot establish gradient flow through the whole graph.")}
${listing("Read the autograd wrapper, module and comparison harness", python)}
${listing("Read the C++ Python binding", binding)}
${listing("Read the framework-aware CUDA extension", kernel)}
</section>`;
