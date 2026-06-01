---
name: legacy-android-webview-hybrid
description: Use when maintaining Android apps that load local or remote web assets in WebView and connect them to native behavior through JavaScript bridges, permissions, or device APIs.
---

# Legacy Android WebView Hybrid

Trace both native lifecycle and web runtime before changing either side.

## Workflow

1. Identify Activity/Fragment, WebView settings, asset source, URL loading mode, and bridge interface.
2. Confirm bridge method names, payload shape, callback protocol, permissions, and lifecycle hooks.
3. Check local asset packaging, cache/version behavior, download/file chooser/device integrations.
4. Keep web styling consistent with the embedded viewport and existing team preference.
5. Verify on emulator or device when behavior crosses the native/WebView boundary.

## Guardrails

- Do not change bridge signatures without native and web callers.
- Do not assume local asset changes are picked up without packaging/version checks.
- Do not treat WebView console success as native integration success.
- Record Gradle/build, permission, and deployment implications.
