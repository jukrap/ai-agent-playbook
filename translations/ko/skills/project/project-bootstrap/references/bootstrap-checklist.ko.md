# Project Bootstrap Checklist

대상 프로젝트에 root agent files 또는 `ai-playbook/` folder를 만들 때 사용합니다.

## Discovery

- branch, remotes, dirty files, staged files, local-only policy를 확인합니다.
- root docs, README, package/build files, lockfiles, scripts, existing agent instructions를 확인합니다.
- existing project memory, plans, worklogs, ADRs, runbooks, onboarding notes를 찾습니다.
- package manager, runtime, verification commands, project shape를 습관이 아니라 파일에서 확인합니다.

## Template selection

- 얇은 루트 부트스트랩: `templates/agents/global/AGENTS.md`.
- Skill policy: `templates/project-playbook/SKILLS.md`, copied as `ai-playbook/SKILLS.md`.
- Git policy: `templates/project-playbook/GIT.md`, copied as `ai-playbook/GIT.md`.
- Project memory: `templates/project-playbook/`을 `ai-playbook/`로 복사합니다.
- Stack profile: stack이 확인된 경우에만 가장 가까운 `templates/agents/profiles/**/AGENTS.md`를 추가하고, root 진입점은 짧게 유지합니다.

## Minimum useful `ai-playbook/`

대부분의 프로젝트는 아래로 시작합니다.

- `README.md`
- `START_HERE.md`
- `CURRENT.md`
- `SKILLS.md`
- `GIT.md`
- `questions.md`
- `maps/README.md`
- `runbooks/README.md`
- `plans/README.md`
- `worklogs/README.md`

상세 maps, runbooks, decisions, guides는 채울 project evidence가 있을 때만 추가합니다.

## Content rules

- `START_HERE.md`: 다음 agent가 먼저 읽고 할 일.
- `CURRENT.md`: current truth, active risks, decisions that still matter.
- `maps/`: scan range와 freshness가 있는 structure/runtime facts.
- `runbooks/`: verified commands and cleanup steps.
- `plans/`: active execution plans only.
- `worklogs/`: detailed history plus monthly summaries.
- `archive/`: stale plans, prompts, handoffs.

## Hygiene

- personal absolute paths, private names, credentials, internal URLs, raw tokens, customer data, machine-local assumptions를 commit하지 않습니다.
- reusable templates에서는 relative paths를 사용합니다.
- `ai-playbook/`이 local-only라면 private notes를 쓰기 전에 `.gitignore`에 추가합니다.
- worklog를 commit한다면 scrubbed 상태이고 future maintainers에게 유용해야 합니다.
