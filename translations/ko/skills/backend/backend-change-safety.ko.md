# Backend Change Safety

API 매핑이나 서버 렌더링 흐름에만 국한되지 않는 서버 측 변경을 다룰 때 쓰는 기본 백엔드 스킬입니다.

## 작업 흐름

1. 수정 전에 진입점, 소유자, 실행 방식, 데이터 저장소, 부수 효과, 하위 소비자를 확인합니다.
2. 변경을 추가형, 호환형, 동작 변경형, 파괴적 변경, 운영 변경, 연동 노출 변경 중 하나로 분류합니다.
3. 컨트롤러, 서비스, 저장소 계층, worker, 설정, 모듈 진입점의 기존 책임 경계를 유지합니다.
4. 요청 경로, 비동기 경로, 재시도와 멱등성, 권한, 설정, 로그와 지표, rollback 형태를 검증합니다.
5. 요청 파싱, 검증, 클라이언트에 보이는 오류 변경에는 `request-validation-error-contract`를 사용합니다.
6. 잡, 워커, 큐, 스케줄러, 재시도, 데드레터 경로에는 `job-worker-reliability`를 사용합니다.
7. 저장소 스택이 확인된 뒤에만 `references/stacks/`의 해당 스택 프로필을 읽습니다.

## 참고 자료

공유 런타임, 영속성, 연동 위험이 있는 백엔드 변경을 구현하거나 검토하기 전 `references/backend-change-checklist.md`를 읽습니다.

저장소 스택이 확인되었고 Java, Kotlin, Node, Python, Go, .NET, PHP 프로필 중 무엇을 고를지 정해야 할 때 `references/stack-profile-selection.md`를 읽습니다.

worker, queue, scheduled job, webhook, retry, duplicate delivery 안전성은 `references/async-boundary-idempotency.md`를 읽습니다.
