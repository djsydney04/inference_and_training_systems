# Actor and learner schedule reference

Run from the repository root with Python 3.10 or newer. No dependencies, model,
network connection or accelerator is required.

```sh
python3 examples/training-runtime/rollout_schedule.py --self-test
python3 examples/training-runtime/rollout_schedule.py
python3 examples/training-runtime/rollout_schedule.py --lag 0
python3 examples/training-runtime/rollout_schedule.py --decode-speedup 3
```

The fixed six-group example finishes in **53 declared seconds** with one-step
overlap, **78** with strict synchronization, and **34** when decode takes one
third as long. These are arithmetic results from an invented workload, not CPU
or GPU timing measurements.

## Read the state machine

The actor lane generates and scores one group at a time. The learner lane
consumes groups in order, performs one update per group, and publishes the next
version. Actor snapshots are immutable for the whole group. A new group `k`
starts only if `k - published_version <= max_lag`. When that group reaches the
learner, exactly `k` earlier groups have been consumed, so the same bound holds
for its age. A completed publication takes effect before a simultaneous launch.

The script is event-driven; the browser uses a direct timestamp recurrence in
`src/rollout-training-math.ts`. Tests cover both advantage signs, publication
ties, FIFO resource exclusion, lag limits and the two-stage pipeline bound.

## What to change next

Try a faster actor with lag limits 1 and 4. Completion can stay the same while
the older ready queue grows. Then derive an extension with unequal generation
durations: admit complete prompt groups, retain the behavior version of each
response, and specify whether a straggler is waited for or discarded.

Before adapting this to a real training job, model weight-transfer contention,
partial rollouts, KV cache reconstruction, rejected groups, checkpoint recovery,
and memory budgets. The reference implements no model, reward engine, optimizer,
distributed execution, off-policy state correction or convergence experiment.

## Primary sources checked September 16, 2026

- [AReaL v1](https://arxiv.org/html/2505.24298v1): asynchronous rollout and training,
  behavior/proximal policy separation and interruptible generation.
- [NeMo RL 0.7.0 async GRPO](https://docs.nvidia.com/nemo/rl/0.7.0/guides/async-grpo.html):
  generation/target weight versions and age filtering.
- [verl V1 trainer, pinned commit 6785892](https://github.com/verl-project/verl/blob/678589299a280fac2c17a8fcc03b8839d49b823c/docs/advance/v1_async_trainer.md):
  execution modes, partial rollout and version-specific composition limits.
- [PPO](https://arxiv.org/abs/1707.06347): clipped surrogate used by the probability
  example; this example is not a full PPO implementation.

The scheduler is an original teaching model. It reproduces none of these
frameworks' configuration semantics or performance claims.
