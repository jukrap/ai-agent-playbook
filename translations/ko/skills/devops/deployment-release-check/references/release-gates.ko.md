# Release Gates

## Inventory

- Artifact: package, image, static bundle, serverless bundle, mobile build, CLI, plugin, migration bundle, configuration bundle.
- Gate source: CI status, test, build, package dry-run, generated artifact diff, dependency scan, SBOM/license check, deployment preview, manual approval.
- Environment: target environment, config source, secret, feature flag, data migration, queue, scheduled job, downstream dependency.
- Documentation: changelog, release note, runbook, rollout plan, verification plan, known residual risk.

## Review

- Deploy되는 artifact가 build되고 검증된 artifact와 같은지 확인합니다.
- Version, tag, digest, changelog, migration version, config version alignment를 확인합니다.
- Dependency, container, package 변경이 release-critical supply-chain에 주는 영향을 검토합니다.
- Database migration, background job, queue, cache invalidation, feature flag를 보조 메모가 아니라 release gate로 확인합니다.
- 어떤 check가 blocking, advisory, skipped, unavailable인지 식별합니다. Missing check를 조용히 pass로 취급하지 않습니다.
- Release scope를 rollback plan과 post-deploy check와 비교합니다.

## Verification

- 같은 commit에 대한 repository-defined test/build/package command 또는 CI evidence.
- 가능한 경우 package 또는 deploy dry-run.
- Data change가 있으면 migration dry-run 또는 reversible migration review.
- Release의 주요 user 또는 service path를 덮는 smoke test.
- Health, log, error rate, latency, queue depth, scheduled job status, critical metric에 대한 post-deploy check.

## Stop Conditions

- Artifact identity를 verified source revision에 연결할 수 없습니다.
- Migration/config/feature flag state가 불명확합니다.
- User-impacting release에 rollback 또는 containment path가 없습니다.
- Required check가 없고 residual risk를 누군가 명시적으로 수용하지 않았습니다.
