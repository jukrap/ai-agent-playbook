# Mobile Release

Inputs: release target, platform, application id, version/build number, signing state, build profile, release channel, artifact path, device or simulator matrix, permission changes, offline/sync scope, and WebView or native bridge scope.

Outputs: release checklist, build evidence, signing/store evidence, device permission matrix, offline/sync risk notes, known release blockers, and rollback or hotfix path.

Skills: native release readiness, device permission QA, offline sync review, WebView bridge when hybrid, deployment release check, test verification strategy.

Tools: platform build tools, store or distribution dry-run when repository-defined, device logs, release artifact inspection, `operator audit`, `workflow run-start`, `diagnostics check`.

Stop conditions: signing mismatch, missing release artifact, unavailable target device coverage, release-build debug bridge risk, unreviewed permission expansion, untested offline/sync data path, store credential requirement, or missing rollback path.

Verification: clean build, artifact inspection, install/launch check, smoke test, permission grant/deny check for changed permissions, offline/network transition check when relevant, WebView bridge check when hybrid, and rollback or hotfix rehearsal when supported.
