# AI Agent Playbook 1.3.0

This release adds an optional light skill installation and protects profile transitions when a replacement cannot be installed. The default core profile, project record formats, and MCP configuration remain compatible.

## What changes

- `--profile light` selects one compact `project-notes` skill without a reference bundle. It provides brief continuity guidance, focused record reads, and result-focused replies subject to required disclosures and host instructions. Core still selects two skills and development selects five.
- The CLI and PowerShell installers support light for installation, updates, checks, removal, and explicit migration. Ordinary installation is additive: existing skills remain until explicitly removed or migrated.
- Profile migration reconciles known current and old AAPB copies using ownership and exact-file checks. All selected replacements must be valid before cleanup. A selected-installation conflict prevents removal planning; each removal rechecks the replacements during apply. A failed or changed replacement blocks remaining removals.
- Independent safe installations and cleanup operations remain supported. Modified, unmanaged, linked, and unrelated plugin directories are preserved. Completed operations retain rollback data.
- Bootstrap keeps the existing `--records minimal` option. No separate light bootstrap flag or record migration is required.

Light reduces the selected instruction bundle. It does not change model settings, permissions, mandatory disclosures, provider logs, or company audit records. It is not a global response setting or a guarantee of token or cost savings. See [Light mode](skill-catalog.md#light-mode).

## Install and switch

After npm publication, install the exact release:

```sh
npm install -g ai-agent-playbook@1.3.0
ai-agent-playbook --version
```

GitHub release availability and npm publication are separate. Before the registry version is available, use the verified release archive with npm as described in [Local package testing](demo.md).

For a new skill installation:

```sh
ai-agent-playbook skills install --profile light --dry-run --json
ai-agent-playbook skills install --profile light --json
ai-agent-playbook skills check --profile light --json
```

To reduce an existing installation, inspect the full removal plan before applying:

```sh
ai-agent-playbook skills migrate --profile light --json
ai-agent-playbook skills migrate --profile light --apply --json
```

Migration can remove an independently selected legacy skill too; include all skills that must remain with explicit `--skill` options. Retain the returned backup. A partial operation does not automatically undo previously completed changes. Reload the host and inspect its actual skill catalog after applying. See [Profile transitions](lifecycle.md#light-installation-and-switching-profiles).

## Recovery and scope

Use `skills rollback --backup "<transaction-directory>" --json` to preview recovery, then repeat with `--apply`. Recover newest transactions first. To change capability selections, preview a migration to core or development instead. Returning to the previous CLI uses `npm install -g ai-agent-playbook@1.2.2`; changing the CLI alone does not restore installed skills.

Local and package validation are recorded in [Verification](verification.md). They do not establish automatic selection in every host, measured token savings, or npm publication. Existing user installations and external service settings are separate from release preparation.
