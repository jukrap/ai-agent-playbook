# 템플릿

템플릿은 프로젝트에 복사하는 파일이며 설치형 스킬이 아닙니다. 일반적인 대상 프로젝트 폴더 이름은 `.ai-agent-playbook/`입니다.

새 저장소를 시작하거나, 프로젝트 에이전트 문서를 정리하거나, 여러 컴퓨터에서 에이전트 동작을 휴대 가능하게 만들 때 사용합니다.

## 포함 내용

- `agents/`: 루트 지침 템플릿과 스택 프로필.
- `agents/global/`: 얇은 프로젝트 루트 `AGENTS.md` 부트스트랩. 폴더 이름이 `global`이지만 대상 저장소에 복사되는 파일이며, Codex home 전역 지침이 아닙니다.
- `codex-home/`: Codex 사용자를 위한 선택적 개인 `~/.codex/AGENTS.md` 시작점.
- `project-playbook/`: 대상 프로젝트에 `.ai-agent-playbook/`로 복사하는 표준 프로젝트 메모리 묶음.
- Runtime CLI 파일은 저장소 루트의 `bin/`, `src/`, `test/` 아래에 있습니다.

## 에이전트가 템플릿을 발견하는 방식

이 저장소가 스킬로 설치되어 있다고 해서 에이전트가 템플릿을 자동으로 불러오지 않습니다. 템플릿은 아래 중 하나일 때만 프로젝트에 영향을 줍니다.

- 대상 프로젝트에 복사된 경우.
- 프로젝트 `AGENTS.md`가 링크하거나 이름을 언급한 경우.
- 사용자가 명시적으로 에이전트에게 읽거나 적용하라고 요청한 경우.
- 프로젝트 bootstrap 또는 문서 설정 중 스킬 참고 자료가 에이전트를 그쪽으로 안내한 경우.

여러 프로젝트에서 재사용되는 동작은 `skills/`에서 설치합니다. 프로젝트별 상시 지침과 오래 남길 메모리는 `templates/`에서 조정합니다. 가장 반복 가능한 경로는 저장소 루트에서 런타임 CLI를 사용하는 것입니다.

```powershell
node .\bin\aapb.mjs bootstrap <target-repo> --dry-run
node .\bin\aapb.mjs bootstrap <target-repo> --local-only
node .\bin\aapb.mjs guides sync <target-repo> --dry-run
node .\bin\aapb.mjs doctor <target-repo>
```

## 추천 시작점

- 불분명하거나 혼합된 프로젝트: `agents/global/AGENTS.md`를 루트 부트스트랩으로 복사하고, skill/Git 정책은 `project-playbook/` 안에서 `.ai-agent-playbook/policy/SKILLS.md`, `.ai-agent-playbook/policy/GIT.md`로 유지합니다.
- 개인 Codex 기본값: `codex-home/AGENTS.md`를 Codex home 디렉터리에 맞게 조정하고, 저장소 규칙은 프로젝트 `AGENTS.md` 파일에 둡니다.
- 오래 남길 에이전트 메모리가 필요한 프로젝트: `project-playbook/`을 `.ai-agent-playbook/`로 bootstrap하거나 복사합니다.
- React/Vite/FSD 프로젝트: `agents/global/AGENTS.md`와 `agents/profiles/react-vite-fsd/AGENTS.md`로 시작합니다.
- Expo/React Native 프로젝트: `agents/global/AGENTS.md`와 `agents/profiles/react-native-expo/AGENTS.md`로 시작합니다.
- 레거시 프로젝트: `agents/global/AGENTS.md`, 가장 가까운 `agents/profiles/legacy-*`, `project-playbook/knowledge/references/guides/legacy-mode.md`로 시작합니다.
- Git 또는 로컬 전용 문서가 중요한 프로젝트: `project-playbook/policy/GIT.md`와 `project-playbook/knowledge/references/guides/commit-push-worklog.md`를 조정합니다.
- 근거 기반 아키텍처 정리가 필요한 프로젝트: `project-playbook/knowledge/references/guides/structural-review.md`를 조정합니다.
- 이미 다른 에이전트 문서 체계나 하네스가 있는 프로젝트: `project-playbook/knowledge/references/guides/harness-migration.md`로 시작합니다.

## 적용 규칙

템플릿은 항상 대상 저장소에 맞게 줄입니다. 프로젝트가 실제로 쓰지 않는 스택, 명령, 작업 흐름, 정책 규칙은 제거합니다.

내용이 `.ai-agent-playbook/memory/maps/`, `.ai-agent-playbook/workflows/runbooks/`, `.ai-agent-playbook/memory/decisions/`, `.ai-agent-playbook/workflows/plans/`, `.ai-agent-playbook/workflows/worklogs/`에 속한다면 프로젝트 루트에 느슨한 markdown 파일을 새로 만들지 않습니다.
