# AGENTS.md 템플릿 가이드

`templates/agents`에는 프로젝트 루트에 복사할 수 있는 `AGENTS.md` 예시가 있습니다. 보통 프로젝트는 에이전트를 `ai-playbook/`으로 안내하는 얇은 루트 `AGENTS.md` 하나를 유지하고, 스택이 확인된 경우에만 가장 가까운 프로필을 병합합니다.

여기서 `global/`은 이 저장소 안에서 "스택 중립 프로젝트 루트 기본 템플릿"이라는 뜻입니다. Codex의 개인 전역 파일인 `~/.codex/AGENTS.md`가 아닙니다. Codex home 수준 기본값은 `../codex-home/`을 사용합니다.

## 프로필 선택

- `global/AGENTS.md`: 알 수 없는 스택, 문서 중심 프로젝트, 일반 저장소에 쓰는 얇은 프로젝트 루트 부트스트랩.
- `profiles/react-vite-fsd/AGENTS.md`: React, Vite, TypeScript, pnpm, pragmatic FSD 또는 유사한 layered frontend.
- `profiles/react-native-expo/AGENTS.md`: Expo Router, React Native, native/device verification.
- `profiles/legacy-jquery-web/AGENTS.md`: jQuery, plugin, direct DOM manipulation, script-order dependent pages.
- `profiles/legacy-server-rendered-web/AGENTS.md`: JSP, Thymeleaf, Razor, PHP template 또는 server-rendered form flow.
- `profiles/legacy-android-webview-hybrid/AGENTS.md`: Android native shell, WebView, local assets, JavaScript bridge.

## 적용 방법

1. 프로젝트의 실제 config, README, build files, existing docs를 먼저 확인합니다.
2. `global/AGENTS.md`를 짧은 부트스트랩으로 사용하고, skill/Git 정책은 `ai-playbook/SKILLS.md`와 `ai-playbook/GIT.md` 아래에 둡니다.
3. 가장 가까운 스택 프로필을 고르고 적용되지 않는 규칙을 제거합니다.
4. 오래 남길 에이전트 메모리가 필요하면 `templates/project-playbook/`을 `ai-playbook/`로 복사합니다.
5. 자세한 commit, push, PR, worklog 지침이 필요하면 `templates/project-playbook/GIT.md`와 `templates/project-playbook/guides/commit-push-worklog.md`를 조정합니다.
6. 프로젝트 고유 제품 규칙은 별도 문서에 둡니다. `AGENTS.md`는 최소 진입점과 로컬 override 규칙에만 사용합니다.
