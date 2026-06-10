---
name: project-bootstrap
description: Use when starting a new project, inheriting an existing repository, or setting up agent-facing project memory, a thin root agent bootstrap, and playbook docs.
---

# Project Bootstrap

Create only the project memory and root instructions that the repository can actually use.

## Workflow

1. Inspect repository structure, git state, README, agent instructions, build config, scripts, and existing docs before proposing files.
2. Classify the project shape: new, inherited, legacy, API-heavy, UI-heavy, mobile, multi-repo, documentation-only, or mixed.
3. Decide whether `ai-playbook/` should be committed or local-only, then record that policy before writing private notes.
4. Adapt a thin root `AGENTS.md` from `templates/agents/global` and project memory templates from `templates/project-playbook`.
5. Create only the maps, runbooks, decisions, plans, guides, and worklog structure the project needs now.
6. Keep project-specific facts in project docs, not installable skills.
7. Scrub personal paths, private names, credentials, internal URLs, and machine-specific setup from committed docs.

## Reference

Read `references/bootstrap-checklist.md` when generating or reviewing a project bootstrap plan.
