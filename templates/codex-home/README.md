# Codex Home Templates

This folder is for personal Codex home guidance, not project-root templates.

Codex loads a global instruction file from the Codex home directory. By default
that is `~/.codex`, unless `CODEX_HOME` is set. At that level Codex reads
`AGENTS.override.md` first if it exists; otherwise it reads `AGENTS.md`.

Use this folder when you want a reusable starting point for your own
`~/.codex/AGENTS.md`.

## Files

- `AGENTS.md`: recommended personal global defaults for Codex.

## Install manually

PowerShell:

```powershell
$playbookRepo = '<path-to-ai-agent-playbook>'
$codexHome = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path $env:USERPROFILE '.codex' }
New-Item -ItemType Directory -Force -Path $codexHome | Out-Null
Copy-Item -LiteralPath (Join-Path $playbookRepo 'templates\codex-home\AGENTS.md') -Destination (Join-Path $codexHome 'AGENTS.md')
```

Use `AGENTS.override.md` in the Codex home directory only for temporary global
experiments. Remove it when the experiment is done.

## What belongs here

- Personal communication preferences.
- Personal default verification habits.
- Personal default Git safety preferences.
- How to treat skills and project playbook docs when a repository provides them.

## What does not belong here

- Project-specific stack rules.
- Product requirements, API contracts, or milestones.
- Customer, employer, account, or private path details.
- Rules that should travel with a repository.

Put repository rules in the project's root `AGENTS.md`. If you use this
playbook's project templates, those root files come from
`templates/agents/global/` and are different from this Codex home template.
