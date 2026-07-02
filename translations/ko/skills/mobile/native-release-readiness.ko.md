# Native Release Readiness

Native, Expo, React Native, hybrid app의 release readiness를 위한 primary mobile skill입니다.

## Workflow

1. target platform, release channel, application id, version/build number, signing state, artifact path, rollback 또는 hotfix route를 확인합니다.
2. build profile, scheme/flavor, store metadata, privacy declaration, entitlement/permission 변경, release note를 함께 확인합니다.
3. debug bridge, test endpoint, local override, verbose log, non-production entitlement, device-control surface가 release build에서 정리되었는지 확인합니다.
4. build evidence, skipped device/store check, residual risk, rollout 또는 rollback constraint를 기록합니다.

## Reference

Signing, provisioning, store metadata, privacy, release artifact review에는 `references/release-signing-and-store-checks.md`를 읽습니다.

Build profile, release channel, staged rollout, release-build cleanup에는 `references/mobile-build-channel-checks.md`를 읽습니다.
