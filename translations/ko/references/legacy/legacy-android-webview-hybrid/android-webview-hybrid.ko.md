# Android WebView Hybrid Stack Checks

## 함께 확인할 것

- Activity/Fragment lifecycle, WebView setting, asset source, URL loading rule, navigation override, JavaScript bridge, native permission.
- Bridge method name, payload schema, callback protocol, origin check, user-agent behavior, deep link, download, upload, file chooser flow.
- Web route, bundled asset, remote content policy, cache/version behavior, offline/error handling, auth/session sharing, storage/cookie setting.
- Android manifest, proguard/R8 rule, min/target SDK, permission, privacy prompt, network security config, release build difference.

## 변경 위험

- Bridge payload 변경은 한쪽이 compile되어도 오래된 web asset이나 native shell을 깨뜨릴 수 있습니다.
- WebView setting은 JavaScript, file access, mixed content, unverified origin을 통해 attack surface를 넓힐 수 있습니다.
- Lifecycle/cache behavior는 rotation, process death, app resume, offline mode, version upgrade 전까지 bug를 숨길 수 있습니다.
- File chooser, camera, storage, download flow는 runtime permission과 device/API-level behavior에 의존합니다.

## 검증

- Native-to-web/web-to-native call, callback success/failure, malformed payload, denied permission, unsupported route behavior를 실행합니다.
- Navigation, deep link, back button, refresh, login/session, offline/error page, file upload, download, camera/storage path를 검증합니다.
- Bridge, permission, file, signing behavior가 바뀌면 release-like setting의 emulator 또는 device에서 테스트합니다.
- Console/native log, network security failure, mixed-content block, WebView version difference를 확인합니다.
- 필요에 따라 `mobile/webview-bridge`, `mobile/device-permission-qa`, `frontend/browser-dom-change`, `security/security-review`와 함께 사용합니다.
