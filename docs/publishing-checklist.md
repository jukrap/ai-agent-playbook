# Publishing Checklist

Use this before pushing the repository to GitHub.

## Maintenance check

- Read `docs/maintenance.md` for any added or changed skills, templates, examples, translations, or adapters.
- Confirm README, classification docs, template indexes, Korean translations, and installed skill copies were updated when applicable.
- Make sure portable project rules do not depend on machine-local custom instructions.

## Public hygiene

- Search for personal paths:

```powershell
rg -n --glob '!docs/publishing-checklist.md' "PERSONAL_NAME|COMPANY_NAME|CUSTOMER_NAME|INTERNAL_DOMAIN|SECRET|TOKEN|PASSWORD|PRIVATE_KEY|PR #|ticket #|C:\\|D:\\" .
```

- Remove credentials, internal domains, screenshots with customer data, and dated branch/PR status.
- Keep examples generic.
- Do not publish generated zip files or local install output.
- Confirm `.gitignore` excludes local environment files, logs, temporary files, and generated dependency folders before the first commit.

## Validation

```powershell
.\scripts\validate-skills.ps1
.\scripts\validate-translations.ps1
.\scripts\sync-skills.ps1 -WhatIf
.\install.ps1 -SkipValidation -WhatIf
.\update.ps1 -SkipValidation -WhatIf
```

If skill source files changed, run `.\scripts\sync-skills.ps1` after validation.

After pushing to GitHub, confirm the `Validate` workflow passes. It runs the skill and translation validators on `push` and `pull_request`.

## GitHub setup

- Choose a repository name such as `ai-agent-playbook` or `agent-skills-playbook`.
- For a private repository under `jukrap`, `ai-agent-playbook` maps cleanly to `https://github.com/jukrap/ai-agent-playbook`.
- Keep the repository private until the hygiene search and validation commands pass.
- Keep the MIT license in `LICENSE` unless the repository intentionally changes its redistribution policy.
- Add topics such as `ai-agents`, `skills`, `codex`, `claude-code`, `legacy-systems`, `software-engineering`.
- After publishing, update install examples with the final repository URL.

## First push

After creating the empty private repository on GitHub:

```powershell
git init
git config user.name "jukrap"
git config user.email "jukrap628@gmail.com"
git add .
git commit -m "docs: initial ai agent playbook"
git branch -M main
git remote add origin https://github.com/jukrap/ai-agent-playbook.git
git push -u origin main
```

Use a repository-local Git config here so global company Git settings stay untouched.
