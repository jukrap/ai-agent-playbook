---
name: device-permission-qa
description: Use when changing or verifying mobile runtime permissions, device capabilities, manifests, privacy prompts, lifecycle behavior, or device/emulator QA matrices.
---

# Device Permission QA

Use this as the primary mobile skill for device capability and permission evidence.

## Workflow

1. List each permission or device capability, where it is declared, when it is requested, and what degraded behavior is expected when denied.
2. Build a device matrix covering platform, OS version, screen size, orientation, network state, lifecycle state, and real device versus simulator/emulator coverage.
3. Verify permission grant, denial, revocation, reinstall, update, background/foreground, and cold-start paths when relevant.
4. Record evidence source, logs or screenshots, unavailable devices, manual-only checks, and residual risk.

## Reference

Read `references/permission-device-matrix.md` for permission declarations, runtime prompts, capability coverage, and device evidence.

Read `references/lifecycle-and-device-state-checks.md` for lifecycle, network, orientation, update, and reinstall checks.
