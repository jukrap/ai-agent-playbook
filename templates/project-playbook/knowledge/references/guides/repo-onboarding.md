# Repository Onboarding

Use this guide before planning, editing, or answering project-specific workflow questions in an unfamiliar repository.

## First pass

1. Check branch, remotes, dirty files, and staged files.
2. Inspect root files, README, agent instructions, package/build config, lockfiles, and scripts.
3. Find package manager, runtime versions, test/lint/build commands, and local-only policy.
4. Search relevant entrypoints with `rg`.
5. Read `.ai-agent-playbook/START_HERE.md`, `CURRENT.md`, relevant maps, and relevant runbooks when they exist.
6. State confirmed facts and unresolved assumptions before planning.

## Avoid

- Inferring framework, package manager, tests, architecture, branch policy, or API contracts from habit.
- Trusting stale plans over current code.
- Asking the user questions that repository inspection can answer.

## Output shape

```md
## Confirmed
- Stack:
- Package manager:
- Run commands:
- Verification:
- Local-only policy:

## Unknown
- Item:
  - Search already attempted:
  - Why it matters:
```
