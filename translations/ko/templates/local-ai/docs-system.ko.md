# Project Docs System

프로젝트별 AI 문서를 정리할 때 사용합니다.

## 문서 역할

- `AGENTS.md`: agent workflow, verification, commit, collaboration rules.
- `README.md`: 신규 개발자를 위한 공개 setup/run guide.
- `PROJECT_SPEC.md`: product goals, feature/screen scope, API/data policy.
- `PLANS.md`: milestone order, completion criteria, verification commands.
- `FSD.md`: 필요할 때 FSD 또는 architecture boundary rules.
- `docs/plans/README.md`: local planning docs index와 reading order.
- `docs/plans/CONVENTIONS.md`: coding conventions.
- `docs/plans/AGENT_SKILL_USAGE.md`: 어떤 skill을 언제 쓸지.
- `docs/plans/TEMPLATES.md`: 반복 가능한 slice/task templates.
- `docs/worklog/**`: milestone completion, blockers, major direction changes.
- `design-docs/**`, `_reference/**`: secondary references.

## Source of truth

1. 최신 사용자 지시.
2. 실제 코드와 config.
3. 프로젝트별 specification/planning docs.
4. 가장 가까운 하위 `AGENTS.md`.
5. global working rules.
6. old references.

Docs와 code가 다르면 code를 확인하고 docs update 필요성을 명시합니다.

## Local-only policy

AI working notes, worklogs, internal planning, design sources, experiments는 local-only일 수 있습니다. 프로젝트가 local-only로 표시한 파일은 커밋하지 않습니다.

권장 guard:

```bash
git diff --cached --name-only
git ls-files '*.md' 'docs/*' 'design-docs/*' '_reference/*'
```

local-only 파일을 막는 hook을 우회하지 않습니다.

## 정리 규칙

- `AGENTS.md`는 how to work에 집중합니다.
- 제품 요구사항은 `PROJECT_SPEC.md`에 둡니다.
- milestone과 verification criteria는 `PLANS.md`에 둡니다.
- 날짜가 박힌 handoff와 prompt는 active policy가 아니라 reference로 둡니다.
- 같은 규칙을 여러 파일에 반복하지 말고 index document에서 연결합니다.
