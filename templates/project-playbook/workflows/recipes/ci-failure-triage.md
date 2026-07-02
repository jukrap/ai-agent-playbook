# CI Failure Triage

Inputs: failing job, logs, recent diff, expected checks, environment details.

Outputs: failure classification, minimal fix or escalation note, verified rerun command.

Skills: verification, cleanup, devops triage.

Tools: `diagnostics check`, `operator delta`, `operator search`, `operator audit`.

Stop conditions: missing logs, external outage, credentials required, nondeterministic failure without evidence.

Verification: reproduce locally when possible, then run the failing check or nearest equivalent.

