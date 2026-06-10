# AGENTS.md
# Legacy Android WebView Hybrid Profile

Android native shell, WebView, local web assets, JavaScript bridge가 섞인 레거시 hybrid app에 사용합니다.

## 시작 규칙

- native Activity/Fragment, WebView settings, asset loading path, bridge interface를 먼저 확인합니다.
- remote web loading, local asset loading, mixed loading을 구분합니다.
- Android SDK, minSdk, targetSdk, Gradle, signing, flavors, deployment flow를 확인합니다.
- WebView JavaScript 변경도 boundary를 넘으면 native bridge와 permission 변경으로 봅니다.

## 변경 전략

- bridge method name, payload shape, callback protocol을 추측하지 않습니다.
- Android permissions, file chooser, downloads, camera, scanner, printer, back button, lifecycle effect를 확인합니다.
- local asset 변경 시 cache, versioning, packaging location을 확인합니다.
- native rewrite보다 현재 구조 안에서 작고 검증 가능한 변경을 선호합니다.

## UI와 styling

- WebView 내부 화면은 기존 web styling method를 따릅니다.
- native UI와 web UI가 함께 보이면 status bar, safe area, keyboard, density, viewport metadata를 확인합니다.
- inline style preference가 project-local rule이면 존중합니다.

## 검증

- 가능하면 emulator 또는 device에서 app launch, bridge call, back navigation, file/download flow를 확인합니다.
- Android logs와 WebView console output을 함께 봅니다.
- Gradle build 또는 프로젝트 packaging command를 fresh output으로 실행합니다.

## Git과 worklog

- native config, bridge contract, deployment output path, permission 변경을 worklog와 PR notes에 기록합니다.
- local-only docs와 build output은 staged changes에 넣지 않습니다.
