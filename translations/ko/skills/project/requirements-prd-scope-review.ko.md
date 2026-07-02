# Requirements PRD Scope Review

넓은 의도를 계약이나 구현 사실을 지어내지 않고 검토 가능한 범위로 바꿉니다.

## 작업 흐름

1. 산출물 유형을 확인합니다. PRD, lightweight spec, scope brief, acceptance criteria, open-question list 중 무엇인지 구분합니다.
2. 알려진 goal, user, workflow, constraint, non-goal, dependency, assumption, unknown을 분리합니다.
3. Product language, technical plan, worklog history, generated evidence가 섞였는지 확인합니다.
4. 추측한 구현 세부사항이 아니라 외부에서 관찰 가능한 동작으로 acceptance criteria를 정의합니다.
5. Source evidence가 이미 증명하지 않는 backend/API/data field는 open question으로 표시합니다.
6. Owner, decision status, verification expectation, 아직 durable memory가 되면 안 되는 내용을 기록합니다.

## Reference

PRD, spec, scope brief를 정리할 때는 `references/prd-scope-checks.md`를 읽습니다.

불명확한 요청을 testable criteria와 unresolved question으로 바꿀 때는 `references/acceptance-criteria-and-open-questions.md`를 읽습니다.
