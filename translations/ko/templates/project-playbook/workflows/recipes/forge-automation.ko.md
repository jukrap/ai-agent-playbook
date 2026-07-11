# Forge Automation

Inputs: approved automation plan과 sidecar, acceptance criteria, dependency order, verification command, permission profile, forge remote, ready와 pause label, executor policy, run budget, deny override.

Outputs: resumable run ledger, derived task state, local evidence, 허용되는 경우 synchronized issue와 milestone, 허용되는 경우 managed branch와 draft pull request, blocker, reconciliation decision, final handoff.

Skills: forge automation control, issue planning triage, agent orchestration handoff, pre-action fact gate, evidence locator integrity, test verification strategy, git worklog guardrails.

Tools: `plan validate`, `forge status`, `forge bootstrap`, `forge sync`, `forge reconcile`, `automation doctor`, `automation start`, `automation tick`, `automation supervise`, `automation status`, `automation pause`, `automation resume`, `automation stop`, `automation schedule`, project-defined verification command.

Stop conditions: unapproved plan, acceptance criterion 누락, write가 요청된 unknown provider, insufficient permission, active kill switch 또는 pause label, changed remote requirement, stale 또는 conflicting lease, dirty unattended base, exhausted retry 또는 wall-time budget, repeated no-progress tick, failed controller verification, approval-bound Git action.

Verification: structured plan validation, provider capability와 permission report, deterministic task ordering, single-controller lease evidence, acceptance-criteria progress, controller가 실행한 command result, remote idempotency check, secret redaction check, user checkout 보존, resumable final checkpoint.
