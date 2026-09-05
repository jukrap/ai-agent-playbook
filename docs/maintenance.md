# Maintenance

Read the current source, relevant instructions and worktree state before changing content. English is canonical; update Korean mirrors in the same change. Installable SKILL.md files belong only under skills/<category>/<name>. Frontmatter contains name and a trigger-focused description beginning with Use when.

Keep short skill entrypoints, task-specific local references, project-copyable policies under templates/agents, and project records under templates/project-playbook. The optional reference library is not an automatic reading list. Sync installed copies only from this repository.

## Checks

Run after a coherent change:

```sh
npm run check
npm run typecheck
npm test
npm run validate:python
npm run validate:all
```

Windows wrapper compatibility:

```powershell
.\scripts\sync-skills.ps1 -WhatIf
.\install.ps1 -SkipValidation -WhatIf
.\update.ps1 -SkipValidation -WhatIf
```

Select a profile when actually syncing. For old duplicates, inspect a migration preview first. Do not re-run the entire suite for every paragraph; rerun affected checks when a failure or new behavior warrants it.

## Runtime and artifacts

Keep Node ESM entrypoints and the aapb command. Add meaningful regressions for changed data boundaries, overwrite rules, migration/recovery and public commands. Validate npm pack contents and prerelease installation. Optional Python metadata uses PEP 440, mapping npm next.N to devN.

Do not weaken public-document hygiene or translation coverage to hide failures. Keep machine paths, credentials, local records and raw evidence out of public artifacts. Update CI when validation behavior changes.

Use Conventional Commit type/scope and the user's working language, with a body and actual verification for substantive changes. Stage explicit related paths; do not bypass hooks or include local-only records. Remote publication is separate from local commits.
