---
name: job-worker-reliability
description: Use when changing backend jobs, workers, queues, schedulers, consumers, retries, dead-letter handling, or long-running tasks.
---

# Job Worker Reliability

Treat asynchronous backend work as a delivery contract, not ordinary request code.

## Workflow

1. Identify trigger, queue/topic/schedule, worker process, concurrency model, lease/visibility timeout, and shutdown behavior.
2. Classify delivery as scheduled, queued, event-driven, webhook-backed, batch, replay, or manual repair.
3. Define idempotency key, durable state transition, retryable errors, permanent failures, dead-letter path, and replay behavior.
4. Guard side effects with transactions, compare-and-set updates, unique constraints, checkpoints, or provider operation ids.
5. Verify duplicate delivery, retry, permanent failure, partial batch failure, shutdown, replay, and observability.
6. Pair with `backend-change-safety` for shared service/module changes and `connector-integration-change` for provider callbacks.

## Reference

Read `references/job-worker-reliability.md` before editing worker loops, queue consumers, schedulers, webhook follow-up jobs, or long-running batch tasks.
