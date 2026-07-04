param(
  [string]$Python = "",
  [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$venv = Join-Path $repoRoot ".venv"

function Resolve-Python {
  param([string]$Requested)
  if ($Requested) { return @($Requested) }
  if ($env:AI_PLAYBOOK_PYTHON) { return @($env:AI_PLAYBOOK_PYTHON) }
  $py = Get-Command py -ErrorAction SilentlyContinue
  if ($py) { return @("py", "-3") }
  $python = Get-Command python -ErrorAction SilentlyContinue
  if ($python) { return @("python") }
  throw "Python 3.11+ was not found. Install Python or set AI_PLAYBOOK_PYTHON."
}

$pythonCommand = @(Resolve-Python -Requested $Python)
$pythonArgs = @()
if ($pythonCommand.Length -gt 1) {
  $pythonArgs = $pythonCommand[1..($pythonCommand.Length - 1)]
}
$pythonExe = $pythonCommand[0]
& $pythonExe @pythonArgs -m venv $venv
$venvPython = Join-Path $venv "Scripts\python.exe"
if (!(Test-Path $venvPython)) {
  $venvPython = Join-Path $venv "bin/python"
}

& $venvPython -m pip install --upgrade pip
if (!$SkipInstall) {
  & $venvPython -m pip install -e "$repoRoot[ko,analysis]"
}

Write-Host "Python engine ready: $venvPython"
