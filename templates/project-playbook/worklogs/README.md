# Worklogs

Worklogs preserve detailed reasoning, blockers, verification, and direction changes.

## Layout

```text
worklogs/
  README.md
  YYYY-MM/
    YYYY-MM-DD-short-topic.md
  summaries/
    YYYY-MM.md
```

## Write a worklog for

- milestone completion
- blocker or repeated failure
- major direction change
- long debugging with useful cause analysis
- API contract, deployment, native, printing, permission, or data-shape changes

## Rules

- Keep worklogs detailed enough for a future agent to recover context.
- Explain problem, decision path, evidence, verification, and remaining risk.
- Do not reduce worklogs to commit-message-sized summaries when the project relies on them as durable context.
- Promote still-current facts into `../CURRENT.md`, `../maps/`, `../runbooks/`, or `../decisions/`.

