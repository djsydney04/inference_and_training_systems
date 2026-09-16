# Hardware and frontier source audit

Audited: 2026-09-14. Scope: `src/accelerator-content.ts`, `src/frontier-content.ts`, and the existing Kimi/GLM claims called out below. This is a claim audit of selected public primary sources, not a complete survey of every accelerator or model. Vendor specifications and author benchmarks have not been reproduced on their hardware.

## How claims are presented

- Each device number identifies its local-memory boundary, source unit and evidence type. GB and GiB are not silently treated as interchangeable.
- “Peak” means a published hardware limit. The chapters do not rank mixed dense/sparse or FP4/BF16 compute specifications.
- New architecture disclosure, a published platform manual, and an explicit general-availability announcement are different evidence.
- Workload-fit advice follows from explicit storage/traffic/dependency budgets and is a teaching inference, not a product benchmark.
- The worked model is fictional: 70B parameters, 80 layers, 8 KV heads and dimension 128. Its arithmetic does not assert the architecture or quality of a particular model checkpoint.
- Numerical reference code and estimates are original. Drawings are original SVGs with title/description alternatives; no published figure was copied.
- Main-branch configurations and rolling documentation can change. This audit records the observed fields and date; it does not claim they are pinned releases.

## Hardware evidence

| Source | Observed support | Treatment |
|---|---|---|
| [NVIDIA HGX reference components](https://docs.nvidia.com/enterprise-reference-architectures/hgx-ai-factory/latest/components.html) | H200 SXM 141 GB/4.8 TB/s; B200 SXM 180 GB/up to 8 TB/s; B300 SXM 288 GB/up to 8 TB/s; B300 eight-GPU aggregate about 2.30 TB | Specific deployed SXM platform units, not generic Blackwell die capacity |
| [DGX B300 user guide](https://docs.nvidia.com/dgx/dgxb300-user-guide/introduction-to-dgxb300.html) | Eight B300 GPUs and 288 GB per GPU | Supporting platform evidence; no live inventory claim |
| [Rubin architecture, July 21, 2026](https://developer.nvidia.com/blog/inside-nvidia-rubin-gpu-architecture-powering-the-era-of-agentic-ai/) | Up to 288 GB HBM4, 22 TB/s per GPU | Dated vendor disclosure; no extrapolated measured application speedup |
| [Rubin launch statement](https://nvidianews.nvidia.com/_gallery/download_pdf/695c39b23d633240d175d8e6/) | Production claim and partner availability starting second half 2026 | Does not establish a specific available cloud instance |
| [ROCm 7.2.4 workload guide](https://rocm.docs.amd.com/en/docs-7.2.4/how-to/rocm-for-ai/inference-optimization/workload.html) | MI300X 192 GB/5.3 TB/s; MI325X 256 GB/6 TB/s; MI350X/MI355X 288 GB/8 TB/s; CDNA3 FNUZ versus CDNA4 OCP/MX | Preserve page's GB units; note other AMD architecture tables say GiB |
| [AMD architecture specifications](https://rocm.docs.amd.com/en/docs-7.0.1/reference/gpu-arch-specs.html) | CDNA wavefront 64, capacities labeled GiB | Supports the programming-model portability boundary and unit caveat |
| [AMD CDNA4 whitepaper](https://www.amd.com/content/dam/amd/en/documents/instinct-tech-docs/white-papers/amd-cdna-4-architecture-whitepaper.pdf) | MI350X/MI355X have different power/cooling configurations | No assumption that shared capacity implies identical platform |
| [Cloud TPU7x](https://docs.cloud.google.com/tpu/docs/tpu7x) | v5p 95 GiB/2765 GBps; v6e 32 GiB/1638 GBps; TPU7x 192 GiB/7380 GBps; 9216-chip pod; JAX/PyTorch supported, TensorFlow unsupported | Deployment documentation checked directly; pod aggregate is not local chip memory |
| [Trainium 2 architecture](https://awsdocs-neuron.readthedocs-hosted.com/en/v2.31.1/about-neuron/arch/neuron-hardware/trainium2.html) | 96 GiB, 2.9 TB/s, 8 NeuronCore-v3 | Headline architecture specification |
| [Trainium 3 architecture](https://awsdocs-neuron.readthedocs-hosted.com/en/latest/about-neuron/arch/neuron-hardware/trainium3.html) | 144 GiB, 4.9 TB/s, 8 NeuronCore-v4, 2.56 TB/s NeuronLink | Headline value used; see discrepancy below |
| [Trainium 3 NKI architecture](https://awsdocs-neuron.readthedocs-hosted.com/en/latest/nki/guides/architecture/trainium3_arch.html) | 144 GiB, 4.7 TB/s; SBUF/PSUM engine layout | Conflicts with 4.9 TB/s headline. Both values explicitly noted; disputed communication-core count omitted |
| [Trn 3 general availability, Dec 2, 2025](https://aws.amazon.com/about-aws/whats-new/2025/12/amazon-ec2-trn3-ultraservers/) | Explicit GA announcement; up to 144-chip UltraServer | GA family evidence, not regional quota or on-demand availability |
| [Intel Gaudi 3 deployment guide](https://community.intel.com/t5/Blogs/Tech-Innovation/Artificial-Intelligence-AI/Deploying-Llama-4-Scout-and-Maverick-Models-on-Intel-Gaudi-3/post/1699547) | 128 GB HBM2e, 3.7 TB/s, 8 MMEs, 64 TPCs | Intel-authored explanation |
| [Intel Gaudi 3 launch](https://www.intel.com/content/www/us/en/newsroom/news/next-generation-ai-solutions-xeon-6-gaudi-3.html) | 24×200 Gb Ethernet and compute-engine counts | Port aggregate does not establish full bandwidth to each peer |
| [Groq ISCA2022 paper](https://groq.com/wp-content/uploads/2023/05/GroqISCAPaper2022_ASoftwareDefinedTensorStreamingMultiprocessorForLargeScaleMachineLearning-1.pdf) | 220 MiB per TSP; distributed SRAM; compiler-scheduled network | Explicitly historical architecture, not every later Groq generation; system queue latency remains |
| [Cerebras WSE-3 announcement](https://www.cerebras.ai/press-release/cerebras-announces-third-generation-wafer-scale-engine) | 44 GB SRAM and 900,000 cores | Separate SRAM from external model-storage capacity |
| [Cerebras disaggregated inference](https://www.cerebras.ai/blog/disaggregated-inference) | 21 PB/s aggregate WSE-3 SRAM bandwidth; Trainium-prefill/CS-3-decode disclosure | Vendor architecture disclosure; rejected headline SRAM/HBM ratio as direct speedup |
| [CS-4/WSE-3T announcement, Aug 18, 2026](https://investors.cerebras.ai/news-releases/news-release-details/cerebras-unveils-cs-4-30-times-faster-gpu-based-solutions) | 44 GB SRAM, 900,000 cores, 43.2 PB/s aggregate | Marked newly announced; no application speedup reproduced |
| [Apple M4 Max, Oct 2024](https://www.apple.com/sg/newsroom/2024/10/apple-introduces-m4-pro-and-m4-max/) | Up to 128 GB unified memory, 546 GB/s | Deliberately dated local example, no assertion this is newest Apple silicon |
| [MLX unified memory](https://ml-explore.github.io/mlx/build/html/usage/unified_memory.html) | Arrays shared by CPU/GPU; execution synchronization still matters | Shared physical storage does not establish unlimited memory or instantaneous completion |

## Programming and performance primary references

- [CUDA programming model](https://docs.nvidia.com/cuda/cuda-programming-guide/01-introduction/programming-model.html): thread groups and memory spaces.
- [JAX TPU pipelining](https://docs.jax.dev/en/latest/pallas/tpu/pipelining.html): TensorCore components, VMEM/SMEM, compiler-managed execution.
- [Pallas TPU quickstart](https://docs.jax.dev/en/latest/pallas/tpu/quickstart.html): current API and explicit HBM/VMEM boundaries. No unverified cross-platform kernel execution is claimed.
- [Trainium 2 NKI architecture](https://awsdocs-neuron.readthedocs-hosted.com/en/latest/nki/guides/architecture/trainium2_arch.html): scratch buffers, partial sums, engine layout and DMA.
- [MLCommons inference datacenter](https://mlcommons.org/benchmarks/inference-datacenter/): benchmark quality and load contracts, divisions, system-power scope.

## Algorithm and systems evidence

| Source | Claim supported | Boundary |
|---|---|---|
| [DeepSeek-V3 report](https://arxiv.org/html/2412.19437v2) | MLA compression/positional path; 671B total / 37B active; expert routing and balancing | Content-only absorption algebra is presented as a simplified derivation. “Auxiliary-loss-free” routing does not mean no sequence-wise auxiliary loss |
| [Kimi Linear](https://arxiv.org/html/2510.26692v1) | Channel-wise KDA; 3:1 hybrid; Figure 1 larger-batch 6.3× TPOT; Figure 7 batch-one; §6.3 batch-one 2.3× at 1M | Author benchmark, not universal speedup; distinguish prefill and decode figures |
| [Kimi K3 official repository](https://github.com/MoonshotAI/Kimi-K3) | 93 layers = 69 KDA + 24 Gated MLA; 2.8T total / 104B active; 16 of 896 experts | Distinct checkpoint from Kimi Linear; report summary is a moving branch |
| [GLM-5.3-Flash official config](https://huggingface.co/zai-org/GLM-5.3-Flash/raw/main/config.json) | 45 layers; 34 linear_attention + 11 deepseek_sparse_attention; index_topk 2048 | Parsed local copy and counted fields; model-family statements remain versioned |
| [FlashAttention-3](https://arxiv.org/abs/2407.08608) | Hopper asynchronous execution, warp specialization and low precision | Kernel techniques require shape/dtype-specific numerical checks |
| [FlashAttention-4, March 5, 2026](https://arxiv.org/abs/2603.05451) | Blackwell resource asymmetry, redesigned pipeline, exp/software work, TMEM and two-CTA | No universal 1.3×/2.7×speedup carried into atlas |
| [FA4 author blog](https://tridao.me/blog/2026/flash4/) | Current explanation and comparison against specific cuDNN versions | Blog/paper small peak differences not treated as exact device properties |
| [Dao-AILab implementation](https://github.com/Dao-AILab/flash-attention/blob/main/README.md) | Current CuTe-DSL implementation and framework interface | Current README does not establish old releases support every path |
| [Hardware-Aware FP4 FlashAttention-4, Sep 3, 2026](https://arxiv.org/abs/2609.04105) | Separate inference/training experiments; all tested distributed MXFP4 probability/value trajectories diverged | Very recent author preprint; negative result only for tested configurations |
| [Transformer Engine FP8 primer](https://docs.nvidia.com/deeplearning/transformer-engine/examples/fp8_primer.html) | MXFP8 one E8M0 scale/32; basic NVFP4 E2M1 and E4M3 scale/16 plus tensor scale | Storage examples include scales; not all training state becomes low precision |
| [Transformer Engine common recipes](https://docs.nvidia.com/deeplearning/transformer-engine/api/common.html) | Directional quantization; transposed representations; 2D weight-scale recipes | Basic 1D storage math is not a complete recipe memory budget |
| [DistServe](https://arxiv.org/abs/2401.09670) | Separation of prefill/decode and goodput under both latency constraints | Original transport break-even example is a teaching estimate, not a reproduced result |
| [vLLM disaggregated prefilling](https://docs.vllm.ai/en/latest/features/disagg_prefill/) | Experimental feature and KV connector implementation boundary | Old `/serving/disagg_prefill.html` URL failed; current link used |
| [Test-time compute scaling](https://arxiv.org/abs/2408.03314) | Difficulty-dependent allocation, verifier search and response adaptation | Independent-candidate probability is an oracle toy model, not selected-answer accuracy |

## Audit of the pre-existing atlas

1. `src/content.ts` originally described Kimi Linear's 6.3× TPOT at 1M as batch-one. The paper Figure 1 ties this to memory-enabled larger batches; Figure 7 and §6.3 describe the smaller batch-one benefit. Corrected by the integration agent in this work session. The new chapter explicitly distinguishes these comparisons.
2. The existing “Kimi: KDA + gated MLA” heading combined Kimi Linear and Kimi K3. Gated MLA and 69/24 layer counts are K3-specific. Uniform 3:1 refers to Kimi Linear. Clarified by the integration agent in this work session.
3. The existing GLM 45 layer/34 KDA/11 sparse and 2048 index claim was verified. `layer_types` has 34 `linear_attention` and 11 `deepseek_sparse_attention` entries. Sparse layers are indices 3, 7, ..., 43; layer 44 is KDA. The full sequence is eleven 3:1 groups plus a final recurrent layer.
4. TPU examples must remain generation-specific: TPU7x currently excludes TensorFlow even though earlier TPU generations support it. New chapter flags this directly.

## Numerical verification

`tests/accelerator-math.test.ts` checks:

- 70B 4-bit weights plus one-byte/32 scale metadata = 37,187,500,000 bytes.
- 80 layers×8 KV heads×128 dimensions×32768 tokens×K/V×2 bytes = 10 GiB per request.
- 80 GiB capacity and 8 GiB reserve fit three requests, not four.
- Half-sized KV storage changes only the KV term; seven requests fit in the corresponding toy case.
- Incomplete quantization blocks still allocate scale metadata.
- 400 Gb/s at 70% useful bandwidth = 35 GB/s; 10 GiB transfer takes 0.306783378... seconds.
- A 4 ms/token saving amortizes that transfer after 77 tokens; zero/negative savings have no break-even point.
- Invalid or nonfinite inputs are rejected.

`npm run check` and the five new tests passed during authoring. Integration, browser presentation and full repository checks belong to the main task. No physical GPU, TPU, Trainium, wafer-scale or multi-host benchmark was performed for these additions.

## Coverage limits

This source pass prioritizes disclosed, primary-evidence mechanisms. It does not verify provider prices, stock, cloud quotas, private model details or every new accelerator. Broad vendor comparisons omit unsupported directly comparable compute rankings. FPGA/RTL pedagogy, CUDA implementation and full training examples are authored in separate chapters by the rest of the task; this document audits only the hardware/frontier contribution above.

## Capstone vLLM source verification

The chapter's vLLM 0.12.0 links use directory routes, not the old `.html` routes:

- [Docker deployment](https://docs.vllm.ai/en/v0.12.0/deployment/docker/)
- [Completion server](https://docs.vllm.ai/en/v0.12.0/serving/openai_compatible_server/)
- [Serving arguments](https://docs.vllm.ai/en/v0.12.0/cli/serve/)
- [Benchmark arguments](https://docs.vllm.ai/en/v0.12.0/cli/bench/serve/)
- [Tagged Docker documentation](https://github.com/vllm-project/vllm/blob/v0.12.0/docs/deployment/docker.md)
- [Tagged benchmark implementation](https://github.com/vllm-project/vllm/blob/v0.12.0/vllm/benchmarks/serve.py)

The documented Docker entrypoint accepts `--model`; `--max-model-len 512` and `--generation-config vllm` are supported. The benchmark parser accepts `--goodput ttft:200 tpot:50` in milliseconds, `--backend vllm`, the completion endpoint, random dataset lengths, request rate and save-result flags. The tagged implementation maps `vllm` to its OpenAI-compatible completion transport and automatically sets `ignore_eos=True` for its random dataset. Default generation sampling in the benchmark is greedy. These are source-verified command contracts, not an executed GPU benchmark.
