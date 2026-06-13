# Project Playbook 템플릿

이 폴더를 대상 저장소에 `.ai-playbook/`로 복사합니다.

이 폴더는 에이전트와 유지보수자를 위한 프로젝트 메모리입니다. 현재 사실, 지도, 반복 절차, 계획, 결정 기록, 작업 기록을 분리해 미래 세션이 전체 저장소를 다시 읽지 않아도 이어서 작업할 수 있게 합니다.

이 저장소에서 권장하는 설정 방식:

```powershell
node .\bin\ai-playbook.mjs bootstrap <target-repo> --dry-run
node .\bin\ai-playbook.mjs bootstrap <target-repo> --local-only
node .\bin\ai-playbook.mjs guides sync <target-repo> --dry-run
node .\bin\ai-playbook.mjs guides sync <target-repo> --check --diff --json
node .\bin\ai-playbook.mjs migrate path <target-repo> --json
node .\bin\ai-playbook.mjs doctor <target-repo>
```

Legacy `ai-playbook/` 프로젝트에서는 폴더 이동, 참조 갱신, `.gitignore` 변경 계획을 검토하기 전까지 `migrate path`를 preview mode로 유지합니다.

## 읽는 순서

1. `START_HERE.md`: 다음 에이전트를 위한 가장 짧은 재개 안내.
2. `CURRENT.md`: 현재 기준선, 활성 리스크, 최근 결정.
3. `questions.md`: 구현에 영향을 줄 수 있는 미해결 질문.
4. `context/`: path-scoped 사실, 읽기 힌트, 피해야 할 가정.
5. `maps/doc-map.md`: 공개 문서와 project memory 위치를 찾는 지도.
6. `maps/`: 저장소, 런타임, route, API, data, risk map.
7. `runbooks/`: 명령과 운영 절차.
8. `contracts/`: active 또는 pending business rule과 invariant.
9. `plans/`: 진행 중인 구현 계획만 둡니다.
10. `runs/`: 한 작업의 진행 중 evidence ledger.
11. `worklogs/`: 상세 이력과 월간 summary.
12. `guides/`: 재사용 지원 가이드. 이미 에이전트 문서나 다른 하네스가 있는 프로젝트는 `harness-migration.md`, 선택적 hook layer를 판단할 때는 `runtime-roadmap.md`를 봅니다.

## 신뢰 우선순위

문서가 충돌하면 아래 순서를 우선합니다.

1. 최신 사용자 지시.
2. 실제 code, configuration, command output.
3. 루트 `AGENTS.md`, `.ai-playbook/SKILLS.md`, `.ai-playbook/GIT.md`.
4. `.ai-playbook/CURRENT.md`, context, maps, runbooks, contracts, decisions.
5. Runs, worklogs, archived notes.

Runs는 진행 중 evidence입니다. Worklogs는 history입니다. 계속 현재인 사실은 `CURRENT.md`, `context/`, `maps/`, `runbooks/`, `contracts/`, `decisions/`로 승격합니다.

## 유지보수 규칙

상위 파일은 안정적으로 유지합니다.

- `START_HERE.md`: 현재 재개 지점만 둡니다.
- `CURRENT.md`: 오래 남길 현재 사실만 둡니다.
- `questions.md`: 아직 결정을 바꿀 수 있는 미해결 질문만 둡니다.

더 큰 내용은 맞는 하위 폴더에 둡니다. Path-scoped 읽기 힌트는 `context/`, 구조는 `maps/`, 명령은 `runbooks/`, business rule과 invariant는 `contracts/`, 오래 남길 선택은 `decisions/`, 실행 계획은 `plans/`, 작업 중 증거는 `runs/`, 상세 이력은 `worklogs/`를 사용합니다.

핵심 파일에 템플릿 문구가 남아 있으면 `doctor`가 warning을 냅니다. 첫 저장소 점검 뒤 `START_HERE.md`, `CURRENT.md`, `questions.md`의 placeholder bullet을 프로젝트별 현재 사실로 바꾸거나, active task나 open question이 없다고 명확히 적습니다.

이 문서 하네스가 hook 없이 동작하기 전에는 runtime hook을 추가하지 않습니다. 프로젝트가 나중에 hook을 선택한다면 decision을 문서화하고 hook layer를 선택 사항으로 유지합니다.

## 커밋 정책

프로젝트별로 `.ai-playbook/`을 commit할지 local-only로 둘지 결정합니다. local-only라면 project-specific note를 쓰기 전에 `.gitignore`에 추가합니다.

credential, private URL, customer data, personal path, 민감값이 있는 raw log, machine-specific secret을 여기에 저장하지 않습니다.
