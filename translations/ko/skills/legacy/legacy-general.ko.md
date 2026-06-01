# Legacy General

runtime flow가 불명확하고 오래된 convention, hidden coupling, 약한 tests, 섞인 documentation이 있는 legacy codebase를 유지보수/확장할 때 사용합니다.

## Workflow

1. 실제 entrypoints, build/deploy flow, runtime files, active docs를 식별합니다.
2. architecture 변경을 제안하기 전에 현재 behavior를 추적합니다.
3. shared selectors, globals, templates, DTOs, config keys, side effects를 검색합니다.
4. 요청을 해결하는 가장 작고 좁은 변경을 만듭니다.
5. project commands 또는 explicit manual scenarios로 검증합니다.
6. blockers, hidden coupling, residual risk를 필요하면 worklog/PR에 기록합니다.

## Guardrails

- 코드가 오래돼 보인다는 이유만으로 rewrite하지 않습니다.
- runtime flow 밖이라는 증거 없이 "unused" code를 삭제하지 않습니다.
- 이름만 보고 backend contract 또는 deployment path를 추론하지 않습니다.
- 관련 없는 사용자 변경을 보존합니다.
- architectural purity보다 현재 운영과의 호환성을 우선합니다.
