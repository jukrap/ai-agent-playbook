# Mobile Release

Inputs: release target, platform, application id, version/build number, signing state, build profile, release channel, artifact path, device 또는 simulator matrix, permission change, offline/sync scope, WebView 또는 native bridge scope.

Outputs: release checklist, build evidence, signing/store evidence, device permission matrix, offline/sync risk note, known release blocker, rollback 또는 hotfix path.

Skills: native release readiness, device permission QA, offline sync review, hybrid이면 WebView bridge, deployment release check, test verification strategy.

Tools: platform build tools, repository-defined store/distribution dry-run, device logs, release artifact inspection, `operator audit`, `workflow run-start`, `diagnostics check`.

Stop conditions: signing mismatch, missing release artifact, unavailable target device coverage, release-build debug bridge risk, unreviewed permission expansion, untested offline/sync data path, store credential requirement, missing rollback path.

Verification: clean build, artifact inspection, install/launch check, smoke test, changed permission의 grant/deny check, 관련되는 경우 offline/network transition check, hybrid이면 WebView bridge check, 지원되는 경우 rollback 또는 hotfix rehearsal.
