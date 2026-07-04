$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Push-Location $repoRoot
try {
  $files = git ls-files | Where-Object {
    $_ -notmatch '^(docs/plans|translations/ko/docs/plans)/' -and
    $_ -notmatch '^(_reference|_work|node_modules)/'
  }

  $allowedLegacyFiles = @(
    'src/harness/core.mjs',
    'src/harness/bootstrap.mjs',
    'src/layout/structured-playbook-layout.mjs',
    'src/runtime/python-engine.mjs',
    'src/operator/shared.mjs',
    'adapters/shared/context-hook.mjs',
    'scripts/validate-translations.ps1',
    'test/adapters.test.mjs',
    'test/cli.test.mjs',
    'test/operator-diagnostics.test.mjs'
  )

  $findings = New-Object System.Collections.Generic.List[string]

  foreach ($file in $files) {
    if (!(Test-Path -LiteralPath $file -PathType Leaf)) { continue }
    $lines = Get-Content -LiteralPath $file
    for ($index = 0; $index -lt $lines.Count; $index++) {
      $line = $lines[$index]
      $lineNumber = $index + 1
      $location = "${file}:${lineNumber}"
      $legacyAllowed = $allowedLegacyFiles -contains $file -or
        $line -match '(?i)\blegacy\b|\bmigrate path\b|\bmigration\b|\bcompatibility\b|\bconflict\b' -or
        $line -match '기존|레거시|전환|마이그레이션|충돌|conflict'

      if ($line -match 'ai-playbook://') {
        $findings.Add("$location uses legacy MCP URI scheme ai-playbook://.")
      }
      if ($line -match 'bin[\\/]+ai-playbook\.mjs') {
        $findings.Add("$location references removed bin/ai-playbook.mjs.")
      }
      if ($line -match '\bai_playbook_engine\b') {
        $findings.Add("$location references old Python module ai_playbook_engine.")
      }
      if ($line -match '\bAI_PLAYBOOK_[A-Z0-9_]*\b' -and $file -ne 'src/runtime/python-engine.mjs') {
        $findings.Add("$location references old AI_PLAYBOOK_* environment variable.")
      }
      if (($line -match '\.ai-playbook/' -or $line -match '(^|[^A-Za-z0-9_.-])ai-playbook/') -and !$legacyAllowed) {
        $findings.Add("$location references legacy playbook path outside a migration context.")
      }
      if ($line -match '(^|[^A-Za-z0-9_.-])ai-playbook(?=[\s`"''.,:)\]]|$)' -and !$legacyAllowed) {
        $findings.Add("$location references removed ai-playbook command/name outside a migration context.")
      }
    }
  }

  if ($findings.Count -gt 0) {
    $findings | ForEach-Object { Write-Error $_ }
    throw "Naming validation failed with $($findings.Count) finding(s)."
  }

  Write-Host "Naming validation passed."
} finally {
  Pop-Location
}
