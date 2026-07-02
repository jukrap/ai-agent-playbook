# Deployment Release

Inputs: release scope, target environment, artifact or image, migration needs, rollback path, post-deploy checks.

Outputs: release gate checklist, deploy and rollback notes, verification evidence, incident or handoff note when needed.

Skills: deployment release check, container change safety when runtime packaging changes, observability incident triage for production symptoms.

Tools: `dependency-inventory`, `diagnostics check`, `operator preflight`, `write-gate preview`, CI/deploy logs when available.

Stop conditions: missing rollback path, unreviewed migration gate, unavailable deploy credentials, unclear owner for production risk.

Verification: build artifact or image identity, CI status, migration gate, smoke checks, logs/metrics/traces, rollback readiness.

