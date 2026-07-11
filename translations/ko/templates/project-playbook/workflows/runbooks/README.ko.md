# Runbooks

Runbook에는 반복 가능한 command와 operational procedure를 둡니다.

유용한 runbook:

- `setup.md`: local setup, environment variables, first run.
- `verification.md`: lint, test, build, browser, mobile, manual QA commands.
- `git.md`: branch, commit, PR, release, rollback workflow.
- `deploy.md`: deployment, packaging, handoff steps.
- `debugging.md`: known logs, traces, fixtures, reproduction loops.
- `forge-automation.md`: forge preflight, 재개 가능한 run, scheduler opt-in, pause, reconcile, recovery, completion evidence.

## Rules

- project config나 verified shell output에서 확인한 command를 선호합니다.
- secret은 runbook에 넣지 않고 얻는 위치만 설명합니다.
- server, port, temporary files, generated artifacts에 대한 cleanup step을 포함합니다.
