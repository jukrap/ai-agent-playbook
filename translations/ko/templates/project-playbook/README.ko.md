# Project Playbook 템플릿

이 폴더를 대상 저장소에 `.ai-agent-playbook/`로 복사합니다.

이 폴더는 에이전트와 유지보수자를 위한 프로젝트 기억 공간입니다. 정책, 오래 유지할 지식, 작업 흐름, 지식 출처, 실행 중 생성물, 통합 설정, 보관 자료를 분리해 미래 세션이 전체 저장소를 다시 읽지 않아도 이어서 작업할 수 있게 합니다.

이 저장소에서 권장하는 설정 방식:

```powershell
node .\bin\aapb.mjs bootstrap <target-repo> --dry-run
node .\bin\aapb.mjs bootstrap <target-repo> --local-only
node .\bin\aapb.mjs guides sync <target-repo> --dry-run
node .\bin\aapb.mjs guides sync <target-repo> --check --diff --json
node .\bin\aapb.mjs migrate path <target-repo> --json
node .\bin\aapb.mjs doctor <target-repo>
```

Legacy `ai-playbook/` 프로젝트에서는 폴더 이동, 참조 갱신, `.gitignore` 변경 계획을 검토하기 전까지 `migrate path`를 preview mode로 유지합니다.

## 읽는 순서

1. `START_HERE.md`: 다음 에이전트를 위한 가장 짧은 재개 안내.
2. `CURRENT.md`: 현재 기준선, 활성 리스크, 최근 결정.
3. `questions.md`: 구현에 영향을 줄 수 있는 미해결 질문.
4. `policy/SKILLS.md`: 프로젝트별 스킬 선택 정책.
5. `policy/GIT.md`: Git, PR, push, 작업 기록 정책.
6. `memory/context/`: 경로별 사실, 읽기 힌트, 피해야 할 가정.
7. `memory/maps/doc-map.md`: 공개 문서와 프로젝트 기억 위치를 찾는 지도.
8. `memory/maps/`: 저장소, 런타임, 경로, API, 데이터, 위험 지도.
9. `workflows/runbooks/`: 명령과 운영 절차.
10. `memory/contracts/`: 활성 또는 검토 중인 업무 규칙과 불변 조건.
11. `workflows/plans/`: 진행 중인 구현 계획만 둡니다.
12. `workflows/runs/`: 한 작업의 진행 중 근거 장부.
13. `workflows/worklogs/`: 상세 이력과 월간 요약.
14. `integrations/`: 검토된 forge, MCP, adapter, hook, scheduler 설정. 프로젝트가 자동화를 선택한 경우에만 `forge.example.json`에서 시작합니다.
15. `knowledge/references/guides/`: 재사용 지원 가이드. 이미 에이전트 문서나 다른 하네스가 있는 프로젝트는 `harness-migration.md`, 선택적 hook 계층을 판단할 때는 `runtime-roadmap.md`를 봅니다.

관련 문맥이 불분명할 때는 전체 플레이북을 읽지 않습니다. 먼저 `operator context --path <file> --json`을 사용하고, 필요하면 `operator search` 또는 `index search`로 적용되는 map, runbook, contract, guide, worklog만 찾습니다.

## 신뢰 우선순위

문서가 충돌하면 아래 순서를 우선합니다.

1. 최신 사용자 지시.
2. 실제 code, configuration, command output.
3. 루트 `AGENTS.md`, `.ai-agent-playbook/policy/SKILLS.md`, `.ai-agent-playbook/policy/GIT.md`.
4. `.ai-agent-playbook/CURRENT.md`, 기억 문맥, 지도, 반복 절차, 계약, 결정.
5. 작업 실행 기록, 작업 이력, 보관 노트.

작업 실행 기록은 진행 중 근거입니다. 작업 이력은 지나간 판단과 결과입니다. 계속 현재인 사실은 `CURRENT.md`, `memory/context/`, `memory/maps/`, `workflows/runbooks/`, `memory/contracts/`, `memory/decisions/`로 승격합니다.

긴 작업에서는 실행 중 `workflows/runs/`를 사용하고, milestone 완료, blocker 해결, 방향 변경, 다른 에이전트 handoff 시점에는 `workflows/worklogs/`를 씁니다. 생성된 runtime report는 명시적으로 검토하고 간결한 사실로 승격하기 전까지 `runtime/`에 둡니다.

## 유지보수 규칙

상위 파일은 안정적으로 유지합니다.

- `START_HERE.md`: 현재 재개 지점만 둡니다.
- `CURRENT.md`: 오래 남길 현재 사실만 둡니다.
- `questions.md`: 아직 결정을 바꿀 수 있는 미해결 질문만 둡니다.

더 큰 내용은 맞는 하위 폴더에 둡니다. 경로별 읽기 힌트는 `memory/context/`, 구조는 `memory/maps/`, 명령은 `workflows/runbooks/`, 업무 규칙과 불변 조건은 `memory/contracts/`, 오래 남길 선택은 `memory/decisions/`, 실행 계획은 `workflows/plans/`, 작업 중 근거는 `workflows/runs/`, 상세 이력은 `workflows/worklogs/`를 사용합니다.

`START_HERE.md`나 `CURRENT.md`를 긴 보고서로 만들지 않습니다. scan range, freshness, confidence, supporting evidence가 필요한 사실은 map, contract, decision, runbook, worklog, runtime report에 두고 짧은 파일에서는 링크만 둡니다.

핵심 파일에 템플릿 문구가 남아 있으면 `doctor`가 warning을 냅니다. 첫 저장소 점검 뒤 `START_HERE.md`, `CURRENT.md`, `questions.md`의 placeholder bullet을 프로젝트별 현재 사실로 바꾸거나, active task나 open question이 없다고 명확히 적습니다.

이 문서 하네스가 hook 없이 동작하기 전에는 runtime hook을 추가하지 않습니다. 프로젝트가 나중에 hook을 선택한다면 decision을 문서화하고 hook layer를 선택 사항으로 유지합니다.

## 커밋 정책

프로젝트별로 `.ai-agent-playbook/`을 commit할지 local-only로 둘지 결정합니다. local-only라면 project-specific note를 쓰기 전에 `.gitignore`에 추가합니다.

credential, private URL, customer data, personal path, 민감값이 있는 raw log, machine-specific secret을 여기에 저장하지 않습니다.
