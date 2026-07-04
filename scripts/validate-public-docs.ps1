param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = 'Stop'
& node (Join-Path $PSScriptRoot "validate.mjs") public-docs --root $Root
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
