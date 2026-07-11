# Forge Automation

Inputs: approved automation plan and sidecar, acceptance criteria, dependency order, verification commands, permission profile, forge remote, ready and pause labels, executor policy, run budget, and deny overrides.

Outputs: resumable run ledger, derived task state, local evidence, synchronized issues and milestones when permitted, managed branch and draft pull request when permitted, blockers, reconciliation decisions, and final handoff.

Skills: forge automation control, issue planning triage, agent orchestration handoff, pre-action fact gate, evidence locator integrity, test verification strategy, git worklog guardrails.

Tools: `plan validate`, `forge status`, `forge bootstrap`, `forge sync`, `forge reconcile`, `automation doctor`, `automation start`, `automation tick`, `automation supervise`, `automation status`, `automation pause`, `automation resume`, `automation stop`, `automation schedule`, and project-defined verification commands.

Stop conditions: unapproved plan, missing acceptance criteria, unknown provider with requested writes, insufficient permission, active kill switch or pause label, changed remote requirements, stale or conflicting lease, dirty unattended base, exhausted retry or wall-time budget, repeated no-progress ticks, failed controller verification, or approval-bound Git action.

Verification: structured plan validation, provider capability and permission report, deterministic task ordering, single-controller lease evidence, acceptance-criteria progress, controller-run command results, remote idempotency check, secret redaction check, user checkout preservation, and resumable final checkpoint.
