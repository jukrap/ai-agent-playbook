# 런타임 하네스 가이드

`templates/project-playbook/`을 대상 프로젝트에 `ai-playbook/`로 복사한 뒤 이 guide를 사용합니다.

런타임 하네스는 root agent files, `ai-playbook/` project memory, installable skills, 이 저장소의 작은 CLI를 합친 것입니다. 모든 프로젝트에 같은 workflow가 필요하다고 단정하지 않으면서도 agent setup을 반복 가능하게 만드는 것이 목적입니다.

## 일반 설정 흐름

이 저장소에서 실행합니다.

```powershell
node .\bin\ai-playbook.mjs bootstrap <target-repo> --dry-run
node .\bin\ai-playbook.mjs bootstrap <target-repo> --local-only --with-skills --with-git
node .\bin\ai-playbook.mjs doctor <target-repo>
```

대상 프로젝트에 이미 agent docs가 있으면 먼저 `--dry-run`을 사용합니다. 충돌을 확인하고 생성 파일이 기존 파일을 대체해야 한다고 판단한 뒤에만 `--force`를 사용합니다.

## 진행 중 프로젝트 흐름

반복 가능한 파일 배치에는 CLI를 사용합니다.

```powershell
node .\bin\ai-playbook.mjs plan new <target-repo> --title "short-plan-title"
node .\bin\ai-playbook.mjs worklog new <target-repo> --title "short-worklog-title"
node .\bin\ai-playbook.mjs worklog summarize <target-repo> --month YYYY-MM
node .\bin\ai-playbook.mjs doctor <target-repo> --strict
```

세션 중 행동에는 skill을 사용합니다.

- `project-bootstrap`: 저장소를 확인한 뒤 무엇을 설치할지 결정합니다.
- `repo-onboarding`: 낯선 저장소를 바꾸기 전에 이해합니다.
- `project-doc-system`: 흩어진 project memory를 정리합니다.
- `commit-worklog-guardrails`: commit, PR 문구, 상세 worklog를 맞춥니다.

## 파일 배치 규칙

- root `AGENTS.md`, `SKILLS.md`, `GIT.md`는 짧게 유지합니다.
- 현재 사실은 `CURRENT.md`에 둡니다.
- 실행 중인 plan은 `plans/`에 둡니다.
- 상세 reasoning과 복구용 history는 `worklogs/YYYY-MM/`에 둡니다.
- 오래 남길 구조 사실은 `maps/`에 둡니다.
- 반복 실행 command와 운영 절차는 `runbooks/`에 둡니다.
- 받아들인 선택은 `decisions/`에 둡니다.
- stale plan, old prompt, superseded note는 `archive/` 아래로 보관합니다.

저장소가 이미 명확한 public docs 관례를 갖고 있지 않다면 프로젝트 루트에 느슨한 markdown 파일을 만들지 않습니다.

## Local-only 정책

프로젝트별 세부사항을 쓰기 전에 `ai-playbook/`을 commit할지 local-only로 둘지 결정합니다.

note에 private context, unfinished analysis, raw log, sensitive URL, customer-specific detail이 들어갈 수 있으면 local-only mode를 사용합니다. 프로젝트가 `ai-playbook/`을 commit한다면 public documentation처럼 scrub합니다.

## 유지보수 주기

- 세션 시작 시 `START_HERE.md`, `CURRENT.md`, 관련 plan 또는 runbook을 읽습니다.
- 큰 작업 중에는 milestone이 끝나거나 blocker가 해결되거나 방향이 바뀔 때 worklog를 씁니다.
- handoff 전에는 `START_HERE.md`를 갱신하고, worklog의 durable facts를 `CURRENT.md`, maps, runbooks, decisions로 승격합니다.
- commit 또는 PR 전에는 `doctor`와 project-specific verification을 실행합니다.
