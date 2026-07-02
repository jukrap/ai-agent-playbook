# Backend Change Checklist

## Discover

- Runtime entrypoints: HTTP routes, RPC handlers, CLI commands, jobs, workers, consumers, webhooks, and module loaders.
- Ownership boundaries: controller/request orchestration, service/business logic, repository/data access, adapter/integration, config, and bootstrap.
- State and side effects: database writes, events, queues, caches, file/object storage, sessions, external APIs, emails, and audit logs.
- Deployment shape: single process, worker pool, serverless function, container, cron host, queue consumer, or legacy app server.
- Compatibility surface: public API, internal callers, schema, permissions, configuration names, logs, metrics, and alert expectations.

## Change Classification

| Kind | Review focus |
|---|---|
| Additive | New route/module/job defaults, disabled-by-default behavior, permissions, and observability. |
| Compatible | Existing contract shape, default values, retry behavior, and old clients. |
| Behavior-changing | Caller expectations, feature flags, migration notes, and rollout/rollback plan. |
| Destructive | Data loss, schema drops, removed config, removed endpoints, and consumer migration. |
| Operational | Startup/shutdown, health checks, resource use, concurrency, and instance-specific behavior. |
| Integration-facing | Auth, rate limits, retries, idempotency keys, secrets, payload versioning, and sandbox/live modes. |

## Boundary Rules

- Controllers should validate/request-shape and delegate; do not bury business rules in route handlers when local services exist.
- Services should coordinate business logic and side effects; do not let repositories know request/session concepts.
- Repositories should own data access details; do not scatter SQL/ORM query fragments across controllers.
- Module or feature entrypoints should load only the required pieces for the active runtime mode.
- Configuration must have documented defaults, environment names, and failure behavior.
- Migrations, schema changes, and backfills must be reviewed with the database skill.

## Verification

- Unit tests for pure business rules and adapters.
- Integration tests for route/service/repository contracts when local harness exists.
- Job/worker tests for retries, duplicate delivery, poison messages, and shutdown.
- Contract tests or captured payload comparison for external integrations.
- Manual smoke only when automated harness is absent, with exact route/job/config noted.
- Worklog or PR note for changed runtime assumptions, permissions, rollback, and unverified paths.

## Common Mistakes

- Adding a helper, service, or module without searching for an existing owner.
- Treating queue/job code as ordinary request code and missing idempotency or retry semantics.
- Changing config names/defaults without deployment notes.
- Verifying only the happy HTTP path while leaving worker, webhook, or rollback behavior untested.
- Mixing stack-specific fixes into a generic backend pattern without recording the stack profile.
