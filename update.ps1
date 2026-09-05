param(
  [string]$CodexSkillsRoot = (Join-Path $env:USERPROFILE '.codex\skills'),
  [string]$AgentsSkillsRoot = (Join-Path $env:USERPROFILE '.agents\skills'),
  [ValidateSet('core', 'development', 'legacy')][string]$Profile = 'core',
  [string[]]$Skill = @(),
  [string]$BackupRoot,
  [switch]$Migrate,
  [switch]$SkipValidation,
  [switch]$Pull,
  [switch]$WhatIf
)
$ErrorActionPreference = 'Stop'
if ($Pull) {
  if ($WhatIf) { Write-Output 'Would run git pull --ff-only for this checkout.' }
  else {
    & git -C $PSScriptRoot pull --ff-only
    if ($LASTEXITCODE -ne 0) { throw 'Fast-forward update failed; installation was not started.' }
  }
}
if (-not $SkipValidation) {
  & (Join-Path $PSScriptRoot 'scripts\validate-skills.ps1')
  & (Join-Path $PSScriptRoot 'scripts\validate-translations.ps1')
}
& (Join-Path $PSScriptRoot 'scripts\sync-skills.ps1') -CodexSkillsRoot $CodexSkillsRoot -AgentsSkillsRoot $AgentsSkillsRoot -Profile $Profile -Skill $Skill -BackupRoot $BackupRoot -Migrate:$Migrate -WhatIf:$WhatIf
