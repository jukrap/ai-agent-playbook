param(
  [string]$SkillsRoot = (Join-Path (Split-Path -Parent $PSScriptRoot) 'skills')
)

$ErrorActionPreference = 'Stop'
& node (Join-Path $PSScriptRoot "validate.mjs") skills --skills-root $SkillsRoot
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
