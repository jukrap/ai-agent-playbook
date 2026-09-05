# Installation, migration and recovery

Package installation and skill installation are separate. Validate a local prerelease tarball with an isolated npm prefix. Publishing is not part of install or update.

## Skill selection

Core installs two record/format entrypoints. Development adds three design/UI/prose entrypoints. Legacy installs one stack-contract entrypoint. Individual --skill selections replace the profile selection. References belonging to a selected skill travel with it; the larger source reference library is not automatically installed.

An ordinary install/update affects only selected skills in .agents/skills. It does not mirror them into .codex/skills or delete old copies. Run migrate explicitly for a 0.5 installation.

## Transaction

The default backup parent is a sibling of the selected .agents/skills directory, named aapb-backups. Custom installation roots therefore keep their default backups on the installation filesystem. Backups and every affected installation in one transaction must share a filesystem so directory moves remain atomic. Preview rejects a mismatched --backup-root before creating a journal or changing installed files. A migration spanning multiple filesystems must be split into separate selections/root pairs with a local backup for each; cross-filesystem copying is not an atomic migration mode.

1. Preview the selected installation and known legacy cleanup.
2. Inspect ownership markers, hashes, destination roots, and conflicts.
3. Apply with a backup root outside both installation roots.
4. Keep the returned transaction directory and journal.
5. Reload the host and inspect the new catalog separately from the file changes.

The journal records prepared, applying, applied and restored entries. Existing directories are moved into the backup before replacements are activated. Interrupted operations retain their recoverable content. A retry observes the current filesystem; it does not assume that the previous run completed.

Modified managed files, unmanaged files and linked directories are preserved. Independent safe items may complete while the result reports conflicts. Rollback checks current and saved hashes before restoring; later user edits are not overwritten. Do not modify a recovery journal or its content.

## Project records

New bootstrap preserves root instructions and creates only CURRENT.md plus metadata. --local-only uses the Git-local exclude file, including linked worktrees. Existing projects are not re-bootstrapped over their content.

Structured and legacy playbook paths remain readable. If multiple roots exist, reconcile the ambiguity rather than silently selecting one. Layout migration requires an existing reviewed CURRENT.md and owned, unchanged layout metadata. It saves the previous manifest and ownership marker in a local archive. User records are not rewritten or automatically summarized.

Preview with `aapb migrate layout <project> --to minimal --json`, then explicitly add --apply. The applied result returns the playbook-relative backup path. Preview recovery with `aapb migrate rollback <project> --backup <returned-path> --json`, then add --apply to restore unchanged metadata. Later edits are preserved as conflicts.

## Retired commands and exact recovery

Execution, supervisors, schedules and automatic delivery are not included in 1.0. Native host execution/scheduling or existing project tools are the replacement. For an intentional old-runtime operation, use the pinned `npx ai-agent-playbook@0.5.11` command. Preserve the actual previous global package separately if it differs from the source baseline.

Before replacing a global executable, check whether existing local or remote schedules reference it. This package never rewrites or deletes schedules or remote records. Keep the older executable available for an explicitly chosen recovery.

PowerShell install and sync wrap the same Node implementation. update.ps1 no longer pulls implicitly; -Pull explicitly requests git pull --ff-only. -WhatIf performs no mutation.
