# Forge Automation and Resumable Delivery

AI Agent Playbook uses a local execution ledger and a GitHub or Gitea collaboration surface for different kinds of truth. This document describes the current contract; release history belongs in `CHANGELOG.md`.

## Responsibility split

- The local ledger owns task state, attempts, leases, checkpoints, verification evidence, and resume facts.
- Issues represent a roadmap and independently reviewable delivery groups, not every internal task by default.
- GitHub Projects and Views present status, priority, risk, phase, and progress. Gitea uses milestone and status-label views when equivalent stable APIs are unavailable.
- Milestones track release or program completion.
- Pull requests carry actual code changes, verification, risk, rollback, and remaining work.

An approved structured plan may contain fine-grained task IDs while publishing one parent roadmap and at most a small set of delivery-group issues. Existing issues enter the execution queue only through an explicit ready approval. Public titles and bodies are presentation contracts for people, not a serialized runtime database.

## Execution model

`automation start` creates a run from an approved plan. `automation tick` claims at most one ready task and invokes a worker. The controller then re-runs project verification, delivers reviewed Git changes when allowed, synchronizes the Forge state, and records a checkpoint. `automation supervise` repeats short ticks within configured task, retry, stall, and wall-clock budgets.

The append-only ledger survives process restarts. A renewable lease, heartbeat, fencing token, and provider concurrency group prevent stale or duplicate controllers from writing valid state. Retry-budget usage can be reset after review, but the attempt serial never decreases or reuses an earlier event ID.

Interactive work uses a task branch in the current checkout while preserving unrelated dirty paths. Unattended work uses a managed isolated checkout from a committed Git baseline. Workers do not receive Forge tokens, push credentials, credential helpers, or interactive Git authentication. The controller inspects changed files, re-runs verification, stages explicit paths, and performs delivery.

## Human-facing coordination

The normal issue mode is one roadmap plus delivery-group issues. Korean managed titles are written as reviewed noun phrases rather than mechanically converted sentences. Managed body regions preserve user text outside the marker. They contain scope, non-goals, outcomes, acceptance, dependencies, verification, risk, rollback, progress, the current gate, the next action, and related pull requests.

When GitHub Projects is available, managed fields use neutral names such as `Delivery Status`, `Priority`, `Risk`, `Phase`, `Progress`, `Area`, and `Task ID`. Existing tool-prefixed fields remain readable compatibility aliases and are reused without destructive renaming or deletion. New repositories use only the explicit `status:ready` execution-approval label when Projects owns presentation state.

## Permissions and provider capabilities

Permission profiles are `off`, `observe`, `coordinate`, `deliver`, and `release`. The default `deliver` profile may coordinate issues and project metadata and may create a branch, explicit commit, push, and draft pull request. Merge, release, delete, force-push, and protected-branch changes still require approval; the `release` profile never makes delete or force-push automatic.

`forge status` separates configured policy from verified authentication and repository permissions. Missing GitHub Projects permission stops preferred Project coordination before the first mutation and reports the recovery commands:

```powershell
gh auth refresh -s project
aapb forge status .
```

The harness never expands authentication scopes automatically. An operator who does not want Projects access must explicitly approve the documented Projects/Views capability fallback.

Gitea support is capability-based. Version and OpenAPI inspection happen before authenticated writes. The adapter uses only advertised public issue, label, milestone, pull-request, and Actions methods. An uncertain self-hosted provider remains non-writable until its provider and API base are configured and match the Git remote host.

## Reconciliation and recovery

Forge bootstrap, synchronization, reconciliation, and scheduler installation are preview-first. Apply uses reviewed `updatedAt` snapshots and compare-and-swap checks. Provider-confirmed reusable operations are reported as no-ops instead of being written again.

GitHub creates a system default view for a new Project. The adapter reuses that view for the managed all-items role instead of creating a duplicate table view. The public API does not support renaming or deleting the system view, so the harness does not claim that its visible name changed.

Reviewed legacy consolidation can reuse survivor issues, close approved obsolete issues, remove their Project cards, and unlink native sub-issue relationships. It never deletes issues or label definitions. Operations are ordered so a failure leaves a state the next preview can rediscover. Recovery of an already-unlinked open issue requires the exact approved-plan supersede marker; ambiguous ownership stops writes.

Git delivery is checkpointed before Forge synchronization. A controller that stops after commit or push resumes synchronization without rerunning the worker or creating another commit. Requirement drift during an active attempt pauses the run for reconciliation rather than silently adopting changed remote instructions.

## Hosted workflows and local fallback

Generated GitHub Actions and Gitea Actions workflows pin the same AAPB package release that generated them. Existing copied workflows are not overwritten automatically; review a fresh schedule preview before updating their start and tick package pins. External Actions remain pinned by full commit SHA.

When no usable remote exists, or when `--no-remote` or `--offline` narrows the request, the controller does not call Forge transport and continues locally. Missing authentication or write permission disables mutations while still allowing safe capability probes or permitted reads.

Pause, stop, kill-switch, and request-level deny settings can narrow automation at any time. Disabling automation does not delete issues, branches, pull requests, comments, schedules, or other remote effects already created.

## Verification boundary

Provider-contract fakes, local scheduler previews, and repository tests prove deterministic behavior without remote side effects. A GitHub or Gitea write path is remotely verified only when it has run against a disposable repository with the required permissions. CI success proves the checked commands passed; it does not by itself prove product completion or visual quality.
