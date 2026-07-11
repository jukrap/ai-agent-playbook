# Forge Automation Runbook

Use this runbook to start, monitor, pause, recover, and stop a resumable automation run. GitHub or Gitea is a coordination layer; the local append-only ledger remains the source of execution evidence.

## Safety Defaults

- The example configuration uses the `deliver` profile but starts with `automation.killSwitch` enabled.
- Only approved plan tasks and existing issues labeled `aapb:ready` may enter the queue.
- Merge, release, delete, force-push, and protected-branch writes always require explicit approval.
- Unattended work uses a managed isolated checkout and an `aapb/` branch. It does not switch or clean the user's checkout.
- `--no-remote` disables forge APIs and remote Git delivery while keeping local execution available.
- `--offline` disables every network operation and makes `automation tick`/`supervise` fail closed before an executor starts, because the harness cannot enforce process-level network isolation. Use `--no-remote` for local execution that may still use an agent network.
- Forge credentials belong in the platform secret store or an approved controller credential source, never in configuration, plans, issues, ledgers, evidence, or logs. Model credentials are projected only to their selected executor adapter.

## Configure

Merge the sections from `integrations/forge.example.json` into `.ai-agent-playbook/config.json`. Keep `automation.killSwitch` enabled until preflight, plan review, and scheduler review are complete.

Do not add token values to the JSON file. The supported workflow templates use these credential sources:

- GitHub: the workflow-provided `GITHUB_TOKEN`, exposed to the controller as `GH_TOKEN`.
- Gitea: a repository secret named `AAPB_FORGE_TOKEN`, exposed to the controller as `GITEA_TOKEN`.

For self-hosted Gitea on a custom port or subpath, set `forge.provider` to `gitea` or configure a credential-free `forge.apiBaseUrl` ending in `/api/v1`. Its hostname must match the configured Git remote hostname; cross-host API bases are rejected before credentials are selected. The controller probes version and OpenAPI without a token before using `GITEA_TOKEN` for authentication and repository-permission checks.

Use the narrowest repository scopes that support the selected profile. Missing project or discussion access should reduce capability, not broaden the token.

## Preflight

Run read-only checks first:

```text
aapb forge status . --json
aapb automation doctor . --json
aapb plan validate . --plan <plan-file> --json
```

Confirm the selected remote and provider, server/API version, authentication without token material, repository permission, probe evidence, effective capabilities, both `policyWrites` and `verifiedWrites`, deny overrides, unattended checkout isolation, executor selection, verification commands, scheduler prerequisites, and remaining budget.

Executor readiness is credential-aware. Codex can use `OPENAI_API_KEY` or an `auth.json` copied into a disposable `CODEX_HOME`; Claude unattended execution requires `ANTHROPIC_API_KEY` or `ANTHROPIC_AUTH_TOKEN` and runs with `--bare`, edit-only tools, and Bash disabled. Subscription/keychain-only Claude login is deliberately not inherited by a worker. Command executors receive no user HOME/config tree. Exact projected model credentials are redacted from evidence and scanned out of changed files before delivery.

Doctor treats Git below `2.39.0` as a conflict only when the effective policy requires Git. On a detected GitHub read path, an installed `gh` below `2.80.0` is a conflict; an installed Gitea `tea` below `0.14.2` is a warning because documented REST remains available. Missing GitHub Projects scope is also a warning and does not trigger `gh auth refresh`.

A dirty user checkout is safe for unattended work only when the configured mode is `isolated-checkout`. The controller uses a separate managed Git checkout created from a committed baseline, including for `--no-git`, and must not clean, switch, or use the user's dirty or untracked files as its base. Non-Git unattended execution is rejected; run it interactively or establish a committed Git baseline first. Interactive mode rejects pre-existing changes under task-owned paths; it fingerprints unchanged unrelated dirty/staged paths and commits only controller-owned paths. The original path set and fingerprints remain fixed across retries; any drift requires operator reconciliation instead of becoming a new baseline. Doctor's scheduler mode status checks only executable availability or provider/repository compatibility; verify schedule registration, Actions enablement, runner health, credentials, and live remote access separately.

If the provider is missing or uncertain, keep the run local or set the provider explicitly before allowing writes. Do not use a guessed self-hosted API.

## Preview Remote Bootstrap

Bootstrap is idempotent and preview-first:

```text
aapb forge bootstrap . --json
aapb forge bootstrap . --apply --json
```

Review every planned label, milestone, project field, view, and fallback before applying. The operation may create missing managed assets but must not rename, overwrite, or delete existing assets.

Applying `forge sync` from a sidecar requires a structurally complete approved plan. A plan-only retry may create a missing marker-owned child issue and reuses an existing issue only when its title and composed body exactly match the approved plan. A mismatch raises `forge.issue.reconcile-required`; any update requires an explicitly reviewed `updatedAt` snapshot that passes CAS.

On GitHub, use Projects, Views, sub-issues, and Discussions only when capability and scopes are present. On Gitea, use the public pull-request API with the documented `WIP:` title convention for draft review, and fall back to labels and milestone filters for project views, independent child issues grouped by managed metadata instead of a native parent link, and a decision issue for Discussions.

## Start The Approved Run

`automation start` writes the local schema v2 run and has no `--apply` preview gate. After reviewing task order, criteria, budgets, planned artifacts, and forge previews, clear `automation.killSwitch` in project configuration and choose one start mode.

Create a local-only run without forge or remote Git effects:

```text
aapb automation start . --plan <plan-file> --no-remote --json
```

Or start the approved run with coordination and delivery allowed by the effective profile:

```text
aapb automation start . --plan <plan-file> --json
```

