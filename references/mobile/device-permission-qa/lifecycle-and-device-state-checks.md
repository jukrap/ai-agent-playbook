# Lifecycle And Device State Checks

Use this when mobile behavior may change across app lifecycle, device state, update path, or environment transitions.

## Lifecycle Matrix

- Cold start, warm start, background, foreground, app kill, process restore, deep link resume, notification open, and back navigation.
- Orientation changes, split screen or tablet layout, safe areas, keyboard appearance, low power mode, low storage, dark mode, locale, and font scaling.
- App update, reinstall, logout/login, token refresh, permission revocation, and cached session restore.
- Push, background fetch, location updates, file downloads/uploads, media capture, and WebView reload if applicable.

## Network And Device State

- Online, offline, airplane mode, weak network, captive portal, DNS failure, proxy/VPN, network handoff, and retry timing.
- Clock drift, timezone change, battery saver, storage pressure, notification permission changes, and biometric enrollment changes.
- Verify loading, empty, error, disabled, retry, and recovery states instead of only the success path.
- Record which checks are automated, manual, real-device, simulator/emulator, or not available.

## Stop Conditions

- Lifecycle state can lose user data, duplicate a request, or leave a hidden stuck state.
- Background or notification behavior changed without a device-state check.
- App update or reinstall can strand local data without a migration or recovery path.
- QA evidence does not name the platform/device profile that was actually checked.
