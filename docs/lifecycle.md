# Installation, update, migration, and recovery

Manage the CLI package, user skills, and project records separately. npm installs and updates the Node CLI; `ai-agent-playbook skills` manages selected guidance; record commands select a project or explicitly registered workspace source. MCP remains a separate host setting.

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

When upgrading an existing project, also [review its active instructions](existing-repository-bootstrap.md#review-instructions-when-upgrading-from-05). Package and skill updates preserve those files; they cannot remove stale command or skill requirements from them.

Default `core` selects `project-memory` and `spec-artifacts`. `light` selects only the compact `project-notes` skill without references. `development` adds design direction, UI polish, and document editing. `legacy` selects `legacy-contracts` alone. Repeated `--skill` options replace a profile with an explicit list. See [Skill catalog](skill-catalog.md).

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

### Light installation and switching profiles

For a new light installation:

```sh
ai-agent-playbook skills install --profile light --dry-run --json
ai-agent-playbook skills install --profile light --json
ai-agent-playbook skills check --profile light --json
```

Use the same profile for later `update` or `uninstall`. Source-checkout PowerShell wrappers accept `-Profile light` too:

```powershell
.\install.ps1 -Profile light -WhatIf
.\install.ps1 -Profile light
```

Installing light does not remove previous skills. To reduce an existing core/development installation, preview a profile migration:

```sh
ai-agent-playbook skills migrate --profile light --json
ai-agent-playbook skills migrate --profile light --apply --json
```

Migration installs the selected skill and removes unchanged known AAPB copies outside the selection from both supported roots, including other current profiles and recognized old copies. This can also remove an explicitly installed legacy skill; inspect the operations and use an explicit `--skill` selection if it must remain. Modified, unmanaged, linked, and unrelated plugin directories are preserved. A partial result can leave additional skills installed. To switch back, preview `skills migrate --profile core --json` or `--profile development`, then repeat with `--apply`. Use the returned transaction backup for rollback, and reload the host to check its actual catalog.

Cleanup depends on every selected skill being a valid, unchanged managed installation matching the planned source. If a selected installation conflicts during inspection, removal is omitted from the plan; independent installations can still proceed. During apply, that prerequisite is checked again immediately before each removal, including for already-current skills. If a replacement fails or changes, remaining cleanup is blocked. Previously completed operations are not automatically undone; use the returned backup to recover them. A conflict in an unselected cleanup target still preserves that target while other safe removals can proceed.

Light is a smaller guidance selection, not a privacy or logging control. Its result-focused wording applies when that skill is used and remains subject to host/project instructions. See [Light mode](skill-catalog.md#light-mode) for scope and limitations. Bootstrap needs no new mode: `bootstrap "<project>" --records minimal --agents preserve --dry-run` previews the existing minimal record setup, independently of skill selection.

## Migrate 0.5 copies into one root

Use this when reconciling a selected profile or when AAPB copies remain in both `.codex/skills` and `.agents/skills`:

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

Explicit argument mode defaults to minimal records; `--records standard` also adds worklog and knowledge guides when absent. Root `AGENTS.md` is preserved unless `--agents link` is selected. `--local-only` aliases `--exclude local`; without Git, records are still created and the skipped exclusion is reported. Choose `shared` for a `.gitignore` rule, `global` for a user-level Git exclusion, or `none` for no new rule. Global changes affect other repositories using that file, while local Git excludes may also affect linked worktrees.

Existing records are not overwritten. Rerunning bootstrap can add missing guides or an explicit AGENTS link and transition unchanged AAPB-owned exclusions. User rules, tracked files, metadata, and membership remain preserved; see [Existing repositories](existing-repository-bootstrap.md).

Project record deletion is a deliberate file-management decision, not part of package uninstall. Back up useful records and check references and Git tracking before removing a playbook. The old `managed uninstall` command is retired; it does not silently delete documents in 1.0.

## Recover bootstrap and exclusion changes

Keep the `backup` journal returned by a bootstrap change, including exclusion-mode transitions and additions to AGENTS.md. Use that exact journal with the same project:

```sh
ai-agent-playbook migrate bootstrap-rollback "<project>" --backup "<returned-journal>" --json
ai-agent-playbook migrate bootstrap-rollback "<project>" --backup "<returned-journal>" --apply --json
```

The first call previews; `--apply` restores affected content only when current and saved hashes permit it. Later user edits are preserved as conflicts. Check returned operations and warnings, retain the journal, and recover dependent changes newest first. This is separate from layout migration and skill rollback. A backup returned by `workspace add/remove` is a prior registry, not a bootstrap journal; review it alongside current membership before a deliberate registry restoration.

For common records and explicit members, follow [Workspaces](workspaces.md). For date-based worklogs and topic knowledge, follow [Durable records](durable-records.md). Those operations do not require moving existing records or setting a timer.

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

## Recover a member-local record source

`migrate layout`, `migrate rollback`, and `migrate bootstrap-rollback` accept `--record-source repo:<id>` for an explicitly registered member's existing records. Keep the same project target, source, and matching returned backup through preview and apply. Omission uses the common workspace records; selecting a member must not be replaced by changing shell directories alone. A migration or rollback updates only its selected record source, preserving common records and other members.

The [command guide](commands.md) shows source-qualified examples. Inspect legacy ownership and current hashes before applying; source selection does not bypass those checks.

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
