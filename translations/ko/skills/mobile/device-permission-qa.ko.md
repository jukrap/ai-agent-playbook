# Device Permission QA

Device capability와 permission evidence를 위한 primary mobile skill입니다.

## Workflow

1. 각 permission 또는 device capability, 선언 위치, 요청 시점, 거부 시 expected degraded behavior를 나열합니다.
2. platform, OS version, screen size, orientation, network state, lifecycle state, real device와 simulator/emulator coverage를 포함하는 device matrix를 만듭니다.
3. 관련되는 경우 permission grant, denial, revocation, reinstall, update, background/foreground, cold-start path를 검증합니다.
4. evidence source, log 또는 screenshot, unavailable device, manual-only check, residual risk를 기록합니다.

## Reference

Permission declaration, runtime prompt, capability coverage, device evidence에는 `references/permission-device-matrix.md`를 읽습니다.

Lifecycle, network, orientation, update, reinstall check에는 `references/lifecycle-and-device-state-checks.md`를 읽습니다.
