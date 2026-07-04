# Codex adapter

Codex can use the skills in this repository after they are copied into its skill directory with the npm CLI or a local checkout.

## Codex App on Windows

For Codex App on Windows, treat this repository as the local source of truth and run setup from PowerShell in the checkout. Keep paths in variables or quotes because target repositories often live under paths with spaces or non-ASCII characters.

Codex has two different `AGENTS.md` layers:

- Codex home global: personal defaults in `~/.codex/AGENTS.md`, or another directory if `CODEX_HOME` is set.
- Project root: a thin bootstrap in the target project's `AGENTS.md` that points to repository playbook docs.

`templates/codex-home/AGENTS.md` is for the first layer. `templates/agents/global/AGENTS.md` is for the second layer and is what `aapb bootstrap` writes into a target project. Skill and Git policy live under `.ai-agent-playbook/policy/SKILLS.md` and `.ai-agent-playbook/policy/GIT.md`.

Recommended first setup:

```powershell
npx ai-agent-playbook skills install --dry-run
npx ai-agent-playbook skills install
```

After syncing skills, restart Codex App or start a new session so skill metadata is refreshed. From a local checkout, use `node .\bin\aapb.mjs skills install` or the compatible `.\install.ps1` script.

Optional personal Codex global setup:

```powershell
$playbookRepo = '<path-to-ai-agent-playbook>'
$codexHome = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path $env:USERPROFILE '.codex' }
New-Item -ItemType Directory -Force -Path $codexHome | Out-Null
Copy-Item -LiteralPath (Join-Path $playbookRepo 'templates\codex-home\AGENTS.md') -Destination (Join-Path $codexHome 'AGENTS.md')
```

Do not put project-specific rules in the Codex home global file. Use the target project's root `AGENTS.md` only as the entrypoint, and keep repository behavior in `.ai-agent-playbook/` docs.

For an existing project, do not overwrite its root agent docs on the first pass. Start with a dry run:

```powershell
$targetRepo = '<path-to-target-project>'
npx ai-agent-playbook bootstrap $targetRepo --local-only --dry-run
```

If the target already has `AGENTS.md` or `.ai-agent-playbook/`, inspect the conflict instead of using `--force`. A safer trial path is to scaffold into a temporary folder, inspect the generated files, then manually merge only the pieces the project needs:

```powershell
$scratch = Join-Path $env:TEMP 'aapb-scaffold'
Remove-Item -LiteralPath $scratch -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $scratch | Out-Null
npx ai-agent-playbook bootstrap $scratch --local-only
```

For a legacy or documentation-heavy project, usually add only `.ai-agent-playbook/START_HERE.md`, `CURRENT.md`, and a docs map first. Keep existing worklogs and plans in place until a human has reviewed the migration.

## Local sync

For the full new-computer setup, see `../../docs/lifecycle.md`. From the repository root, use this once after cloning:

```powershell
node .\bin\aapb.mjs skills install
```

The compatible PowerShell path remains available with `.\install.ps1`.

For later updates on the same computer:

```powershell
node .\bin\aapb.mjs skills update
```

The compatible PowerShell updater remains available with `.\update.ps1`.

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

The repository also includes a small Node CLI for project harness setup and maintenance. It is not an installed Codex skill. Use `npx ai-agent-playbook` after package publication, `aapb` after a global install, or `node .\bin\aapb.mjs` from a local checkout. For settings that persist adapter hook paths, prefer a global install or local checkout so the rendered hook command points at a stable location.

```powershell
npx ai-agent-playbook bootstrap <target-repo> --dry-run
npx ai-agent-playbook bootstrap <target-repo> --local-only
npx ai-agent-playbook guides sync <target-repo> --dry-run
npx ai-agent-playbook guides sync <target-repo> --check --diff --json
npx ai-agent-playbook migrate path <target-repo> --json
npx ai-agent-playbook doctor <target-repo> --strict
npx ai-agent-playbook doctor <target-repo> --json
npx ai-agent-playbook doctor <target-repo> --reminder --json
npx ai-agent-playbook context <target-repo> --json
npx ai-agent-playbook mcp
npx ai-agent-playbook adapter config <target-repo> --adapter codex --json
npx ai-agent-playbook adapter check <target-repo> --adapter codex --json
npx ai-agent-playbook adapter check <target-repo> --adapter codex --settings <local-settings-path> --json
npx ai-agent-playbook plan new <target-repo> --title "short-plan-title"
npx ai-agent-playbook worklog new <target-repo> --title "short-worklog-title"
```

