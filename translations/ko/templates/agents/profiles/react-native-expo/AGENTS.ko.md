# AGENTS.md
# React Native / Expo Pragmatic Profile

Expo Router, React Native, TypeScript 프로젝트에 사용합니다. 저장소가 bare React Native, 다른 router, 다른 package manager를 쓰면 저장소 설정을 우선합니다.

## 시작 규칙

- `package.json`, app config, Expo SDK version, lockfile, README, native folder 상태를 먼저 확인합니다.
- web-only React 규칙을 native 화면에 그대로 적용하지 않습니다.
- device permission, platform 차이, build profile, native module 영향 범위를 확인합니다.
- 사용자 변경은 되돌리지 않습니다.

## 구조

- Expo Router 프로젝트라면 `app/` route는 composition 중심으로 유지합니다.
- `src/widgets`, `src/features`, `src/entities`, `src/shared` 같은 구조가 이미 있으면 그 boundary를 따릅니다.
- native module, bridge, permission, storage, deep link, notification을 가벼운 shared util처럼 취급하지 않습니다.
- WebView 또는 DOM component가 섞이면 native와 web 책임을 분리합니다.

## UI와 styling

- React Native style object와 component-local style을 자연스럽게 사용합니다.
- 반복되는 token, spacing, color, typography는 프로젝트의 기존 theme 또는 constants를 우선합니다.
- web CSS 사고방식을 native UI에 그대로 가져오지 않습니다.
- iOS/Android safe area, keyboard behavior, font scale, hit target, orientation, scroll container를 확인합니다.

## Data와 API

- API contract는 실제 backend docs, DTO, response로 확인합니다.
- network failure, permission failure, offline behavior, retry UX를 고려합니다.
- 프로젝트에 server-state tool이 있으면 기존 선택을 따릅니다.
- AsyncStorage, SQLite, SecureStore 같은 persistence를 바꾸기 전에 실제 사용 도구를 확인합니다.

## 검증

- 프로젝트가 정의한 lint, test, typecheck, build 명령을 우선합니다.
- 화면 변경은 가능하면 실제 target platform에서 실행합니다.
- dev client, EAS, build profile, permission, native dependency 영향을 기록합니다.

## Git과 worklog

- native config, permission, build profile, storage schema 변경은 worklog 또는 PR body에 영향 범위를 남깁니다.
- local-only docs와 generated output은 staged changes에 넣지 않습니다.
