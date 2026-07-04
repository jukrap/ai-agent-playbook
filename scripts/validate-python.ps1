param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"
& node (Join-Path $PSScriptRoot "validate.mjs") python --root $Root
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
