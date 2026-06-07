# Codex adapter

Codex can use the skills in this repository after they are copied into its skill directory.

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
node .\bin\ai-playbook.mjs bootstrap <target-repo> --local-only --with-skills --with-git
node .\bin\ai-playbook.mjs doctor <target-repo> --strict
node .\bin\ai-playbook.mjs plan new <target-repo> --title "short-plan-title"
node .\bin\ai-playbook.mjs worklog new <target-repo> --title "short-worklog-title"
```

Use the CLI when a project needs repeatable `AGENTS.md`, `SKILLS.md`, `GIT.md`, and `ai-playbook/` scaffolding. Use installed skills when the agent needs reusable working behavior during a coding session.

## Portable instructions

Do not rely on Codex account-level custom instructions being present on another computer. Put reusable working agreements in project `AGENTS.md` templates or `templates/project-playbook` docs, and keep machine-specific paths only in local setup notes.

For root-level project policy, prefer `templates/agents/global/AGENTS.md`, `templates/agents/global/SKILLS.md`, and `templates/agents/global/GIT.md`. Treat hooks, slash commands, or runtime-specific instructions from external skills as ideas to translate, not Codex defaults.
