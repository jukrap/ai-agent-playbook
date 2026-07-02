# CI Quality Gate

Inputs: change scope, target branch 또는 release surface, required checks, optional checks, CI status, local command output, artifacts, environment, owner, skip policy.

Outputs: gate decision, check status table, blocked checks, skipped 또는 unavailable checks, evidence locator package, residual risk, next verification commands.

Skills: ci quality gate, test verification strategy, check 실패 시 ci failure triage, check가 intermittent일 때 flaky test triage, git/worklog guardrails.

Tools: `diagnostics check`, `dependency-inventory`, `workflow run-preview`, `runtime schema-check`, `evidence locator-check`, `operator search`, `operator audit`, edit 제안 전 `write-gate preview`.

Stop conditions: required check unknown, CI status가 reviewed revision에 연결되지 않음, claimed result의 log 또는 artifact 누락, owner와 expiry 없는 required check skip, credential 또는 external system이 필요하지만 unavailable, limit 없이 flaky check retry.

Verification: project-defined command 또는 CI evidence 기준으로 required check를 검증하고, 모든 expected check를 분류하며, generated report evidence locator를 검증하고, skipped/unavailable check를 owner와 residual risk와 함께 기록합니다.
