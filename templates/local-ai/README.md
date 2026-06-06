# Local AI Support Templates

These files are optional project-level support docs for agent work. Inside a project, place adapted copies wherever the team keeps local-only notes, such as `.local-ai`, `docs/ai`, or `docs/plans`. If these files conflict with product or technical source of truth, trust actual code and current project docs first.

## Recommended bundles

- Every project: `repo-onboarding.md`, `docs-system.md`, `commit-push-worklog.md`.
- React/FSD projects: `pragmatic-fsd.md`, `ui-style-quality.md`, `api-contract-boundary.md`.
- API-heavy projects: `api-contract-boundary.md`.
- SI or legacy maintenance: `si-legacy-mode.md` and the nearest legacy `AGENTS.md` profile.
- Repository-wide cleanup or architecture review: `structural-review.md`.

`commit-push-worklog.md` is the portable replacement for machine-local commit, PR, and worklog custom instructions. Copy or reference it when the repository needs consistent agent behavior across computers.

Use `templates/agents/global/GIT.md` for short root-level Git policy. Use `commit-push-worklog.md` when the project also needs detailed PR, rollback, and worklog guidance. The short root policy is not a replacement for detailed worklogs when a team relies on them as durable context.

## Usage rules

- These docs provide additional guidance for agents.
- They do not replace actual project config, run commands, lower-level `AGENTS.md`, or the latest user instruction.
- When copying docs from an older project, reduce them to the current codebase instead of trusting them unchanged.
