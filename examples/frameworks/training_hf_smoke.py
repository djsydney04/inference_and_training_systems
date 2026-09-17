#!/usr/bin/env python3
"""Local CPU framework contract check. Creates random tiny weights; never downloads.

Tested environment is recorded in training_README.md. This is not an SFT recipe,
distributed run, quantized merge, or evaluation of language-model capability.
"""
import os
os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["TRANSFORMERS_OFFLINE"] = "1"
os.environ["USE_TF"] = "0"
os.environ["USE_FLAX"] = "0"

import copy
import tempfile
from pathlib import Path
import torch
from torch.nn import functional as F
import transformers
from transformers import AutoModelForCausalLM, AutoTokenizer, GPT2Config, GPT2LMHeadModel, PreTrainedTokenizerFast
from tokenizers import Tokenizer
from tokenizers.models import WordLevel
from tokenizers.pre_tokenizers import WhitespaceSplit
import peft
from peft import LoraConfig, PeftModel, get_peft_model


def main():
    torch.manual_seed(123)
    torch.set_num_threads(1)
    vocab = {"[BOS]": 0, "[USER]": 1, "question": 2, "[ASSISTANT]": 3,
             "answer": 4, "[EOS]": 5, "[UNK]": 6}
    backend = Tokenizer(WordLevel(vocab, unk_token="[UNK]"))
    backend.pre_tokenizer = WhitespaceSplit()
    tokenizer = PreTrainedTokenizerFast(tokenizer_object=backend, bos_token="[BOS]",
        eos_token="[EOS]", pad_token="[EOS]", unk_token="[UNK]")
    tokenizer.chat_template = (
        "{{ bos_token }} {% for message in messages %}"
        "{% if message['role'] == 'user' %}[USER] {{ message['content'] }} "
        "{% elif message['role'] == 'assistant' %}[ASSISTANT] "
        "{% generation %}{{ message['content'] }} {{ eos_token }}{% endgeneration %} "
        "{% endif %}{% endfor %}")
    conversation = [{"role": "user", "content": "question"}, {"role": "assistant", "content": "answer"}]
    encoded = tokenizer.apply_chat_template(conversation, tokenize=True, return_dict=True,
        return_assistant_tokens_mask=True, add_generation_prompt=False)
    assert encoded["input_ids"] == [0, 1, 2, 3, 4, 5], encoded
    assert encoded["assistant_masks"] == [0, 0, 0, 0, 1, 1], encoded
    ids = torch.tensor([encoded["input_ids"] + [tokenizer.pad_token_id] * 2])
    attention = torch.tensor([[1] * 6 + [0, 0]])
    assistant = torch.tensor([encoded["assistant_masks"] + [0, 0]], dtype=torch.bool)
    labels = ids.clone()
    labels[(attention == 0) | ~assistant] = -100
    assert labels.tolist() == [[-100, -100, -100, -100, 4, 5, -100, -100]]

    config = GPT2Config(vocab_size=len(tokenizer), n_positions=16, n_embd=16, n_layer=1,
        n_head=2, resid_pdrop=0., embd_pdrop=0., attn_pdrop=0., bos_token_id=0, eos_token_id=5, pad_token_id=5)
    config._attn_implementation = "eager"
    model = GPT2LMHeadModel(config).cpu()
    reference = copy.deepcopy(model)
    optimizers = [torch.optim.SGD(m.parameters(), lr=.03) for m in (model, reference)]
    last_loss = None
    for step in range(3):
        for optimizer in optimizers:
            optimizer.zero_grad(set_to_none=True)
        output = model(input_ids=ids, attention_mask=attention, labels=labels, use_cache=False)
        logits = reference(input_ids=ids, attention_mask=attention, use_cache=False).logits
        manual = F.cross_entropy(logits[:, :-1].reshape(-1, len(tokenizer)),
                                 labels[:, 1:].reshape(-1), ignore_index=-100)
        torch.testing.assert_close(output.loss, manual, atol=1e-6, rtol=1e-6)
        output.loss.backward(); manual.backward()
        for (name, parameter), (other_name, other) in zip(model.named_parameters(), reference.named_parameters()):
            assert name == other_name
            torch.testing.assert_close(parameter.grad, other.grad, atol=2e-6, rtol=1e-5)
        for optimizer in optimizers:
            optimizer.step()
        for actual, expected in zip(model.parameters(), reference.parameters()):
            torch.testing.assert_close(actual, expected, atol=2e-6, rtol=1e-5)
        last_loss = output.loss.item()

    model.eval()
    with tempfile.TemporaryDirectory(prefix="atlas-framework-training-") as temporary:
        root = Path(temporary); base_dir = root / "base"; adapter_dir = root / "adapter"; merged_dir = root / "merged"
        model.save_pretrained(base_dir); tokenizer.save_pretrained(base_dir)
        restored_tokenizer = AutoTokenizer.from_pretrained(base_dir, local_files_only=True)
        assert restored_tokenizer.apply_chat_template(conversation, tokenize=True, add_generation_prompt=False) == encoded["input_ids"]
        base = AutoModelForCausalLM.from_pretrained(base_dir, local_files_only=True).eval()
        with torch.no_grad():
            expected_base = model(ids, attention_mask=attention, use_cache=False).logits
            torch.testing.assert_close(base(ids, attention_mask=attention, use_cache=False).logits, expected_base)

        adapted = get_peft_model(base, LoraConfig(r=2, lora_alpha=4, target_modules=["c_attn"],
            lora_dropout=0., bias="none", fan_in_fan_out=True, task_type="CAUSAL_LM")).eval()
        with torch.no_grad():
            torch.testing.assert_close(adapted(ids, attention_mask=attention, use_cache=False).logits, expected_base)
            for name, parameter in adapted.named_parameters():
                if "lora_B" in name:
                    parameter.fill_(.02)
            expected = adapted(ids, attention_mask=attention, use_cache=False).logits
            assert (expected - expected_base).abs().max().item() > 1e-6
        adapted.save_pretrained(adapter_dir)
        assert (adapter_dir / "adapter_model.safetensors").is_file()
        reloaded = PeftModel.from_pretrained(AutoModelForCausalLM.from_pretrained(base_dir, local_files_only=True), adapter_dir).eval()
        with torch.no_grad():
            torch.testing.assert_close(reloaded(ids, attention_mask=attention, use_cache=False).logits, expected, atol=2e-6, rtol=1e-5)
            merged = reloaded.merge_and_unload().eval()
            torch.testing.assert_close(merged(ids, attention_mask=attention, use_cache=False).logits, expected, atol=2e-6, rtol=1e-5)
            merged.save_pretrained(merged_dir)
            final = AutoModelForCausalLM.from_pretrained(merged_dir, local_files_only=True).eval()
            torch.testing.assert_close(final(ids, attention_mask=attention, use_cache=False).logits, expected, atol=2e-6, rtol=1e-5)
    print(f"PASS CPU: torch={torch.__version__}, transformers={transformers.__version__}, peft={peft.__version__}")
    print(f"Chat template/masks, three CE/gradient/SGD parity steps, local model+tokenizer restore; last loss={last_loss:.6f}")
    print("PEFT zero-init, changed adapter save/reload, FP32 merge and merged model reload agree.")
    print("No GPU, DDP/FSDP/DeepSpeed/Megatron/TRL run, trained language capability, or quantized merge tested.")


if __name__ == "__main__":
    main()
