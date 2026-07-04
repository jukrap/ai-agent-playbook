# Boundary Review

모듈과 레이어 경계를 검토할 때 쓰는 기본 아키텍처 스킬입니다.

## 작업 흐름

1. 코드, 문서, 패키지 배치, import에서 의도한 아키텍처 경계를 확인합니다.
2. 의존 방향, 공개 API, shared utility, 기능 소유권, 데이터 흐름을 점검합니다.
3. 새 아키텍처를 강요하기보다 로컬 관례를 우선합니다.
4. 사용자가 재설계를 요청한 경우가 아니라면 대규모 구조 변경보다 작은 경계 복구를 먼저 권합니다.

## 참고 자료

로컬 관례 유지, FSD/DDD/레이어드 규칙 적용, 패키지 분리, 더 큰 구조 개편을 판단해야 할 때 `references/boundary-redesign-protocol.md`를 읽습니다.

기능 단위, 계층형, 도메인 주도, 모듈형 모놀리스, 레거시 접점 방식 중 어느 접근이 맞는지 판단할 때 `references/fsd-ddd-fit-matrix.md`를 읽습니다.

경계 복구에 단계적 이동, 어댑터, 호환성 보조 계층, import/의존성 점검이 필요하면 `references/modular-boundary-migration.md`를 읽습니다.

모듈이 더 깊은 책임을 가져야 하는지, 대안 인터페이스를 비교해야 하는지, 얕은 추출이 복잡도만 옮길 위험이 있는지 평가할 때는 `references/deep-module-design-review.md`를 읽습니다.
