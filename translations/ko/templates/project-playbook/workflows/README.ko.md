# Workflows

반복 가능한 작업 패턴을 이곳에 둡니다.

재사용 절차는 `recipes/`, 프로젝트별 운영 절차는 `runbooks/`, 예정 작업은 `plans/`, active run ledger는 `runs/`, 완료 기록은 `worklogs/`, 인계 메모는 `handoffs/`를 사용합니다.

Structured automation plan은 Markdown과 `workflow.plan.v2` JSON sidecar를 함께 둡니다. Schema v2 run directory와 append-only ledger는 controller가 관리합니다. `automation status`로 확인하고 이전 attempt를 숨기기 위해 derived state를 다시 쓰지 않습니다.
