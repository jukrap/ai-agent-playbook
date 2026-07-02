---
name: webview-bridge
description: Use when changing mobile WebView bridges, native-to-web messaging, deep links, embedded auth, file upload, downloads, or hybrid app navigation.
---

# WebView Bridge

hybrid app boundary를 위한 primary mobile skill입니다.

## Workflow

1. native container, WebView setting, bridge message, route/deep link handling, auth/session, platform permission을 함께 추적합니다.
2. contract가 의도적으로 바뀌지 않는 한 message name, payload shape, origin check, navigation behavior를 보존합니다.
3. 프로젝트가 양쪽을 지원하면 Android와 iOS 차이를 확인합니다.
4. 관련되는 경우 install/launch, bridge call, back navigation, reload, offline/error, permission case를 검증합니다.

