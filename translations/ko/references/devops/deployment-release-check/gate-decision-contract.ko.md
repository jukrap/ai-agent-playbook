# Release Deployment Gate Decision Contract

## Decision States

- `pass`: named artifact, revision, environment, rollout mode의 required gate가 통과했습니다.
- `blocked`: 하나 이상의 required gate가 실패, 누락, stale이거나 release artifact와 연결되지 않습니다.
- `advisory-only`: useful risk는 찾았지만 required gate가 scope에 없습니다.
- `accepted-risk`: required gate가 skipped 또는 unavailable이고 owner가 expiry와 compensating evidence로 risk를 수락했습니다.

## Required Gate Evidence

- Artifact identity: source revision, tag, image digest, package version, build id, bundle hash, release candidate id.
- CI quality gate: required/optional check의 status, owner, freshness, skip policy.
- Deployment target: environment, rollout mechanism, traffic strategy, region 또는 tenant scope, release owner.
- Config diff: environment variable, feature flag, secret reference, service config, routing, queue, cron job, scheduled job.
- Data and migration gate: migration id, expand/contract step, backfill, rollback 또는 compensation path, consumer compatibility.
- Runtime readiness: health check, smoke path, log, metric, trace, alert/monitor ownership, post-deploy observation window.
- Documentation state: changelog, release note, runbook, known issue, support note, user-facing이면 rollback note.

## Evidence Locators

- Local artifact와 report에는 target-relative path를 사용합니다.
- Generated evidence에는 runtime report path를 사용하고, 가능하면 `runtime schema-check` 또는 `evidence locator-check`로 검증합니다.
- External CI, deploy, issue tracker, dashboard, incident tool에는 source registry boundary를 사용합니다.
- Credential, private URL, 긴 log, personal absolute path를 public release note에 붙여 넣지 않습니다.

## Stop Conditions

- Artifact identity, deployment target, release owner가 unknown입니다.
- Config 또는 feature flag change를 credential/private endpoint 없이는 검토할 수 없습니다.
- Data-bearing release에서 migration rollback, data compensation, compatibility가 정의되지 않았습니다.
- User-impacting release에서 monitoring ownership 또는 post-deploy observation이 없습니다.
- User-facing change에서 release note 또는 support handoff가 필요하지만 없습니다.
