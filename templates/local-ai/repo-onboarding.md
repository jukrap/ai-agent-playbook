# Repo Onboarding

Use this checklist when an agent enters a new or stale project.

## First pass

1. Confirm current directory and whether it is a repository.
2. Check branch, remotes, and dirty worktree.
3. Inspect root files and major folders.
4. Read README, root `AGENTS.md`, lower-level `AGENTS.md`, and package/build config.
5. If local docs exist, read only the relevant parts in this order: `PROJECT_SPEC.md`, `PLANS.md`, `FSD.md`, `docs/plans/README.md`.
6. Confirm package manager, runtime, scripts, test, lint, and build commands from real config.
7. Use `rg` to find entrypoints, routes, modules, APIs, and style files related to the request.

## Facts to record

- Technology stack and package manager.
- Run and verification commands.
- Source-of-truth docs.
- Local-only file policy.
- Branch, remote, and push policy.
- Main architecture boundaries.
- Relationship between dirty files and the current task.

## Do not

- Guess `npm test`, `pnpm build`, FSD, React, or API paths.
- Revert user changes.
- Trust docs without checking real code.
- Claim completion without fresh command output.

## Good opening line

```text
I will first inspect the repository structure, docs, scripts, and current git state so I can work from this project's real rules.
```
