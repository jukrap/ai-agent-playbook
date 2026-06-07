# Project Playbook 템플릿

이 폴더를 대상 저장소에 `ai-playbook/`로 복사합니다.

이 폴더는 에이전트와 유지보수자를 위한 project memory입니다. current truth, map, runbook, plan, decision, worklog를 분리해 미래 세션이 전체 저장소를 다시 읽지 않아도 이어서 작업할 수 있게 합니다.

## 읽는 순서

1. `START_HERE.md`: 다음 agent를 위한 가장 짧은 resume guide.
2. `CURRENT.md`: current baseline, active risks, recent decisions.
3. `questions.md`: 구현에 영향을 줄 수 있는 unresolved questions.
4. `maps/`: repository, runtime, route, API, data, risk maps.
5. `runbooks/`: commands와 operational procedures.
6. `plans/`: active implementation plans only.
7. `worklogs/`: detailed history와 monthly summaries.

## Source of truth

docs가 충돌하면 아래 순서를 우선합니다.

1. 최신 사용자 지시.
2. 실제 code, configuration, command output.
3. `AGENTS.md`, `SKILLS.md`, `GIT.md`.
4. `ai-playbook/CURRENT.md`, maps, runbooks, decisions.
5. Worklogs와 archived notes.

Worklogs는 history입니다. 계속 현재인 사실은 `CURRENT.md`, `maps/`, `runbooks/`, `decisions/`로 승격합니다.

## Commit policy

프로젝트별로 `ai-playbook/`을 commit할지 local-only로 둘지 결정합니다. local-only라면 project-specific note를 쓰기 전에 `.gitignore`에 추가합니다.

credential, private URL, customer data, personal path, 민감값이 있는 raw log, machine-specific secret을 여기에 저장하지 않습니다.
