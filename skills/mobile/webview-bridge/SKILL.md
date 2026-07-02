---
name: webview-bridge
description: Use when changing mobile WebView bridges, native-to-web messaging, deep links, embedded auth, file upload, downloads, or hybrid app navigation.
---

# WebView Bridge

Use this as the primary mobile skill for hybrid app boundaries.

## Workflow

1. Trace native container, WebView settings, bridge messages, route/deep link handling, auth/session, and platform permissions together.
2. Preserve message names, payload shape, origin checks, and navigation behavior unless the contract changes deliberately.
3. Check Android and iOS differences when the project supports both.
4. Verify install/launch, bridge call, back navigation, reload, offline/error, and permission cases when relevant.

