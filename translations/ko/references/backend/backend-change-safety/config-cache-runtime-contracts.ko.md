# 설정, 캐시, 런타임 계약

Environment variable, feature flag, runtime default, cache behavior, process startup, operational toggle을 바꿀 때 사용합니다.

## 목록

- 설정 원본: environment, config file, secret store, database setting, feature flag, CLI flag, build-time constant, default value.
- 런타임 범위: process startup, request time, job worker, scheduler, browser bundle, test fixture, container, serverless invocation.
- 캐시 범위: memory, distributed cache, browser cache, CDN, ORM/query cache, materialization, search index, generated artifact.
- 운영자: local developer, CI, staging, production, support, migration job, rollback owner.

## 계약 규칙

- 이름, 타입, 기본값, 필수 여부, 실패 동작은 설정 계약의 일부입니다.
- Production behavior에 영향을 주는 default를 rollout/rollback note 없이 조용히 바꾸지 않습니다.
- Build-time value와 runtime value를 분리하고, secret이나 환경별 값을 browser bundle에 넣지 않습니다.
- Feature flag에는 owner, default state, target scope, cleanup expectation, observability signal이 필요합니다.
- Cache key에는 값을 바꾸는 모든 input과 공존 가능한 compatibility dimension을 포함합니다.
- Cache invalidation에는 trigger, propagation delay, stale-read tolerance, manual repair path를 명시합니다.

## 실패 모드

- Worker와 web process가 서로 다른 config를 읽습니다.
- Test는 default 때문에 통과하지만 production setting은 빠져 있습니다.
- Cache가 schema나 permission 변경 뒤에도 살아남아 stale data를 노출합니다.
- Feature flag rollback이 database나 external side effect를 되돌리지 못합니다.
- Config parsing failure가 job이나 CLI 같은 특정 runtime mode에서만 터집니다.

## 검증

- Missing, malformed, deprecated setting에 대한 config validation 또는 startup check.
- 변경된 input과 permission을 포함한 cache hit/miss 또는 invalidation test.
- Flag on/off behavior, observability, cleanup path 확인.
- 새 설정, 기본값, secret 요구사항, rollback behavior를 deployment note에 기록.
- Post-deploy에서 error rate, cache miss storm, queue lag, unexpected flag exposure 확인.
