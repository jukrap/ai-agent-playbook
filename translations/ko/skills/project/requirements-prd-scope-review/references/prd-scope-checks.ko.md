# PRD Scope Checks

요청을 구현 준비 완료 상태로 보기 전에 이 체크리스트를 사용합니다.

## 산출물 적합성

- PRD: product outcome, user, workflow, constraint, success metric, rollout, risk, open decision.
- Lightweight spec: bounded change의 알려진 behavior, interface, state, constraint, verification.
- Scope brief: 포함 범위, 제외 범위, decision owner, 누락된 evidence.
- Open-question list: unresolved product, data, API, security, compliance, operations, ownership question.

## 필수 섹션

- Problem 또는 goal: 작업의 user-visible 또는 business 이유.
- Audience 또는 persona: 혜택을 받는 사람, 운영자, 검토자.
- Current behavior: 관찰된 source, screen, workflow, data, policy evidence.
- Proposed behavior: 외부에서 보이는 behavior, state, constraint.
- Non-goals: scope creep를 막는 명시적 제외 항목.
- Dependencies: system, team, data source, approval, release gate, migration, design asset.
- Risks: compatibility, security, privacy, data integrity, operations, migration, UX, support risk.
- Verification: 변경을 확인하는 방법과 manual/unverified로 남는 부분.
- Owner and status: draft, reviewed, approved, deferred, superseded, archived.

## Evidence 규칙

- Raw transcript, generated summary, runtime report는 검토 전까지 provisional evidence로 둡니다.
- Noisy reference name이나 personal path가 아니라 검토된 source evidence에 연결합니다.
- Field, endpoint, role, table, event, environment에 대한 추측을 requirement로 바꾸지 않습니다.
- Source가 불명확하면 owner가 있는 open question으로 씁니다.

## 중단 조건

- 요청 결과가 현재 product 또는 policy docs와 충돌합니다.
- 필수 user/data/API/security ownership이 불명확합니다.
- Acceptance criteria가 확인되지 않은 구현 세부사항에 의존합니다.
- Artifact가 private path, credential, internal URL, branch name, PR number, raw reference excerpt를 노출합니다.
