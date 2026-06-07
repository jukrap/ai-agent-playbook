# Codex adapter

Codex can use the skills in this repository after they are copied into its skill directory.

## Codex App on Windows

For Codex App on Windows, treat this repository as the local source of truth and run setup from PowerShell in the checkout. Keep paths in variables or quotes because target repositories often live under paths with spaces or non-ASCII characters.

Codex has two different `AGENTS.md` layers:

- Codex home global: personal defaults in `~/.codex/AGENTS.md`, or another directory if `CODEX_HOME` is set.
- Project root: a thin bootstrap in the target project's `AGENTS.md` that points to repository playbook docs.

`templates/codex-home/AGENTS.md` is for the first layer. `templates/agents/global/AGENTS.md` is for the second layer and is what `ai-playbook bootstrap` writes into a target project. Skill and Git policy live under `ai-playbook/SKILLS.md` and `ai-playbook/GIT.md`.

Recommended first setup:

```powershell
$playbookRepo = '<path-to-ai-agent-playbook>'
Set-Location -LiteralPath $playbookRepo
.\install.ps1
```

After syncing skills, restart Codex App or start a new session so skill metadata is refreshed.

Optional personal Codex global setup:

```powershell
$playbookRepo = '<path-to-ai-agent-playbook>'
$codexHome = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path $env:USERPROFILE '.codex' }
New-Item -ItemType Directory -Force -Path $codexHome | Out-Null
Copy-Item -LiteralPath (Join-Path $playbookRepo 'templates\codex-home\AGENTS.md') -Destination (Join-Path $codexHome 'AGENTS.md')
```

Do not put project-specific rules in the Codex home global file. Use the target project's root `AGENTS.md` only as the entrypoint, and keep repository behavior in `ai-playbook/` docs.

For an existing project, do not overwrite its root agent docs on the first pass. Start with a dry run:

```powershell
$playbookRepo = '<path-to-ai-agent-playbook>'
$targetRepo = '<path-to-target-project>'
Set-Location -LiteralPath $playbookRepo
node .\bin\ai-playbook.mjs bootstrap $targetRepo --local-only --dry-run
```

If the target already has `AGENTS.md` or `ai-playbook/`, inspect the conflict instead of using `--force`. A safer trial path is to scaffold into a temporary folder, inspect the generated files, then manually merge only the pieces the project needs:

```powershell
$scratch = Join-Path $env:TEMP 'ai-playbook-scaffold'
Remove-Item -LiteralPath $scratch -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $scratch | Out-Null
node .\bin\ai-playbook.mjs bootstrap $scratch --local-only
```

For a legacy or documentation-heavy project, usually add only `ai-playbook/START_HERE.md`, `CURRENT.md`, and a docs map first. Keep existing worklogs and plans in place until a human has reviewed the migration.

## Local sync

For the full new-computer setup, see `../../docs/installation.md`. From the repository root, use this once after cloning:

```powershell
.\install.ps1
```

For later updates on the same computer:

```powershell
.\update.ps1
```

To override only the Codex target directory:

```powershell
.\scripts\sync-skills.ps1 -CodexSkillsRoot "$env:USERPROFILE\.codex\skills"
```

The script flattens `skills/<category>/<skill>` into the local skill directory because some agents present skills more clearly that way.

## GitHub install

After this repository is published, a skill manager may be able to install it directly from the final repository URL:

```text
<repo-url>
```

Private repositories may require Git authentication in the target tool before installation works.

## Source rule

Do not edit files under the local installed skill directory as the source of truth. Edit this repository, validate, then sync.

## Runtime CLI

The repository also includes a small Node CLI for project harness setup and maintenance. It is not an installed Codex skill; run it from this repository checkout.

```powershell
node .\bin\ai-playbook.mjs bootstrap <target-repo> --dry-run
node .\bin\ai-playbook.mjs bootstrap <target-repo> --local-only
node .\bin\ai-playbook.mjs guides sync <target-repo> --dry-run
node .\bin\ai-playbook.mjs doctor <target-repo> --strict
node .\bin\ai-playbook.mjs plan new <target-repo> --title "short-plan-title"
node .\bin\ai-playbook.mjs worklog new <target-repo> --title "short-worklog-title"
```

Use the CLI when a project needs repeatable root `AGENTS.md` and `ai-playbook/` scaffolding. Use installed skills when the agent needs reusable working behavior during a coding session.

Codex App does not need `ai-playbook` to be installed as a global command. The stable invocation is:

```powershell
node .\bin\ai-playbook.mjs <command>
```

Use `doctor` after manual merges to catch missing playbook files, absolute local paths, and obsolete style-skill references.

Use `guides sync` when a project already has `ai-playbook/` and you only want missing guide templates from this checkout. It keeps existing guide files by default; use `--force` only after reviewing guide overwrites.

## Portable instructions

Do not rely on Codex account-level custom instructions being present on another computer. Put reusable working agreements in project `AGENTS.md` templates or `templates/project-playbook` docs, and keep machine-specific paths only in local setup notes.

For root-level project policy, prefer `templates/agents/global/AGENTS.md`. Keep skill and Git policy in `templates/project-playbook/SKILLS.md` and `templates/project-playbook/GIT.md`. Treat hooks, slash commands, or runtime-specific instructions from external skills as ideas to translate, not Codex defaults.
