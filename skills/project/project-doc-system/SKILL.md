---
name: project-doc-system
description: Use when creating, reorganizing, or reviewing project AI docs such as AGENTS.md, ai-playbook, project specs, plans, maps, runbooks, worklogs, or local-only documentation.
---

# Project Doc System

Separate working rules from product facts and keep stale notes out of active guidance.

## Workflow

1. Inspect existing docs and git/local-only policy before proposing structure.
2. Keep `AGENTS.md` as a thin entrypoint; move current project memory into `.ai-playbook/`.
3. Separate current truth, maps, runbooks, decisions, active plans, worklogs, and archived notes.
4. Preserve dated prompts, handoffs, and worklogs as history unless their rules are still current.
5. Promote still-current facts from worklogs into `CURRENT.md`, maps, runbooks, or decisions.
6. Document source-of-truth priority and local-only commit policy.

## Reference

Read `references/doc-roles.md` when deciding where a rule belongs or when consolidating scattered markdown files.
