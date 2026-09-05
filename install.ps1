param(
  [string]$CodexSkillsRoot = (Join-Path $env:USERPROFILE '.codex\skills'),
  [string]$AgentsSkillsRoot = (Join-Path $env:USERPROFILE '.agents\skills'),
  [ValidateSet('core', 'development', 'legacy')][string]$Profile = 'core',
  [string[]]$Skill = @(),
  [string]$BackupRoot,
  [switch]$Migrate,
  [switch]$SkipValidation,
  [switch]$WhatIf
)
$ErrorActionPreference = 'Stop'
if (-not $SkipValidation) {
  & (Join-Path $PSScriptRoot 'scripts\validate-skills.ps1')
  & (Join-Path $PSScriptRoot 'scripts\validate-translations.ps1')
}
& (Join-Path $PSScriptRoot 'scripts\sync-skills.ps1') -CodexSkillsRoot $CodexSkillsRoot -AgentsSkillsRoot $AgentsSkillsRoot -Profile $Profile -Skill $Skill -BackupRoot $BackupRoot -Migrate:$Migrate -WhatIf:$WhatIf
