# Maintenance

Before editing, inspect relevant instructions, the current branch, and dirty changes. Read current behavior from code and intended behavior from specifications. Preserve unrelated work. English is the functional source of truth; update Korean coverage in the same change.

## Preserve the purpose of each document

Keep SKILL.md entrypoints concise and trigger-focused. Keep human guides complete enough for their readers. Shortening a skill or reducing bootstrap files is not permission to remove README branding, language navigation, beginner instructions, worked examples, or recovery guidance.

Before a major documentation rewrite, compare the previous structure and reader journeys. Account for important sections: retain them, update them for current behavior, or move them behind a clear link. Explicitly identify retired features instead of leaving old commands runnable-looking or deleting their recovery explanation.

English and Korean should agree on commands, limits, behavior, and verification claims. Their taglines, explanation order, language selectors, and emphasis can differ intentionally. Review Korean for understandable prose, not just source-file coverage.

For copyable instructions, review the rules themselves as well as Markdown links: code-font filenames, reading order, retired commands, and architecture assumptions can be wrong even when link checks pass. Compare removed rules with their replacements and preserve useful contracts in a discoverable reference. Personal templates need enough detail for their purpose; skill brevity is not their length limit.

## Content placement

Installable SKILL.md files belong under `skills/<category>/<name>`. Frontmatter contains only `name` and a trigger-focused `description` beginning with `Use when`. Put longer selected detail in local references; the root reference library is optional, not an automatic reading list.

Project-copyable policies belong in `templates/agents`; records belong in `templates/project-playbook`. Do not require deleted template files or retired skill names in copyable instructions. Sync installed skills only from the intended repository. See [Classification](classification.md).

## Verification after a coherent change

For substantive integrated changes, run the repository checks:

```powershell
npm run check
npm run typecheck
npm test
npm run validate:python
npm run validate:all
.\scripts\validate-skills.ps1
.\scripts\validate-translations.ps1
.\scripts\sync-skills.ps1 -WhatIf
.\install.ps1 -SkipValidation -WhatIf
.\update.ps1 -SkipValidation -WhatIf
```

Do not rerun the full suite after every paragraph. Use affected checks for further documentation-only edits; rerun behavioral checks when new behavior, failures, or unresolved concerns warrant them. Select a profile when actually syncing. Preview legacy migration separately.

For human documentation, also follow the beginner path in an isolated folder, run changed command examples, compare English/Korean literals and meaning, and inspect links and presentation. Translation coverage and valid links do not prove a guide is understandable or preserves intent.

## Package and public artifacts

Keep Node ESM, the `ai-agent-playbook` package and primary executable, and the compatible `aapb` alias. Both executables use the same implementation. Verify meaningful behavior boundaries such as ownership, path limits, migration, and recovery. Python prerelease metadata maps npm `next.N` to PEP 440 `devN`.

Inspect the actual npm archive, not only the checkout. Include linked human guides, examples, and README images. Check Markdown links and HTML `src`/`href`, including language-specific relative paths. Verify code-font paths and commands separately; a Markdown link checker does not catch nonexistent paths mentioned in prose.

Keep private paths, credentials, raw logs, local project records, backups, and test installations out of public artifacts. Do not weaken hygiene or translation checks to hide findings. Preserve versioned verification evidence and distinguish historical checks from checks for the current archive.

## Git and release records

Use Korean or the user's working language with Conventional Commit type/scope. For substantive changes include a concise body and actual verification. Stage explicit related paths, inspect the staged diff, and respect hooks. Keep work milestones in the project's approved local records.

A commit, push, PR, merge, npm publication, and local installation are different actions; follow the user's authorization and report only completed actions. See [Publishing checklist](publishing-checklist.md).
