# Legacy Android WebView Hybrid

local 또는 remote web assets를 WebView로 load하고 JavaScript bridge, permissions, device APIs로 native behavior와 연결하는 Android app을 유지보수할 때 사용합니다.

## Workflow

1. Activity/Fragment, WebView settings, asset source, URL loading mode, bridge interface를 식별합니다.
2. bridge method names, payload shape, callback protocol, permissions, lifecycle hooks를 확인합니다.
3. local asset packaging, cache/version behavior, download/file chooser/device integrations를 확인합니다.
4. web styling은 embedded viewport와 기존 team preference에 맞춥니다.
5. native/WebView boundary를 넘는 behavior는 emulator 또는 device에서 검증합니다.

## Guardrails

- native와 web caller 모두 확인하지 않고 bridge signature를 바꾸지 않습니다.
- packaging/version check 없이 local asset 변경이 반영된다고 가정하지 않습니다.
- WebView console success를 native integration success로 보지 않습니다.
- Gradle/build, permission, deployment implication을 기록합니다.
