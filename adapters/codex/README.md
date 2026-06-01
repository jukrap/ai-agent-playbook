# Codex adapter

Codex can use the skills in this repository after they are copied into its skill directory.

## Local sync

From the repository root:

```powershell
.\scripts\sync-skills.ps1 -CodexSkillsRoot "$env:USERPROFILE\.codex\skills"
```

The script flattens `skills/<category>/<skill>` into the local skill directory because some agents present skills more clearly that way.

## GitHub install

After this repository is published, a skill manager may be able to install it directly from GitHub:

```text
https://github.com/jukrap/ai-agent-playbook
```

Private repositories may require GitHub authentication in the target tool before installation works.

## Source rule

Do not edit files under the local installed skill directory as the source of truth. Edit this repository, validate, then sync.

## Portable instructions

Do not rely on Codex account-level custom instructions being present on another computer. Put reusable working agreements in project `AGENTS.md` templates or `templates/local-ai` docs, and keep machine-specific paths only in local setup notes.
