# Permission Device Matrix

Use this when a feature depends on mobile permissions, sensors, files, notifications, biometrics, camera, media, location, microphone, contacts, or background capabilities.

## Permission Contract

- Declaration location: Android manifest, Info.plist, Expo config, native module manifest, privacy manifest, or generated native project.
- Runtime request point, user-facing reason, fallback UI, denial path, repeated denial behavior, settings deep link, and feature degradation.
- Permission scope, data accessed, retention, upload path, background use, and telemetry or analytics side effects.
- Platform differences, minimum OS versions, restricted modes, and store policy notes.

## Device Evidence

- Record platform, OS version, device model or emulator profile, app version/build, install source, locale, orientation, and network state.
- Distinguish real-device evidence from simulator/emulator evidence.
- Capture grant, deny, revoke-in-settings, reinstall, app update, and first-run behavior for sensitive capabilities.
- Keep screenshots, logs, or manual notes in local project evidence when they contain private device or account data.

## Stop Conditions

- A new sensitive permission is declared without a runtime request path, fallback behavior, or product reason.
- Permission prompt copy, manifest usage string, or privacy metadata does not match the feature.
- The only verification is a clean build, with no permission grant/deny evidence.
- The feature depends on a hardware capability that was not exercised on a suitable device or emulator.
