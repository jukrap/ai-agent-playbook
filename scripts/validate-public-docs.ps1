param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = 'Stop'
$resolvedRoot = (Resolve-Path -LiteralPath $Root).Path
$errors = @()

$excludedDirs = @(
  '.git',
  '.next',
  '.turbo',
  '_reference',
  '_work',
  'build',
  'coverage',
  'dist',
  'node_modules'
)

$scanRoots = @(
  'AGENTS.md',
  'CONTEXT.md',
  'README.md',
  'adapters',
  'docs',
  'examples',
  'skills',
  'templates',
  'translations\ko'
)

function Get-RelativePath {
  param(
    [Parameter(Mandatory = $true)]
    [string]$FullName
  )

  return $FullName.Substring($resolvedRoot.Length + 1)
}

function Test-IsExcludedPath {
  param(
    [Parameter(Mandatory = $true)]
    [string]$FullName
  )

  $rel = Get-RelativePath -FullName $FullName
  $parts = $rel -split '[\\/]'
  foreach ($part in $parts) {
    if ($excludedDirs -contains $part) {
      return $true
    }
  }

  return $false
}

function Get-LineNumber {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Content,
    [Parameter(Mandatory = $true)]
    [int]$Index
  )

  if ($Index -le 0) {
    return 1
  }

  return ([regex]::Matches($Content.Substring(0, $Index), "`n")).Count + 1
}

function Add-Finding {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Rel,
    [Parameter(Mandatory = $true)]
    [string]$Kind,
    [Parameter(Mandatory = $true)]
    [string]$Content,
    [Parameter(Mandatory = $true)]
    [int]$Index,
    [string]$Value = ''
  )

  $line = Get-LineNumber -Content $Content -Index $Index
  $suffix = if ($Value) { " -> $Value" } else { '' }
  $script:errors += "${Rel}:${line}: ${Kind}${suffix}"
}

$files = @()
foreach ($scanRoot in $scanRoots) {
  $path = Join-Path $resolvedRoot $scanRoot
  if (-not (Test-Path -LiteralPath $path)) {
    continue
  }

  $item = Get-Item -LiteralPath $path
  if ($item.PSIsContainer) {
    $files += Get-ChildItem -LiteralPath $item.FullName -Recurse -Filter '*.md' -File |
      Where-Object { -not (Test-IsExcludedPath -FullName $_.FullName) }
  } elseif ($item.Extension -eq '.md') {
    $files += $item
  }
}

$files = $files | Sort-Object FullName -Unique

$patternChecks = @(
  @{
    Kind = 'local Windows absolute path'
    Pattern = '(?<![A-Za-z0-9_])[A-Za-z]:[\\/][^\s)`">]+'
  },
  @{
    Kind = 'local Unix absolute path'
    Pattern = '(?<![A-Za-z0-9_])/(?:Users|home)/[^\s)`">]+'
  },
  @{
    Kind = 'local file URI'
    Pattern = 'file://[^\s)`">]+'
  },
  @{
    Kind = 'internal or local URL'
    Pattern = 'https?://(?:localhost|127\.0\.0\.1|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2}|[A-Za-z0-9.-]*(?:internal|intranet|corp|local)[A-Za-z0-9.-]*(?::\d+)?)(?:/[^\s)`">]*)?'
  },
  @{
    Kind = 'local reference directory mention'
    Pattern = '(?<![A-Za-z0-9_-])_reference[\\/]'
  }
)

$secretAssignmentPattern = '(?im)\b(?:api[_-]?key|access[_-]?token|auth[_-]?token|refresh[_-]?token|secret|password|passwd|private[_-]?key)\b\s*[:=]\s*["'']?([A-Za-z0-9_./+=:-]{12,})'
$placeholderPattern = '(?i)example|placeholder|redacted|replace-me|your-|xxx|\*\*\*'
$fencedBlockPattern = '(?s)```.*?```'
$maxFencedBlockChars = 6000

foreach ($file in $files) {
  $rel = Get-RelativePath -FullName $file.FullName
  $content = Get-Content -LiteralPath $file.FullName -Raw

  foreach ($check in $patternChecks) {
    $matches = [regex]::Matches($content, $check.Pattern)
    foreach ($match in $matches) {
      Add-Finding -Rel $rel -Kind $check.Kind -Content $content -Index $match.Index -Value $match.Value
    }
  }

  $secretMatches = [regex]::Matches($content, $secretAssignmentPattern)
  foreach ($match in $secretMatches) {
    $value = $match.Groups[1].Value
    if ($value -match $placeholderPattern) {
      continue
    }
    Add-Finding -Rel $rel -Kind 'secret-like assignment' -Content $content -Index $match.Index -Value $match.Groups[0].Value
  }

  $fencedMatches = [regex]::Matches($content, $fencedBlockPattern)
  foreach ($match in $fencedMatches) {
    if ($match.Value.Length -gt $maxFencedBlockChars) {
      Add-Finding -Rel $rel -Kind "oversized fenced excerpt ($($match.Value.Length) chars)" -Content $content -Index $match.Index
    }
  }
}

if ($errors.Count) {
  $errors | ForEach-Object { Write-Error $_ }
  exit 1
}

Write-Host "Validated public documentation hygiene for $($files.Count) markdown files."
