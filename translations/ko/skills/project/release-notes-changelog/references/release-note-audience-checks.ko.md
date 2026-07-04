# Release Note Audience Checks

누가 읽는지에 따라 구조와 상세도를 정합니다.

## Reader 유형

- End user: 무엇이 바뀌었는지, 왜 중요한지, 어떻게 쓰는지, limitation, support path.
- Support 또는 operations: symptom, rollout window, alert, known issue, mitigation, escalation path.
- Developer: API/schema/config change, migration step, compatibility, deprecation, test evidence.
- Stakeholder: outcome, scope, risk, readiness, unresolved decision, rollout 또는 follow-up.
- Maintainer: changed surface, operational caveat, cleanup need, rollback, archive path.

## Content 규칙

- 내부 구현 순서가 아니라 관찰 가능한 impact를 먼저 씁니다.
- 관련 변경을 묶고, 프로젝트가 원하지 않는 한 raw commit list를 피합니다.
- Known issue와 limitation을 명확히 씁니다.
- Source evidence가 검토된 경우에만 migration 또는 upgrade action을 이름 붙입니다.
- 실제로 실행한 verification result만 포함합니다.
- 필요하면 durable docs 또는 worklog를 가리키되 noisy output을 붙여 넣지 않습니다.

## Artifact 유형

- Release notes: user-facing 또는 stakeholder-facing change summary.
- Changelog: 보통 added/changed/fixed/removed/security로 묶는 durable internal history.
- Migration notes: step, compatibility window, ordering, rollback, validation.
- Upgrade notes: version constraint, config change, deprecation, support path.
- Known issues: active caveat, impact, mitigation, owner, review date.

## 중단 조건

- Source evidence 없이 release가 있었다고 주장합니다.
- 검증하지 않은 test, environment, device, rollout status를 포함합니다.
- Private project value, branch name, PR number, credential, internal URL을 노출합니다.
