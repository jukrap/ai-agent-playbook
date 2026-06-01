param(
  [string]$CodexSkillsRoot = (Join-Path $env:USERPROFILE '.codex\skills'),
  [string]$AgentsSkillsRoot = (Join-Path $env:USERPROFILE '.agents\skills'),
  [switch]$SkipValidation,
  [switch]$WhatIf
)

$ErrorActionPreference = 'Stop'
$repoRoot = $PSScriptRoot

if (Test-Path -LiteralPath (Join-Path $repoRoot '.git')) {
  if ($WhatIf) {
    Write-Host "Would run: git -C `"$repoRoot`" pull --ff-only"
  } else {
    git -C $repoRoot pull --ff-only
  }
} else {
  Write-Warning 'This directory is not a git clone. Skipping git pull and running local install only.'
}

& (Join-Path $repoRoot 'install.ps1') `
  -CodexSkillsRoot $CodexSkillsRoot `
  -AgentsSkillsRoot $AgentsSkillsRoot `
  -SkipValidation:$SkipValidation `
  -WhatIf:$WhatIf
