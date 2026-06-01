---
name: project-doc-system
description: Use when creating, reorganizing, or reviewing project AI docs such as AGENTS.md, PROJECT_SPEC.md, PLANS.md, FSD.md, docs/plans, worklogs, or local-only documentation.
---

# Project Doc System

Separate working rules from product facts and keep stale notes out of active guidance.

## Workflow

1. Inspect existing docs and git/local-only policy before proposing structure.
2. Keep `AGENTS.md` about how to work; move product scope to `PROJECT_SPEC.md` and milestones to `PLANS.md`.
3. Put architecture rules in a dedicated doc only when the project actually uses that architecture.
4. Preserve dated prompts, handoffs, and worklogs as examples unless their rules are still current.
5. Document source-of-truth priority and local-only commit policy.

## Reference

Read `references/doc-roles.md` when deciding where a rule belongs or when consolidating scattered markdown files.
