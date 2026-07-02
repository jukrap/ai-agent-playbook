---
name: commit-worklog-guardrails
description: Use when staging files, writing commits, pushing branches, opening PRs, preparing release notes, or recording worklogs in repositories with local-only docs or careful branch policies.
---

# Commit Worklog Guardrails

Primary route: `delivery/git-worklog-guardrails`.

Protect unrelated changes, local-only files, and verification integrity.

## Workflow

1. Check branch, remote, upstream, dirty files, and staged files.
2. Stage only explicit files related to the task.
3. Run project-defined verification and report only commands actually executed.
4. Write structured Conventional Commit messages unless the repo proves another convention.
5. Suggest a checkpoint commit when a verified logical slice, large diff, many touched files, or mixed concern set would be clearer as a separate commit.
6. Push only to the intended remote/branch.
7. Write detailed worklogs for milestones, blockers, large direction changes, or long debugging.

## Reference

Read `references/git-worklog-checklist.md` before committing, pushing, writing PR bodies, or creating worklogs.
