"""Byte-level decoder with an explicit, append-only KV cache. CPU teaching model.

Run train.py and serve.py from this directory. No downloaded model or data.
The attention equations stay visible so cached and full execution can be compared.
"""
from dataclasses import asdict, dataclass
import math
import torch
from torch import nn
from torch.nn import functional as F


@dataclass(frozen=True)
class Config:
    vocab: int = 256
    context: int = 128
    width: int = 64
    heads: int = 4
    layers: int = 2

    def __post_init__(self):
        if any(type(v) is not int or v <= 0 for v in asdict(self).values()):
            raise ValueError("configuration dimensions must be positive integers")
        if self.width % self.heads:
            raise ValueError("width must be divisible by heads")
        if self.vocab != 256:
            raise ValueError("this tokenizer has exactly 256 byte IDs")


class Attention(nn.Module):
    def __init__(self, config):
        super().__init__()
        self.heads = config.heads
        self.dim = config.width // config.heads
        self.qkv = nn.Linear(config.width, 3 * config.width, bias=False)
        self.proj = nn.Linear(config.width, config.width, bias=False)

    def forward(self, x, past=None):
        batch, time, width = x.shape
        q, k, v = [a.view(batch, time, self.heads, self.dim).transpose(1, 2)
                   for a in self.qkv(x).chunk(3, dim=-1)]
        offset = 0 if past is None else past[0].shape[2]
        if past is not None:
            k, v = torch.cat((past[0], k), dim=2), torch.cat((past[1], v), dim=2)
        # Query i has absolute position offset+i; never use a top-left T x S mask
        # for cached decode. At T=1 it must see the entire preceding prefix.
        query_positions = offset + torch.arange(time, device=x.device)
        key_positions = torch.arange(k.shape[2], device=x.device)
        allowed = key_positions[None, :] <= query_positions[:, None]
        scores = (q @ k.transpose(-2, -1)) / math.sqrt(self.dim)
        weights = scores.masked_fill(~allowed, float("-inf")).softmax(dim=-1)
        mixed = (weights @ v).transpose(1, 2).contiguous().view(batch, time, width)
        return self.proj(mixed), (k, v)


class Block(nn.Module):
    def __init__(self, config):
        super().__init__()
        self.norm1 = nn.LayerNorm(config.width)
        self.attention = Attention(config)
        self.norm2 = nn.LayerNorm(config.width)
        self.mlp = nn.Sequential(nn.Linear(config.width, 4 * config.width),
                                 nn.GELU(), nn.Linear(4 * config.width, config.width))

    def forward(self, x, past=None):
        attention, cache = self.attention(self.norm1(x), past)
        x = x + attention
        return x + self.mlp(self.norm2(x)), cache


class TinyDecoder(nn.Module):
    def __init__(self, config=Config()):
        super().__init__()
        self.config = config
        self.tokens = nn.Embedding(config.vocab, config.width)
        self.positions = nn.Embedding(config.context, config.width)
        self.blocks = nn.ModuleList([Block(config) for _ in range(config.layers)])
        self.norm = nn.LayerNorm(config.width)
        self.apply(self._initialize)

    @staticmethod
    def _initialize(module):
        if isinstance(module, (nn.Linear, nn.Embedding)):
            nn.init.normal_(module.weight, mean=0.0, std=0.02)
        if isinstance(module, nn.Linear) and module.bias is not None:
            nn.init.zeros_(module.bias)

    def forward(self, tokens, cache=None):
        if tokens.ndim != 2 or tokens.shape[1] == 0:
            raise ValueError("tokens must be nonempty [batch, time]")
        if cache is not None and len(cache) != self.config.layers:
            raise ValueError("one KV pair is required for each layer")
        offset = 0
        if cache is not None:
            for index, pair in enumerate(cache):
                if not isinstance(pair, (tuple, list)) or len(pair) != 2:
                    raise ValueError("cache entries must be key/value pairs")
                k, v = pair
                if not isinstance(k, torch.Tensor) or not isinstance(v, torch.Tensor) or k.ndim != 4:
                    raise ValueError("cached tensors must have shape [B,H,S,Dh]")
                if index == 0:
                    offset = k.shape[2]
                expected = (tokens.shape[0], self.config.heads, offset,
                            self.config.width // self.config.heads)
                if tuple(k.shape) != expected or tuple(v.shape) != expected:
                    raise ValueError("cache shapes and prefix lengths must agree across layers")
                if k.device != tokens.device or v.device != tokens.device:
                    raise ValueError("cache and tokens must share a device")
        if offset + tokens.shape[1] > self.config.context:
            raise ValueError("context limit exceeded; this example does not evict KV")
        positions = torch.arange(offset, offset + tokens.shape[1], device=tokens.device)
        x = self.tokens(tokens) + self.positions(positions)
        next_cache = []
        for index, block in enumerate(self.blocks):
            x, kv = block(x, None if cache is None else cache[index])
            next_cache.append(kv)
        # One shared parameter matrix for embedding and vocabulary projection.
        return F.linear(self.norm(x), self.tokens.weight), next_cache

    def loss(self, sequence):
        logits, _ = self(sequence[:, :-1])
        return F.cross_entropy(logits.reshape(-1, self.config.vocab),
                               sequence[:, 1:].reshape(-1))

    @torch.inference_mode()
    def generate(self, prompt, new_tokens=32, use_cache=True):
        if type(new_tokens) is not int or new_tokens < 0:
            raise ValueError("new_tokens must be a nonnegative integer")
        if prompt.ndim != 2 or prompt.shape[1] == 0:
            raise ValueError("prompt must be nonempty [batch, time]")
        if prompt.shape[1] + new_tokens > self.config.context:
            raise ValueError("prompt plus output exceeds context capacity")
        result = prompt.clone()
        cache = None
        for _ in range(new_tokens):
            model_input = result if cache is None or not use_cache else result[:, -1:]
            logits, next_cache = self(model_input, cache if use_cache else None)
            cache = next_cache if use_cache else None
            result = torch.cat((result, logits[:, -1].argmax(-1, keepdim=True)), dim=1)
        return result
