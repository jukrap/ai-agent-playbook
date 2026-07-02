# Feature Delivery

Inputs: requested behavior, affected files, acceptance criteria, verification commands.

Outputs: plan, implementation, run ledger, worklog, verified checks.

Skills: planning, implementation, verification, git/worklog guardrails.

Tools: `operator preflight`, `write-gate preview`, `run start`, `run record`.

Stop conditions: contract 누락, 알 수 없는 data shape, 안전하지 않은 unrelated diff, prerequisite 실패.

Verification: targeted test를 먼저 실행하고, 가능하면 lint/test/build로 넓힙니다.

