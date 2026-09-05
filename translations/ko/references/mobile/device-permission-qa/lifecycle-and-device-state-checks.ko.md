# Lifecycle And Device State Checks

Mobile behavior가 app lifecycle, device state, update path, environment transition에 따라 달라질 수 있을 때 사용합니다.

## Lifecycle Matrix

- Cold start, warm start, background, foreground, app kill, process restore, deep link resume, notification open, back navigation.
- Orientation change, split screen 또는 tablet layout, safe area, keyboard appearance, low power mode, low storage, dark mode, locale, font scaling.
- App update, reinstall, logout/login, token refresh, permission revocation, cached session restore.
- 해당되는 경우 push, background fetch, location update, file download/upload, media capture, WebView reload.

## Network And Device State

- Online, offline, airplane mode, weak network, captive portal, DNS failure, proxy/VPN, network handoff, retry timing.
- Clock drift, timezone change, battery saver, storage pressure, notification permission change, biometric enrollment change.
- Success path뿐 아니라 loading, empty, error, disabled, retry, recovery state를 검증합니다.
- 어떤 check가 automated, manual, real-device, simulator/emulator, unavailable인지 기록합니다.

## Stop Conditions

- Lifecycle state에서 user data loss, duplicate request, hidden stuck state가 발생할 수 있습니다.
- Background 또는 notification behavior가 바뀌었지만 device-state check가 없습니다.
- App update 또는 reinstall이 migration/recovery path 없이 local data를 고립시킬 수 있습니다.
- QA evidence가 실제 확인한 platform/device profile을 명시하지 않습니다.