Use the CLI when a project needs repeatable root `AGENTS.md` and `.ai-agent-playbook/` scaffolding. Use installed skills when the agent needs reusable working behavior during a coding session.

Use MCP when Codex or another AI app can call local tools directly. Register `npx ai-agent-playbook mcp` or, after a global install, `aapb mcp` as the local stdio server command. The MCP surface is read-only in this version and is separate from Codex hook setup.

Codex App does not need `aapb` to be installed as a global command. From a local checkout, the stable invocation remains:

```powershell
node .\bin\aapb.mjs <command>
```

The optional adapter-local package shell exposes the same hook, config, and check path with the Codex adapter fixed:

```powershell
node .\adapters\codex\package.mjs config <target-repo> --json
node .\adapters\codex\package.mjs check <target-repo> --json
node .\adapters\codex\package.mjs hook
```

This shell is not installed automatically, does not write settings, and is only a packaging convenience. Prefer the main CLI for the default document harness.

Use `doctor` after manual merges to catch missing playbook files, absolute local paths, and obsolete style-skill references.

Use `guides sync` when a project already has `.ai-agent-playbook/` and you only want missing guide templates from this checkout. It keeps existing guide files by default; `guides sync --check --diff --json` also reports stale guide files by comparing source and target hashes and showing the first differing line. Use `--force` only after reviewing guide overwrites.

Use `migrate path --json` to preview a legacy `ai-playbook/` to `.ai-agent-playbook/` move before applying it. This is separate from hook setup and does not install or edit adapter settings.

Use `doctor --reminder --json` when local wrapper code needs a small read-only signal about missing playbooks, stale guides, or worklog summary freshness. The adapter hook examples do not run this automatically.

## Optional context hook PoC

`hook.mjs` is a read-only proof of concept for Codex hook environments. It reads the hook payload from stdin, uses the payload `cwd` as the target project, and emits `hookSpecificOutput.additionalContext` for:

- `SessionStart`
- `PostCompact`

It uses the shared runtime context builder behind:

```powershell
node .\bin\aapb.mjs context <target-repo> --json
```

The hook does not install itself, edit project files, rewrite tool output, or call the network. If `.ai-agent-playbook/` is missing, unsupported, or unreadable, it exits successfully with no stdout.

By default, the hook only handles `SessionStart` and `PostCompact`. To experiment with narrow lifecycle reminders, opt in locally:

```powershell
$env:AI_AGENT_PLAYBOOK_HOOK_EVENTS = 'UserPromptSubmit,PostToolUse,Stop'
```

`UserPromptSubmit` only reminds on commit, push, PR, merge, worklog, or doctor-style intent. `PostToolUse` only reminds after edit-like tool payloads when a changed path can be read. `Stop` only emits a short end-of-session handoff reminder. These events stay quiet for unrelated prompts, missing playbooks, and unsupported payloads; they do not block, continue the session, run doctor, write files, or call the network.

Before wiring the hook into local Codex settings, render a local config and inspect it:

```powershell
node .\bin\aapb.mjs adapter config <target-repo> --adapter codex --json
```

The renderer is read-only. It prints a hook command and copy-pasteable config using this checkout's absolute hook path, without writing settings files or leaving placeholder paths in the output.

The JSON output also includes an MCP settings example using `npx ai-agent-playbook mcp`, plus a global-install variant using `aapb mcp`. Review and copy it manually if your AI app supports MCP.

Then run the adapter check:

```powershell
node .\bin\aapb.mjs adapter check <target-repo> --adapter codex --json
```

Treat any failure as a setup issue to fix in the target project or adapter checkout before enabling the hook. The check is read-only and verifies both supported hook JSON and quiet unsupported paths.

After manually editing a local Codex plugin or hook configuration, validate the settings file too:

```powershell
node .\bin\aapb.mjs adapter check <target-repo> --adapter codex --settings <local-settings-path> --json
```

Use `hooks.example.json` only as a manual reference when the renderer is not enough. Keep the timeout short and keep debug output on stderr by setting `AI_AGENT_PLAYBOOK_DEBUG=1` only while troubleshooting.

## Portable instructions

Do not rely on Codex account-level custom instructions being present on another computer. Put reusable working agreements in project `AGENTS.md` templates or `templates/project-playbook` docs, and keep machine-specific paths only in local setup notes.

For root-level project policy, prefer `templates/agents/global/AGENTS.md`. Keep skill and Git policy in `templates/project-playbook/policy/SKILLS.md` and `templates/project-playbook/policy/GIT.md`. Treat hooks, slash commands, or runtime-specific instructions from external skills as ideas to translate, not Codex defaults.
