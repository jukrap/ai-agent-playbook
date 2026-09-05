# Installation, update, migration, and recovery

Manage the CLI package, user skills, and project records separately. npm installs and updates the Node CLI; `ai-agent-playbook skills` manages selected guidance; record commands work on one project. MCP remains a separate host setting.

## Install and update with npm

```sh
npm install -g ai-agent-playbook
ai-agent-playbook --version
ai-agent-playbook --help
```

To update to the current published release:

```sh
npm install -g ai-agent-playbook@latest
ai-agent-playbook --version
```

Before replacing an existing executable, save its exact version and recovery package. Check whether an existing schedule refers to it. Updating npm files does not update installed skills, alter project records, register MCP, or change model settings.

### Select a specific version

```sh
npm view ai-agent-playbook dist-tags --json
npm install -g "ai-agent-playbook@<version>"
npx "ai-agent-playbook@<version>" --help
```

Replace `<version>` with a published version you intend to use. `npx` is convenient for occasional calls; repeat the version pin to avoid mixing runtimes. A global installation, npm cache, and source checkout may contain different versions. Use the selected executable's `--version` when diagnosing a mismatch.

### Install without a global command

Use a separate directory as the npm prefix:

```sh
npm install --prefix "<prefix>" "ai-agent-playbook@<version>"
node "<prefix>/node_modules/ai-agent-playbook/bin/aapb.mjs" --help
```

Choose a prefix outside projects whose dependencies you want to leave unchanged. Use that Node script in place of `ai-agent-playbook` for later examples. No PowerShell wrapper is required.

## Remove or recover the global CLI

```sh
npm uninstall -g ai-agent-playbook
```

This removes the program and leaves skills and project records in place. To recover an earlier executable, install its saved archive and check the version:

```sh
npm install -g "<previous-archive.tgz>"
aapb --version
```

The recovery example uses `aapb` because 0.5.11 provides only that command. In 1.0, `ai-agent-playbook` is primary and `aapb` remains an alias.

Keep the exact previous installation separately if it differs from the source baseline. Recovery of user skills and project layout uses the distinct procedures below.

## Development and local package testing

For an unpublished candidate, npm can install a local archive using the same installation mechanism. Build and inspect it with [Local package testing](demo.md), then pass the archive instead of a registry package:

```sh
npm install --prefix "<demo-prefix>" --ignore-scripts "<archive.tgz>"
node "<demo-prefix>/node_modules/ai-agent-playbook/bin/aapb.mjs" --version
```

Keep the archive checksum with its verification evidence. From a source checkout, use `npm install --no-package-lock` and `node bin/aapb.mjs --help`; see [Maintenance](maintenance.md) for source checks. Publishing is a separate release action, not an installation prerequisite.

## Select and manage skills

Default `core` selects `project-memory` and `spec-artifacts`. `development` adds design direction, UI polish, and document editing. `legacy` selects `legacy-contracts` alone. Repeated `--skill` options replace a profile with an explicit list. See [Skill catalog](skill-catalog.md).

```sh
ai-agent-playbook skills install --profile development --dry-run --json
ai-agent-playbook skills install --profile development --json
ai-agent-playbook skills check --profile development --json
ai-agent-playbook skills update --profile development --dry-run --json
ai-agent-playbook skills update --profile development --json
```

An ordinary install/update touches only the selected skills in `.agents/skills`. It does not mirror them into `.codex/skills`, delete other profiles, or clean up all old copies. Each selected skill's own references travel with it; the larger historical reference library is not automatically installed.

To remove the selected managed skills:

```sh
ai-agent-playbook skills uninstall --profile development --dry-run --json
ai-agent-playbook skills uninstall --profile development --json
```

Read the result and preserve its backup directory. Modified files, unknown ownership, and linked directories are preserved as conflicts. A filename alone is not proof of ownership. Force replacement is unsupported.

After installation or removal, reload the agent and check its actual catalog. `skills check` verifies disk copies, not whether a running conversation loaded them.

## Migrate 0.5 copies into one root

Use this when AAPB copies remain in both `.codex/skills` and `.agents/skills`:

```sh
ai-agent-playbook skills migrate --profile development --json
ai-agent-playbook skills migrate --profile development --apply --json
```

