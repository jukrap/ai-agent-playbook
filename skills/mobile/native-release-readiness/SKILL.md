---
name: native-release-readiness
description: Use when preparing, reviewing, or troubleshooting mobile app releases, signing, provisioning, build channels, store distribution, release artifacts, or release-build cleanup.
---

# Native Release Readiness

Use this as the primary mobile skill for app release readiness across native, Expo, React Native, and hybrid apps.

## Workflow

1. Identify target platform, release channel, application id, version/build number, signing state, artifact path, and rollback or hotfix route.
2. Check build profile, scheme/flavor, store metadata, privacy declarations, entitlement/permission changes, and release notes together.
3. Confirm release-build cleanup for debug bridges, test endpoints, local overrides, verbose logs, non-production entitlements, and device-control surfaces.
4. Record build evidence, skipped device/store checks, residual risk, and rollout or rollback constraints.

## Reference

Read `references/release-signing-and-store-checks.md` for signing, provisioning, store metadata, privacy, and release artifact review.

Read `references/mobile-build-channel-checks.md` for build profiles, release channels, staged rollout, and release-build cleanup.
