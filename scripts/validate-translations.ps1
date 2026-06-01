param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot),
  [string]$Locale = 'ko'
)

$ErrorActionPreference = 'Stop'
$translationRoot = Join-Path $Root "translations\$Locale"
$errors = @()

if (-not (Test-Path -LiteralPath $translationRoot)) {
  throw "Translation root does not exist: $translationRoot"
}

$translatedSkillFiles = Get-ChildItem -LiteralPath $translationRoot -Recurse -Filter 'SKILL.md' -File
foreach ($file in $translatedSkillFiles) {
  $errors += "Translation tree must not contain installable SKILL.md: $($file.FullName)"
}

$sourceMdFiles = Get-ChildItem -LiteralPath $Root -Recurse -Filter '*.md' -File |
  Where-Object { $_.FullName -notlike "$translationRoot*" }

foreach ($file in $sourceMdFiles) {
  $content = Get-Content -LiteralPath $file.FullName -Raw
  if ($content -match '\p{IsHangulSyllables}|\p{IsHangulJamo}|\p{IsHangulCompatibilityJamo}') {
    $rel = $file.FullName.Substring($Root.Length + 1)
    $errors += "English source contains Hangul: $rel"
  }
}

foreach ($file in $sourceMdFiles) {
  $rel = $file.FullName.Substring($Root.Length + 1)
  $parts = $rel -split '[\\/]'
  $expected = $null

  if ($parts[0] -eq 'skills' -and $file.Name -eq 'SKILL.md') {
    $skillName = $parts[$parts.Length - 2]
    $skillCategory = $parts[1]
    $expected = Join-Path $translationRoot "skills\$skillCategory\$skillName.$Locale.md"
  } else {
    $dir = Split-Path -Parent $rel
    $base = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
    $expectedRel = if ($dir) { Join-Path $dir "$base.$Locale.md" } else { "$base.$Locale.md" }
    $expected = Join-Path $translationRoot $expectedRel
  }

  if (-not (Test-Path -LiteralPath $expected)) {
    $errors += "Missing translation for $rel -> $($expected.Substring($translationRoot.Length + 1))"
  }
}

if ($errors.Count) {
  $errors | ForEach-Object { Write-Error $_ }
  exit 1
}

Write-Host "Validated translation safety and coverage for $($sourceMdFiles.Count) source markdown files."
