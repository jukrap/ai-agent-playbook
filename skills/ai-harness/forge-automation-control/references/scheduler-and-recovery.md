# Scheduler And Recovery

Use this reference when a run must continue across sessions, scheduled invocations, crashes, or unattended execution.

## Tick Contract

One tick performs at most one ready task:

1. Load and validate the plan, ledger, derived state, policy, and provider capability snapshot.
2. Refuse work when the kill switch, pause label, deny flag, wall-clock budget, or unresolved reconciliation is active.
3. Acquire the single-controller lease and a monotonically increasing fencing token.
4. Claim one dependency-ready task deterministically.
5. Invoke the selected executor with bounded scope and a credential-scrubbed environment.
6. Review changed files and rerun the declared verification in the controller.
7. Record evidence and the resulting state event before any remote synchronization.
8. Commit, push, or update a draft pull request only when the effective profile allows it.
9. Release the lease and emit a checkpoint even when the task fails.

## Default Budgets

| Budget | Default |
|---|---:|
| Concurrent tasks | 1 |
| Tick duration | 30 minutes |
| Attempts per task | 3 |
| Consecutive no-progress ticks | 3 |
| Run wall time | 8 hours |
| Lease heartbeat | 30 seconds |
| Lease expiry | 2 minutes |

Budgets are ceilings, not targets. Stop earlier when evidence, permissions, or safety boundaries are insufficient.

## Scheduling Modes

- Interactive work uses an `aapb/` task branch in the current checkout only when that checkout is understood and the requested operation permits it.
- Unattended work uses a managed isolated checkout outside the user's working tree and creates a branch per task or delivery group.
- A local supervisor repeats short ticks within the run budget. It must not hold an executor process open merely to wait for remote state.
- Windows Task Scheduler and systemd user service definitions are preview-first. Register or update them only after an explicit apply request.
- GitHub Actions and Gitea Actions run one tick per job, use a provider concurrency group, and keep `cancel-in-progress` disabled so a new invocation cannot replace an evidence-writing tick.
- Scheduled workflows remain inactive until the project kill switch is cleared and the repository automation variable is explicitly enabled.
- A hosted workflow may read `AAPB_AUTOMATION_PLAN` as the repository-relative path of a committed approved sidecar. It restores cached runs first, then passes the value through the environment as the quoted argument `"$AAPB_AUTOMATION_PLAN"` to idempotent `automation start` before ticking. An unchanged `planId` reuses, rather than rewrites, the default run.
- The pinned cache saves both the runs directory and external managed checkout in its post-job phase. Both are needed to resume a committed-but-not-pushed checkpoint without rerunning the worker. Treat the cache as the last completed tick checkpoint, not durable in-progress state; hard timeout, cancellation, runner loss, or cache eviction can require replay from an earlier checkpoint and reconciliation of ambiguous external effects.
- A hosted runner must have its configured Codex, Claude, or command executor installed, authenticated, and verified by `automation doctor`; forge credentials do not authenticate the executor. Claude's default unattended adapter exposes edit-only tools and disables Bash, while controller verification runs declared commands separately.
- Local schedules embed the current CLI entrypoint. Hosted definitions preserve the effective no-remote/read-only/no-git restrictions, including natural-language remote denial, in start and tick commands; local definitions preserve them in the tick command. Reject offline schedule apply and hosted no-git schedule apply because those jobs fail before execution or cannot deliver output safely.
- Gitea continuation through `actions/cache` requires its runner cache service to be enabled, configured, and reachable. Verify a real save/restore cycle or select reviewed persistent storage/local scheduling instead.
- Treat doctor scheduler readiness as a prerequisite signal only. Executable or provider/repository compatibility does not prove registration, Actions enablement, runner health, credentials, or a successful remote invocation.

## Git Delivery

- Never use dirty or untracked user files as an unattended execution base. Use an isolated managed Git checkout created from a committed baseline, including for no-git execution, while preserving the user's directory. Reject non-Git unattended execution and refuse dirty state in non-isolated modes.
- In interactive mode, keep the initial unrelated dirty path set and fingerprints as an immutable retry checkpoint. Do not reclassify worker-created or worker-modified paths as pre-existing user work.
- Fetch a clean base into the managed checkout, then create or reuse `aapb/<plan-or-run>-<task-or-delivery>-<slug>`.
- Reuse one plan-namespaced branch and ownership-marked draft/WIP pull request for the same task or delivery group.
- Stage explicit reviewed paths. Never use broad staging to absorb unrelated files.
- Do not persist checkout credentials. The controller obtains credentials only for the delivery operation and removes them afterward.
- Never force-push. If history diverges, pause with recovery instructions.

## Recovery Cases

- **Expired lease:** verify no live controller heartbeat, acquire a higher fencing token, replay the append-only ledger, and resume from the last complete checkpoint.
- **Executor crash:** record the failed attempt, inspect partial files in the managed checkout, discard nothing automatically, and retry only after the controller can bound the remaining diff.
- **Verification failure:** preserve output and logs as evidence, return the task to a retryable state while budget remains, then block it.
- **Remote unavailable:** checkpoint locally, mark remote sync pending, and continue only if remote state is not required for approval or requirements.
- **Remote requirements changed:** an eligible pre-claim drift may be imported into the unclaimed task. Drift detected after executor work pauses as `needs-reconcile`; do not verify, push, or post a completion comment.
- **Rate limit or quota:** honor the provider retry time, checkpoint, and let a later tick continue. Do not busy-wait.
- **Diverged branch or changed base:** pause and require a reviewed update strategy. Never rewrite published history automatically.
- **Missing credential:** keep the completed local evidence and produce a delivery handoff instead of treating the task as failed.

## Completion Evidence

A task reaches `completed` only when the controller has recorded every acceptance criterion, the exact verification commands and exit results, reviewed paths, skipped checks, residual risk, and any required review approval. A run handoff also states pending remote sync, branch or draft pull request identity when present, and the next safe action.
