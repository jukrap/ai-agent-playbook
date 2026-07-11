# AI Agent Playbook 0.5.4 Forge Automation

This change note records the public operator and maintainer contract for the 0.5.4 forge collaboration and resumable-execution work. It is not evidence that a live GitHub or Gitea write smoke test ran.

## Observable impact

- Approved automation plans can become resumable runs whose append-only ledger and derived state survive a controller restart.
- GitHub or Gitea can act as the collaboration layer for queue state, milestones, reviews, draft pull requests, and CI while the local ledger remains authoritative for execution facts and evidence.
- A controller advances one ready task per tick, verifies project commands itself, and records a checkpoint before another tick continues.
- Each child issue or delivery group reuses one plan-namespaced `aapb/<plan>-<id>-<slug>` branch and one ownership-marked review request. GitHub uses its native draft flag; Gitea uses the documented `WIP:` title convention through the public pull-request API. The controller updates a single marker comment only at state transitions, blockers, recovery, and final verification instead of posting a comment for every tick.
- Interactive work uses an `aapb/` task branch in the current checkout. Pre-existing changes under task-owned paths are rejected; unchanged unrelated dirty/staged paths are fingerprinted, excluded from the controller commit, and preserved. Their original path set and fingerprints remain the trust anchor across retries, so worker changes cannot be adopted as a fresh user baseline. Unattended work, including `--no-git`, uses a managed checkout cloned from a committed Git baseline. Non-Git unattended execution is rejected so dirty files, untracked secrets, and out-of-tree symlinks are not copied into a worker base.
- When remote reads are allowed, new and reused non-terminal runs can append open non-pull-request issues carrying the configured ready label. Closed or paused issues are excluded, approved local tasks win ID collisions, and remote commands or paths are never adopted as trusted execution instructions.
- Linked existing issues receive only managed state-label changes; their title, body, acceptance text, pause label, and user-managed labels are preserved until an explicit reconciliation is approved.

## Permission and safety model

The permission profiles are `off`, `observe`, `coordinate`, `deliver`, and `release`. The default `deliver` profile can coordinate issues and project metadata and can create a task branch, explicit commit, push, and draft pull request. Merge, release, delete, force-push, and protected-branch changes still require approval; the `release` profile does not make delete or force-push automatic.

Remote and scheduler mutations remain preview-first. An apply flag is required before bootstrap plans, workflow files, or operating-system schedule registrations are written, and inline mutation booleans parse `false` as false instead of truthy text. Hosted schedules persist effective denial in start and tick commands; local schedules persist it in the tick command. Offline apply and hosted `--no-git` apply are rejected because those jobs cannot execute and deliver safely. Current-request denials can narrow configured permission but cannot expand it.

`forge sync --plan ... --apply` requires a structurally complete approved sidecar before any forge inspection. Plan-only retries create missing marker-owned issues and reuse an existing issue only when its title and composed body exactly match the approved plan. A mismatch raises `forge.issue.reconcile-required`; title, body, acceptance, and status updates require a reviewed `updatedAt` snapshot and CAS. MCP forge previews require a target and use the same detected provider, effective capabilities, and configured language as their gated apply tools.

Workers run with a temporary isolated HOME/config tree and do not receive forge tokens, user Git configuration, credential-helper access, push URLs, SSH-agent variables, or interactive Git authentication. The Codex adapter projects only a temporary copy of its model auth file (or `OPENAI_API_KEY`); the Claude adapter uses `--bare`, edit-only tools, and an explicit Anthropic model credential instead of OAuth/keychain state or Bash. Exact projected credential values are redacted from executor/verification evidence and scanned out of changed-file bytes before staging. The controller validates effective local/worktree Git config, uses a fixed non-personal per-command commit identity, and performs explicit path-only commit delivery.

## Provider capability fallback

- GitHub support includes the shared issue, label, milestone, pull request, and Actions core. Projects and Views are enabled only when the API and current token expose the required project scopes. Missing project scope is reported without running an authentication refresh, while supported Issues and Milestones operations remain available.
- Forge status distinguishes configured `policyWrites` from `verifiedWrites`. Effective remote writes stay disabled until authentication and repository write permission are verified, and the status record carries server/API version plus probe evidence without token material.
- `gh agent-task` is isolated as an explicitly selected preview adapter. It is not part of automatic executor selection.
- Gitea uses only shared-core operations whose required methods appear in the server OpenAPI. Version and OpenAPI inspection is anonymous and precedes token-bearing authentication and repository-permission checks. Draft review uses the public pull-request API plus Gitea's documented `WIP:` title convention. Where a stable Project or View API is unavailable, status labels and milestone filters provide the queue and board views. A `decision` issue provides the Discussions fallback.
- An unknown or hostname-only self-hosted provider is not treated as writable. The operator must set `forge.provider: "gitea"` or a credential-free `forge.apiBaseUrl` before version and capability inspection can establish a safe contract. The API base hostname must match the configured Git remote hostname; a project-controlled cross-host URL is rejected before a token-bearing request.
- When no usable remote exists, or when `--no-remote`/`--offline` denies access, the controller does not call forge transport and continues locally. Missing authentication or write permission disables mutations but may still permit anonymous capability probes or remote reads.

