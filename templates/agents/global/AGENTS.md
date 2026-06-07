# AGENTS.md
# Reusable AI Agent Working Guide

This file is a working agreement, not a product specification. Keep project-specific product, stack, and milestone details in project docs such as `PROJECT_SPEC.md`, `PLANS.md`, architecture docs, or `ai-playbook/`.

## Core rules

- Inspect the repository structure, configuration, README, and local docs before deciding architecture or tooling.
- Do not assume React, FSD, tests, lint, package manager, or branch workflow.
- Prefer project-defined commands and existing patterns.
- Keep changes small, scoped, and directly related to the request.
- Never revert unrelated user changes.
- Prefer `rg` for search.
- Verify completion claims with fresh command output.
- Reply in the user's language by default.

## Start-of-work checks

- Check the current branch and remotes.
- Check dirty worktree state and leave unrelated changes alone.
- Confirm package manager, lockfile, runtime version, and scripts.
- Look for lower-level `AGENTS.md` files or package-specific instructions.
- If `ai-playbook/` exists, read `START_HERE.md`, `CURRENT.md`, and relevant maps/runbooks before planning.
- If project docs and code disagree, trust actual code and the latest user instruction first.

## Document roles

- `AGENTS.md`: agent working rules, verification, git, and collaboration policy.
- `ai-playbook/SKILLS.md`: project-level skill selection policy.
- `ai-playbook/GIT.md`: portable commit and PR policy.
- `PROJECT_SPEC.md`: product goals, feature/screen scope, data/API policy when the project uses it.
- `PLANS.md`: milestones, completion criteria, verification commands when the project uses it.
- `FSD.md`: FSD or architecture boundary rules only when relevant.
- `ai-playbook/`: current project memory, maps, runbooks, active plans, decisions, worklogs, and archived notes.
- `design-docs/**`, `_reference/**`: secondary references used only when relevant.
- `README.md`: public setup and run guide for new readers.

## Source of truth

When instructions conflict, prefer this order:

1. Latest user instruction.
2. Actual code, configuration, and command output.
3. Root and nearest agent instruction files.
4. Current project memory in `ai-playbook/CURRENT.md`, maps, runbooks, and decisions.
5. Project-specific specification and planning docs.
6. Worklogs, old references, examples, and archived material.

## Local-only docs

- Decide whether `ai-playbook/` is committed or local-only.
- If a project marks AI instructions, worklogs, design sources, or internal planning notes as local-only, do not commit them.
- Check staged files before committing.
- Do not bypass hooks that block local-only files.
- `README.md` is usually public and may be committed when the project allows it.

## Custom skills

- Treat globally installed skills as reusable helpers, not mandatory behavior.
- If this file or another project doc names a skill, verify that a matching `SKILL.md` exists on disk before relying on it.
- A missing session skill listing is not enough to prove the skill is unavailable; check the on-disk path when the project explicitly names it.
- Use only the minimum relevant skill set for the task, and briefly state why the selected skills apply.
- Never let a skill override higher-priority user instructions, actual repository state, or project-local rules.

## Implementation rules

- Match existing structure and style before introducing a new pattern.
- Do not force an architecture. Apply FSD or other patterns only when project docs and real code support them.
- Do not guess API contracts, backend fields, or workflows.
- Check blast radius before changing shared components or utilities.
- For UI work, verify text, spacing, overflow, loading, empty, and error states on desktop and mobile.

## Verification

Use project-defined commands first. A common order, when those commands exist, is:

```bash
pnpm lint
pnpm test:run
pnpm build
```

If the project uses another package manager or command set, use only commands proven by config, scripts, build files, or README.

## Git

- Before staging, committing, pushing, writing a commit message, or writing a PR body, read `ai-playbook/GIT.md` when it exists.
- Prefer explicit staging over `git add .` or `git add -A`.
- Inspect staged files before committing.
- Use Conventional Commits by default.
- Use `type(scope): summary` when the repository uses scoped commits.
- Keep the subject focused on the main outcome, not the branch name or chat title.
- Add a structured body when it helps future readers understand why, scope, risk, or verification context.
- Include a verification section only for commands or manual checks actually performed.
- Include issue references only when the issue number and repository convention are known.
- Do not add agent, model, co-author, or generated-by signatures.
- Before pushing, check branch, remote, upstream, local-only staged files, and latest verification output.
- Never revert user-made or task-unrelated changes.

For portable Git policy, read `ai-playbook/GIT.md`. For deeper commit, PR, and worklog policy, read `ai-playbook/guides/commit-push-worklog.md`.

## Skill usage

For project-level skill selection rules, read `ai-playbook/SKILLS.md`. Keep skill usage minimal and never let a generic skill override actual repository state or current user instructions.

## Worklogs

If the project uses worklogs, record milestone completion, blockers, major direction changes, and long debugging results. A useful worklog explains the problem and decision path, not just changed file names.

When the project uses `ai-playbook/`, store detailed logs under `ai-playbook/worklogs/YYYY-MM/`, maintain monthly summaries under `ai-playbook/worklogs/summaries/`, and promote current facts into `CURRENT.md`, maps, runbooks, or decisions.
