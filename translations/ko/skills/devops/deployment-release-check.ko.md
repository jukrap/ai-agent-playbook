# Deployment Release Check

Release readiness와 deploy/rollback review를 위한 primary DevOps skill입니다.

## Workflow

1. Artifact, environment, release mechanism, migration/config/feature-flag gate, rollback path를 확인합니다.
2. 단일 green status에 의존하지 않고 source, build, package, deploy, data, operational evidence 기준으로 readiness를 확인합니다.
3. Exact release path 또는 가장 가까운 repository-defined dry-run을 검증한 뒤 residual risk와 post-deploy check를 기록합니다.
4. Rollback을 나중에 생각할 항목이 아니라 release의 일부로 다룹니다.

## Reference

Release 또는 deployment를 승인하기 전에 `references/release-gates.md`를 읽습니다.

Deploy가 artifact, data, config, feature flag, runtime topology를 바꾸면 `references/rollback-readiness.md`를 읽습니다.
