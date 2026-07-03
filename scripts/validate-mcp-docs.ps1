param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = 'Stop'
$resolvedRoot = (Resolve-Path -LiteralPath $Root).Path
$errors = @()

function Read-RepoFile {
  param([Parameter(Mandatory = $true)][string]$Path)
  return Get-Content -LiteralPath (Join-Path $resolvedRoot $Path) -Raw
}

function Add-Finding {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][string]$Message
  )
  $script:errors += "${Path}: ${Message}"
}

$mcpSourcePath = 'src\mcp-tools.mjs'
$mcpSource = Read-RepoFile -Path $mcpSourcePath

$resourceMatches = [regex]::Matches($mcpSource, "resource\('([^']+)',\s*'([^']+)'")
$resourceUris = @($resourceMatches | ForEach-Object { $_.Groups[2].Value } | Sort-Object -Unique)
if ($resourceUris.Count -eq 0) {
  Add-Finding -Path $mcpSourcePath -Message 'No MCP resources were discovered.'
}

$writeBlockMatch = [regex]::Match($mcpSource, "(?s)const writeTools = enableWriteTools \? \[(.*?)\]\s*:\s*\[\];")
if (-not $writeBlockMatch.Success) {
  Add-Finding -Path $mcpSourcePath -Message 'Could not locate opt-in write tool registration block.'
  $writeToolNames = @()
} else {
  $writeToolNames = @([regex]::Matches($writeBlockMatch.Groups[1].Value, "tool\('([^']+)'") |
    ForEach-Object { $_.Groups[1].Value } |
    Sort-Object -Unique)
}

$requiredPreviewTools = @(
  'reference_source_registry_update_preview',
  'reference_ledger_update_preview',
  'reference_ledger_decision_preview'
)

$docsToCheck = @(
  'docs\commands.md',
  'docs\mcp-permission-model.md',
  'translations\ko\docs\commands.ko.md',
  'translations\ko\docs\mcp-permission-model.ko.md'
)

foreach ($docPath in $docsToCheck) {
  $content = Read-RepoFile -Path $docPath

  foreach ($uri in $resourceUris) {
    if (-not $content.Contains($uri)) {
      Add-Finding -Path $docPath -Message "Missing MCP resource URI: $uri"
    }
  }

  foreach ($toolName in $writeToolNames) {
    if (-not $content.Contains($toolName)) {
      Add-Finding -Path $docPath -Message "Missing opt-in write tool: $toolName"
    }
  }

  if ($docPath -like '*mcp-permission-model*') {
    foreach ($toolName in $requiredPreviewTools) {
      if (-not $content.Contains($toolName)) {
        Add-Finding -Path $docPath -Message "Missing read-only preview tool: $toolName"
      }
    }
  }
}

if ($errors.Count) {
  $errors | ForEach-Object { Write-Error $_ }
  exit 1
}

Write-Host "Validated MCP docs for $($resourceUris.Count) resources and $($writeToolNames.Count) opt-in write tools."
