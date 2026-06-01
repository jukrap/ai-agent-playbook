param(
  [string]$CodexSkillsRoot = (Join-Path $env:USERPROFILE '.codex\skills'),
  [string]$AgentsSkillsRoot = (Join-Path $env:USERPROFILE '.agents\skills'),
  [switch]$SkipValidation,
  [switch]$WhatIf
)

$ErrorActionPreference = 'Stop'
$repoRoot = $PSScriptRoot

$validateSkills = Join-Path $repoRoot 'scripts\validate-skills.ps1'
$validateTranslations = Join-Path $repoRoot 'scripts\validate-translations.ps1'
$syncSkills = Join-Path $repoRoot 'scripts\sync-skills.ps1'

foreach ($script in @($validateSkills, $validateTranslations, $syncSkills)) {
  if (-not (Test-Path -LiteralPath $script)) {
    throw "Required script not found: $script"
  }
}

if (-not $SkipValidation) {
  & $validateSkills
  & $validateTranslations
}

& $syncSkills `
  -CodexSkillsRoot $CodexSkillsRoot `
  -AgentsSkillsRoot $AgentsSkillsRoot `
  -WhatIf:$WhatIf

if ($WhatIf) {
  Write-Host 'Dry run complete. No files were changed.'
} else {
  Write-Host 'Install complete. Restart Codex so the next session can pick up skill metadata.'
}
