# Lifecycle Guide

This guide covers the full local lifecycle: choosing how to run the CLI, installing, updating, or removing reusable skills, registering MCP manually, bootstrapping or removing `.ai-agent-playbook/`, and using local checkout scripts.

This package is easiest to use through npm or npx. A local Git checkout with the PowerShell scripts is still supported for development, private forks, and Windows environments that prefer explicit local scripts.

If you are using the playbook for the first time, start with [First 10 minutes](quick-start.md), then return here for lifecycle details.

There are three separate layers:

1. The npm package installs the `aapb` CLI and bundled source files.
2. `skills install` copies reusable skills into user-level skill roots.
3. `bootstrap` copies a project playbook into one target repository.
4. `mcp` starts a local stdio server only when an MCP-capable AI app launches it.

Installing the npm package by itself does not copy skills, create `.ai-agent-playbook/`, enable hooks, register MCP settings, or register slash commands. Those actions stay explicit.

## Choose a CLI Entry Point

Use this when Node.js is available. The public package is [`ai-agent-playbook`](https://www.npmjs.com/package/ai-agent-playbook).

`npm i` is the short alias for `npm install`; scope flags decide where the package goes.

| Goal | Command | Result |
| ---- | ------- | ------ |
| Try the tool or run occasional commands | `npx ai-agent-playbook --help` | npm downloads/runs the package for that command. No project dependency is added. |
| Use `aapb` from any directory | `npm install -g ai-agent-playbook` | Installs a global CLI command. Use `npm install -g ai-agent-playbook@latest` to update it. |
| Pin the tool in one project | `npm install -D ai-agent-playbook` | Adds a dev dependency and `node_modules/ai-agent-playbook`; run it with `npx ai-agent-playbook ...`. |
| Work from a source checkout | `node .\bin\aapb.mjs --help` | Runs the checked-out repository directly. |
| Let an AI app call read-only tools | `npx ai-agent-playbook mcp` | Use this as the app's local stdio MCP server command. |

Avoid treating plain `npm install ai-agent-playbook` as the normal first step unless you intentionally want this package as a runtime dependency of the current project. It installs under the current project's `node_modules`, but it still does not install skills or bootstrap a project playbook.

## Recommended first-time setup

Start with read-only previews:

```powershell
npx ai-agent-playbook --help
npx ai-agent-playbook skills install --dry-run
npx ai-agent-playbook skills install
npx ai-agent-playbook bootstrap <target-project> --dry-run
npx ai-agent-playbook operator check <target-project> --json
```

Restart Codex or start a new agent session after skill installation so new skill metadata is picked up.

Use a global install only when you want the shorter command:

```powershell
npm install -g ai-agent-playbook
aapb --help
aapb skills check
```

After a global install, replace `npx ai-agent-playbook` with `aapb` in the examples below.

For the full command reference, see [Command guide](commands.md).

## Optional Python Engine

Node.js is enough for the CLI, skill lifecycle, project bootstrap, and MCP server. Python 3.11+ is recommended when you want stronger local language checks, especially Korean prose and translation cleanup. The Python engine is read-only and optional; if it is not available, supported commands keep their JavaScript fallback.

For a source checkout, bootstrap a local environment with:

```powershell
.\scripts\bootstrap-python.ps1
node .\bin\aapb.mjs runtime python-status --json
```

For an npm or global install, create any Python 3.11+ virtual environment and point the harness at it:

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\python -m pip install -U pip kss kiwipiepy
$env:AI_AGENT_PLAYBOOK_PYTHON = ".\.venv\Scripts\python.exe"
npx ai-agent-playbook runtime python-status --json
```

Use `writing naturalness-check --engine auto` for the normal path. Use `--engine js` when Python should be ignored, and `--engine python` when a missing Python environment should be reported explicitly.

## Reusable Skills Lifecycle

Reusable skills are installed into user-level skill roots, not into a target repository:

- `%USERPROFILE%\.codex\skills\<skill>`
- `%USERPROFILE%\.agents\skills\<skill>`
- `%USERPROFILE%\.agents\skills\legacys\<legacy-skill>` for legacy skills

Install or update managed local skills:

```powershell
npx ai-agent-playbook skills check --json
npx ai-agent-playbook skills install --dry-run
npx ai-agent-playbook skills install
npx ai-agent-playbook skills update --dry-run
npx ai-agent-playbook skills update
```

Remove managed local skills:

```powershell
npx ai-agent-playbook skills uninstall --dry-run
npx ai-agent-playbook skills uninstall
```

`skills install` and `skills update` are idempotent. They sync managed skills into the common Codex and agent skill directories. They refuse to overwrite locally edited managed skills unless `--force-managed` is provided, and they refuse different same-name unmanaged skills unless `--force-unmanaged` is provided.

`skills uninstall` removes only unmodified managed skills installed by this playbook. Run it with `--dry-run` first. If a managed skill was edited locally, uninstall stops until you either keep it or intentionally pass `--force-managed`.

The ownership marker is `.ai-agent-playbook-install.json` inside each installed skill folder. The marker stores `source: "ai-agent-playbook"` and hashes so the CLI can distinguish this playbook's managed copies from other people's skills.

Restart Codex after skill installation or update so the next session can pick up skill metadata.

## Global CLI Lifecycle

The global npm package and the copied skills are separate. Removing the global package does not remove copied skills.

```powershell
npm install -g ai-agent-playbook@latest
npm uninstall -g ai-agent-playbook
```

Use `npx ai-agent-playbook skills uninstall` or `aapb skills uninstall` when you want to remove copied skills.

## MCP registration

MCP is optional. Use it when an AI app supports local MCP servers and you want the agent to call playbook tools directly instead of asking you to remember CLI commands.

The recommended server command is:

```powershell
npx ai-agent-playbook mcp
```

A typical MCP settings entry looks like this:

```json
{
  "mcpServers": {
    "ai-agent-playbook": {
      "command": "npx",
      "args": ["ai-agent-playbook", "mcp"]
    }
  }
}
```

After a global install, the shorter variant is:

```json
{
  "mcpServers": {
    "ai-agent-playbook": {
      "command": "aapb",
      "args": ["mcp"]
    }
  }
}
```

This project does not edit your MCP settings automatically. `adapter config <target> --adapter codex --json` renders the same examples so you can review and copy them manually. The MCP tools exposed in this version are read-only.

## What writes files

| Command | Writes by default? | Target |
| ------- | ------------------ | ------ |
| `npx ai-agent-playbook --help` | No | Prints CLI help. |
| `npx ai-agent-playbook mcp` | No | Starts a local stdio MCP server for an AI app. |
| `npm install -g ai-agent-playbook` | Yes | npm global package location only. |
| `npm install -D ai-agent-playbook` | Yes | Current project's `package.json`, lockfile, and `node_modules`. |
| `skills check` | No | Reports skill status. |
| `skills install` / `skills update` | Yes unless `--dry-run` | User skill roots. |
| `skills uninstall` | Yes unless `--dry-run` | Removes managed skills from user skill roots. |
| `bootstrap <target>` | Yes unless `--dry-run` | Target project's root `AGENTS.md` and `.ai-agent-playbook/`. |
| `guides sync <target>` | Yes unless `--dry-run` or `--check` | Target project's `.ai-agent-playbook/knowledge/references/guides/`. |
| `context init` | Yes unless `--dry-run` | Target project's `.ai-agent-playbook/memory/context/` and `.ai-agent-playbook/memory/maps/doc-map.md`. |
| `context list/status` | No | Read-only path-scoped project memory inspection. |
| `run start/summarize` | Yes unless `--dry-run` | Target project's `.ai-agent-playbook/workflows/runs/`. |
| `run record` | Yes | Appends one event to a selected run ledger. |
| `run status` | No | Read-only run status inspection. |
| `contracts init` | Yes unless `--dry-run` | Target project's `.ai-agent-playbook/memory/contracts/`. |
| `contracts list/check` | No | Read-only contract inspection. |
| `managed adopt/prune/uninstall` | No unless `--apply` | Target project's `.ai-agent-playbook/` managed files. |
| `operator check/search/research/context/analyze/map/audit` | No | Read-only target project diagnostics. |
| `operator analyze --deep` | No | Read-only AST-grep, exact function-body clone, and TypeScript/JavaScript analysis signals. |
| `operator gc` | No unless `--apply` | Target project's obsolete unmodified managed playbook files. |
| `adapter config/check` | No | Renders or validates local adapter settings. |

## Option 2: Fast local checkout with GitHub CLI

Use this when `gh` is installed and authenticated.

```powershell
$target = Join-Path $env:USERPROFILE 'Documents\ai-agent-playbook'
if (Test-Path $target) {
  $updater = Join-Path $target 'update.ps1'
  if (Test-Path $updater) {
    pwsh -NoProfile -ExecutionPolicy Bypass -File $updater
  } else {
    git -C $target pull --ff-only
    pwsh -NoProfile -ExecutionPolicy Bypass -File (Join-Path $target 'install.ps1')
  }
} else {
  gh repo clone <owner>/<repo> $target
  pwsh -NoProfile -ExecutionPolicy Bypass -File (Join-Path $target 'install.ps1')
}
```

Restart Codex after the installer or updater finishes.

For Codex App on Windows, keep this repository as a normal checkout and run PowerShell commands from that checkout. See `../adapters/codex/README.md` for the Windows app workflow, existing-project dry runs, and safe manual merge path.

## Option 3: Standard Git install

Use this when GitHub CLI is not available, or when you prefer normal `git clone`.

### 1. Authenticate Git

For a private repository, sign in with one of these before cloning:

- GitHub CLI: `gh auth login`
- Git Credential Manager through the browser prompt during `git clone`
- SSH key configured for the host

### 2. Clone the repository

```powershell
$target = Join-Path $env:USERPROFILE 'Documents\ai-agent-playbook'
git clone <repo-url> $target
Set-Location $target
```

Use another local path if preferred. Keep this clone as the source of truth.

### 3. Install skills

```powershell
node .\bin\aapb.mjs skills install --dry-run
node .\bin\aapb.mjs skills install
```

The Node CLI copies installable skills from `skills/<category>/<skill>` into:

- `%USERPROFILE%\.codex\skills\<skill>`
- `%USERPROFILE%\.agents\skills\<skill>`
- `%USERPROFILE%\.agents\skills\legacys\<legacy-skill>` for legacy skills

Installed skills receive an ownership marker named `.ai-agent-playbook-install.json`. Later updates replace only matching managed skills, matching unmanaged copies from older installs, or unmanaged copies when `--force-unmanaged` is explicitly provided. If a managed installed copy was edited locally, the updater refuses to overwrite it unless `--force-managed` is provided.

The compatible PowerShell path remains available:

```powershell
.\install.ps1
```

Restart Codex after syncing so the session can pick up skill metadata.

Optional Codex home guidance:

```powershell
$codexHome = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path $env:USERPROFILE '.codex' }
New-Item -ItemType Directory -Force -Path $codexHome | Out-Null
Copy-Item .\templates\codex-home\AGENTS.md (Join-Path $codexHome 'AGENTS.md')
```

This is for personal Codex defaults only. Keep repository rules in project `AGENTS.md` files.

### 4. Confirm installation

```powershell
Test-Path "$env:USERPROFILE\.codex\skills\repo-onboarding\SKILL.md"
Test-Path "$env:USERPROFILE\.codex\skills\commit-worklog-guardrails\SKILL.md"
```

Both should print `True`.

## Option 4: Existing clone update

```powershell
Set-Location "$env:USERPROFILE\Documents\ai-agent-playbook"
node .\bin\aapb.mjs skills update
```

The CLI update refreshes managed installed skills from the current checkout. Pull the checkout first when you want newer source content. Restart Codex after syncing.

Use a dry run before risky updates:

```powershell
node .\bin\aapb.mjs skills update --dry-run
```

The compatible PowerShell updater still pulls with `--ff-only`, then runs the installer:

```powershell
.\update.ps1
```

If the updater reports an unmanaged conflict, inspect that folder before deciding whether this playbook should own it. Do not use `--force-unmanaged` or `-ForceUnmanaged` unless the same-name skill is known to be from this playbook or intentionally replaceable.

## Option 5: Manual sync for custom paths

Use this only when you need non-default skill directories.

```powershell
node .\bin\aapb.mjs skills install `
  --codex-root "$env:USERPROFILE\.codex\skills" `
  --agents-root "$env:USERPROFILE\.agents\skills"
