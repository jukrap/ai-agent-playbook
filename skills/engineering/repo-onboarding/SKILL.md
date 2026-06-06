---
name: repo-onboarding
description: Use when starting work in an unfamiliar or newly opened repository, before planning architecture/tooling, editing code, or answering project-specific workflow questions.
---

# Repo Onboarding

Ground decisions in the repository before acting.

## Workflow

1. Inspect root files, git branch/remotes/status, README, `AGENTS.md`, package/build config, and local docs.
2. Identify actual package manager, runtime, scripts, architecture, local-only policy, and verification commands.
3. Read `ai-playbook/START_HERE.md`, `CURRENT.md`, relevant maps, and relevant runbooks when they exist.
4. Search relevant entrypoints with `rg`; do not infer stack, routes, tests, or branch policy from habit.
5. State only facts confirmed from fresh output. Mark unresolved items as assumptions or blockers.

## Reference

Read `references/onboarding-checklist.md` when the task involves a new project, a stale project, or unclear repo conventions.
