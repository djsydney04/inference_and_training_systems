# Training framework boundaries

Two independent levels of evidence live here. Neither is a distributed GPU
training recipe or a language-model quality benchmark.

## Standard-library reference

From the repository root:

```sh
python3 examples/frameworks/training_reference.py
python3 -m unittest discover -s examples/frameworks -p 'training*_test.py' -v
```

The reference works through aligned causal-LM labels, positional padding masks,
partitioned scalar updates and an adapter artifact. Six tests check:

- Model-owned shifting scores answer and real EOS targets once. Sharing the EOS
  ID with padding does not mean genuine EOS targets should disappear.
- Double shifting changes the objective. Truncation can remove every target.
- Unequal local token counts, including an empty local microbatch, retain the
  global mean gradient with either summed or averaged rank reduction and a
  declared backward-helper divisor. The independent oracle is finite differences
  of a full scalar half-squared loss; a second check compares five SGD updates.
- Nonsquare rank-two adapter merging equals an independently expanded matrix
  contraction.
- A JSON round trip retains the adapter and identity fields. A changed base,
  tokenizer, template or target is rejected. Rounding after merging is an
  explicitly different numerical path.

Expected examples include two scored response targets with mean loss `0.6`, and
the separate/merged adapter output `[4.5, -0.5]`. Masking every EOS-valued label
incorrectly reduces the target count to one and the reported mean to `0.4`.

The manifest is an original `atlas-linear-adapter-v1` teaching schema, **not**
the PEFT checkpoint schema. Its base digest hashes canonical JSON for tiny
matrices, not real framework tensor files. It does not serialize optimizer state.
The matrices use `W[out,in]`, `A[rank,in]`, `B[out,rank]` and column-vector inputs.

## Local Transformers + PEFT check

Use an isolated environment with a native Python supported by the selected
PyTorch wheel. These pins define the example's environment, not the newest
available libraries:

```sh
python -m pip install -r examples/frameworks/training_requirements.txt
python examples/frameworks/training_hf_smoke.py
```

`training_hf_smoke.py` creates a seven-token local WordLevel tokenizer, an
original chat template and a random one-layer GPT-2. It performs no Hub download.
The executed checks are:

1. Template-provided assistant spans and padded labels have the exact expected
   token positions, including a real EOS target with the same ID as padding.
2. Model-owned causal cross entropy matches an explicit manual shift in loss,
   every named parameter gradient and three SGD updates.
3. Saved/reloaded model and tokenizer preserve logits and templated IDs.
4. A zero-initialized PEFT adapter initially preserves the base output. A
   deliberately changed adapter survives save/reload and FP32 merge, and the
   merged full-model export reloads with matching logits.

The saved files live in a temporary directory and are removed after the check.
The script disables Hub access and disables Transformers' TensorFlow/Flax backend
imports so a separate TensorFlow installation does not change this PyTorch test.

Execution status, September 16, 2026:

- Standard-library reference and six Python tests passed with Python 3.14.7.
- The complete framework-specific script passed on a native arm64 CPU with
  Python 3.11.5, Torch 2.8.0, Transformers 4.57.1, PEFT 0.17.0 and Accelerate
  1.11.0 installed. It compared loss, every named gradient and three SGD updates;
  the final random-model loss was `1.592381`. Both model/tokenizer restoration
  and all adapter save/reload/FP32-merge checks passed.
- The run used `arch -arm64` to keep the universal macOS interpreter native.
  The same script selects CPU explicitly and requires no device backend or
  downloaded model. Its default causal-loss fallback emitted an informational
  message; that loss was checked against explicit cross entropy.

Even a passing framework check does not establish Accelerate distributed
execution, DDP/FSDP/DeepSpeed/Megatron integration, a TRL training run, quantized
adapter merging, learned language capability or GPU performance. The native
runtime documentation is separately versioned from the local Torch 2.8 test.

## Primary sources

Checked September 16, 2026:

- [Transformers 4.57.1 chat templates](https://huggingface.co/docs/transformers/v4.57.1/en/chat_templating)
  and [tokenizer API](https://huggingface.co/docs/transformers/v4.57.1/en/main_classes/tokenizer).
- [GPT-2 model-owned label shifting](https://huggingface.co/docs/transformers/v4.57.1/en/model_doc/gpt2).
- [Accelerate 1.11.0 accumulation](https://huggingface.co/docs/accelerate/v1.11.0/en/usage_guides/gradient_accumulation):
  variable-size sums, global counts and automatic divisions.
- [PEFT 0.17.0 LoRA configuration](https://huggingface.co/docs/peft/v0.17.0/package_reference/lora)
  and [adapter checkpoint format](https://huggingface.co/docs/peft/v0.17.0/en/developer_guides/checkpoint).
- [TRL 0.24.0 SFTTrainer](https://huggingface.co/docs/trl/v0.24.0/en/sft_trainer):
  assistant masks and recipe integration. TRL is not required for the local check.

The page's remaining sources document native runtime responsibilities. They do
not imply that the different version pins form a tested distributed deployment.
