# 경계 재설계 프로토콜

코드베이스에 아키텍처 정리, FSD 도입, DDD/module 재구성, 패키지 경계 복구, 더 큰 디렉터리 재구성이 필요할 수 있을 때 이 참고 자료를 사용합니다.

## 첫 확인

- 이름 있는 패턴을 적용하기 전에 현재 아키텍처를 코드에서 읽습니다.
- 진입점, 기능 영역, 도메인 개념, shared utility, 데이터 접근, UI 표면, 빌드 패키지, 배포 경계를 식별합니다.
- 문서와 코드가 다르면 코드와 현재 테스트를 운영상 진실로 보고, 문서 드리프트를 기록합니다.
- import, 공개 API, 라우트 소유권, 데이터베이스 소유권, package manifest, test fixture 같은 경계 증거를 path와 함께 표시합니다.

## 패턴 적합성

| 패턴 | 사용할 때 | 피할 때 |
|---|---|---|
| FSD | 프론트엔드 기능, 페이지, 엔티티, shared UI/lib 경계가 이미 일부 보이거나 slice 단위로 도입할 수 있을 때. | 백엔드 전용 코드, 작은 앱, 명시적 프론트엔드 레이어를 원하지 않는 팀. |
| 레이어드 아키텍처 | controller/service/repository/domain/infrastructure 역할이 있고 주된 결합 문제가 의존 방향 위반일 때. | domain behavior가 레이어 이름을 붙일 만큼 안정적이지 않을 때. |
| DDD 모듈 | 비즈니스 개념, invariant, aggregate, bounded context가 변경의 중심일 때. | 시스템이 주로 CRUD, integration glue, reporting이고 강한 domain rule이 없을 때. |
| Monorepo package | ownership, build boundary, release cadence, dependency direction을 강제해야 할 때. | package split이 독립 build/test 가치 없이 폴더만 복제할 때. |
| 레거시 경계 격리 | 바꾸기 어려운 legacy code가 위험이고 깔끔한 새 구조보다 compatibility boundary가 중요할 때. | 팀이 legacy surface를 적극 교체 중이고 큰 이동을 감당할 수 있을 때. |

## 재설계 결정

- 문제가 잘못 배치된 import, helper, file 한두 개라면 로컬 패턴을 유지합니다.
- 의존 방향은 대체로 맞지만 한 표면이 data, UI, request state, infrastructure detail을 새게 한다면 경계를 복구합니다.
- 여러 변경이 같은 경계 결정을 반복하게 되고 그 패턴을 작은 규칙으로 문서화할 수 있다면 이름 있는 패턴을 도입합니다.
- package split은 ownership, release, build, test, dependency, runtime isolation 중 하나를 실제로 제공할 때만 합니다.
- 현재 coupling이 여러 영역의 delivery, testability, ownership, safe rollout을 막을 때만 넓은 구조 개편을 제안합니다.

## 리팩터링 형태

- 동작 변경 전에 이동만 하는 변경이나 adapter-first commit을 우선합니다.
- 기존 caller가 넓으면 public API shim이나 compatibility wrapper를 유지합니다.
- 저장소에 architecture rule을 둘 lint/test 자리가 이미 있다면 boundary test나 import lint를 추가합니다.
- shared utility dumping ground를 만들지 않습니다. 최소 두 실제 owner가 같은 안정 동작을 필요로 할 때만 shared code로 올립니다.
- 새 아키텍처 규칙은 PR 설명에만 두지 말고 project docs에 기록합니다.

## 검증

- 검토 대상 경계의 import/dependency check.
- 이동하거나 wrapper를 둔 module의 기존 unit/integration/build test.
- old path, public import, package name, stale doc 검색.
- 이동의 영향을 받은 기본 entrypoint runtime smoke test.
- 넓은 구조 개편은 rollback path와 남은 tradeoff를 포함한 worklog 또는 ADR.
