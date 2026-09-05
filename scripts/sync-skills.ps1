param(
  [string]$SourceSkillsRoot = (Join-Path (Split-Path -Parent $PSScriptRoot) 'skills'),
  [string]$CodexSkillsRoot = (Join-Path $env:USERPROFILE '.codex\skills'),
  [string]$AgentsSkillsRoot = (Join-Path $env:USERPROFILE '.agents\skills'),
  [ValidateSet('core', 'development', 'legacy')][string]$Profile = 'core',
  [string[]]$Skill = @(),
  [string]$BackupRoot,
  [switch]$Migrate,
  [switch]$ForceManaged,
  [switch]$ForceUnmanaged,
  [switch]$SkipObsoleteCleanup,
  [switch]$WhatIf
)
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$expectedSource = [IO.Path]::GetFullPath((Join-Path $repoRoot 'skills'))
if ([IO.Path]::GetFullPath($SourceSkillsRoot) -ne $expectedSource) {
  throw 'Sync only from this checkout. Use the CLI from the intended source repository.'
}
if ($ForceManaged -or $ForceUnmanaged) { throw 'Force replacement is retired. Preserve and reconcile local edits first.' }
if ($SkipObsoleteCleanup) { Write-Warning 'Obsolete cleanup is never implicit; use -Migrate explicitly.' }
$action = if ($Migrate) { 'migrate' } else { 'update' }
$cliArgs = @((Join-Path $repoRoot 'bin\aapb.mjs'), 'skills', $action, '--profile', $Profile, '--agents-root', $AgentsSkillsRoot, '--codex-root', $CodexSkillsRoot, '--json')
foreach ($name in $Skill) { $cliArgs += @('--skill', $name) }
if ($BackupRoot) { $cliArgs += @('--backup-root', $BackupRoot) }
if ($WhatIf) { $cliArgs += '--dry-run' }
elseif ($Migrate) { $cliArgs += '--apply' }
& node @cliArgs
if ($LASTEXITCODE -ne 0) { throw 'Skill operation reported a conflict or error. See the result and recovery journal.' }
