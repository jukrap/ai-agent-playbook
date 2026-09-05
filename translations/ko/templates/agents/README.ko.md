# 프로젝트 AGENTS.md 템플릿

프로젝트 루트 지침에 맞게 조정해 쓰는 예시입니다. 기존 AGENTS.md를 먼저 읽고 필요한 규칙만 합치세요. AAPB 1.0 bootstrap은 이 파일을 자동으로 보존합니다.

여기서 `global/`은 특정 기술에 묶이지 않은 프로젝트 템플릿을 뜻합니다. 개인 전역 지침 파일이 아닙니다. 개인 설정 예시는 [codex-home](../codex-home/README.ko.md)에 있습니다.

## 맞는 프로필 고르기

| 템플릿 | 해당 프로젝트 |
| --- | --- |
| [global](global/AGENTS.ko.md) | 일반 저장소와 문서 작업 |
| [react-vite-fsd](profiles/react-vite-fsd/AGENTS.ko.md) | 기존 계층 구조를 사용하는 React/Vite/TypeScript |
| [react-native-expo](profiles/react-native-expo/AGENTS.ko.md) | Expo/React Native와 기기 검증 |
| [legacy-jquery-web](profiles/legacy-jquery-web/AGENTS.ko.md) | jQuery, 직접 DOM 조작, 스크립트 순서 |
| [legacy-server-rendered-web](profiles/legacy-server-rendered-web/AGENTS.ko.md) | 서버 템플릿, 폼, 서버 계약 |
| [legacy-android-webview-hybrid](profiles/legacy-android-webview-hybrid/AGENTS.ko.md) | 네이티브 셸, WebView, 로컬 자산, 브리지 |

## 실제 저장소에 적용하기

1. 설정, 빌드 명령, 기존 지침, 커밋하지 않은 변경을 확인합니다.
2. 루트 정책에는 실제 적용할 규칙과 현재 상태의 시작 위치를 둡니다.
3. 기술 환경이 맞을 때만 프로필을 고르고 해당하지 않는 전제·명령을 뺍니다.
4. 기록이 필요하면 bootstrap으로 만든 뒤 CURRENT.md에 현재 사실을 적습니다.
5. 상세 제품·Git·검증 규칙은 프로젝트의 기존 문서에 두고 필요할 때 연결합니다.

과거 템플릿의 `policy/SKILLS.md`, `policy/GIT.md`, 생성형 안내 폴더는 최소 템플릿에 없습니다. 존재하지 않는 파일을 복사하거나 필수로 요구하지 마세요. 기존 프로젝트에 남은 문서는 과거 기록이나 해당 프로젝트 자료로 계속 사용할 수 있습니다. [기록 구조](../../docs/structured-playbook-layout.ko.md)를 참고하세요.
