# Installation

This repository is easiest to use by cloning it once, then running the root installer. Several install styles are supported because different machines may have different Git authentication and PowerShell policies.

Replace `<repo-url>` with the final Git repository URL.

## Option 1: Fast install with GitHub CLI

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

## Option 2: Standard Git install

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
.\install.ps1
```

The installer validates the repository and copies installable skills from `skills/<category>/<skill>` into:

- `%USERPROFILE%\.codex\skills\<skill>`
- `%USERPROFILE%\.agents\skills\<skill>`
- `%USERPROFILE%\.agents\skills\legacys\<legacy-skill>` for legacy skills

Restart Codex after syncing so the session can pick up skill metadata.

### 4. Confirm installation

```powershell
Test-Path "$env:USERPROFILE\.codex\skills\repo-onboarding\SKILL.md"
Test-Path "$env:USERPROFILE\.codex\skills\commit-worklog-guardrails\SKILL.md"
```

Both should print `True`.

## Option 3: Existing clone update

```powershell
Set-Location "$env:USERPROFILE\Documents\ai-agent-playbook"
.\update.ps1
```

The update script pulls with `--ff-only`, then runs the installer. This is the normal one-command update path for every computer that already has a clone. Restart Codex after syncing.

## Option 4: Manual sync for custom paths

Use this only when you need non-default skill directories.

```powershell
.\scripts\validate-skills.ps1
.\scripts\validate-translations.ps1
.\scripts\sync-skills.ps1 `
  -CodexSkillsRoot "$env:USERPROFILE\.codex\skills" `
  -AgentsSkillsRoot "$env:USERPROFILE\.agents\skills"
```

## Applying project templates

Templates are not installed automatically as skills. Copy or adapt them into each project.

Common starting point:

```powershell
$projectRoot = Join-Path $env:USERPROFILE 'Documents\example-project'
Copy-Item .\templates\agents\global\AGENTS.md (Join-Path $projectRoot 'AGENTS.md')
Copy-Item .\templates\project-playbook (Join-Path $projectRoot 'ai-playbook') -Recurse
```

Optionally copy `templates/agents/global/SKILLS.md` or `templates/agents/global/GIT.md` when the project needs portable skill or Git policy. Then merge the closest profile from `templates/agents/profiles/**` and any needed guides from `templates/project-playbook/guides/**`.

## Codex skill installer note

Codex's skill installer can install individual skills from a Git repository path when authentication is available. For this playbook, cloning and running `install.ps1` once, then `update.ps1` later, is still the recommended method because:

- the repository contains many skills,
- it also contains copyable templates and docs,
- the installer validates first and installs both `.codex` and `.agents` layouts,
- updates are a simple `.\update.ps1`.

## External process skills

This repository does not install external process skill packs. Keep them installed separately, then use these skills alongside them when useful.