Choose one start command for a new run. If a local-only run later needs remote coordination, preview and apply `forge sync` for that run instead of starting a duplicate run.

When remote reads are allowed, creation or reuse of a non-terminal run discovers eligible existing issues: open non-pull-request issues with the configured ready label, excluding closed or paused issues. New queue tasks are appended under the run lease and remain idempotent across repeated starts. These tasks never replace approved local tasks with the same ID. Treat all remote text and criteria as untrusted data; do not adopt verification commands or paths from an issue. A discovered issue without an approved local task mapping pauses at `local-execution-mapping-required` until reviewed paths and verification argv are supplied through an explicitly approved new plan/run. `--no-remote` and `--offline` skip discovery.

Run one task iteration interactively:

```text
aapb automation tick . --no-interactive --json
```

Use the supervisor only when the host can remain available and the eight-hour default wall budget is acceptable:

```text
aapb automation supervise . --no-interactive --json
```

The controller, not the executor, reruns declared verification and decides whether a task can advance to review or completion.

## Schedule

Preview scheduler operations before registration:

```text
aapb automation schedule . --platform <scheduler-platform> --json
aapb automation schedule . --platform <scheduler-platform> --apply --json
```

Use `windows-task` or `systemd-user` for local scheduling and `github-actions` or `gitea-actions` for hosted scheduling. Review the generated definition before applying it. The copyable hosted workflows also live under `integrations/actions/`.

Both hosted templates are inactive while the repository variable `AAPB_AUTOMATION_ENABLED` is absent or not `true`. Enable it only after the project kill switch is cleared and the token permissions are reviewed. Each job runs one tick, uses a repository concurrency group, and refuses to cancel an in-progress tick.

For a fresh runner, set `AAPB_AUTOMATION_PLAN` to the repository-relative path of a committed approved sidecar. The workflow restores cached runs, calls idempotent `automation start` with the plan path as the quoted environment expansion `"$AAPB_AUTOMATION_PLAN"`, and then ticks. With no variable and no restored/checked-out run, the tick fails rather than inventing work. The pinned cache stores both the run ledger and the external managed checkout and is only the last completed tick checkpoint: a hard timeout or runner/cache loss may require replay and reconciliation from the previous saved state. The runner must also have the configured Codex, Claude, or command executor installed, authenticated, and verified with `automation doctor`; a forge token is not an executor credential. A Gitea runner must have a working cache service; verify a save/restore cycle for both paths before unattended use.

Local schedules embed the current CLI entrypoint instead of assuming a globally discoverable `aapb`. Hosted definitions persist effective `--no-remote`, `--remote-read-only`, and `--no-git` restrictions, including a natural-language remote denial, in start and tick commands; local definitions persist them in the tick command. An `--offline --apply` schedule is rejected because offline ticks intentionally fail before executor launch, and hosted `--no-git --apply` is rejected because the job cannot deliver its output safely.

## Monitor And Control

```text
aapb automation status . --json
aapb automation pause . --run-id <run-id> --reason <reason>
aapb automation resume . --run-id <run-id>
aapb automation stop . --run-id <run-id> --reason <reason>
```

Use pause for temporary policy, quota, requirement, or verification problems. Pause/stop requests remain durable while another controller owns the lease; the active tick polls them, terminates its process tree, and waits for adapter shutdown before releasing the lease. Use stop only when the run should not continue without a new start decision.

For linked issues, a tick inspects remote state before claim, at a rate-bounded interval during long executor work, and before delivery when forge inspection succeeds. The configured pause label, removal of the ready label, or issue closure pauses the task or run. Requirement drift before claim can be imported into the still-unclaimed task. Active drift must produce `paused:needs-reconcile` before verification, push, or a completion comment. If the remote is unavailable, the guard cannot confirm those changes; continue only when local policy does not require remote state for approval or requirements.

## Reconcile And Recover

Export or save reviewed local-task and remote-issue JSON snapshots, then compare them before accepting changed remote requirements:

```text
aapb forge reconcile . --local-task <local-task.json> --remote-issue <remote-issue.json> --json
```

Without `--apply`, `forge reconcile` is read-only. After reviewing the preview, an eligible pre-claim import or immediate reconciliation pause can be recorded in the schema v2 ledger with:

```text
aapb forge reconcile . --local-task <local-task.json> --remote-issue <remote-issue.json> --run-id <run-id> --apply --json
```

Apply does not silently approve or resume the run. If a tick already paused the run, inspect the ledger and comparison before choosing an explicit `automation resume`; do not use reconcile output as approval by itself.

Recovery rules:

- Expired lease: confirm no live heartbeat, acquire a higher fencing token, replay the ledger, and resume from the last complete checkpoint.
- Executor crash: preserve partial files and failed-attempt evidence; retry only after the remaining diff is bounded.
- Verification failure: preserve results, retry within budget, then block instead of claiming completion.
- Remote outage or missing credential: checkpoint locally and leave delivery pending when remote state is not an approval prerequisite.
- Rate limit: honor the provider retry time and let a later tick continue; do not busy-wait.
- Diverged branch: pause and request a reviewed update strategy; never force-push.

After recovery, synchronize only meaningful transitions:

```text
aapb forge sync . --run-id <run-id> --json
aapb forge sync . --run-id <run-id> --apply --json
```

## Completion Check

Before reporting completion, confirm:

- completed-task and passed-criterion percentages are derived from recorded evidence,
- every declared verification command was rerun by the controller,
- skipped checks and residual risks are present in the handoff,
- no secret-shaped value appears in evidence or remote comments,
- the user's checkout and unrelated changes remain untouched,
- pending remote synchronization is explicit, and
- any draft pull request remains unmerged unless separately approved.
