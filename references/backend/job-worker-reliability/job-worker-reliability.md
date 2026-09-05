# Job Worker Reliability

Use this reference for backend jobs, workers, queues, consumers, scheduled tasks, retries, dead-letter handling, replay, and long-running work.

## Runtime Inventory

- Trigger: cron, scheduler, queue, topic, stream, webhook, command, backfill, migration, or manual repair.
- Worker runtime: single process, pool, serverless trigger, container replica, sidecar, app-server thread, or external workflow engine.
- Delivery model: at-most-once, at-least-once, claimed exactly-once, ordered partition, unordered batch, delayed retry, or manual replay.
- Coordination: lock, lease, visibility timeout, checkpoint, cursor, unique constraint, advisory lock, or external provider id.
- Side effects: database writes, outbound API calls, emails, billing, file/object writes, cache invalidation, events, notifications, or audit records.

## Reliability Rules

- Make the state machine explicit: pending, leased, processing, succeeded, retryable failed, permanently failed, dead-lettered, canceled, compensated, or already applied.
- Store an idempotency key before irreversible side effects. Prefer provider event id, business natural key, operation id, or canonical payload hash.
- Separate message parsing, validation, state transition, side effect, and final acknowledgement when the local architecture supports it.
- Acknowledge or delete messages only after durable capture or successful side effect according to the queue contract.
- Use checkpoints for long-running scans, imports, backfills, and exports.
- Keep poison message handling explicit; one bad item must not silently drop a whole batch unless the batch contract says so.
- Design replay so it is safe, observable, and bounded by filters such as id range, time range, tenant, or operation id.

## Shutdown And Concurrency

- Confirm graceful shutdown drains or requeues in-flight work.
- Confirm lease extension and visibility timeout exceed worst-case processing or can be renewed.
- Confirm concurrent workers cannot double-apply the same operation.
- Confirm worker-specific configuration is not hidden inside HTTP-only request/session helpers.
- Confirm resource limits, rate limits, and backpressure behavior under retry storms.

## Observability

- Track queue depth, queue age, retry count, dead-letter count, worker lag, processing duration, success/failure counts, and stuck states.
- Logs and traces should include message id, operation id, attempt count, final state, and sanitized failure code.
- Alerts should distinguish backlog growth, poison messages, provider outage, code regression, and data-specific repair.

## Verification

- Duplicate delivery test: the same message produces one durable result and one clear duplicate signal.
- Retry test: transient failure retries without duplicating irreversible side effects.
- Permanent failure test: invalid payload or denied permission lands in expected failed or dead-letter state.
- Partial batch test: one failing item does not corrupt, lose, or hide other items.
- Shutdown test: interruption before and after side effects resumes or reports a clear recovery path.
- Replay test: replaying a bounded range is idempotent and produces reviewable evidence.
