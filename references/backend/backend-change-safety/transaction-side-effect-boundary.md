# Transaction And Side Effect Boundary

Use this reference when a backend change mixes database writes with events, queues, external APIs, files, email, billing, cache invalidation, or audits.

## Boundary Inventory

- Durable state: tables, documents, object storage, queue records, ledger rows, audit records, and checkpoints.
- Side effects: outbound API calls, emails, notifications, payments, webhooks, events, file writes, cache writes, and search index updates.
- Transaction owner: controller, service, repository, unit of work, ORM transaction, database procedure, workflow engine, or external provider.
- Recovery signal: idempotency key, unique constraint, operation id, outbox row, retry count, status field, or compensation record.

## Design Rules

- Keep irreversible side effects outside the database transaction unless the local architecture has a real outbox or workflow transaction.
- Write the intent or operation record before calling an external system when retries or replay are possible.
- Use unique constraints, compare-and-set updates, or idempotency keys to prevent duplicate application.
- Make state transitions explicit enough to recover from crash points before, during, and after side effects.
- Do not hide transaction behavior inside helpers that controllers, jobs, and webhooks call with different lifecycles.
- Treat cache invalidation, search indexing, and audit logging as observable side effects, not incidental cleanup.

## Failure Points

| Failure point | Expected answer |
| --- | --- |
| Before durable write | Request can retry without partial state. |
| After durable write, before side effect | Job, outbox, or repair path completes or cancels the side effect. |
| After side effect, before final status | Idempotency or provider operation id prevents duplicate side effect. |
| During batch item | One failed item does not corrupt unrelated items. |
| During rollback | Compensation or containment path is explicit. |

## Verification

- Test duplicate requests or duplicate messages against the same operation id.
- Test transient provider failure and retry without duplicating durable state.
- Test crash-like resume path with a partially advanced status when practical.
- Check logs/metrics include operation id, final state, attempt count, and sanitized failure code.
- Record manual repair or replay command when the system lacks automated recovery.
