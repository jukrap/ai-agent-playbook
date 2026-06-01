# Project Documentation Roles

## 권장 파일

- `AGENTS.md`: AI working agreements, verification, git/worklog rules.
- `README.md`: public setup and run guide.
- `PROJECT_SPEC.md`: product goal, screens, feature scope, API/data policies.
- `PLANS.md`: milestone order, completion criteria, verification commands.
- `FSD.md`: architecture boundary rules when relevant.
- `docs/plans/README.md`: local docs index and reading order.
- `docs/plans/CONVENTIONS.md`: code conventions proven by the repo.
- `docs/plans/AGENT_SKILL_USAGE.md`: skill selection policy.
- `docs/worklog/**`: milestone/blocker/direction-change records.
- `design-docs/**`, `_reference/**`: secondary references.

## Source-of-truth priority

1. Latest user instruction.
2. Actual code and config.
3. Project-specific planning/spec docs.
4. Nearest `AGENTS.md`.
5. Global working guide.
6. Old references.

## Cleanup rules

- 오래된 handoff에서는 재사용 가능한 process만 추출하고, 날짜가 박힌 status는 active policy로 만들지 않습니다.
- Stack-specific guidance는 profiles 또는 architecture docs 안에 둡니다.
- 프로젝트가 요구하면 local-only docs를 commit에서 제외합니다.
- 흩어진 반복 지침보다 하나의 index document를 선호합니다.
