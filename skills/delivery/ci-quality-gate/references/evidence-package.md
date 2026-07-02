# CI Quality Gate Evidence Package

## Required Fields

- Gate id and purpose.
- Change scope and target revision, tag, artifact, or release candidate.
- Required checks and optional checks.
- Check status table with pass, fail, skipped, unavailable, stale, or not-applicable.
- Source locator for every check: CI job URL or id, target-relative log path, runtime report path, command output note, or manual QA note.
- Environment: local, CI provider, preview, staging, production-like, device, browser, database, or package registry dry-run.
- Freshness: timestamp, revision, artifact digest, config version, or run id.
- Owner and expiry for every skip or unavailable required check.
- Residual risk and next verification command.

## Evidence Quality

- Prefer repository-defined commands and CI jobs over invented checks.
- Include failure owners and the first meaningful error for failed checks.
- Include retry count and flake classification for intermittent checks.
- Include generated runtime report paths, but do not treat generated reports as durable memory.
- Use target-relative paths for local logs and artifacts.
- Do not include credentials, private URLs, personal absolute paths, or long raw logs in public handoffs.

## Handoff Shape

Use a compact table:

| Check | Required | Status | Evidence locator | Owner | Risk |
| --- | --- | --- | --- | --- | --- |
| lint | yes | pass | CI job or command output locator | build owner | none |
| e2e | yes | skipped | skip record and compensating smoke test | feature owner | route not covered |

Then add:

- Gate decision: pass, blocked, advisory-only, or accepted-risk.
- Blocking checks.
- Skipped or unavailable checks.
- Commands already run.
- Commands still recommended.
- Residual risk and rollback or containment note when release-facing.
