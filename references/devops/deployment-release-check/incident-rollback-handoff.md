# Incident Rollback Handoff

Use this reference when a release, hotfix, rollback, or production issue needs a concise handoff for another operator.

## Handoff Fields

- Current state: deployed version, affected environment, affected users, start time, and severity.
- Trigger: release, config change, migration, dependency outage, traffic spike, data issue, or unknown.
- Evidence: failing checks, dashboard signals, logs, traces, support reports, and reproduction path.
- Containment: feature flag, rollback, traffic shift, queue pause, rate limit, config revert, or manual repair.
- Data risk: writes during incident, replay needs, backfill needs, cache/index repair, and audit requirements.
- Owner and next checkpoint: who decides next and when.

## Rollback Review

- Confirm rollback artifact or prior version is known and deployable.
- Confirm config, feature flags, migrations, queues, and cached data can return to a safe state.
- Confirm rollback will not double-apply jobs, payments, emails, webhooks, or data migrations.
- Confirm monitoring can prove rollback worked.
- If rollback is unsafe, define containment and forward-fix criteria.

## Verification

- Pre-rollback and post-rollback signal comparison.
- Smoke test for the user or service path that failed.
- Queue/job status if async work was involved.
- Data reconciliation or repair note when data was touched.
- Follow-up issue or worklog for permanent fix and test gap.
