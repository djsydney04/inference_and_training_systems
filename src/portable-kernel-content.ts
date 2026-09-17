import { chapterMarkup, sourceLink as ref, workedCheck as check, escapeCode } from "./lesson-template";
import { portableKernelLab } from "./portable-kernel-lab";
import matmulSource from "../examples/portable-kernels/matmul.cpp?raw";

const code=(title:string,text:string)=>`<div class="lesson-code"><div><h4>${title}</h4></div><pre><code>${escapeCode(text)}</code></pre></div>`;

export const portableKernelChapter=chapterMarkup("portable-kernels","Programming across accelerators",
  "Hold the equation fixed while changing the compiler, execution model and memory path.",`
<section class="lesson" id="portable-matmul-contract" data-lesson="One operation, four backends"><header><span>Start with the software contract</span><h3>Port the operation, then redesign its execution</h3></header>
<p>CUDA is a programming platform for NVIDIA GPUs. HIP is part of AMD's ROCm programming stack; JAX/Pallas and Neuron/NKI expose different ways to express accelerator work. Their hardware details explain why an implementation behaves as it does, but writing, testing and profiling that implementation is software work.</p>
<p>Our common operation is <code>C[M,N] = A[M,K] × B[K,N]</code>. An output tile owns a rectangle of C and accumulates products across K. Each update reads an A tile and a B tile; it must preserve the same output ownership, valid bounds and numerical contract when the backend changes. The workbench models BF16 operands with FP32 partial sums. Its teaching tile sizes are choices, not hardware limits or benchmark winners.</p>
${portableKernelLab}
<p>The software boundary matters at every level: changing a launch API is a source port; changing workgroup layout is a kernel redesign; changing the placement of model shards is a distributed-runtime change. The <a href="#accelerator-atlas">hardware comparison</a> supplies context for these decisions.</p>
${check("Work it out: why does a ragged matrix need more than integer division?","For M = 129 and a 128-row tile, floor division schedules only one tile and drops row 128. Ceiling division schedules two, then a mask or padded storage excludes the 127 invalid rows in the second tile. Repeat the reasoning independently for N and K.")}
</section>

<section class="lesson" id="h100-kernel-example" data-lesson="H100: a Hopper example"><header><span>NVIDIA, before Blackwell and Rubin</span><h3>A CUDA program on H100 has its own execution contract</h3></header>
<p>H100 is an NVIDIA Hopper GPU. It is distinct from the Grace–Blackwell rack and the Vera/Rubin systems discussed elsewhere. Use <code>sm_90</code> for this baseline's H100 compilation target. The H100 SXM product specification lists 80 GB of memory and 3.35 TB/s bandwidth; PCIe and NVL configurations must be identified separately.</p>
${ref("https://www.nvidia.com/en-us/data-center/h100/","NVIDIA H100: SXM and NVL product specifications")}
<p>The companion assigns one C element to each thread in a 16 × 16 block. For <code>[17,19] × [19,13]</code>, its grid contains two blocks, with 512 launched threads but only 221 valid outputs. Bounds checks stop the others before any load or store. This scalar kernel establishes a correctness baseline before tensor-core optimization.</p>
${code("Build and check the H100 correctness baseline",`nvcc -x cu -std=c++17 -O2 -lineinfo -arch=sm_90 -DATLAS_CUDA \\
  examples/portable-kernels/matmul.cpp -o /tmp/atlas-matmul-h100
/tmp/atlas-matmul-h100
compute-sanitizer --tool memcheck --error-exitcode 1 /tmp/atlas-matmul-h100`)}
<h4>Next step: a Hopper tile pipeline</h4><p>Hopper's Tensor Memory Accelerator can stage operands into shared memory. Warpgroup matrix operations coordinate four warps, while completion rules protect operands and accumulated results. A two-buffer schedule can load the next tile while consuming the current one; each buffer must remain live until its readers finish. This is a separate implementation, not a compiler promise for the scalar loop above. Architecture-specific instructions may require a more specific target than the baseline.</p>
${ref("https://docs.nvidia.com/cuda/hopper-tuning-guide/index.html","Hopper tuning: shared memory, asynchronous movement and occupancy")}${ref("https://docs.nvidia.com/cuda/parallel-thread-execution/index.html#asynchronous-warpgroup-level-matrix-instructions","PTX: asynchronous warpgroup matrix instructions and completion rules")}
${check("Worked capacity example: what does 8 billion BF16 weights imply?","At two bytes per weight the raw weights occupy 16 GB. A hypothetical complete sweep at the H100 SXM headline bandwidth takes at least 16 / 3350 seconds, about 4.78 ms. This excludes cache state, metadata, other operators and imperfect bandwidth utilization. It is not a token-latency or throughput prediction.")}
<p><a href="#portable-kernel-workbench">Compare H100's path with the other backends</a> · <a href="#cuda-complete-harness">Continue with CUDA reductions and normalization</a>.</p>
</section>

<section class="lesson" id="mi300x-kernel-example" data-lesson="MI300X: a HIP example"><header><span>AMD ROCm and CDNA 3</span><h3>A source port preserves the equation, not every lane assumption</h3></header>
<p>Compile the same companion for MI300X with HIP and the <code>gfx942</code> target. It uses HIP allocation, launch and error APIs in its AMD build; there is no CUDA binary running through an emulation layer. The 256-thread block spans four 64-lane CDNA 3 wavefronts, compared with eight 32-thread CUDA warps. Query the device rather than treating that width as a constant for all AMD products.</p>
${ref("https://rocm.docs.amd.com/projects/HIP/en/docs-7.0.0/how-to/hip_porting_guide.html","HIP 7.0: source porting, runtime properties and warp-size assumptions")}${ref("https://rocm.docs.amd.com/en/docs-7.2.4/how-to/rocm-for-ai/inference-optimization/workload.html","ROCm 7.2.4: MI300X/CDNA 3 targets, matrix operations and memory")}
${code("Build the same numerical contract for MI300X",`hipcc -x hip -std=c++17 -O2 -g --offload-arch=gfx942 -DATLAS_HIP \\
  examples/portable-kernels/matmul.cpp -o /tmp/atlas-matmul-mi300x
/tmp/atlas-matmul-mi300x`)}
<p>Our baseline has no shuffles, lane masks or cooperative reductions, so every valid thread can compute its result independently. An optimized matrix kernel introduces different obligations: stage reusable operands in LDS, select a matrix-instruction fragment layout, synchronize reuse, and inspect register use. A correct scalar port does not establish a fast matrix-core implementation.</p>
<details class="lesson-code"><summary>Read the complete CUDA / HIP companion and correctness harness</summary><pre><code>${escapeCode(matmulSource)}</code></pre></details>
${code("Check launch coverage locally without a GPU",`clang++ -std=c++17 -O1 -g -fsanitize=address,undefined \\
  examples/portable-kernels/matmul.cpp -o /tmp/atlas-matmul-cpu
/tmp/atlas-matmul-cpu`)}
<p><strong>Execution boundary:</strong> the CPU mode emulates the launch and checks against an FP64 reference. CUDA/HIP compilation, device execution and GPU timing require their target environments. The companion checks singleton, aligned, ragged, mixed-sign and zero-input cases, rejects unwritten/nonfinite outputs, and uses tolerance <code>2e-4 + 2e-4 × |reference|</code>. It does not benchmark either vendor.</p>
${check("Porting trap: what happens to a fixed 32-lane reduction?","A reduction written around 32 lanes may combine only part of a 64-lane wavefront, and a 32-bit active mask cannot represent all its lanes. Choose the correct supported subgroup operation, mask type and reduction ownership, then test values from both halves of the wavefront. API-name replacement alone does not prove the reduction correct.")}
<p><a href="#portable-kernel-workbench">Inspect the MI300X memory path</a>.</p>
</section>
<section class="lesson" id="tpu-kernel-example" data-lesson="TPU: a tile-program example"><header><span>Google JAX, XLA and Pallas</span><h3>Describe array tiles instead of assigning CUDA threads</h3></header>
<p>On TPU, start with a framework matrix product and inspect its compiled behavior. Pallas gives you more direct control over tile ownership and movement between HBM and vector memory (VMEM). A <code>BlockSpec</code> maps program indices to an array block. Those indices are not CUDA thread IDs; the compiler maps the tile computation to the TPU.</p>
${ref("https://docs.jax.dev/en/latest/pallas/tpu/pipelining.html","JAX: TPU HBM, VMEM and pipeline buffer lifetimes")}
<p>For <code>[256,256] × [256,256]</code> with 128 × 128 × 128 tiles, there are four output tiles and two reduction steps each. Tile (row 1, column 0) first accumulates <code>A[128:256,0:128] × B[0:128,0:128]</code>, then <code>A[128:256,128:256] × B[128:256,0:128]</code>. Initialize its accumulator once, before both updates.</p>
${code("Tile mapping pseudocode · not an executable Pallas kernel",`for tile_m, tile_n in output_grid:
    accumulator = zeros([128, 128], float32)
    for tile_k in reduction_grid:
        a_tile = stage_A_in_VMEM(tile_m, tile_k)
        b_tile = stage_B_in_VMEM(tile_k, tile_n)
        accumulator += matrix_product(a_tile, b_tile)
    store_valid_C_region(tile_m, tile_n, accumulator)`)}
<p>An actual Pallas implementation supplies block specifications, output shape, scratch storage and reduction scheduling semantics. The official tutorial develops those steps. For ragged dimensions, define padding or masks explicitly rather than substituting ceiling division into a kernel that assumes full tiles.</p>
${ref("https://docs.jax.dev/en/latest/pallas/tpu/matmul.html","JAX Pallas: executable TPU matrix multiplication and accumulation examples")}
${check("Storage exercise: what fits in one 128 × 128 × 128 tile update?","A and B each contain 16,384 BF16 values, so the pair occupies 64 KiB. The FP32 accumulator occupies another 64 KiB. Double-buffering both operands makes their storage 128 KiB before adding the accumulator and other runtime state. These logical sizes are not a complete VMEM allocation or occupancy proof.")}
<p><a href="#portable-kernel-workbench">Select TPU and follow the two K steps</a>.</p>
</section>

<section class="lesson" id="trainium-kernel-example" data-lesson="Trainium: an NKI example"><header><span>AWS Neuron and explicit engine work</span><h3>The stationary operand changes how you lay out the same matrix</h3></header>
<p>NKI exposes scratch-buffer storage (SBUF), Tensor Engine work and partial-sum storage (PSUM). For the Tensor Engine path here, supply the stationary operand as <code>Aᵀ[K,M]</code> and the moving operand as <code>B[K,N]</code>. Their shared partition axis is K. The engine computes stationary-transpose times moving, returning the intended <code>C[M,N]</code>.</p>
${ref("https://awsdocs-neuron.readthedocs-hosted.com/en/latest/nki/guides/architecture/trainium2_arch.html","Neuron: Trainium2 engine and memory architecture")}
${code("NKI layout pseudocode · not an executable kernel",`stationary[K, M] = transpose(A[M, K])
moving[K, N] = B[K, N]
partial[M, N] = zeros_in_PSUM(float32)
for each K tile:
    s = load_stationary_tile_to_SBUF()
    v = load_moving_tile_to_SBUF()
    partial += engine_matmul(stationary=s, moving=v)  # computes s.T @ v
result = copy_or_cast_to_store_buffer(partial)
store_valid_output(result)`)}
<p>The transpose must be accounted for: a caller may already supply that layout, or the implementation must create it. Merely renaming a buffer does not transpose its data. The Neuron tutorial builds executable kernels around the actual instruction, layout and tile limits; our pseudocode isolates ownership and accumulation.</p>
${ref("https://awsdocs-neuron.readthedocs-hosted.com/en/v2.29.0/nki/guides/tutorials/matrix_multiplication.html","Neuron 2.29: executable NKI matrix multiplication and tile constraints")}
${check("Work the transpose by hand","Let A = [[1,2,3],[4,5,6]] and B = [[1,0],[0,1],[1,1]]. Store stationary = [[1,4],[2,5],[3,6]], shape [3,2]. Its transpose multiplied by B gives [[4,5],[10,11]], shape [2,2]. The numerical answer stays fixed while the engine-facing storage changes.")}
<p><a href="#portable-kernel-workbench">Inspect SBUF and PSUM in the comparison</a>. Use the <a href="#performance">profiling chapter</a> to separate compilation, transfers, kernel execution and completion when you measure a real implementation.</p>
</section>`);
