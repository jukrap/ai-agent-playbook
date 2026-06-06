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

## Portable instructions

Do not rely on Codex account-level custom instructions being present on another computer. Put reusable working agreements in project `AGENTS.md` templates or `templates/project-playbook` docs, and keep machine-specific paths only in local setup notes.

For root-level project policy, prefer `templates/agents/global/AGENTS.md`, `templates/agents/global/SKILLS.md`, and `templates/agents/global/GIT.md`. Treat hooks, slash commands, or runtime-specific instructions from external skills as ideas to translate, not Codex defaults.
