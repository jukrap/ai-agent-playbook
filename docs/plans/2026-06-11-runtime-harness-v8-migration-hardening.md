# Runtime Harness V8 Migration Hardening

**Goal:** Make existing-project adoption safer after the `.ai-playbook/` path change without adding blocking hooks, continuation, automatic doctor execution, or settings writes.

**Architecture:** Keep the document and CLI harness as the default path. Add small, deterministic CLI checks that help users preview writes, review stale guides, and move legacy playbook paths only after explicit approval.

## Scope

- Add a read-only `migrate path <target>` preview for legacy `ai-playbook/` projects.
- Add `migrate path <target> --apply` for the reviewed folder move from `ai-playbook/` to `.ai-playbook/`.
- Update root and playbook references from `ai-playbook/` to `.ai-playbook/` during the migration.
- Add `.ai-playbook/` to `.gitignore` during migration only when the legacy path is already ignored, while preserving the legacy ignore entry for transition compatibility.
- Make bootstrap preflight all planned writes before creating files so conflicts do not leave partial playbook output behind.
- Add `guides sync --check --diff` to show the first differing line for stale guides without writing files.

## Boundaries

- Do not install hooks or edit adapter settings.
- Do not add blocking, continuation, or automatic doctor execution.
- Do not call the network.
- Do not treat `--force` as a migration strategy.
- Do not modify unrelated project files during path migration.
- Keep legacy `ai-playbook/` read/write compatibility when `.ai-playbook/` is absent.

## Test Coverage

- Bootstrap conflict preflight refuses existing root policy files without partial writes.
- Guide check diff reports stale guide line differences and remains read-only.
- Migration preview reports folder move, reference updates, and `.gitignore` changes without writing files.
- Migration apply moves the legacy folder, updates references, and keeps doctor compatible with `.ai-playbook/`.
- Migration conflict reports both-path conflicts without writing files.
- Tests include spaces and non-ASCII characters in target paths.

## Documentation

- Update runtime CLI docs with `migrate path` and `guides sync --check --diff`.
- Update installation and adapter docs so migration remains a reviewed manual action.
- Update copied project playbook guides so target projects can discover the safer migration flow.
- Update Korean translations with the English source edits.

## Verification

```powershell
npm run check
npm test
.\scripts\validate-skills.ps1
.\scripts\validate-translations.ps1
.\scripts\sync-skills.ps1 -WhatIf
.\install.ps1 -SkipValidation -WhatIf
.\update.ps1 -SkipValidation -WhatIf
git diff --check
```

Also run public documentation searches for external harness names and fixed local absolute paths before merge.
