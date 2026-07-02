# Deployment Release

Inputs: release scope, target environment, artifact or image, config or feature flag diff, migration needs, rollback path, release notes status, post-deploy checks.

Outputs: release gate decision, artifact identity evidence, deploy and rollback notes, config/migration gate summary, release notes status, verification evidence, incident or handoff note when needed.

Skills: deployment release check, CI quality gate, container change safety when runtime packaging changes, observability incident triage for production symptoms.

Tools: `dependency-inventory`, `diagnostics check`, `operator search`, `route-api-hints`, `runtime schema-check`, `evidence locator-check`, `canon check`, `operator preflight`, `write-gate preview`, CI/deploy logs when available.

Stop conditions: artifact identity cannot be tied to verified source, missing rollback path, unreviewed migration or config gate, unavailable deploy credentials, unclear owner for production risk, missing release notes or support handoff when user-facing.

Verification: build artifact or image identity, CI quality gate, config diff, migration gate, smoke checks, logs/metrics/traces, release notes status, rollback readiness.
