# Release Deployment Gate Decision Contract

## Decision States

- `pass`: required gates passed for the named artifact, revision, environment, and rollout mode.
- `blocked`: at least one required gate failed, is missing, is stale, or cannot be tied to the release artifact.
- `advisory-only`: the review found useful risks, but no required gate was in scope.
- `accepted-risk`: a required gate is skipped or unavailable, and the owner accepted the risk with expiry and compensating evidence.

## Required Gate Evidence

- Artifact identity: source revision, tag, image digest, package version, build id, bundle hash, or release candidate id.
- CI quality gate: required and optional checks with status, owner, freshness, and skip policy.
- Deployment target: environment, rollout mechanism, traffic strategy, region or tenant scope, and release owner.
- Config diff: environment variables, feature flags, secrets references, service config, routing, queues, cron jobs, and scheduled jobs.
- Data and migration gate: migration id, expand/contract step, backfill, rollback or compensation path, and consumer compatibility.
- Runtime readiness: health check, smoke path, logs, metrics, traces, alert/monitor ownership, and post-deploy observation window.
- Documentation state: changelog, release notes, runbook, known issues, support note, and rollback note when user-facing.

## Evidence Locators

- Use target-relative paths for local artifacts and reports.
- Use runtime report paths for generated evidence, then validate with `runtime schema-check` or `evidence locator-check` when available.
- Use source registry boundaries for external CI, deploy, issue tracker, dashboard, or incident tools.
- Do not paste credentials, private URLs, long logs, or personal absolute paths into public release notes.

## Stop Conditions

- Artifact identity, deployment target, or release owner is unknown.
- Config or feature flag changes cannot be reviewed without credentials or private endpoints.
- Migration rollback, data compensation, or compatibility is undefined for a data-bearing release.
- Monitoring ownership or post-deploy observation is missing for a user-impacting release.
- Release notes or support handoff are required but missing for a user-facing change.
