param(
  [string]$SourceSkillsRoot = (Join-Path (Split-Path -Parent $PSScriptRoot) 'skills'),
  [string]$CodexSkillsRoot = (Join-Path $env:USERPROFILE '.codex\skills'),
  [string]$AgentsSkillsRoot = (Join-Path $env:USERPROFILE '.agents\skills'),
  [switch]$SkipObsoleteCleanup,
  [switch]$ForceManaged,
  [switch]$ForceUnmanaged,
  [switch]$WhatIf
)

$ErrorActionPreference = 'Stop'

$installSource = 'ai-agent-playbook'
$markerFileName = '.ai-agent-playbook-install.json'
$skillFiles = Get-ChildItem -LiteralPath $SourceSkillsRoot -Recurse -Filter 'SKILL.md' -File
if (-not $skillFiles) {
  throw "No SKILL.md files found under $SourceSkillsRoot"
}

function Assert-PathInside {
  param(
    [string]$Root,
    [string]$Child
  )

  $rootFull = [System.IO.Path]::GetFullPath($Root).TrimEnd('\', '/')
  $childFull = [System.IO.Path]::GetFullPath($Child)
  $prefix = $rootFull + [System.IO.Path]::DirectorySeparatorChar

  if ($childFull -ne $rootFull -and -not $childFull.StartsWith($prefix, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to operate outside destination root: $childFull"
  }
}

function Get-DirectorySignature {
  param([string]$Directory)

  if (-not (Test-Path -LiteralPath $Directory)) {
    return $null
  }

  $directoryFull = (Get-Item -LiteralPath $Directory).FullName.TrimEnd('\', '/')
  $fileEntries = foreach ($file in (Get-ChildItem -LiteralPath $directoryFull -Recurse -File | Where-Object { $_.Name -ne $markerFileName })) {
    $relativePath = $file.FullName.Substring($directoryFull.Length + 1).Replace('\', '/')
    $hash = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
    [pscustomobject]@{
      RelativePath = $relativePath
      Part = "$relativePath=$hash"
    }
  }

  $parts = $fileEntries | Sort-Object RelativePath | ForEach-Object { $_.Part }
  $joined = [string]::Join("`n", $parts)
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($joined)
  $sha = [System.Security.Cryptography.SHA256]::Create()
  try {
    return ([System.BitConverter]::ToString($sha.ComputeHash($bytes))).Replace('-', '').ToLowerInvariant()
  } finally {
    $sha.Dispose()
  }
}

function Get-InstallMarker {
  param([string]$Directory)

  $markerPath = Join-Path $Directory $markerFileName
  if (-not (Test-Path -LiteralPath $markerPath)) {
    return $null
  }

  try {
    return Get-Content -LiteralPath $markerPath -Raw | ConvertFrom-Json
  } catch {
    throw "Invalid install marker: $markerPath"
  }
}

function Test-ManagedMarker {
  param($Marker)

  return $null -ne $Marker -and $Marker.source -eq $installSource
}

function Write-InstallMarker {
  param(
    [string]$Destination,
    [string]$SkillName,
    [string]$Category,
    [string]$SourceHash
  )

  $markerPath = Join-Path $Destination $markerFileName
  $marker = [ordered]@{
    schemaVersion = 1
    source = $installSource
    skillName = $SkillName
    category = $Category
    sourceHash = $SourceHash
    installedAtUtc = (Get-Date).ToUniversalTime().ToString('o')
  }

  $marker | ConvertTo-Json | Set-Content -LiteralPath $markerPath -Encoding UTF8
}

function Copy-ManagedSkill {
  param(
    [string]$SourceDir,
    [string]$DestinationRoot,
    [string]$SkillName,
    [string]$Category
  )

  $destination = Join-Path $DestinationRoot $SkillName
  Assert-PathInside -Root $DestinationRoot -Child $destination

  $sourceHash = Get-DirectorySignature -Directory $SourceDir
  $destinationExists = Test-Path -LiteralPath $destination

  if ($destinationExists) {
    $marker = Get-InstallMarker -Directory $destination
    $destinationHash = Get-DirectorySignature -Directory $destination

    if (Test-ManagedMarker -Marker $marker) {
      if (-not $ForceManaged -and $marker.sourceHash -and $destinationHash -ne $marker.sourceHash) {
        throw "Refusing to overwrite locally modified managed skill: $destination. Re-run with -ForceManaged after backing up any local changes."
      }

      if ($WhatIf) {
        Write-Host "Would update managed skill $SkillName -> $destination"
        return
      }
    } elseif ($destinationHash -eq $sourceHash) {
      if ($WhatIf) {
        Write-Host "Would adopt matching unmanaged skill $SkillName -> $destination"
        return
      }
    } elseif ($ForceUnmanaged) {
      if ($WhatIf) {
        Write-Host "Would replace unmanaged skill $SkillName -> $destination"
        return
      }
    } else {
      throw "Refusing to overwrite unmanaged skill: $destination. Move it aside, or re-run with -ForceUnmanaged if this playbook should own it."
    }
  } elseif ($WhatIf) {
    Write-Host "Would install managed skill $SkillName -> $destination"
    return
  }

  New-Item -ItemType Directory -Force -Path $DestinationRoot | Out-Null
  if ($destinationExists) {
    Remove-Item -LiteralPath $destination -Recurse -Force
  }

  Copy-Item -LiteralPath $SourceDir -Destination $destination -Recurse
  Write-InstallMarker -Destination $destination -SkillName $SkillName -Category $Category -SourceHash $sourceHash
  Write-Host "Synced $SkillName -> $destination"
}

function Remove-ObsoleteSkill {
  param(
    [string]$DestinationRoot,
    [string]$SkillName
  )

  $destination = Join-Path $DestinationRoot $SkillName
  Assert-PathInside -Root $DestinationRoot -Child $destination

  if (-not (Test-Path -LiteralPath $destination)) {
    return
  }

  $marker = Get-InstallMarker -Directory $destination
  if (-not (Test-ManagedMarker -Marker $marker)) {
    Write-Warning "Skipping unmanaged obsolete skill $SkillName at $destination"
    return
  }

  $destinationHash = Get-DirectorySignature -Directory $destination
  if (-not $ForceManaged -and $marker.sourceHash -and $destinationHash -ne $marker.sourceHash) {
    throw "Refusing to remove locally modified managed obsolete skill: $destination. Re-run with -ForceManaged after backing up any local changes."
  }

  if ($WhatIf) {
    Write-Host "Would remove managed obsolete skill $SkillName from $destination"
    return
  }

  Remove-Item -LiteralPath $destination -Recurse -Force
  Write-Host "Removed managed obsolete skill $SkillName from $destination"
}

$obsoleteSkillNames = @(
  'change-safety',
  'design-system-first',
  'css-class-first',
  'utility-class-first',
  'inline-style-first'
)

if (-not $SkipObsoleteCleanup) {
  foreach ($skillName in $obsoleteSkillNames) {
    Remove-ObsoleteSkill -DestinationRoot $CodexSkillsRoot -SkillName $skillName
    Remove-ObsoleteSkill -DestinationRoot $AgentsSkillsRoot -SkillName $skillName
  }
}

foreach ($skillFile in $skillFiles) {
  $sourceDir = Split-Path -Parent $skillFile.FullName
  $skillName = Split-Path -Leaf $sourceDir
  $category = Split-Path -Leaf (Split-Path -Parent $sourceDir)

  Copy-ManagedSkill -SourceDir $sourceDir -DestinationRoot $CodexSkillsRoot -SkillName $skillName -Category $category

  if ($category -eq 'legacy') {
    Copy-ManagedSkill -SourceDir $sourceDir -DestinationRoot (Join-Path $AgentsSkillsRoot 'legacys') -SkillName $skillName -Category $category
  } else {
    Copy-ManagedSkill -SourceDir $sourceDir -DestinationRoot $AgentsSkillsRoot -SkillName $skillName -Category $category
  }
}

Write-Host "Processed $($skillFiles.Count) skills."
