# API Versioning And Compatibility

Use this reference when a backend change can affect clients, generated SDKs, webhooks, events, imports, exports, or stored payloads.

## Contract Inventory

- Entrypoints: HTTP route, RPC method, webhook, event topic, job payload, import/export format, SDK method, or form post.
- Consumers: browser UI, mobile app, partner integration, internal service, scheduled job, generated client, dashboard, or report.
- Contract shape: method, path, headers, auth, query/body fields, enum values, defaults, pagination, sorting, error envelope, and rate limits.
- Compatibility evidence: OpenAPI/schema, generated types, fixtures, snapshots, client code, logs, docs, examples, and migration notes.

## Change Classes

| Class | Rule |
| --- | --- |
| Additive | New optional fields, new enum values only when clients tolerate unknown values, new endpoint, or disabled behavior. |
| Compatible | Same required fields, same status codes, same defaults, same auth and pagination semantics. |
| Behavior-changing | Same shape but different meaning, ordering, filtering, validation, retryability, or side effect. |
| Breaking | Removed/renamed fields, stricter required values, changed envelope, changed auth, changed id type, or incompatible enum behavior. |
| Versioned | New path/header/media type/topic/schema version with explicit migration and old-version behavior. |

## Review Rules

- Do not infer compatibility from server tests alone; inspect at least one real consumer or generated contract.
- Treat error codes, validation field paths, pagination cursors, webhook retry semantics, and idempotency keys as part of the contract.
- Prefer expand-and-contract when changing required fields: accept both old and new input, emit stable output, then remove old behavior after migration evidence.
- For generated SDKs, check generation command, package versioning, typed exports, and downstream test expectations.
- For events and webhooks, keep old consumers safe with versioned payloads, additive fields, or adapters.
- For imports/exports, include sample files and round-trip checks when possible.

## Verification

- Contract or snapshot tests for old and new payloads.
- Consumer tests for UI, SDK, job, webhook, or partner-facing paths.
- Schema diff or generated type diff when a schema exists.
- Backward compatibility smoke with recorded fixture when no formal contract exists.
- Release note or migration note for every behavior-changing or breaking contract.
