# Rollback Readiness

## Rollback Shape

- Artifact rollback: redeploy previous package, image, static bundle, or function version.
- Config rollback: restore previous env/config/secret/feature flag state.
- Data rollback: reverse migration, restore backup, run compensating migration, or freeze write paths.
- Traffic rollback: canary stop, route weight revert, DNS/ingress revert, queue drain, or maintenance mode.

## Review

- Name the previous known-good artifact, config, and data state.
- Check whether new and old versions can run together during rollout and rollback.
- Identify irreversible steps: destructive migrations, one-way data transforms, external API side effects, emitted events, and cache invalidations.
- Define rollback triggers using user impact, health status, error rate, latency, queue depth, and business-critical metrics.
- Confirm who or what can execute rollback and whether credentials/permissions exist.

## Verification

- Dry-run rollback or documented command when the project supports it.
- Restore or backup check for data-bearing changes.
- Feature flag off-switch or config revert check.
- Smoke test after rollback path in a non-production environment when possible.
- Handoff note for residual data repair, reconciliation, or customer-impact follow-up.

## Stop Conditions

- Rollback would require guessing a previous config or artifact.
- New data cannot be read by the previous version and no compatibility plan exists.
- External side effects cannot be contained or reconciled.
- Rollback authority or credentials are unknown for a time-sensitive release.
