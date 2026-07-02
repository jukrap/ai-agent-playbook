---
name: package-publish-readiness
description: Use when preparing, reviewing, or troubleshooting package publishing, release artifacts, package metadata, registry dry-runs, generated bundles, binaries, or marketplace distribution.
---

# Package Publish Readiness

Use this as the primary devops skill for packages and shipped artifact readiness.

## Workflow

1. Identify package manager, registry, artifact type, release channel, version source, generated outputs, and rollback path.
2. Review package metadata, included files, entrypoints, binaries, platform assets, README, license, notices, changelog, and publish scripts.
3. Prefer repository-defined pack/publish dry-runs and provenance checks over generic registry advice.
4. Record actual artifact evidence, skipped checks, release risk, and rollback or unpublish constraints.

## Reference

Read `references/package-metadata-checks.md` for package metadata, entrypoint, file inclusion, and version review.

Read `references/artifact-dry-run-checks.md` for pack/publish dry-run evidence and artifact boundary checks.
