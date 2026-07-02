---
name: deployment-release-check
description: Use when preparing, reviewing, or troubleshooting releases, deploys, rollbacks, feature flags, changelogs, package artifacts, migration gates, or post-deploy checks.
---

# Deployment Release Check

Use this as the primary DevOps skill for release readiness and deploy/rollback review.

## Workflow

1. Identify the artifact, environment, release mechanism, migration/config/feature-flag gates, and rollback path.
2. Check readiness from source, build, package, deploy, data, and operational evidence instead of relying on a single green status.
3. Verify the exact release path or the nearest repository-defined dry-run, then record residual risk and post-deploy checks.
4. Treat rollback as part of the release, not an afterthought.

## Reference

Read `references/release-gates.md` before approving a release or deployment.

Read `references/rollback-readiness.md` when a deploy changes artifacts, data, config, feature flags, or runtime topology.
