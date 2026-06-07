# Worklogs

Worklog는 detailed reasoning, blocker, verification, direction change를 보존합니다.

## Layout

```text
worklogs/
  README.md
  YYYY-MM/
    YYYY-MM-DD-short-topic.md
  summaries/
    YYYY-MM.md
```

## Worklog를 쓰는 경우

- milestone completion
- blocker 또는 repeated failure
- major direction change
- useful cause analysis가 있는 long debugging
- API contract, deployment, native, printing, permission, data-shape changes

## Rules

- 미래 agent가 context를 회복할 수 있을 만큼 자세히 씁니다.
- problem, decision path, evidence, verification, remaining risk를 설명합니다.
- 프로젝트가 worklog를 durable context로 사용한다면 commit-message-sized summary로 줄이지 않습니다.
- 계속 현재인 사실은 `../CURRENT.md`, `../maps/`, `../runbooks/`, `../decisions/`로 승격합니다.
