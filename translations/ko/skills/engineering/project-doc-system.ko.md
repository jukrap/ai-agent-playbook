# Project Doc System

프로젝트 AI docs를 만들거나 재정리하거나 review할 때 사용합니다.

## Workflow

1. 구조를 제안하기 전에 기존 docs와 git/local-only policy를 확인합니다.
2. `AGENTS.md`는 how to work에 집중하고, product scope는 `PROJECT_SPEC.md`, milestone은 `PLANS.md`로 옮깁니다.
3. architecture rule은 프로젝트가 실제로 그 architecture를 사용할 때만 dedicated doc에 둡니다.
4. 날짜가 박힌 prompt, handoff, worklog는 규칙이 여전히 현재형일 때만 active guidance로 승격합니다.
5. source-of-truth priority와 local-only commit policy를 문서화합니다.

## Reference

규칙을 어디에 둘지 정하거나 흩어진 markdown files를 통합할 때 `references/doc-roles.md`를 읽습니다.