The support and integration targets are listed in the [README compatibility matrix](../../README.md#forge-automation-compatibility). A target version states the intended contract and does not replace a disposable-repository smoke test.

## Upgrade and data compatibility

- New runs use execution-ledger schema v2. Schema v1 remains readable and is not overwritten during a compatibility read.
- The legacy `run status` command recognizes v2 directories through the common store. Legacy `run record` and `run summarize` remain schema-v1 writers for legacy directories in 0.5.4 and are fenced from v2 ledgers; full writer unification is a staged compatibility migration, not a silent rewrite in this release.
- Run initialization publishes a complete store by atomic directory rename. Empty or matching manifest-only interrupted initialization is quarantined and recovered; unknown partial content is preserved for operator review. Reusing a run ID requires the same approved-plan fingerprint; a changed plan requires an explicitly reviewed new plan/run ID rather than in-place reconciliation.
- Structured automation plans pair human-readable Markdown with a `workflow.plan.v2` JSON sidecar containing stable task IDs, dependencies, risk, acceptance criteria, verification commands, delivery grouping, and remote-execution eligibility.
- The configuration gains `automation`, `forge`, `git`, and `executor` sections. Existing configuration precedence remains in place, and a denial on the current request is applied last.
- `bootstrap --local-only` keeps its existing meaning: project playbook files remain excluded from Git. Upgrading does not upload an existing local playbook or enable a remote schedule by itself.

No destructive data migration is required. Existing local-only operation remains the fallback when the new integration is disabled or unavailable.

## Pause, recovery, and disable path

- Pause/stop requests are written independently of the run lease and polled by the active controller, which cancels the process tree and retains its lease until the adapter acknowledges termination. The absolute tick deadline covers executor, verification, Git, forge requests, retries, and the supervisor wall budget rather than resetting per phase.
- For a linked issue, successful forge inspection checks pause/approval state and requirement drift before claim, at a rate-bounded poll during long execution, and again before delivery. Pre-claim drift can be imported into an unclaimed task; active drift pauses for reconciliation before verification or delivery. An unavailable remote cannot provide this guard, so local policy decides whether remote state is required to continue.
- `forge reconcile` is preview-only unless `--apply` is supplied. Apply can record an eligible pre-claim import or reconciliation pause in a schema v2 ledger, but it does not approve or resume the run.
- A crashed controller resumes from the ledger and lease state. An expired lease can be reclaimed with a higher fencing token; a stale controller cannot keep writing valid events. UUID-scoped Lamport contenders serialize lease-file operations without deleting a foreign or successor lock during stale recovery.
- Incomplete start coordination remains `remote.mode=pending`; a repeated idempotent start retries bootstrap/sync and checkpoints issue links instead of permanently skipping the remote phase.
- Successful Git delivery is persisted before forge synchronization. If the controller stops after commit or push, the next tick retries synchronization and completion from that delivery checkpoint without rerunning the worker or creating another commit. A failed attempt clears provisional criterion evidence before retrying, so attempts do not inflate progress.
- A local-only delivery checkpoint records its workspace and branch when present in `handoff.md`; no-git output remains an explicit residual risk until an operator reviews and integrates or exports it.
- A ready issue that has no approved local task mapping is recorded as untrusted queue data and pauses at `local-execution-mapping-required`; an operator must review its owned paths and verification argv in an explicitly approved new plan/run before execution.
- To stop remote coordination for one invocation, use the relevant deny flag. To disable it persistently, select the `off` profile or enable the configured kill switch. The local ledger and evidence remain available for inspection.

Rollback consists of disabling the automation profile or schedule and reverting the 0.5.4 package change. This does not delete remote issues, branches, pull requests, comments, or workflow runs that were already created; those external effects require explicit operator review.

## Verification boundary

Repository validation, provider-contract fakes, and local scheduler previews can verify implementation behavior without remote side effects. A GitHub or Gitea write path is considered remotely verified only when it has run against a disposable repository with the required permissions. When that environment is unavailable, release evidence must say that the remote write smoke test was not performed.
