# CI Quality Gate

Inputs: change scope, target branch or release surface, required checks, optional checks, CI status, local command output, artifacts, environment, owner, skip policy.

Outputs: gate decision, check status table, blocked checks, skipped or unavailable checks, evidence locator package, residual risk, next verification commands.

Skills: ci quality gate, test verification strategy, ci failure triage when a check fails, flaky test triage when a check is intermittent, git/worklog guardrails.

Tools: `diagnostics check`, `dependency-inventory`, `workflow run-preview`, `runtime schema-check`, `evidence locator-check`, `operator search`, `operator audit`, `write-gate preview` before proposing edits.

Stop conditions: unknown required checks, CI status not tied to the reviewed revision, missing logs or artifacts for a claimed result, required check skipped without owner and expiry, credentials or external systems required but unavailable, retrying a flaky check without limit.

Verification: verify required checks against project-defined commands or CI evidence, classify every expected check, validate evidence locators for generated reports, record skipped/unavailable checks with owner and residual risk.
