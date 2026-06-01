# AGENTS.md
# Reusable AI Agent Working Guide

This file is a working agreement, not a product specification. Keep project-specific product, stack, and milestone details in separate files such as `PROJECT_SPEC.md`, `PLANS.md`, `FSD.md`, or `docs/plans/**`.

## Core rules

- Inspect the repository structure, configuration, README, and local docs before deciding architecture or tooling.
- Do not assume React, FSD, tests, lint, package manager, or branch workflow.
- Prefer project-defined commands and existing patterns.
- Keep changes small, scoped, and directly related to the request.
- Never revert unrelated user changes.
- Prefer `rg` for search.
- Verify completion claims with fresh command output.
- Reply in Korean by default when the user speaks Korean.

## Start-of-work checks

- Check the current branch and remotes.
- Check dirty worktree state and leave unrelated changes alone.
- Confirm package manager, lockfile, runtime version, and scripts.
- Look for lower-level `AGENTS.md` files or package-specific instructions.
- If project docs exist, read the relevant parts in this order: README, `PROJECT_SPEC.md`, `PLANS.md`, `FSD.md`, `docs/plans/README.md`.
- If docs and code disagree, trust actual code and the latest user instruction first.

## Document roles

- `AGENTS.md`: agent working rules, verification, git, and collaboration policy.
- `PROJECT_SPEC.md`: product goals, feature/screen scope, data/API policy.
- `PLANS.md`: milestones, completion criteria, verification commands.
- `FSD.md`: FSD or architecture boundary rules.
- `docs/plans/**`: detailed conventions, prompts, handoffs, and planning notes.
- `docs/worklog/**`: milestone completion, blockers, and major direction changes.
- `design-docs/**`, `_reference/**`: secondary references used only when relevant.
- `README.md`: public setup and run guide for new readers.

## Source of truth

When instructions conflict, prefer this order:

1. Latest user instruction.
2. Actual code and configuration.
3. Project-specific specification and planning docs.
4. Nearest lower-level `AGENTS.md`.
5. Global working rules.
6. Old references and external material.

## Local-only docs

- If a project marks AI instructions, worklogs, design sources, or internal planning notes as local-only, do not commit them.
- Check staged files before committing.
- Do not bypass hooks that block local-only files.
- `README.md` is usually public and may be committed when the project allows it.

## Custom skills

- Treat globally installed skills as reusable helpers, not mandatory behavior.
- For Codex, common local skill roots include `%USERPROFILE%\.codex\skills` and `%USERPROFILE%\.agents\skills`.
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

If the project uses another package manager or command set, use only commands proven by `package.json`, build files, or README.

## Git

- Prefer explicit staging over `git add .` or `git add -A`.
- Inspect staged files before committing.
- Use Conventional Commits by default.
- Use `type(scope): summary` when the repository uses scoped commits.
- Keep the subject focused on the main outcome, not the branch name or chat title.
- Add a short body only when the title does not explain why, scope, or risk.
- Include a verification section only for commands or manual checks actually performed.
- Include issue references only when the issue number and repository convention are known.
- Do not add agent, model, co-author, or generated-by signatures.
- Before pushing, check branch, remote, upstream, local-only staged files, and latest verification output.
- Never revert user-made or task-unrelated changes.

For deeper commit, PR, and worklog policy, copy or read `templates/local-ai/commit-push-worklog.md`.

## Worklogs

If the project uses worklogs, record milestone completion, blockers, major direction changes, and long debugging results. A useful worklog explains the problem and decision path, not just changed file names.