```

The skills lifecycle command does not remove or overwrite other people's same-name skills by default. It only removes obsolete skills when their ownership marker proves they were installed by this playbook. The PowerShell `scripts/sync-skills.ps1` wrapper remains available for local checkout workflows.

## Project Playbook Lifecycle

Templates are not installed automatically as skills. Skills are reusable user-level guidance; the project playbook is per-repository project memory. Use the runtime CLI for the normal path, or copy/adapt templates manually when you need tighter control.

This is the default project harness. Runtime hooks or agent plugins are optional extensions and are not installed by `install.ps1`, `update.ps1`, or the current CLI.

### Runtime path

Start project-level work with previews:

```powershell
npx ai-agent-playbook bootstrap <target-project> --dry-run
npx ai-agent-playbook operator check <target-project> --json
```

After a global install, replace `npx ai-agent-playbook` with `aapb`. From a local checkout, replace it with `node .\bin\aapb.mjs`. For the full list of project playbook, context, runs, contracts, managed cleanup, operator, adapter, plan, and worklog commands, see [Command guide](commands.md).

Use `--profile <name>` only after the target stack is known. Use `--local-only` when `.ai-agent-playbook/` should be added to the target `.gitignore`.

Use `guides sync` for projects that already have `.ai-agent-playbook/` and only need missing guide templates from a newer playbook checkout. `guides sync --check --json` also reports stale guides using source and target hashes, and `--diff` adds the first differing line without writing files. It does not modify root `AGENTS.md`, playbook policy files, or project-specific notes unless `--force` is explicitly used for guide files.

Runtime commands use `.ai-agent-playbook/` as the active project playbook root. New bootstrap output uses `.ai-agent-playbook/`, and legacy `ai-playbook/` folders are handled only through `migrate path`. Use `migrate path --json` to preview a legacy folder move and reference updates, then add `--apply` only after reviewing the preview.

Bootstrap and guide sync maintain a project-level marker at `.ai-agent-playbook/.ai-agent-playbook-install.json`. Use `managed check` to inspect it, `managed catalog` to review owned files by kind and status, `managed adopt --apply` to mark older matching installs, `managed prune --apply --path <managed-path>` to remove one selected unmodified managed file, and `managed uninstall --apply` to remove all unmodified managed files. The prune and uninstall commands preserve locally edited files and leave `.gitignore` cleanup to the operator.

Use this preview-first flow when removing a project playbook from a target repository:

```powershell
npx ai-agent-playbook managed check <target-project> --json
npx ai-agent-playbook managed uninstall <target-project> --json
npx ai-agent-playbook managed uninstall <target-project> --apply --json
```

`managed uninstall --apply` removes only files tracked by `.ai-agent-playbook/.ai-agent-playbook-install.json` whose current hash still matches the manifest. It preserves edited project memory and does not edit `.gitignore`.

The optional adapter hook examples use the `context` command internally. They are read-only and must be enabled manually from `adapters/`. Use `adapter config` to render placeholder-free local settings, then use `adapter check --settings <local-settings-path>` after manually editing a local settings file. See [Command guide](commands.md) for operator diagnostics, rules, diagnostics, TUI, and adapter command examples.

Create context, run, contract, plan, and worklog files through the CLI so paths stay predictable:

```powershell
npx ai-agent-playbook context init <target-project> --dry-run
npx ai-agent-playbook run start <target-project> --title "Feature slice" --dry-run
npx ai-agent-playbook contracts init <target-project> --dry-run
npx ai-agent-playbook plan new <target-project> --title "Feature slice"
npx ai-agent-playbook worklog new <target-project> --title "Feature slice"
npx ai-agent-playbook worklog summarize <target-project> --month 2026-06
```

### Manual path

Common starting point:

```powershell
$projectRoot = Join-Path $env:USERPROFILE 'Documents\example-project'
Copy-Item .\templates\agents\global\AGENTS.md (Join-Path $projectRoot 'AGENTS.md')
Copy-Item .\templates\project-playbook (Join-Path $projectRoot '.ai-agent-playbook') -Recurse
```

`templates/agents/global/` is the project-root bootstrap template folder for `AGENTS.md`. Keep skill and Git policy in `.ai-agent-playbook/policy/SKILLS.md` and `.ai-agent-playbook/policy/GIT.md`, copied from `templates/project-playbook/`. Then merge the closest profile from `templates/agents/profiles/**` only when the stack is confirmed, and add any needed guides from `templates/project-playbook/knowledge/references/guides/**`.

## Codex skill installer note

Codex's skill installer can install individual skills from a Git repository path when authentication is available. For this playbook, `npx ai-agent-playbook skills install` or a global `aapb skills update` is the recommended path because:

- the repository contains many skills,
- it also contains copyable templates and docs,
- the CLI installs both `.codex` and `.agents` layouts,
- PowerShell scripts remain available for local checkout workflows.

## External process skills

This repository does not install external process skill packs. Keep them installed separately, then use these skills alongside them when useful.

If a project later adopts a hook-based runtime, keep it opt-in and documented in the target project's `.ai-agent-playbook/`. The project should still be understandable and usable from the document harness alone.
