# AGENTS.md

This repository contains reusable AI agent skills and project templates. Keep content agent-agnostic unless it belongs under `adapters/`.

## Working rules

- Before adding, moving, or renaming content, read `docs/maintenance.md`.
- Keep `skills/*/*/SKILL.md` concise and trigger-focused.
- Put longer reusable details in `references/`.
- Keep project-copyable root policies under `templates/agents`.
- Keep copyable project-memory docs under `templates/project-playbook`.
- Do not put personal absolute paths, company names, credentials, internal URLs, branch names, or PR numbers in public docs.
- Update Korean translations in the same change as English source edits.
- Validate skills and translations after editing.
- Sync installed local copies only from this repository.
- For commits and PRs, use Conventional Commit type/scope, write the subject/body in the user's or repository's working language, and include a body plus verification notes for non-trivial changes.

## Skill structure

- Use lowercase hyphenated skill names.
- `SKILL.md` frontmatter must contain only `name` and `description`.
- Description starts with `Use when...` and describes trigger conditions, not the workflow.
- Prefer one-level references from `SKILL.md`.

## Verification

Run these after edits:

```powershell
.\scripts\validate-skills.ps1
.\scripts\validate-translations.ps1
.\scripts\sync-skills.ps1 -WhatIf
```

If local installed copies need updating, run:

```powershell
.\scripts\sync-skills.ps1
```
