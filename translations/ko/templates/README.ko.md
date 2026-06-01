# Templates

Templates는 설치형 skill이 아니라 프로젝트에 복사해 쓰는 파일입니다.

새 저장소를 시작하거나, project AI docs를 정리하거나, 여러 컴퓨터에서 agent behavior를 휴대 가능하게 만들 때 사용합니다.

## 구성

- `agents/`: project root와 stack profile용 `AGENTS.md` 예시.
- `local-ai/`: onboarding, docs structure, commits, API boundary, style quality, pragmatic FSD, SI/legacy mode용 선택적 project-local helper docs.

## Agent가 발견하는 방식

이 저장소가 skill로 설치되어도 agent가 templates를 자동으로 load하지는 않습니다. Template가 프로젝트에 영향을 주려면 아래 중 하나가 필요합니다.

- target project에 복사되어 있음.
- project `AGENTS.md`가 해당 template를 link하거나 이름으로 언급함.
- 사용자가 agent에게 직접 읽거나 적용하라고 요청함.
- documentation setup 작업 중 skill reference가 agent에게 해당 template를 보게 함.

여러 프로젝트에서 반복되는 behavior는 `skills/`에서 설치합니다. 프로젝트별 standing instruction은 `templates/`에서 가져와 조정합니다.

## 추천 시작점

- 불명확하거나 혼합된 프로젝트: `agents/global/AGENTS.md`를 복사합니다.
- React/Vite/FSD 프로젝트: `agents/global/AGENTS.md`와 `agents/profiles/react-vite-fsd/AGENTS.md`를 함께 봅니다.
- Expo/React Native 프로젝트: `agents/global/AGENTS.md`와 `agents/profiles/react-native-expo/AGENTS.md`를 함께 봅니다.
- Legacy 프로젝트: `agents/global/AGENTS.md`와 가장 가까운 `agents/profiles/legacy-*` 파일을 함께 봅니다.
- git 또는 local-only docs가 중요한 프로젝트: `local-ai/commit-push-worklog.md`와 `local-ai/docs-system.md`를 조정합니다.

## 적용 규칙

Template는 항상 target repository에 맞게 줄입니다. 프로젝트가 실제로 쓰지 않는 stack, command, workflow, policy rule은 제거합니다.
