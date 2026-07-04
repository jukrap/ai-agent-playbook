# CI Quality Gate Model

## Inputs

- Change scope: files, packages, services, migrations, generated artifacts, docs, and release target.
- Gate owner: person or team allowed to accept residual risk.
- Required checks: checks that must pass before merge, release, handoff, publish, or deploy.
- Optional checks: useful checks that improve confidence but do not block by default.
- Skip policy: who can mark a check skipped, why, and how long the skip remains valid.
- Evidence source: CI job, local command, artifact report, runtime schema, manual QA, or release dry-run.

## Check Status

- `pass`: the named check ran against the intended scope and current revision.
- `fail`: the check ran and found a blocking problem.
- `skipped`: an expected check was intentionally skipped with owner and reason.
- `unavailable`: the check could not run because of outage, missing credential, missing fixture, or environment gap.
- `stale`: the check is older than the current revision, artifact, config, or target environment.
- `not-applicable`: the check does not apply to the change scope and the reason is recorded.

## Decision Rules

- Required `fail`, `unavailable`, or stale checks block the gate.
- Required `skipped` checks block unless the skip policy names an owner, reason, expiry, and compensating evidence.
- Optional check failures do not block automatically, but they must appear in residual risk when relevant.
- A green aggregate status is not enough. Name the commands, jobs, artifacts, and revision that were checked.
- Treat generated runtime reports as evidence candidates. Promote stable facts only after review.

## Stop Conditions

- Required checks are unknown or undocumented.
- CI status cannot be tied to the source revision or artifact under review.
- Logs, artifacts, or command output are missing for a claimed pass/fail.
- A required check needs credentials or external access that is not available.
- The gate owner is unknown and a blocking check is skipped or unavailable.
- The same flaky check outcome is being retried without a retry limit or stabilization plan.
