---
name: ci-failure-triage
description: Use when diagnosing failing CI jobs, build pipelines, deployment checks, flaky tests, environment drift, or release automation failures.
---

# CI 실패 진단

파이프라인 실패를 다루는 기본 DevOps 스킬입니다.

## 진행 절차

1. 실패한 작업, 명령, 환경, 최근 diff, 처음 의미 있는 오류를 확보합니다.
2. 실패를 코드, 테스트, 의존성, 환경, 캐시, 비밀값, 외부 서비스 문제로 분류합니다.
3. 가능하면 로컬에서 재현하고 가장 좁은 fix를 만듭니다.
4. 실패한 명령 또는 신뢰할 수 있는 가장 가까운 대체 명령으로 검증합니다.

## 참고 자료

로그 순서, 원인 분류, 캐시/의존성 처리, 재실행 규칙은 `references/failure-signal-triage.md`를 읽습니다.
