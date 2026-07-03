# Android WebView Hybrid Stack Checks

## Inspect Together

- Activity/Fragment lifecycle, WebView settings, asset source, URL loading rules, navigation overrides, JavaScript bridge, and native permissions.
- Bridge method names, payload schema, callback protocol, origin checks, user-agent behavior, deep links, downloads, uploads, and file chooser flow.
- Web routes, bundled assets, remote content policy, cache/version behavior, offline/error handling, auth/session sharing, and storage/cookie settings.
- Android manifest, proguard/R8 rules, min/target SDK, permissions, privacy prompts, network security config, and release build differences.

## Change Risks

- Bridge payload changes can break older web assets or native shells even when one side compiles.
- WebView settings can widen attack surface through JavaScript, file access, mixed content, or unverified origins.
- Lifecycle and cache behavior can hide bugs until rotation, process death, app resume, offline mode, or version upgrade.
- File chooser, camera, storage, and download flows depend on runtime permissions and device/API-level behavior.

## Verification

- Exercise native-to-web and web-to-native calls, callback success/failure, malformed payload, denied permission, and unsupported route behavior.
- Verify navigation, deep link, back button, refresh, login/session, offline/error page, file upload, download, and camera/storage paths.
- Test on emulator or device with release-like settings when bridge, permission, file, or signing behavior changed.
- Check console/native logs, network security failures, mixed-content blocks, and WebView version differences.
- Pair with `mobile/webview-bridge`, `mobile/device-permission-qa`, `frontend/browser-dom-change`, or `security/security-review` as needed.
