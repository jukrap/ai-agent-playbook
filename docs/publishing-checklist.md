# Publishing Checklist

Use this before pushing the repository to a shared Git host.

## Maintenance check

- Read `docs/maintenance.md` for any added or changed skills, templates, examples, translations, or adapters.
- Confirm README, classification docs, template indexes, Korean translations, and installed skill copies were updated when applicable.
- Make sure portable project rules do not depend on machine-local custom instructions.

## Public hygiene

Search for private or machine-specific values:

```powershell
rg -n --glob '!docs/publishing-checklist.md' "PERSONAL_NAME|COMPANY_NAME|CUSTOMER_NAME|INTERNAL_DOMAIN|SECRET|TOKEN|PASSWORD|PRIVATE_KEY|PR #|ticket #|[A-Za-z]:\\\\" .
```

- Remove credentials, internal domains, screenshots with private data, and dated branch/PR status.
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

After pushing, confirm the validation workflow passes if the repository uses one.

## Git host setup

- Choose a repository name such as `ai-agent-playbook` or `agent-harness-playbook`.
- Keep the repository private until the hygiene search and validation commands pass.
- Keep the MIT license in `LICENSE` unless the repository intentionally changes its redistribution policy.
- Add topics such as `ai-agents`, `skills`, `codex`, `agent-playbook`, `legacy-systems`, `software-engineering`.
- After publishing, update install examples with the final repository URL.

## First push

After creating the empty private repository:

```powershell
git init
git config user.name "<git-user-name>"
git config user.email "<git-user-email>"
git add .
git commit -m "docs: initial ai agent playbook"
git branch -M main
git remote add origin <repo-url>
git push -u origin main
```

Use repository-local Git config here so unrelated global Git settings stay untouched.
