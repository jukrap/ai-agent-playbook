# Mobile Build Channel Checks

Use this when release confidence depends on build profiles, channels, flavors, environments, or staged distribution behavior.

## Build Channel Review

- Native schemes/flavors, Expo/EAS profiles, React Native variants, environment files, API bases, feature flags, asset bundles, update channels, and OTA behavior.
- Release, beta, staging, debug, and local channels should have clear names, separate credentials, and predictable runtime config.
- Check that app update, rollback, remote config, and feature flag behavior match the chosen release channel.
- If over-the-air updates are supported, record the native binary compatibility boundary and rollback procedure.

## Release-Build Cleanup

- Debug menus, local network bridges, test servers, mock providers, dev certificates, debug overlays, verbose logs, internal diagnostics, and agent-control hooks.
- WebView or hybrid apps should confirm JavaScript bridge exposure, allowed origins, navigation policy, deep links, and file upload/download behavior in release mode.
- Crash reporting, analytics, logging, and monitoring should be configured for the release channel without leaking personal or sensitive values.
- Verify install, launch, cold start, sign-in, core path, background/foreground, and update path on the supported platform matrix.

## Stop Conditions

- Runtime channel cannot be proven from artifact, config, logs, or app-visible diagnostics.
- Release build still exposes a debug bridge, dev menu, local endpoint, or broad inspection surface.
- OTA or staged rollout can change production behavior without rollback evidence.
- The release depends on device capabilities that were not checked on any matching device or emulator.
