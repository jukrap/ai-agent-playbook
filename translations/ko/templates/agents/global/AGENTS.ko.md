# AGENTS.md
# AI Playbook 부트스트랩

이 파일은 에이전트를 위한 얇은 프로젝트 루트 진입점입니다. 오래 유지할 프로젝트 기억, 정책, 계획, worklog는 `.ai-agent-playbook/`에 둡니다.

## 먼저 볼 것

- 기본 답변 언어는 사용자의 언어에 맞춥니다.
- 도구를 정하기 전에 저장소 구조, README, 설정, scripts, lockfile, 현재 git 상태를 확인합니다.
- 하위 디렉터리 파일을 수정하기 전에 더 가까운 `AGENTS.md`가 있는지 확인합니다.
- `.ai-agent-playbook/`이 있으면 계획 전에 아래 순서로 읽습니다.
  1. `.ai-agent-playbook/START_HERE.md`
  2. `.ai-agent-playbook/CURRENT.md`
  3. `.ai-agent-playbook/questions.md`
  4. 관련 maps, runbooks, plans, decisions, guides
  5. 선택적 skill을 고르기 전 `.ai-agent-playbook/policy/SKILLS.md`
  6. staging, commit, push, PR 문구 작성 전 `.ai-agent-playbook/policy/GIT.md`
- `.ai-agent-playbook/`이 없으면 실제 코드와 README를 먼저 기준으로 작업합니다. playbook 생성이나 설치는 사용자 또는 프로젝트가 요구한 뒤에만 진행합니다.

## 작업 규칙

- 최신 사용자 지시, 실제 code/config/output, project docs 순서로 우선합니다.
- framework, architecture, package manager, test, lint, deployment, branch workflow를 추측하지 않습니다.
- 새 구조를 도입하기 전에 기존 project pattern을 맞춥니다.
- 변경 범위는 요청에 맞게 좁게 유지합니다.
- 관련 없는 사용자 변경을 되돌리지 않습니다.
- 검색에는 `rg`를 우선합니다.
- API contract, data fields, credentials, external workflow를 추측하지 않습니다.
- 완료 주장은 fresh command output으로 검증하거나, 검증하지 못한 부분을 명확히 말합니다.

## Git과 로컬 파일

- `.gitignore`, `.ai-agent-playbook/policy/GIT.md`, project docs의 local-only 정책을 지킵니다.
- 루트 정책 파일은 최소로 유지합니다. 루트 `SKILLS.md`나 `GIT.md`를 추가하지 말고 `.ai-agent-playbook/policy/SKILLS.md`, `.ai-agent-playbook/policy/GIT.md`를 사용합니다.
- `git add .` 대신 관련된 경로만 명시적으로 stage합니다.
- repository가 명시적으로 요구하지 않는 한 agent, model, generated-by, co-author, signature footer를 추가하지 않습니다.

## Playbook 관리

- `.ai-agent-playbook/`은 프로젝트 기억이며, 현재 코드를 무시하기 위한 근거가 아닙니다.
- 오래 유지할 사실은 `.ai-agent-playbook/CURRENT.md`, maps, runbooks, decisions로 승격합니다.
- 상세한 이력은 `.ai-agent-playbook/workflows/worklogs/`에 둡니다.
- 오래된 plan과 handoff는 active guidance에 남겨두지 말고 archive로 옮깁니다.
