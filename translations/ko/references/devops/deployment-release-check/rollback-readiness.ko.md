# Rollback Readiness

## Rollback Shape

- Artifact rollback: 이전 package, image, static bundle, function version을 다시 deploy합니다.
- Config rollback: 이전 env/config/secret/feature flag state를 복원합니다.
- Data rollback: migration reverse, backup restore, compensating migration, write path freeze.
- Traffic rollback: canary stop, route weight revert, DNS/ingress revert, queue drain, maintenance mode.

## Review

- Previous known-good artifact, config, data state를 명시합니다.
- Rollout과 rollback 중 new/old version이 함께 실행될 수 있는지 확인합니다.
- Irreversible step을 식별합니다: destructive migration, one-way data transform, external API side effect, emitted event, cache invalidation.
- User impact, health status, error rate, latency, queue depth, business-critical metric 기준 rollback trigger를 정의합니다.
- 누가 또는 무엇이 rollback을 실행할 수 있고 credential/permission이 있는지 확인합니다.

## Verification

- Project가 지원하면 rollback dry-run 또는 documented command.
- Data-bearing change에서는 restore 또는 backup check.
- Feature flag off-switch 또는 config revert check.
- 가능하면 non-production environment에서 rollback path 이후 smoke test.
- Residual data repair, reconciliation, customer-impact follow-up에 대한 handoff note.

## Stop Conditions

- Rollback이 이전 config 또는 artifact를 추측해야만 가능합니다.
- New data를 previous version이 읽을 수 없고 compatibility plan이 없습니다.
- External side effect를 contain 또는 reconcile할 수 없습니다.
- Time-sensitive release에서 rollback authority 또는 credential이 불명확합니다.
