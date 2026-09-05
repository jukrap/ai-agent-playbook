# Backend Change Checklist

## Discover

- Runtime entrypoints: HTTP routes, RPC handlers, CLI commands, jobs, workers, consumers, webhooks, module loaders.
- Ownership boundaries: controller/request orchestration, service/business logic, repository/data access, adapter/integration, config, bootstrap.
- State and side effects: database writes, events, queues, caches, file/object storage, sessions, external APIs, emails, audit logs.
- Deployment shape: single process, worker pool, serverless function, container, cron host, queue consumer, legacy app server.
- Compatibility surface: public API, internal callers, schema, permissions, configuration names, logs, metrics, alert expectations.

## Change Classification

| Kind | Review focus |
|---|---|
| Additive | New route/module/job defaults, disabled-by-default behavior, permissions, observability. |
| Compatible | Existing contract shape, default values, retry behavior, old clients. |
| Behavior-changing | Caller expectations, feature flags, migration notes, rollout/rollback plan. |
| Destructive | Data loss, schema drops, removed config, removed endpoints, consumer migration. |
| Operational | Startup/shutdown, health checks, resource use, concurrency, instance-specific behavior. |
| Integration-facing | Auth, rate limits, retries, idempotency keys, secrets, payload versioning, sandbox/live modes. |

## Boundary Rules

- Controller는 request shape를 검증하고 delegate해야 합니다. local service가 있는데 route handler에 business rule을 묻지 않습니다.
- Service는 business logic과 side effect를 조율합니다. Repository가 request/session 개념을 알게 만들지 않습니다.
- Repository는 data access detail을 소유합니다. SQL/ORM query fragment를 controller에 흩뿌리지 않습니다.
- Module 또는 feature entrypoint는 active runtime mode에 필요한 조각만 load해야 합니다.
- Configuration은 default, environment name, failure behavior가 문서화되어야 합니다.
- Migration, schema change, backfill은 database skill과 함께 review합니다.

## Verification

- Pure business rule과 adapter는 unit test.
- local harness가 있으면 route/service/repository contract는 integration test.
- Job/worker는 retry, duplicate delivery, poison message, shutdown test.
- External integration은 contract test 또는 captured payload comparison.
- Automated harness가 없을 때만 exact route/job/config를 적은 manual smoke.
- Runtime assumption, permission, rollback, unverified path가 바뀌면 worklog 또는 PR note.

## Common Mistakes

- 기존 owner를 찾지 않고 helper, service, module을 새로 추가합니다.
- Queue/job code를 일반 request code처럼 다뤄 idempotency 또는 retry semantics를 놓칩니다.
- Config name/default를 deployment note 없이 바꿉니다.
- Happy HTTP path만 검증하고 worker, webhook, rollback behavior를 남겨둡니다.
- Generic backend pattern에 stack-specific fix를 섞고 stack profile을 기록하지 않습니다.
