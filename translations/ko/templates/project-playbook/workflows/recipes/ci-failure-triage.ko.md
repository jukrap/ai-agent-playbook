# CI Failure Triage

Inputs: failing job, logs, recent diff, expected checks, environment details.

Outputs: failure classification, minimal fix 또는 escalation note, verified rerun command.

Skills: verification, cleanup, devops triage.

Tools: `diagnostics check`, `operator delta`, `operator search`, `operator audit`.

Stop conditions: log 누락, external outage, credential 필요, evidence 없는 nondeterministic failure.

Verification: 가능하면 로컬에서 재현하고, failing check 또는 가장 가까운 equivalent를 실행합니다.

