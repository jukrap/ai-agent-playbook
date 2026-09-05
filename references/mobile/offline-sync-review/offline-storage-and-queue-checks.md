# Offline Storage And Queue Checks

Use this when mobile behavior stores data locally, queues user operations, or must work during network loss.

## Storage Boundary

- Storage type: memory cache, persisted cache, SQLite, file storage, keychain/keystore, secure storage, encrypted database, or platform backup.
- Ownership, schema/version, eviction, retention, encryption, backup/restore, logout cleanup, account switch, tenant boundary, and PII handling.
- Queue entries, operation type, payload shape, timestamps, dependencies, ordering, deduplication, and durability across app restart.
- Local UI state should reveal pending, failed, synced, conflicted, and stale states without pretending writes are complete.

## Offline Evidence

- Airplane mode, network drop, captive portal, app restart, low storage, logout/login, and device clock change.
- Create, edit, delete, upload/download, and background sync paths when the feature supports them.
- Confirm queued data survives expected restarts and is removed after successful sync or explicit discard.
- Keep local test accounts, device logs, and payload captures out of public docs when they contain personal or private values.

## Stop Conditions

- Offline writes can be lost silently, replayed twice, or shown as synced before server confirmation.
- Local data can leak across accounts, tenants, or logout.
- Queue payloads contain secrets or long-lived tokens.
- Storage schema changes without migration, fallback, or clear data reset behavior.
