# Forge Automation Actions

These workflows run one resumable automation tick per job. Copy only the provider template you use:

- GitHub: copy `github-automation.yml` to `.github/workflows/aapb-automation.yml`.
- Gitea: copy `gitea-automation.yml` to `.gitea/workflows/aapb-automation.yml` after confirming Actions is enabled on the server.

## Opt In

Both workflows are inactive while the repository variable `AAPB_AUTOMATION_ENABLED` is absent or not `true`. Keep the project configuration `automation.killSwitch` enabled until the plan, permissions, executor, and first dry run have been reviewed. Both controls must permit execution.

For a fresh hosted runner, set the repository variable `AAPB_AUTOMATION_PLAN` to the repository-relative path of a committed, approved `workflow.plan.v2` sidecar. After restoring cached state, the workflow calls `automation start` only when this variable is non-empty. Start derives `<planId>-run` by default and reuses an existing run with that ID, so repeated jobs do not replace its ledger. Changing the contents of a plan while keeping the same `planId` does not rewrite an existing run: use reconcile only for remote requirement changes, and use an explicitly reviewed new plan/run for changed local plan content.

The plan path is passed through the step environment and expanded only as the quoted argument `"$AAPB_AUTOMATION_PLAN"`. Do not interpolate repository-variable expressions directly into shell source. If `AAPB_AUTOMATION_PLAN` is empty and no run directory is restored or checked out, the tick fails safely because there is no run to resume.

The schedule requests a tick every 15 minutes and each job has a 35-minute limit. Provider scheduling can be delayed, so continuation always comes from the checkpoint rather than an exact wall-clock promise. Task attempts and transitions are recorded in the run ledger. The local `automation supervise` command enforces its wall and consecutive-stall loop budgets; independently scheduled hosted ticks do not by themselves establish one durable cross-job wall/stall counter. Concurrency allows only one evidence-writing job for a repository and does not cancel an active tick.

## Checkpoint And Recovery

The pinned `actions/cache` step restores and saves both `.ai-agent-playbook/workflows/runs` and the external managed checkout under `~/.cache/ai-agent-playbook/checkouts`. Both are required to resume a commit-created/push-pending checkpoint without rerunning the worker. Its run-attempt-qualified immutable key plus restore prefix lets a later job select an available prior checkpoint while still saving a newer retry. The save occurs in the action's post-job phase, so it represents the last job whose post phase completed, normally the last completed tick. The tick step preserves its real exit status so executor, verification, Git, deadline, and forge failures remain visible as failed Actions jobs; cache post-processing still runs under the provider's normal post-action lifecycle.

This cache is not a transactional state service. A hard timeout, runner termination, cancellation, cache eviction, or infrastructure failure before the post phase can discard changes made after the last saved checkpoint. The next job may therefore replay from the last completed tick. Do not claim that an in-progress tick is durable, and inspect/reconcile forge and Git effects before retrying when the prior job ended ambiguously. If no checkpoint can be restored, `AAPB_AUTOMATION_PLAN` can create a fresh run, but it cannot reconstruct evidence or completion state from a lost run.

## Credentials And Permissions

- GitHub maps the workflow-provided `GITHUB_TOKEN` to `GH_TOKEN`. The workflow requests only `contents`, `issues`, and `pull-requests` write access required by the `deliver` profile. Reduce these permissions for an observe or coordinate-only workflow.
- Gitea requires a repository secret named `AAPB_FORGE_TOKEN` and maps it to `GITEA_TOKEN`. Give it only repository content, issue, and pull-request access required by the selected profile.
- Neither workflow persists checkout credentials. Do not put a token value in workflow YAML, project configuration, repository variables, issue text, or logs.
- Project, View, Discussion, or server-specific APIs remain capability-gated. Missing scope must select the documented fallback instead of failing the entire local run.

## Runtime

The templates invoke the exact `ai-agent-playbook` release with `npx` and disable package install scripts. The release pin is kept aligned with package metadata and covers both start and tick. When upgrading an already copied workflow, review and update both pins explicitly because schedule apply preserves differing existing files. If the runner cannot reach the package registry, install the pinned CLI in the runner image or repository and replace those lines with equivalent local `aapb automation start` and `aapb automation tick` commands.

The runner needs Node.js 18 or newer and Git. It also needs the configured executor installed, authenticated, and non-interactive: install the selected Codex or Claude CLI in the runner image, or configure an explicit `command` adapter whose argv is available there. Hosted Codex normally needs `OPENAI_API_KEY`; hosted Claude needs `ANTHROPIC_API_KEY` or `ANTHROPIC_AUTH_TOKEN` and runs in `--bare` mode. These model secrets must be scoped separately from forge permission. The forge token is not an executor/model credential. Run `aapb automation doctor .` in the same runner image and do not enable the repository variable until executor selection succeeds without ambiguity. A Gitea runner also needs an Actions-compatible checkout implementation and network access to the configured package source. Its runner cache service must be enabled, configured, and reachable for the `actions/cache` checkpoint to work; Actions execution support alone does not make run state persistent. Verify one save/restore cycle for both ledger and managed checkout before relying on unattended continuation. If cache is unavailable, use reviewed persistent storage or a local supervisor instead of treating a fresh runner as resumable.

If a Gitea server does not support repository variables, schedules, or concurrency groups, do not remove the opt-in or concurrency safety boundary. Use the local supervisor or an OS scheduler until the server advertises the required capability.

Review template updates like application code. External actions must stay pinned to a full commit SHA.
