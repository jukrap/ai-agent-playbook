# Release Gates

## Inventory

- Artifact: package, image, static bundle, serverless bundle, mobile build, CLI, plugin, migration bundle, or configuration bundle.
- Gate sources: CI status, tests, build, package dry-run, generated artifact diff, dependency scan, SBOM/license check, deployment preview, and manual approval.
- Environment: target environment, config source, secrets, feature flags, data migrations, queues, scheduled jobs, and downstream dependencies.
- Documentation: changelog, release notes, runbook, rollout plan, verification plan, and known residual risk.

## Review

- Confirm the artifact being deployed is the artifact that was built and verified.
- Check version, tag, digest, changelog, migration version, and config version alignment.
- Review dependency, container, and package changes for release-critical supply-chain impact.
- Check database migrations, background jobs, queues, cache invalidation, and feature flags as release gates, not secondary notes.
- Identify which checks are blocking, advisory, skipped, or unavailable. Do not silently treat missing checks as pass.
- Compare release scope with the rollback plan and post-deploy checks.

## Verification

- Repository-defined test/build/package command or CI evidence for the same commit.
- Package or deploy dry-run when available.
- Migration dry-run or reversible migration review when data changes are present.
- Smoke test covering the release's main user or service path.
- Post-deploy checks for health, logs, error rate, latency, queue depth, scheduled job status, and critical metrics.

## Stop Conditions

- The artifact identity cannot be tied to the verified source revision.
- Migration/config/feature flag state is unknown.
- No rollback or containment path exists for a user-impacting release.
- Required checks are missing and nobody has accepted the residual risk.
