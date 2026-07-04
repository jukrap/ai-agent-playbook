$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$pythonPath = Join-Path $repoRoot "engines\python"

function Resolve-Python {
  if ($env:AI_AGENT_PLAYBOOK_PYTHON) { return @($env:AI_AGENT_PLAYBOOK_PYTHON) }
  $venvPython = Join-Path $repoRoot ".venv\Scripts\python.exe"
  if (Test-Path $venvPython) { return @($venvPython) }
  $venvPythonPosix = Join-Path $repoRoot ".venv/bin/python"
  if (Test-Path $venvPythonPosix) { return @($venvPythonPosix) }
  $python = Get-Command python -ErrorAction SilentlyContinue
  if ($python) { return @("python") }
  $py = Get-Command py -ErrorAction SilentlyContinue
  if ($py) { return @("py", "-3") }
  throw "Python was not found. Install Python 3.11+ or set AI_AGENT_PLAYBOOK_PYTHON."
}

$previousPythonPath = $env:PYTHONPATH
if ($previousPythonPath) {
  $env:PYTHONPATH = "$pythonPath;$previousPythonPath"
} else {
  $env:PYTHONPATH = "$pythonPath"
}
$env:PYTHONIOENCODING = "utf-8"

$pythonCommand = @(Resolve-Python)
$pythonArgs = @()
if ($pythonCommand.Length -gt 1) {
  $pythonArgs = $pythonCommand[1..($pythonCommand.Length - 1)]
}
$pythonExe = $pythonCommand[0]
& $pythonExe @pythonArgs -m ai_agent_playbook_engine --help | Out-Null

$sample = @{
  schemaVersion = "1"
  task = "writing-naturalness"
  lang = "ko"
  path = "sample.md"
  text = "이 문서는 중요한 역할을 합니다. 이를 통해 사용자는 더 강력한 결과를 얻을 수 있습니다."
} | ConvertTo-Json -Compress

$output = $sample | & $pythonExe @pythonArgs -m ai_agent_playbook_engine writing-naturalness --json
$parsed = $output | ConvertFrom-Json
if (!$parsed.ok) {
  throw "Python writing naturalness check failed."
}
if ($parsed.findings.Count -lt 1) {
  throw "Python writing naturalness check did not report expected findings."
}

Write-Host "Python engine validation passed."
