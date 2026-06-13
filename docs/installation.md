# Installation

This package is easiest to use through npm or npx. A local Git checkout with the PowerShell scripts is still supported for development, private forks, and Windows environments that prefer explicit local scripts.

## Option 1: npm or npx

Use this when the package has been published and Node.js is available.

```powershell
npx ai-agent-playbook skills install --dry-run
npx ai-agent-playbook skills install
npx ai-agent-playbook bootstrap <target-project> --dry-run
npx ai-agent-playbook operator check <target-project> --json
```

For a persistent global command:

```powershell
npm install -g ai-agent-playbook
ai-playbook skills update
ai-playbook operator search <target-project> --query "auth flow" --json
```

`skills install` and `skills update` sync managed skills into the common Codex and agent skill directories. They refuse to overwrite locally edited managed skills unless `--force-managed` is provided, and they refuse different same-name unmanaged skills unless `--force-unmanaged` is provided.

Restart Codex after skill installation or update so the next session can pick up skill metadata.

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
node .\bin\ai-playbook.mjs skills install --dry-run
node .\bin\ai-playbook.mjs skills install
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
node .\bin\ai-playbook.mjs skills update
```

The CLI update refreshes managed installed skills from the current checkout. Pull the checkout first when you want newer source content. Restart Codex after syncing.

Use a dry run before risky updates:

```powershell
node .\bin\ai-playbook.mjs skills update --dry-run
```

The compatible PowerShell updater still pulls with `--ff-only`, then runs the installer:

```powershell
.\update.ps1
```

If the updater reports an unmanaged conflict, inspect that folder before deciding whether this playbook should own it. Do not use `--force-unmanaged` or `-ForceUnmanaged` unless the same-name skill is known to be from this playbook or intentionally replaceable.

## Option 5: Manual sync for custom paths

Use this only when you need non-default skill directories.

```powershell
node .\bin\ai-playbook.mjs skills install `
  --codex-root "$env:USERPROFILE\.codex\skills" `
  --agents-root "$env:USERPROFILE\.agents\skills"
