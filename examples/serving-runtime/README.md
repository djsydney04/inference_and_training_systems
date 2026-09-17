# Serving trace arithmetic

Python 3.10 or newer; standard library only. Run from the repository root:

```sh
python3 examples/serving-runtime/trace_metrics.py
python3 -m unittest discover -s examples/serving-runtime -p 'test_*.py' -v
python3 examples/serving-runtime/trace_metrics.py --input your-trace.json
```

The supplied JSON is **invented data**, matching the browser's delivery-metrics
lab. It contains four offered attempts, three successful completions and two
completions meeting all thresholds. In the fixed one-second window, completion
throughput is 3 requests/s, goodput is 2 requests/s and attainment is 50%.

## Trace contract

All timestamps share one monotonic clock and are milliseconds relative to an
arbitrary origin. `arrival_ms` is the intended offer time, `sent_ms` is the actual
client dispatch, and `terminal_ms` records complete/failure/cancellation. The
finite cohort must start and finish inside `window_ms`; the program rejects a
truncated observation instead of silently treating unfinished work as success.

`token_receipts_ms` identifies **each known output token** at the client. It is
not a list of HTTP chunks or SSE events. If one event contains several tokens,
those tokens have the same observed receipt time; server generation timestamps
cannot be recovered from that event. Use a separately named chunk-gap metric
when token identity is unavailable. Do not count protocol trailers as tokens.

The program reports TPOT from first to last token receipt, divided by N−1.
Terminal completion is separate and may include protocol trailers. A one-token
answer has no TPOT or inter-token gap; its TTFT and completion still have to meet
the objective. A zero-token successful response is outside this example's
contract. Failed and cancelled attempts stay in the offered denominator and
never count as compliant completions.

Before adapting a real log, establish tokenizer, terminal status, retry/attempt
identity, the observation cohort, warmup, client queueing and clock boundaries.
Do not compare these numbers with a benchmark that uses different definitions.
The script does not send requests, tokenize chunks, benchmark an engine, estimate
tails from a representative population, or measure GPU work.

## Sources checked September 16, 2026

- [vLLM 0.22.0 benchmark interface](https://docs.vllm.ai/en/v0.22.0/cli/bench/serve/):
  offered rate, concurrency limits and workload configuration.
- [Revisiting SLO and Goodput Metrics, v1](https://arxiv.org/html/2410.14257v1):
  why buffering and incomplete answers can distort superficially good metrics.

The atlas's scheduling simulator lives in `src/serving-runtime-math.ts`. Its
iterations are logical boundaries, not measured durations. It deliberately
stops on cache-allocation deadlock; production preemption/recomputation is a
separate mechanism rather than an implicit feature of this toy scheduler.
