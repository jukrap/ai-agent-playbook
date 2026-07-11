---
name: forge-automation-control
description: Use when coordinating or automating resumable work through GitHub or Gitea issues, pull requests, actions, scheduled ticks, or local fallback runs.
---

# Forge Automation Control

Use this skill to make forge-backed work resumable, reviewable, and safe when no forge is available.

## Workflow

1. Inspect repository state, remotes, authentication, configured provider, and the current deny flags before proposing any remote write.
2. Resolve the effective permission profile. Apply the most restrictive user instruction, project setting, CLI flag, and provider capability.
3. Validate an approved structured plan, then queue only plan-created tasks or existing issues carrying the configured ready label.
4. Run one idempotent tick at a time: claim one ready task, execute it within budget, rerun verification in the controller, record evidence, and checkpoint state.
5. Synchronize only meaningful transitions, blockers, reconciliation requests, and final verification. Reuse managed issues, marker comments, branches, and draft pull requests.
6. Pause when requirements change during execution, a lease or permission is uncertain, verification fails repeatedly, or a high-risk action needs approval.
7. Fall back to the local ledger when remote access is unavailable or denied. Never treat remote synchronization as a prerequisite for local progress.

## Safety Boundaries

- Keep merge, release, delete, force-push, and protected-branch writes approval-bound in every profile.
- Keep forge credentials out of configuration, prompts, worker environments, ledgers, evidence, and logs.
- Do not let a worker push or mutate forge state; the controller reviews files and verification before delivery.
- Preserve the user's working checkout. Use a managed isolated checkout for unattended execution.

## Related Skills

- Use `issue-planning-triage` to split an approved plan into independently reviewable child issues and to classify pre-existing ready-label work.
- Use `agent-orchestration-handoff` when executor or review workers need bounded contracts, evidence ownership, and reconciliation handoff.
- Use `git-worklog-guardrails` before controller staging, commit, push, draft pull request, or durable worklog updates.

## References

Read `references/provider-capabilities.md` when detecting GitHub or Gitea, planning remote artifacts, or choosing a capability fallback.

Read `references/state-and-permissions.md` when resolving task transitions, queue labels, progress, permission profiles, deny flags, or approval gates.

Read `references/scheduler-and-recovery.md` when configuring ticks, supervisors, Actions, local schedulers, leases, crash recovery, or unattended Git delivery.
