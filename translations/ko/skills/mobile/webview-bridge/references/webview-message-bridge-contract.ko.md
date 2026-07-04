# WebView 메시지 브리지 계약

하이브리드 앱 WebView 경계를 바꾸기 전에 사용합니다.

## 계약 표면

- 네이티브 컨테이너 설정: JavaScript, storage, mixed content, file access, user agent, debugging.
- 메시지 이름, payload shape, version, correlation ID, error envelope.
- origin check, allowed URL, scheme handler, deep link, redirect rule.
- 네이티브와 웹 계층 사이의 auth/session ownership.
- back navigation, reload, external browser handoff, offline/error screen.
- file upload, download, camera, storage, clipboard, notification permission.

## 플랫폼 차이

- Android와 iOS bridge API는 message timing, serialization, lifecycle이 다를 수 있습니다.
- hardware back 동작은 Android-specific이지만 web coordination이 필요할 수 있습니다.
- cookie, local storage, third-party auth 동작은 플랫폼과 OS version마다 다를 수 있습니다.
- file chooser, download manager, permission prompt는 플랫폼마다 다릅니다.
- WebView debugging과 release setting은 개발 설정과 다를 수 있습니다.

## 안전 점검

- explicit versioning이 없다면 기존 메시지 이름과 payload field를 보존합니다.
- web message를 신뢰하기 전에 origin을 검증합니다.
- 임의의 web content에 native capability를 노출하지 않습니다.
- session refresh와 logout behavior를 native/web 계층 전체에서 일관되게 유지합니다.
- permission denial path를 보이고 복구 가능하게 유지합니다.

## 검증

- fresh install and launch.
- existing session and expired session.
- native-to-web call and web-to-native call.
- back navigation, deep link, reload, external browser handoff.
- offline, server error, permission denial.
- 양쪽을 지원하면 Android와 iOS, 아니면 확인하지 못한 플랫폼을 문서화합니다.
