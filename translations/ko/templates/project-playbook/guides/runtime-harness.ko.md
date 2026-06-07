# 런타임 하네스 가이드

`templates/project-playbook/`을 대상 프로젝트에 `ai-playbook/`로 복사한 뒤 이 가이드를 사용합니다.

런타임 하네스는 루트 에이전트 파일, `ai-playbook/` 프로젝트 메모리, 설치형 스킬, 이 저장소의 작은 CLI를 합친 것입니다. 모든 프로젝트에 같은 작업 흐름이 필요하다고 단정하지 않으면서도 에이전트 설정을 반복 가능하게 만드는 것이 목적입니다.

## 일반 설정 흐름

이 저장소에서 실행합니다.

```powershell
node .\bin\ai-playbook.mjs bootstrap <target-repo> --dry-run
node .\bin\ai-playbook.mjs bootstrap <target-repo> --local-only
node .\bin\ai-playbook.mjs guides sync <target-repo> --dry-run
node .\bin\ai-playbook.mjs doctor <target-repo>
```

대상 프로젝트에 이미 에이전트 문서가 있으면 먼저 `--dry-run`을 사용합니다. 충돌을 확인하고 생성 파일이 기존 파일을 대체해야 한다고 판단한 뒤에만 `--force`를 사용합니다.

대상 프로젝트에 이미 `ai-playbook/`이 있고 새 playbook checkout의 누락된 가이드만 가져오고 싶다면 `guides sync`를 사용합니다. 기본값은 기존 가이드, 루트 정책, 현재 프로젝트 메모, plan, worklog를 유지합니다.

## 진행 중 프로젝트 흐름

반복 가능한 파일 배치에는 CLI를 사용합니다.

```powershell
node .\bin\ai-playbook.mjs plan new <target-repo> --title "short-plan-title"
node .\bin\ai-playbook.mjs worklog new <target-repo> --title "short-worklog-title"
node .\bin\ai-playbook.mjs worklog summarize <target-repo> --month YYYY-MM
node .\bin\ai-playbook.mjs doctor <target-repo> --strict
```

세션 중 행동에는 스킬을 사용합니다.

- `project-bootstrap`: 저장소를 확인한 뒤 무엇을 설치할지 결정합니다.
- `repo-onboarding`: 낯선 저장소를 바꾸기 전에 이해합니다.
- `project-doc-system`: 흩어진 프로젝트 메모리를 정리합니다.
- `commit-worklog-guardrails`: 커밋, PR 문구, 상세 worklog를 맞춥니다.

## 파일 배치 규칙

- 루트 `AGENTS.md`는 얇은 부트스트랩으로 유지합니다. skill/Git 정책은 `ai-playbook/SKILLS.md`와 `ai-playbook/GIT.md`에 둡니다.
- 현재 사실은 `CURRENT.md`에 둡니다.
- 실행 중인 계획은 `plans/`에 둡니다.
- 상세 판단 과정과 복구용 이력은 `worklogs/YYYY-MM/`에 둡니다.
- 오래 남길 구조 사실은 `maps/`에 둡니다.
- 반복 실행 명령과 운영 절차는 `runbooks/`에 둡니다.
- 받아들인 선택은 `decisions/`에 둡니다.
- 낡은 계획, 오래된 프롬프트, 대체된 메모는 `archive/` 아래로 보관합니다.

저장소가 이미 명확한 public docs 관례를 갖고 있지 않다면 프로젝트 루트에 느슨한 markdown 파일을 만들지 않습니다.

## 로컬 전용 정책

프로젝트별 세부사항을 쓰기 전에 `ai-playbook/`을 커밋할지 로컬 전용으로 둘지 결정합니다.

메모에 비공개 맥락, 끝나지 않은 분석, 원본 로그, 민감한 URL, 특정 고객 세부사항이 들어갈 수 있으면 로컬 전용 모드를 사용합니다. 프로젝트가 `ai-playbook/`을 커밋한다면 공개 문서처럼 민감한 내용을 정리합니다.

## 유지보수 주기

- 세션 시작 시 `START_HERE.md`, `CURRENT.md`, 관련 plan 또는 runbook을 읽습니다.
- 큰 작업 중에는 milestone이 끝나거나 blocker가 해결되거나 방향이 바뀔 때 worklog를 씁니다.
- handoff 전에는 `START_HERE.md`를 갱신하고, worklog의 오래 유지할 사실을 `CURRENT.md`, maps, runbooks, decisions로 승격합니다.
- 커밋 또는 PR 전에는 `doctor`와 프로젝트별 검증을 실행합니다.
