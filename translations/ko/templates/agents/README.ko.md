# AGENTS.md 템플릿 가이드

`templates/agents`에는 프로젝트 루트에 복사할 수 있는 `AGENTS.md` 예시가 있습니다. 보통 프로젝트는 루트 `AGENTS.md` 하나를 유지하고, 가장 가까운 profile을 병합합니다.

## Profile 선택

- `global/AGENTS.md`: unknown stack, documentation-first project, general repository의 기본 작업 합의.
- `global/SKILLS.md`: 선택적 프로젝트 수준 skill selection policy.
- `global/GIT.md`: 선택적 프로젝트 수준 commit/PR policy.
- `profiles/react-vite-fsd/AGENTS.md`: React, Vite, TypeScript, pnpm, pragmatic FSD 또는 유사한 layered frontend.
- `profiles/react-native-expo/AGENTS.md`: Expo Router, React Native, native/device verification.
- `profiles/legacy-jquery-web/AGENTS.md`: jQuery, plugin, direct DOM manipulation, script-order dependent pages.
- `profiles/legacy-server-rendered-web/AGENTS.md`: JSP, Thymeleaf, Razor, PHP template 또는 server-rendered form flow.
- `profiles/legacy-android-webview-hybrid/AGENTS.md`: Android native shell, WebView, local assets, JavaScript bridge.

## 적용 방법

1. 프로젝트의 실제 config, README, build files, existing docs를 먼저 확인합니다.
2. `global/AGENTS.md`로 시작하고, 도움이 될 때만 `global/SKILLS.md`와 `global/GIT.md`를 추가합니다.
3. 가장 가까운 stack profile을 고르고 적용되지 않는 rule을 제거합니다.
4. durable agent memory가 필요하면 `templates/project-playbook/`을 `ai-playbook/`로 복사합니다.
5. 자세한 commit, push, PR, worklog guidance가 필요하면 `global/GIT.md`에 더해 `templates/project-playbook/guides/commit-push-worklog.md`를 조정합니다.
6. 프로젝트 고유 product rule은 별도 문서에 둡니다. `AGENTS.md`는 agent가 어떻게 일할지에 집중합니다.
