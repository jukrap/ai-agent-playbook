# Templates

Templates는 설치형 스킬이 아니라 프로젝트에 복사해 쓰는 파일입니다.

새 저장소를 시작하거나, 프로젝트 AI 문서를 정리하거나, 여러 컴퓨터에서 에이전트 동작을 휴대 가능하게 만들 때 사용합니다.

## 구성

- `agents/`: 루트 지침 템플릿과 기술 스택 프로필.
- `agents/global/`: `AGENTS.md`, `SKILLS.md`, `GIT.md` 같은 작은 루트 수준 템플릿.
- `local-ai/`: 온보딩, 문서 구조, 커밋, API 경계, 스타일 품질, 구조 리뷰, pragmatic FSD, SI/레거시 모드용 선택적 프로젝트 로컬 보조 문서.

## 에이전트가 발견하는 방식

이 저장소가 스킬로 설치되어도 에이전트가 templates를 자동으로 불러오지는 않습니다. Template가 프로젝트에 영향을 주려면 아래 중 하나가 필요합니다.

- 대상 프로젝트에 복사되어 있음.
- 프로젝트 `AGENTS.md`가 해당 template를 link하거나 이름으로 언급함.
- 사용자가 에이전트에게 직접 읽거나 적용하라고 요청함.
- 문서 정리 작업 중 스킬 참고 문서가 에이전트에게 해당 template를 보게 함.

여러 프로젝트에서 반복되는 동작은 `skills/`에서 설치합니다. 프로젝트별 상시 지침은 `templates/`에서 가져와 조정합니다.

## 추천 시작점

- 불명확하거나 혼합된 프로젝트: `agents/global/AGENTS.md`를 복사하고, 프로젝트에 상시 규칙이 필요할 때만 `agents/global/SKILLS.md` 또는 `agents/global/GIT.md`를 추가합니다.
- React/Vite/FSD 프로젝트: `agents/global/AGENTS.md`와 `agents/profiles/react-vite-fsd/AGENTS.md`를 함께 봅니다.
- Expo/React Native 프로젝트: `agents/global/AGENTS.md`와 `agents/profiles/react-native-expo/AGENTS.md`를 함께 봅니다.
- 레거시 프로젝트: `agents/global/AGENTS.md`와 가장 가까운 `agents/profiles/legacy-*` 파일을 함께 봅니다.
- git 또는 local-only 문서가 중요한 프로젝트: `agents/global/GIT.md`, `local-ai/commit-push-worklog.md`, `local-ai/docs-system.md`를 조정합니다.
- 근거 기반 아키텍처 정리가 필요한 프로젝트: `local-ai/structural-review.md`를 조정합니다.

## 적용 규칙

Template는 항상 대상 저장소에 맞게 줄입니다. 프로젝트가 실제로 쓰지 않는 기술 스택, 명령, 작업 흐름, 정책 규칙은 제거합니다.
