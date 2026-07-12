---
name: forge-automation-control
description: Use when coordinating or automating resumable work through GitHub or Gitea issues, pull requests, actions, scheduled ticks, or local fallback runs.
---

# Forge Automation Control

Use this skill to make forge-backed work resumable, reviewable, and safe when no forge is available.

## Workflow

1. Inspect repository state, remotes, authentication, configured provider, and the current deny flags before proposing any remote write.
2. Resolve the effective permission profile. Apply the most restrictive user instruction, project setting, CLI flag, and provider capability.
3. Validate an approved structured plan. Keep fine-grained execution tasks in the local ledger and publish reviewable delivery groups as issues; task-per-issue mode is an explicit legacy choice.
4. Run one idempotent tick at a time: claim one ready task, execute it within budget, rerun verification in the controller, record evidence, and checkpoint state.
5. Synchronize only meaningful transitions, blockers, reconciliation requests, and final verification. Reuse managed issues, marker comments, branches, and draft pull requests.
6. Pause when requirements change during execution, a lease or permission is uncertain, verification fails repeatedly, or a high-risk action needs approval.
7. Fall back to the local ledger when remote access is unavailable or denied. Never treat remote synchronization as a prerequisite for local progress.

## Safety Boundaries

- Keep merge, release, delete, force-push, and protected-branch writes approval-bound in every profile.
- Keep forge credentials out of configuration, prompts, worker environments, ledgers, evidence, and logs.
- Do not let a worker push or mutate forge state; the controller reviews files and verification before delivery.
- Preserve the user's working checkout. Use a managed isolated checkout for unattended execution.
- Do not invent a merge-first, release-first, or other gate that is absent from the approved plan. A merge approval may hold merge while branch implementation, verification, and a draft pull request continue.
- Pause before the first write when a configured GitHub Project requires a missing `project` scope. Show `gh auth refresh -s project` and the status recheck command; never run authentication refresh automatically.

## Related Skills

- Use `issue-planning-triage` to shape a roadmap into a small set of independently reviewable delivery-group issues and to classify pre-existing ready-label work. Keep finer execution tasks in the local ledger.
- Use `agent-orchestration-handoff` when executor or review workers need bounded contracts, evidence ownership, and reconciliation handoff.
- Use `git-worklog-guardrails` before controller staging, commit, push, draft pull request, or durable worklog updates.

## References

Read `references/provider-capabilities.md` when detecting GitHub or Gitea, planning remote artifacts, or choosing a capability fallback.

Read `references/state-and-permissions.md` when resolving task transitions, queue labels, progress, permission profiles, deny flags, or approval gates.

Read `references/scheduler-and-recovery.md` when configuring ticks, supervisors, Actions, local schedulers, leases, crash recovery, or unattended Git delivery.
