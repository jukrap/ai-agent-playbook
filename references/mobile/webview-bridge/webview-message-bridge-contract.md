# WebView Message Bridge Contract

Use this before changing hybrid app WebView boundaries.

## Contract surface

- Native container settings: JavaScript, storage, mixed content, file access, user agent, and debugging.
- Message names, payload shape, version, correlation ID, and error envelope.
- Origin checks, allowed URLs, scheme handlers, deep links, and redirect rules.
- Auth/session ownership between native and web layers.
- Back navigation, reload, external browser handoff, and offline/error screens.
- File upload, download, camera, storage, clipboard, and notification permissions.

## Platform differences

- Android and iOS bridge APIs differ in message timing, serialization, and lifecycle.
- Hardware back behavior is Android-specific but may need web coordination.
- Cookie, local storage, and third-party auth behavior can differ by platform and OS version.
- File chooser, download manager, and permission prompts differ by platform.
- WebView debugging and release settings may differ from development settings.

## Safety checks

- Preserve old message names and payload fields unless versioning is explicit.
- Validate origin before trusting web messages.
- Do not expose native capabilities to arbitrary web content.
- Keep session refresh and logout behavior consistent across native and web layers.
- Keep permission denial paths visible and recoverable.

## Verification

- Fresh install and launch.
- Existing session and expired session.
- Native-to-web call and web-to-native call.
- Back navigation, deep link, reload, and external browser handoff.
- Offline, server error, and permission denial.
- Android and iOS when both are supported, or document the unchecked platform.
