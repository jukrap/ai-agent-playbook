# 실패 신호 진단

CI 작업, 빌드 파이프라인, 배포 점검, 릴리스 자동화가 실패할 때 사용합니다.

## 읽는 순서

1. 작업 이름과 trigger event.
2. 정확한 실패 명령.
3. 반복 stack noise 위에 있는 처음 의미 있는 오류.
4. 환경: OS, runtime, package manager, cache key, secret availability, service dependency.
5. 코드, 테스트, lockfile, 설정, workflow 파일, 배포 manifest를 건드린 최근 diff.

## 분류

- 코드: 컴파일, 타입 오류, lint, runtime exception, 바뀐 동작.
- 테스트: assertion mismatch, fixture drift, flaky ordering, timeout, environment assumption.
- 의존성: lockfile drift, registry outage, transitive version, native build, missing binary.
- 환경: OS image, runtime version, path, permission, locale, timezone, browser/device availability.
- 캐시: stale artifact, wrong key, partial restore, generated output, build cache poisoning.
- 비밀값: missing token, permission scope, expired credential, masked value, environment mismatch.
- 외부: third-party outage, rate limit, network failure, deployment platform incident.

## 수정 전략

- 명령과 환경이 있으면 로컬에서 재현합니다.
- 첫 번째 실제 실패를 다루는 가장 좁은 수정을 선호합니다.
- 근거나 가설이 바뀌지 않았는데 반복 재실행만 하지 않습니다.
- 코드나 테스트 실패를 숨기려고 workflow 설정을 바꾸지 않습니다.
- 캐시가 현재 가장 유력한 가설이 아니라면 cache 삭제를 우선하지 않습니다.

## 검증

- 실패한 명령 또는 가장 신뢰할 수 있는 대체 명령을 다시 실행합니다.
- 로컬 재현이 불가능하면 빠진 환경을 문서화하고 가장 가까운 결정적 부분을 검증합니다.
- flaky test는 timing 변경이나 quarantine 정책 변경 전에 충분한 반복 근거를 수집합니다.
- 의존성 실패는 lockfile과 package manager 동작을 확인합니다.
- 비밀값이나 외부 실패에서는 secret value를 로그나 문서에 노출하지 않습니다.
