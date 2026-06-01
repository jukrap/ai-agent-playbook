param(
  [string]$SkillsRoot = (Join-Path (Split-Path -Parent $PSScriptRoot) 'skills')
)

$ErrorActionPreference = 'Stop'
$skillFiles = Get-ChildItem -LiteralPath $SkillsRoot -Recurse -Filter 'SKILL.md' -File
if (-not $skillFiles) {
  throw "No SKILL.md files found under $SkillsRoot"
}

$errors = @()
foreach ($file in $skillFiles) {
  $skillDir = Split-Path -Parent $file.FullName
  $skillName = Split-Path -Leaf $skillDir
  $lines = Get-Content -LiteralPath $file.FullName

  if ($lines.Count -lt 4 -or $lines[0] -ne '---') {
    $errors += "${skillName}: missing opening frontmatter"
    continue
  }

  $end = -1
  for ($i = 1; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -eq '---') {
      $end = $i
      break
    }
  }
  if ($end -lt 0) {
    $errors += "${skillName}: missing closing frontmatter"
    continue
  }

  $keys = @()
  $nameValue = $null
  $descriptionValue = $null
  for ($i = 1; $i -lt $end; $i++) {
    if ($lines[$i] -match '^([^:#]+):\s*(.*)$') {
      $key = $matches[1].Trim()
      $value = $matches[2].Trim()
      $keys += $key
      if ($key -eq 'name') { $nameValue = $value }
      if ($key -eq 'description') { $descriptionValue = $value }
    }
  }

  $extra = $keys | Where-Object { $_ -notin @('name', 'description') }
  if ($extra) { $errors += "${skillName}: extra frontmatter keys $($extra -join ',')" }
  if (-not $nameValue) { $errors += "${skillName}: missing name" }
  if (-not $descriptionValue) { $errors += "${skillName}: missing description" }
  if ($nameValue -and $nameValue -ne $skillName) { $errors += "${skillName}: name does not match folder ($nameValue)" }
  if ($nameValue -and $nameValue -notmatch '^[a-z0-9-]+$') { $errors += "${skillName}: invalid skill name" }
  if ($descriptionValue -and $descriptionValue -notmatch '^Use when') { $errors += "${skillName}: description should start with 'Use when'" }
}

if ($errors.Count) {
  $errors | ForEach-Object { Write-Error $_ }
  exit 1
}

Write-Host "Validated $($skillFiles.Count) skills."
