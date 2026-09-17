# Serving output contract

An original CPU reference for the `framework-token-boundary` atlas lesson.
It demonstrates why text stop strings require state across stream chunks.

```sh
python3 examples/frameworks/serving_contract.py
python3 -m unittest discover -s examples/frameworks -p 'serving*_test.py' -v
node --experimental-strip-types --test tests/framework-serving.test.ts
```

Expected final line: `visible='Hello '; stop='<END>'`.
Python uses only its standard library. The atlas imports the full Python source,
while the browser uses a TypeScript implementation tested against independent
whole-string and block-by-block references.

## Contract

- Inputs are already decoded Unicode text. An HTTP client must first decode
  UTF-8 incrementally and parse its event protocol; packets are not text events.
- The first stop to complete wins. If multiple stops complete simultaneously,
  the longest wins. This is this example's explicit policy, not a claim that all
  engines resolve overlapping stops this way.
- A partial suffix that may become a stop is held back. Normal EOF flushes it.
  A matched stop and subsequent text are excluded. Terminal state is permanent.
- Token-ID stopping happens upstream and is a different operation. This program
  does not tokenize, count model tokens, enforce generation length, or cancel an
  upstream GPU request.

## Exercises

1. Change the chunks while keeping their concatenation fixed; explain why the
   result stays the same. Tests enumerate every partition of short strings.
2. Try stops `abcd` and `bc` with text `zabcd`. The output is `za`: `bc`
   completes before `abcd`. Whole-string earliest-start matching would differ.
3. For a stop `END`, stream `fr` then `iEND`. Explain why a text substring is
   not the same semantic contract as an EOS token ID.
4. Inspect the cache-prefix lab. Changing temperature does not change the
   already computed prompt KV under its fixed dense causal model. Changing
   adapter weights does, even when the integer prompt IDs are identical.

No vLLM, SGLang, TensorRT-LLM, llama.cpp, MLX engine, GPU, model download or
live endpoint was exercised by this reference. It establishes a local adapter
invariant, not serving compatibility, accuracy or throughput.
