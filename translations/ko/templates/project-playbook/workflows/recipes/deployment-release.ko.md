# Deployment Release

Inputs: release scope, target environment, artifact 또는 image, config 또는 feature flag diff, migration needs, rollback path, release notes status, post-deploy check.

Outputs: release gate decision, artifact identity evidence, deploy/rollback note, config/migration gate summary, release notes status, verification evidence, 필요 시 incident 또는 handoff note.

Skills: deployment release check, CI quality gate, runtime packaging 변경 시 container change safety, production symptom에는 observability incident triage.

Tools: `dependency-inventory`, `diagnostics check`, `operator search`, `route-api-hints`, `runtime schema-check`, `evidence locator-check`, `canon check`, `operator preflight`, `write-gate preview`, 가능한 경우 CI/deploy log.

Stop conditions: artifact identity를 verified source에 연결할 수 없음, rollback path 누락, 검토되지 않은 migration/config gate, 사용할 수 없는 deploy credential, production risk owner 불명확, user-facing change의 release note/support handoff 누락.

Verification: build artifact 또는 image identity, CI quality gate, config diff, migration gate, smoke check, log/metric/trace, release notes status, rollback readiness.
