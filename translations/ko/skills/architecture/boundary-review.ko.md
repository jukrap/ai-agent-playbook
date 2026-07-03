# Boundary Review

모듈과 레이어 경계를 검토할 때 쓰는 기본 아키텍처 스킬입니다.

## 작업 흐름

1. 코드, 문서, 패키지 배치, import에서 의도한 아키텍처 경계를 확인합니다.
2. 의존 방향, 공개 API, shared utility, 기능 소유권, 데이터 흐름을 점검합니다.
3. 새 아키텍처를 강요하기보다 로컬 관례를 우선합니다.
4. 사용자가 재설계를 요청한 경우가 아니라면 대규모 구조 변경보다 작은 경계 복구를 먼저 권합니다.

## 참고 자료

로컬 관례 유지, FSD/DDD/레이어드 규칙 적용, 패키지 분리, 더 큰 구조 개편을 판단해야 할 때 `references/boundary-redesign-protocol.md`를 읽습니다.

Feature-sliced, layered, domain-driven, modular monolith, legacy seam 중 어느 접근이 맞는지 판단할 때 `references/fsd-ddd-fit-matrix.md`를 읽습니다.

Boundary repair에 staged move, adapter, compatibility shim, import/dependency check가 필요하면 `references/modular-boundary-migration.md`를 읽습니다.
