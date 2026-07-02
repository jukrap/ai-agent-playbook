# Deployment Release

Inputs: release scope, target environment, artifact 또는 image, migration needs, rollback path, post-deploy check.

Outputs: release gate checklist, deploy/rollback note, verification evidence, 필요 시 incident 또는 handoff note.

Skills: deployment release check, runtime packaging 변경 시 container change safety, production symptom에는 observability incident triage.

Tools: `dependency-inventory`, `diagnostics check`, `operator preflight`, `write-gate preview`, 가능한 경우 CI/deploy log.

Stop conditions: rollback path 누락, 검토되지 않은 migration gate, 사용할 수 없는 deploy credential, production risk owner 불명확.

Verification: build artifact 또는 image identity, CI status, migration gate, smoke check, log/metric/trace, rollback readiness.