```

The skills lifecycle command does not remove or overwrite other people's same-name skills by default. It only removes obsolete skills when their ownership marker proves they were installed by this playbook. The PowerShell `scripts/sync-skills.ps1` wrapper remains available for local checkout workflows.

## Applying project templates

Templates are not installed automatically as skills. Use the runtime CLI for the normal path, or copy/adapt templates manually when you need tighter control.

This is the default project harness. Runtime hooks or agent plugins are optional extensions and are not installed by `install.ps1`, `update.ps1`, or the current CLI.

### Runtime path

```powershell
npx ai-agent-playbook bootstrap <target-project> --dry-run
npx ai-agent-playbook bootstrap <target-project>
npx ai-agent-playbook guides sync <target-project> --dry-run
npx ai-agent-playbook guides sync <target-project> --check --diff
npx ai-agent-playbook migrate path <target-project> --json
npx ai-agent-playbook managed check <target-project> --json
npx ai-agent-playbook managed catalog <target-project> --json
npx ai-agent-playbook managed adopt <target-project> --json
npx ai-agent-playbook managed prune <target-project> --path .ai-playbook/guides/runtime-harness.md --json
npx ai-agent-playbook managed uninstall <target-project> --json
npx ai-agent-playbook doctor <target-project>
npx ai-agent-playbook doctor <target-project> --json
npx ai-agent-playbook doctor <target-project> --reminder --json
npx ai-agent-playbook context <target-project> --json
npx ai-agent-playbook operator check <target-project> --path src/example.ts --json
npx ai-agent-playbook operator search <target-project> --query "auth flow" --path src/example.ts --json
npx ai-agent-playbook operator context <target-project> --path src/example.ts --json
npx ai-agent-playbook operator map <target-project> --json
npx ai-agent-playbook operator audit <target-project> --json
npx ai-agent-playbook operator gc <target-project> --json
npx ai-agent-playbook rules check <target-project> --path src/example.ts --json
npx ai-agent-playbook diagnostics check <target-project> --json
npx ai-agent-playbook qa tui-check .\capture.txt --cols 100 --json
npx ai-agent-playbook adapter config <target-project> --adapter codex --json
npx ai-agent-playbook adapter check <target-project> --adapter codex --json
npx ai-agent-playbook adapter check <target-project> --adapter codex --settings <local-settings-path> --json
```

After a global install, replace `npx ai-agent-playbook` with `ai-playbook`. From a local checkout, replace it with `node .\bin\ai-playbook.mjs`.

Use `--profile <name>` only after the target stack is known. Use `--local-only` when `.ai-playbook/` should be added to the target `.gitignore`.

Use `guides sync` for projects that already have `.ai-playbook/` and only need missing guide templates from a newer playbook checkout. `guides sync --check --json` also reports stale guides using source and target hashes, and `--diff` adds the first differing line without writing files. It does not modify root `AGENTS.md`, playbook policy files, or project-specific notes unless `--force` is explicitly used for guide files.

During the path transition, these runtime commands also support an existing legacy `ai-playbook/` folder when `.ai-playbook/` is absent. New bootstrap output uses `.ai-playbook/`. Use `migrate path --json` to preview a legacy folder move and reference updates, then add `--apply` only after reviewing the preview.

Bootstrap and guide sync maintain a project-level marker at `.ai-playbook/.ai-agent-playbook-install.json`. Use `managed check` to inspect it, `managed catalog` to review owned files by kind and status, `managed adopt --apply` to mark older matching installs, `managed prune --apply --path <managed-path>` to remove one selected unmodified managed file, and `managed uninstall --apply` to remove all unmodified managed files. The prune and uninstall commands preserve locally edited files and leave `.gitignore` cleanup to the operator.

The optional adapter hook examples use the `context` command internally. They are read-only and must be enabled manually from `adapters/`. Use `adapter config` to render placeholder-free local settings, then use `adapter check --settings <local-settings-path>` after manually editing a local settings file.

The operator diagnostics commands are also operator-triggered. `operator check` combines doctor, guide freshness, diagnostics, and rule matching into one human checkpoint. `operator search` searches local source, playbook, rules, plans, and worklogs without writing files. `operator context` previews path-scoped context files, rules, and related maps or runbooks before an agent loads them. `operator map` summarizes stack, architecture, quality, and concern signals without creating map files. `operator audit` checks playbook links, context globs, duplicate notes, legacy path drift, and managed manifest drift without writing files. `operator gc` previews obsolete unmodified managed playbook files and writes only when `--apply` is provided. `rules check` shows which portable rule files apply to a path, `diagnostics check` lists likely verification commands without running them and respects detected package manager lockfiles, and `qa tui-check` checks terminal captures for width overflow and CJK layout risk.

Create plan and worklog files through the CLI so paths stay predictable:

```powershell
npx ai-agent-playbook plan new <target-project> --title "Feature slice"
npx ai-agent-playbook worklog new <target-project> --title "Feature slice"
npx ai-agent-playbook worklog summarize <target-project> --month 2026-06
```

### Manual path

Common starting point:

```powershell
$projectRoot = Join-Path $env:USERPROFILE 'Documents\example-project'
Copy-Item .\templates\agents\global\AGENTS.md (Join-Path $projectRoot 'AGENTS.md')
Copy-Item .\templates\project-playbook (Join-Path $projectRoot '.ai-playbook') -Recurse
```

`templates/agents/global/` is the project-root bootstrap template folder for `AGENTS.md`. Keep skill and Git policy in `.ai-playbook/SKILLS.md` and `.ai-playbook/GIT.md`, copied from `templates/project-playbook/`. Then merge the closest profile from `templates/agents/profiles/**` only when the stack is confirmed, and add any needed guides from `templates/project-playbook/guides/**`.

## Codex skill installer note

Codex's skill installer can install individual skills from a Git repository path when authentication is available. For this playbook, `npx ai-agent-playbook skills install` or a global `ai-playbook skills update` is the recommended path because:

- the repository contains many skills,
- it also contains copyable templates and docs,
- the CLI installs both `.codex` and `.agents` layouts,
- PowerShell scripts remain available for local checkout workflows.

## External process skills

This repository does not install external process skill packs. Keep them installed separately, then use these skills alongside them when useful.

If a project later adopts a hook-based runtime, keep it opt-in and documented in the target project's `.ai-playbook/`. The project should still be understandable and usable from the document harness alone.
