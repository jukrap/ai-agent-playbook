# Codex adapter

Codex can use the skills in this repository after they are copied into its skill directory.

## Codex App on Windows

For Codex App on Windows, treat this repository as the local source of truth and run setup from PowerShell in the checkout. Keep paths in variables or quotes because target repositories often live under paths with spaces or non-ASCII characters.

Codex has two different `AGENTS.md` layers:

- Codex home global: personal defaults in `~/.codex/AGENTS.md`, or another directory if `CODEX_HOME` is set.
- Project root: a thin bootstrap in the target project's `AGENTS.md` that points to repository playbook docs.

`templates/codex-home/AGENTS.md` is for the first layer. `templates/agents/global/AGENTS.md` is for the second layer and is what `ai-playbook bootstrap` writes into a target project. Skill and Git policy live under `.ai-playbook/SKILLS.md` and `.ai-playbook/GIT.md`.

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

Do not put project-specific rules in the Codex home global file. Use the target project's root `AGENTS.md` only as the entrypoint, and keep repository behavior in `.ai-playbook/` docs.

For an existing project, do not overwrite its root agent docs on the first pass. Start with a dry run:

```powershell
$playbookRepo = '<path-to-ai-agent-playbook>'
$targetRepo = '<path-to-target-project>'
Set-Location -LiteralPath $playbookRepo
node .\bin\ai-playbook.mjs bootstrap $targetRepo --local-only --dry-run
```

If the target already has `AGENTS.md` or `.ai-playbook/`, inspect the conflict instead of using `--force`. A safer trial path is to scaffold into a temporary folder, inspect the generated files, then manually merge only the pieces the project needs:

```powershell
$scratch = Join-Path $env:TEMP 'ai-playbook-scaffold'
Remove-Item -LiteralPath $scratch -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $scratch | Out-Null
node .\bin\ai-playbook.mjs bootstrap $scratch --local-only
```

For a legacy or documentation-heavy project, usually add only `.ai-playbook/START_HERE.md`, `CURRENT.md`, and a docs map first. Keep existing worklogs and plans in place until a human has reviewed the migration.

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
node .\bin\ai-playbook.mjs guides sync <target-repo> --check
node .\bin\ai-playbook.mjs doctor <target-repo> --strict
node .\bin\ai-playbook.mjs doctor <target-repo> --json
node .\bin\ai-playbook.mjs doctor <target-repo> --reminder --json
node .\bin\ai-playbook.mjs context <target-repo> --json
node .\bin\ai-playbook.mjs adapter config <target-repo> --adapter codex --json
node .\bin\ai-playbook.mjs adapter check <target-repo> --adapter codex --json
node .\bin\ai-playbook.mjs adapter check <target-repo> --adapter codex --settings <local-settings-path> --json
node .\bin\ai-playbook.mjs plan new <target-repo> --title "short-plan-title"
node .\bin\ai-playbook.mjs worklog new <target-repo> --title "short-worklog-title"
```

Use the CLI when a project needs repeatable root `AGENTS.md` and `.ai-playbook/` scaffolding. Use installed skills when the agent needs reusable working behavior during a coding session.

Codex App does not need `ai-playbook` to be installed as a global command. The stable invocation is:

```powershell
node .\bin\ai-playbook.mjs <command>
```

The optional adapter-local package shell exposes the same hook, config, and check path with the Codex adapter fixed:

```powershell
node .\adapters\codex\package.mjs config <target-repo> --json
node .\adapters\codex\package.mjs check <target-repo> --json
node .\adapters\codex\package.mjs hook
```

This shell is not installed automatically, does not write settings, and is only a packaging convenience. Prefer the main CLI for the default document harness.

Use `doctor` after manual merges to catch missing playbook files, absolute local paths, and obsolete style-skill references.

Use `guides sync` when a project already has `.ai-playbook/` and you only want missing guide templates from this checkout. It keeps existing guide files by default; `guides sync --check --json` also reports stale guide files by comparing source and target hashes. Use `--force` only after reviewing guide overwrites.

Use `doctor --reminder --json` when local wrapper code needs a small read-only signal about missing playbooks, stale guides, or worklog summary freshness. The adapter hook examples do not run this automatically.

## Optional context hook PoC

`hook.mjs` is a read-only proof of concept for Codex hook environments. It reads the hook payload from stdin, uses the payload `cwd` as the target project, and emits `hookSpecificOutput.additionalContext` for:

- `SessionStart`
- `PostCompact`

It uses the shared runtime context builder behind:

```powershell
node .\bin\ai-playbook.mjs context <target-repo> --json
```

The hook does not install itself, edit project files, rewrite tool output, or call the network. If `.ai-playbook/` is missing, unsupported, or unreadable, it exits successfully with no stdout.

By default, the hook only handles `SessionStart` and `PostCompact`. To experiment with narrow lifecycle reminders, opt in locally:

```powershell
$env:AI_PLAYBOOK_HOOK_EVENTS = 'UserPromptSubmit,PostToolUse,Stop'
```

`UserPromptSubmit` only reminds on commit, push, PR, merge, worklog, or doctor-style intent. `PostToolUse` only reminds after edit-like tool payloads when a changed path can be read. `Stop` only emits a short end-of-session handoff reminder. These events stay quiet for unrelated prompts, missing playbooks, and unsupported payloads; they do not block, continue the session, run doctor, write files, or call the network.

Before wiring the hook into local Codex settings, render a local config and inspect it:

```powershell
node .\bin\ai-playbook.mjs adapter config <target-repo> --adapter codex --json
```

The renderer is read-only. It prints a hook command and copy-pasteable config using this checkout's absolute hook path, without writing settings files or leaving placeholder paths in the output.

Then run the adapter check:

```powershell
node .\bin\ai-playbook.mjs adapter check <target-repo> --adapter codex --json
```

Treat any failure as a setup issue to fix in the target project or adapter checkout before enabling the hook. The check is read-only and verifies both supported hook JSON and quiet unsupported paths.

After manually editing a local Codex plugin or hook configuration, validate the settings file too:

```powershell
node .\bin\ai-playbook.mjs adapter check <target-repo> --adapter codex --settings <local-settings-path> --json
```

Use `hooks.example.json` only as a manual reference when the renderer is not enough. Keep the timeout short and keep debug output on stderr by setting `AI_PLAYBOOK_DEBUG=1` only while troubleshooting.

## Portable instructions

Do not rely on Codex account-level custom instructions being present on another computer. Put reusable working agreements in project `AGENTS.md` templates or `templates/project-playbook` docs, and keep machine-specific paths only in local setup notes.

For root-level project policy, prefer `templates/agents/global/AGENTS.md`. Keep skill and Git policy in `templates/project-playbook/SKILLS.md` and `templates/project-playbook/GIT.md`. Treat hooks, slash commands, or runtime-specific instructions from external skills as ideas to translate, not Codex defaults.
