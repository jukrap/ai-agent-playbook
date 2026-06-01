param(
  [string]$SourceSkillsRoot = (Join-Path (Split-Path -Parent $PSScriptRoot) 'skills'),
  [string]$CodexSkillsRoot = (Join-Path $env:USERPROFILE '.codex\skills'),
  [string]$AgentsSkillsRoot = (Join-Path $env:USERPROFILE '.agents\skills'),
  [switch]$WhatIf
)

$ErrorActionPreference = 'Stop'
$skillFiles = Get-ChildItem -LiteralPath $SourceSkillsRoot -Recurse -Filter 'SKILL.md' -File
if (-not $skillFiles) {
  throw "No SKILL.md files found under $SourceSkillsRoot"
}

function Copy-Skill {
  param(
    [string]$SourceDir,
    [string]$DestinationRoot,
    [string]$SkillName
  )

  $destinationRootFull = [System.IO.Path]::GetFullPath($DestinationRoot)
  $destination = Join-Path $DestinationRoot $SkillName
  $destinationFull = [System.IO.Path]::GetFullPath($destination)

  if (-not $destinationFull.StartsWith($destinationRootFull, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to copy outside destination root: $destinationFull"
  }

  if ($WhatIf) {
    Write-Host "Would sync $SkillName -> $destination"
    return
  }

  New-Item -ItemType Directory -Force -Path $DestinationRoot | Out-Null
  if (Test-Path -LiteralPath $destination) {
    Remove-Item -LiteralPath $destination -Recurse -Force
  }
  Copy-Item -LiteralPath $SourceDir -Destination $destination -Recurse
}

foreach ($skillFile in $skillFiles) {
  $sourceDir = Split-Path -Parent $skillFile.FullName
  $skillName = Split-Path -Leaf $sourceDir
  $category = Split-Path -Leaf (Split-Path -Parent $sourceDir)

  Copy-Skill -SourceDir $sourceDir -DestinationRoot $CodexSkillsRoot -SkillName $skillName

  if ($category -eq 'legacy') {
    Copy-Skill -SourceDir $sourceDir -DestinationRoot (Join-Path $AgentsSkillsRoot 'legacys') -SkillName $skillName
  } else {
    Copy-Skill -SourceDir $sourceDir -DestinationRoot $AgentsSkillsRoot -SkillName $skillName
  }
}

Write-Host "Processed $($skillFiles.Count) skills."
