# Async Boundary And Idempotency

Use this reference when the backend change touches workers, queues, scheduled jobs, webhooks, event handlers, retry loops, external callbacks, or long-running background work.

## Inventory

- Entrypoints: queue consumer, scheduled job, webhook route, event handler, message broker subscription, CLI batch, worker process, or serverless trigger.
- Delivery model: at-most-once, at-least-once, exactly-once claim, retry with backoff, dead-letter queue, manual replay, or provider redelivery.
- State transitions: pending, processing, succeeded, failed, retryable, dead-lettered, canceled, compensated, and already-applied.
- Idempotency key: request id, provider event id, business natural key, unique constraint, hash of canonical payload, or explicit operation id.
- Side effects: database mutation, outbound API call, email/SMS, file/object write, cache invalidation, audit log, billing action, or notification.

## Boundary Rules

- Separate message parsing, validation, business decision, state transition, and side effect execution when the local architecture supports it.
- Store enough event identity to detect duplicate delivery before repeating irreversible side effects.
- Make retry behavior explicit: which errors retry, which fail permanently, what backoff is used, and where the last error is recorded.
- Keep external provider payloads immutable after capture. Normalize into internal commands or events before business logic.
- Use transactions or compare-and-set updates around state transitions that guard side effects.
- Do not hide worker-only assumptions inside HTTP controllers or request-scoped session helpers.

## Webhook And Callback Checks

- Verify signature, timestamp, replay window, sender identity, and expected environment before parsing trusted payload fields.
- Return provider-appropriate status codes. Avoid returning success before durable capture unless the provider contract explicitly allows it.
- Persist raw event identity and sanitized payload metadata for replay and audit, but do not log secrets or full sensitive payloads by default.
- Handle out-of-order delivery and unknown future event types safely.
- Add sandbox/live mode separation for provider credentials, endpoints, and test fixtures.

## Job And Queue Checks

- Confirm concurrency limits, worker shutdown behavior, visibility timeout, lease extension, and poison message handling.
- Ensure one failing item in a batch cannot silently drop the rest unless the batch contract says so.
- Use durable checkpoints for long-running jobs and backfills.
- Keep cancellation and rollback semantics explicit when jobs span multiple resources.
- Monitor queue depth, age, retries, failures, dead-letter count, and stuck processing state.

## Verification

- Duplicate delivery test: same message or webhook delivered twice creates one durable result and one clear duplicate signal.
- Retry test: transient failure retries without duplicating irreversible side effects.
- Permanent failure test: invalid payload or denied permission lands in the expected failed/dead-letter state.
- Ordering test: late, early, or missing dependency event does not corrupt state.
- Shutdown test: worker interruption before and after side effects can resume or report an unambiguous recovery path.
- Observability check: logs/metrics/traces identify message id, operation id, retry count, and final state without leaking secrets.
