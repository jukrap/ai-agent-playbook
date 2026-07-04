---
name: release-notes-changelog
description: Use when preparing release notes, changelogs, migration notes, rollback notes, or known issues.
---

# Release Notes Changelog

Translate shipped or planned changes into reader-facing release artifacts without copying commit history.

## Workflow

1. Identify the reader: user, support, operator, developer, maintainer, stakeholder, or migration owner.
2. Group changes by user impact, operational impact, migration impact, known issue, and rollback or support note.
3. Separate verified behavior from implementation detail, commit titles, worklog notes, and generated summaries.
4. Include risk, caveat, compatibility, migration, rollback, and monitoring notes when relevant.
5. Cite only reviewed evidence and actual verification results; do not invent tests or release status.
6. Keep private paths, credentials, internal URLs, branch names, PR numbers, and noisy reference names out of the artifact.

## Reference

Read `references/release-note-audience-checks.md` when choosing release artifact structure and reader detail.

Read `references/changelog-risk-and-rollback.md` when documenting risk, known issues, migrations, rollback, or verification evidence.
