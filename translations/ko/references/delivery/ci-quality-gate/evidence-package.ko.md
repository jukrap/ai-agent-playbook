# CI Quality Gate Evidence Package

## Required Fields

- Gate id와 purpose.
- Change scope와 target revision, tag, artifact, release candidate.
- Required checks와 optional checks.
- pass, fail, skipped, unavailable, stale, not-applicable 상태가 있는 check status table.
- 모든 check의 source locator: CI job URL/id, target-relative log path, runtime report path, command output note, manual QA note.
- Environment: local, CI provider, preview, staging, production-like, device, browser, database, package registry dry-run.
- Freshness: timestamp, revision, artifact digest, config version, run id.
- 모든 skipped 또는 unavailable required check의 owner와 expiry.
- Residual risk와 next verification command.

## Evidence Quality

- 임의로 만든 check보다 repository-defined command와 CI job을 우선합니다.
- Failed check에는 failure owner와 first meaningful error를 포함합니다.
- Intermittent check에는 retry count와 flake classification을 포함합니다.
- Generated runtime report path는 포함하되, generated report를 durable memory로 취급하지 않습니다.
- Local log와 artifact에는 target-relative path를 사용합니다.
- Credential, private URL, personal absolute path, 긴 raw log를 public handoff에 넣지 않습니다.

## Handoff Shape

Compact table을 사용합니다.

| Check | Required | Status | Evidence locator | Owner | Risk |
| --- | --- | --- | --- | --- | --- |
| lint | yes | pass | CI job 또는 command output locator | build owner | none |
| e2e | yes | skipped | skip record와 compensating smoke test | feature owner | route not covered |

그 다음 다음 항목을 추가합니다.

- Gate decision: pass, blocked, advisory-only, accepted-risk.
- Blocking checks.
- Skipped 또는 unavailable checks.
- 이미 실행한 commands.
- 아직 권장되는 commands.
- Release-facing이면 residual risk와 rollback 또는 containment note.
