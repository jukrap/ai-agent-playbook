# Issue Planning Triage

Incoming work를 plan 중복이나 acceptance criteria 손실 없이 scoped issue로 바꿉니다.

## 작업 흐름

1. Issue type을 확인합니다. bug, feature, chore, docs, research, spike, migration, release follow-up, support task 중 무엇인지 구분합니다.
2. Source evidence, user impact, current behavior, expected behavior, 별도 issue로 존재해야 하는 이유를 추출합니다.
3. File list나 구현 추측이 아니라 독립적으로 review 가능한 outcome 기준으로 나눕니다.
4. Acceptance criteria, verification, risk, dependency, owner, priority, blocked/unblocked status를 추가합니다.
5. 가능하면 PRD/spec/worklog evidence에 연결하되 raw transcript와 noisy generated output은 issue에서 제외합니다.
6. Issue가 한 reviewable unit보다 커지면 실행 세부사항은 plan 또는 workflow run으로 라우팅합니다.

## Reference

작업을 issue 또는 task batch로 나눌 때는 `references/issue-breakdown-checks.md`를 읽습니다.

Priority, risk, blocked status, follow-up order를 정할 때는 `references/triage-priority-and-dependencies.md`를 읽습니다.
