# Reader Handoff And Maintenance

Documentation package는 다음 reader가 무엇을 결정하거나 해야 하는지에 맞춰 구성합니다.

## Reader Modes

- Stakeholder: outcome, scope, status, risk, decision needed, timeline, next action.
- Developer: architecture, contract, setup, changed surface, command, verification, open question.
- Operator: runbook, deploy, rollback, monitoring, incident symptom, escalation, data repair.
- Analyst: metric definition, source data, grain, caveat, freshness, lineage, dashboard/report usage.
- Maintainer: ownership, update cadence, archive path, stale marker, related decision, cleanup debt.

## Handoff Sections

- Current state: 지금 무엇이 사실이고 언제 검토되었는지.
- Decision path: 중요한 alternative, 선택 이유, consequence.
- How to verify: command, check, manual review, dashboard, log, source file.
- How to update: owner, cadence, required reviewer, translation need, related file.
- How to archive: artifact가 obsolete가 되는 조건과 history 위치.
- Remaining risk: skipped check, open question, dependency, reader-specific caveat.

## Maintenance Rules

- One-time report를 promotion 없이 active guidance로 만들지 않습니다.
- Durable policy를 편집하기 전에 status change를 worklog 또는 release note에 기록합니다.
- Package가 현재 project rule을 바꾸면 참조하는 canonical docs를 갱신합니다.
- Translated docs가 있으면 같은 변경에서 번역을 갱신하거나 gap을 명시합니다.

## Common Mistakes

- 모든 audience를 위한 하나의 artifact를 작성합니다.
- Open question을 prose에 숨기고 owner와 next action을 적지 않습니다.
- Raw generated text를 durable docs에 복사합니다.
- Screenshot, report, export에 freshness와 source context를 남기지 않습니다.