The first command is a preview. Inspect selected skills, proposed operations, ownership/hash checks, destination paths, and conflicts. The second applies independent safe operations and records what happened. Conflicting items remain untouched; the result can report failure even when other items completed.

Custom roots use `--agents-root`, `--codex-root`, and optionally `--backup-root`. The default backup parent is `aapb-backups` beside the selected skill directory. Backups must be outside both installation roots and on the same filesystem as every affected installation in that transaction. A cross-filesystem backup is rejected before changes. Split migrations across filesystems into separate selections/root pairs with local backups; copying across volumes is not an atomic migration mode.

## Recover a skill operation

Installation operations retain a transaction directory with a journal and saved content. The journal records preparation, application, and restoration. Keep it intact; editing its data can make recovery fail.

```sh
ai-agent-playbook skills rollback --backup "<transaction-directory>" --json
ai-agent-playbook skills rollback --backup "<transaction-directory>" --apply --json
```

Use the directory returned by the operation. If several transactions affected the same skills, reverse them newest first. Rollback checks current and saved hashes and preserves later user edits as conflicts. An interrupted operation retains recoverable content; inspect the journal and current filesystem before retrying or rolling back. Do not assume a nonzero exit means no files changed.

## Create, share, or retain project records

```sh
ai-agent-playbook bootstrap "<project>" --local-only --dry-run
ai-agent-playbook bootstrap "<project>" --local-only
```

New bootstrap creates `CURRENT.md`, `manifest.json`, and `.ai-agent-playbook-install.json`; it preserves root `AGENTS.md`. `--local-only` adds an exclusion through Git's local exclude file, including linked worktrees. It requires Git and does not change shared `.gitignore`. Omit it when records should be available for committing or when the project is not a Git repository.

Existing records are not overwritten. Rerunning bootstrap does not convert an existing shared playbook into local-only records. Choose that Git policy explicitly for existing records; see [Existing repositories](existing-repository-bootstrap.md).

Project record deletion is a deliberate file-management decision, not part of package uninstall. Back up useful records and check references and Git tracking before removing a playbook. The old `managed uninstall` command is retired; it does not silently delete documents in 1.0.

## Migrate and restore layout metadata

Reading an existing structured or legacy playbook does not require migration. Migration to `minimal` changes owned, unchanged metadata only. It requires an existing readable UTF-8 `CURRENT.md` within the record-size bound; review that document yourself before applying.

```sh
ai-agent-playbook migrate layout "<project>" --to minimal --json
ai-agent-playbook migrate layout "<project>" --to minimal --apply --json
```

The result returns a playbook-relative backup path. It stores the original manifest and ownership marker. Old records, evidence links, and root instructions remain in place; no summary is promoted into current facts.

```sh
ai-agent-playbook migrate rollback "<project>" --backup "<returned-relative-backup>" --json
ai-agent-playbook migrate rollback "<project>" --backup "<returned-relative-backup>" --apply --json
```

Later metadata changes are preserved as conflicts. Missing ownership or a modified manifest is a reason to inspect and reconcile, not invent ownership to force migration. Multiple playbook roots are ambiguous and must be reconciled deliberately.

## PowerShell checkout helpers

These wrappers call the same Node implementation:

```powershell
.\install.ps1 -Profile development -WhatIf
.\scripts\sync-skills.ps1 -Profile development -WhatIf
.\update.ps1 -Profile development -WhatIf
```

Remove `-WhatIf` to apply. `-Migrate` selects explicit legacy migration; without it the wrappers update selected skills only. `update.ps1` does not pull implicitly. `-Pull` requests `git pull --ff-only`; with `-WhatIf` even that is previewed. Run wrappers from a source checkout, and sync only from the intended source.

## Retired runtime recovery

Execution, supervision, schedules, indexing, and automatic delivery are retired in 1.0. Use host execution/scheduling or existing project tools. If an old-runtime operation is intentionally needed, the recovery reference is `npx ai-agent-playbook@0.5.11`; preserve an exact older global installation separately if its version differs.

AAPB never rewrites existing schedules or remote records, runs a pinned old runtime automatically, or restores a whole personal configuration. Recover only the affected settings and preserve newer user choices. See [Commands](commands.md) for aliases and [MCP setup](mcp-permission-model.md) for the `playbook_*` to `aapb_*` prerelease name change.
