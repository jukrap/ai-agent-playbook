# AGENTS.md 템플릿 가이드

`templates/agents`는 프로젝트 루트에 복사할 `AGENTS.md` 예시를 담습니다. 한 프로젝트에는 보통 루트 `AGENTS.md` 하나를 두고, 가장 가까운 프로필 내용을 합쳐 사용합니다.

## 프로필 선택

- `global/AGENTS.md`: 기술 스택이 불명확한 저장소, 문서 체계부터 잡는 프로젝트, 일반 저장소용 기본 작업 합의.
- `global/SKILLS.md`: 선택적 프로젝트 수준 스킬 선택 정책.
- `global/GIT.md`: 선택적 프로젝트 수준 커밋/PR 정책.
- `profiles/react-vite-fsd/AGENTS.md`: React, Vite, TypeScript, pnpm, pragmatic FSD 또는 유사 계층형 프론트엔드.
- `profiles/react-native-expo/AGENTS.md`: Expo Router, React Native, native/device 검증.
- `profiles/legacy-jquery-web/AGENTS.md`: jQuery, plugin, 직접 DOM 조작, script 순서에 의존하는 페이지.
- `profiles/legacy-server-rendered-web/AGENTS.md`: JSP, Thymeleaf, Razor, PHP template, 서버 렌더링 form 흐름.
- `profiles/legacy-android-webview-hybrid/AGENTS.md`: Android native shell, WebView, local assets, JavaScript bridge.

## 적용 방식

1. 먼저 프로젝트의 실제 설정, README, 빌드 파일, 기존 문서를 확인합니다.
2. `global/AGENTS.md`로 시작하고, 상시 규칙이 도움이 될 때만 `global/SKILLS.md`와 `global/GIT.md`를 추가합니다.
3. 가장 가까운 기술 스택 프로필을 고르고 적용되지 않는 규칙은 제거합니다.
4. `PROJECT_SPEC.md`, `PLANS.md`, `FSD.md`, `docs/plans/**`, `docs/worklog/**` 같은 local-only 문서 체계가 필요하면 `templates/local-ai/docs-system.md`를 조정합니다.
5. 자세한 커밋, 푸시, PR, 작업 기록 기준이 필요하면 `global/GIT.md`에 더해 `templates/local-ai/commit-push-worklog.md`를 조정합니다.
6. 프로젝트 고유 제품 규칙은 별도 문서에 두고, `AGENTS.md`는 에이전트가 어떻게 일할지에 집중합니다.
