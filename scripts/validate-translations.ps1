param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot),
  [string]$Locale = 'ko'
)

$ErrorActionPreference = 'Stop'
& node (Join-Path $PSScriptRoot "validate.mjs") translations --root $Root --locale $Locale
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
