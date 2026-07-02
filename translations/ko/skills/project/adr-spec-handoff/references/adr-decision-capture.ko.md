# ADR Decision Capture

## Inventory

- Decision: architecture, data model, integration, deployment, security, performance, UX, process, documentation policy.
- Context: problem, constraint, affected system, current behavior, considered option, forcing function.
- Status: proposed, accepted, superseded, deprecated, rejected, needs review.
- Reader: maintainer, reviewer, future agent, release owner, auditor, downstream team.

## Review

- ADR은 모든 구현 detail이 아니라 future work를 제약하는 decision을 capture해야 합니다.
- Background detail보다 먼저 decision을 한두 문장으로 직접 적습니다.
- Alternative는 실제로 고려한 option이어야 하며 strawman이 아니어야 합니다.
- Consequence에는 tradeoff, follow-up work, migration step, risk를 포함합니다.
- 긴 narrative보다 status와 supersession link가 중요합니다.
- Volatile operational status는 stable policy가 되기 전까지 worklog 또는 run note에 둡니다.

## Verification

- ADR이 current code, current docs, latest accepted plan과 모순되지 않는지 확인합니다.
- Raw chat log 대신 durable local doc 또는 portable evidence에 link합니다.
- Sensitive value, personal path, internal URL, branch name, PR number가 없는지 확인합니다.
- Decision이 rule을 바꾸면 관련 `AGENTS.md`, playbook policy, spec, runbook을 갱신합니다.

## Stop Conditions

- Decision이 실제로 settled 상태가 아닙니다.
- 문서가 decision record가 아니라 transcript summary가 됩니다.
- Alternative, consequence, affected boundary가 불명확합니다.
- ADR이 local-only note에 있어야 할 private operational detail을 담게 됩니다.
