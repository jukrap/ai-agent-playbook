# 런타임 하네스

`ai-playbook`은 이 저장소를 대상 프로젝트에 적용하기 위한 실행 표면입니다. AI 모델을 호출하지 않습니다. 템플릿을 복사하고, 프로젝트 메모리 상태를 점검하고, 예측 가능한 plan/worklog 파일을 만들어 에이전트가 임의의 markdown 경로를 계속 새로 만들지 않게 합니다.

이 CLI와 project playbook이 기본 하네스입니다. Runtime hook 또는 plugin은 선택 확장이며, 동작이 명시적이고 local이며 쉽게 끌 수 있기 전까지 기본 경로 밖에 둡니다. 단계적 설계는 `runtime-roadmap.ko.md`를 봅니다.

## 명령

```powershell
node .\bin\ai-playbook.mjs bootstrap <target> [--profile <name>] [--local-only] [--dry-run] [--force]
node .\bin\ai-playbook.mjs doctor <target> [--strict] [--json]
node .\bin\ai-playbook.mjs guides sync <target> [--dry-run] [--force]
node .\bin\ai-playbook.mjs guides sync <target> --check [--json]
node .\bin\ai-playbook.mjs context <target> [--json] [--max-chars N]
node .\bin\ai-playbook.mjs adapter check <target> --adapter codex|claude-code [--json] [--max-chars N]
node .\bin\ai-playbook.mjs plan new <target> --title <text> [--date YYYY-MM-DD] [--dry-run] [--force]
node .\bin\ai-playbook.mjs worklog new <target> --title <text> [--date YYYY-MM-DD] [--dry-run] [--force]
node .\bin\ai-playbook.mjs worklog summarize <target> --month YYYY-MM [--dry-run] [--force]
```

공개 뒤에는 같은 CLI를 package `bin`으로 노출해 `ai-playbook` 명령처럼 사용할 수 있습니다.

## Bootstrap 동작

- `templates/project-playbook/`을 `<target>/ai-playbook/`로 복사합니다.
- `templates/agents/global/AGENTS.md`를 얇은 `<target>/AGENTS.md`로 복사합니다. 이 파일은 프로젝트 루트 부트스트랩이며, Codex의 개인 `~/.codex/AGENTS.md`가 아닙니다.
- `ai-playbook/SKILLS.md`와 `ai-playbook/GIT.md`는 project playbook의 일부로 포함됩니다.
- `--profile <name>`이 있으면 `templates/agents/profiles/<name>/AGENTS.md`를 root `AGENTS.md`에 병합합니다.
- `--local-only`가 있으면 대상 `.gitignore`에만 `ai-playbook/`을 추가합니다.
- 기존 파일은 `--force`가 없으면 덮어쓰지 않습니다.

## Doctor 점검

`doctor`는 최소 `ai-playbook/` layout, root `AGENTS.md`, root `AGENTS.md`가 핵심 playbook 파일을 가리키는지, 예상치 못한 root `SKILLS.md` 또는 `GIT.md`, local-only 정책, 아직 조정되지 않은 핵심 템플릿 문구, 분리된 예전 스타일 스킬 참조, 고정 로컬 절대경로를 점검합니다. 기본 모드에서는 warning이 실패로 처리되지 않습니다. `--strict` 모드에서는 warning도 실패합니다.

방금 bootstrap한 결과는 `START_HERE.md`, `CURRENT.md`, `questions.md`에 템플릿 문구가 남아 있어 `playbook adaptation` warning을 낼 수 있습니다. 이는 bootstrap 실패가 아니라 저장소 점검 뒤 playbook을 조정하라는 알림입니다.

Hook, wrapper, automation이 안정적인 machine-readable output을 필요로 하면 `--json`을 사용합니다. JSON 계약은 `schemaVersion: "1"`로 versioning되며, `summary`와 `id`, `level`, `category`, `name`, `message`, `paths`를 가진 `checks[]` 항목을 포함합니다. 현재 text output은 사람이 읽는 기본값으로 유지합니다.

## 가이드 동기화

`guides sync`는 이 저장소의 현재 가이드 템플릿을 `<target>/ai-playbook/guides/`로 복사합니다.

- 기본 동작은 기존 가이드 파일을 유지하고, 없는 가이드 파일만 추가합니다.
- 먼저 `--dry-run`으로 추가될 파일을 확인합니다.
- 파일을 쓰지 않고 누락된 가이드만 보고하려면 `--check`를 사용합니다. 자동화에는 `--json`을 추가합니다.
- 기존 가이드를 현재 템플릿 버전으로 바꾸기로 결정한 경우에만 `--force`를 사용합니다.
- 이 명령은 `AGENTS.md`, `ai-playbook/SKILLS.md`, `ai-playbook/GIT.md`, `CURRENT.md`, plans, worklogs, 프로젝트별 메모리를 수정하지 않습니다.

## Context 출력

`context`는 아래 project playbook 파일에서 hook에 넣기 좋은 compact context를 만듭니다.

- `ai-playbook/START_HERE.md`
- `ai-playbook/CURRENT.md`
- `ai-playbook/SKILLS.md`
- `ai-playbook/GIT.md`

기본적으로 root `AGENTS.md`를 읽거나 다시 주입하지 않습니다. `--json`을 사용하면 `{ schemaVersion, ok, target, sources, additionalContext, warnings }`를 반환합니다. Hook 환경에 넣을 context 길이를 제한하려면 `--max-chars N`을 사용합니다.

## Adapter 준비 점검

`adapter check`는 선택적 hook adapter를 수동으로 켜기 전에 실행하는 read-only self-check입니다.

```powershell
node .\bin\ai-playbook.mjs adapter check <target> --adapter codex --json
node .\bin\ai-playbook.mjs adapter check <target> --adapter claude-code --json
```

이 명령은 대상 경로, `ai-playbook/`, 비어 있지 않은 core context, adapter hook 파일, 예시 설정, `SessionStart`와 `PostCompact`의 지원 hook JSON, unsupported event 또는 missing playbook context의 quiet behavior를 확인합니다. Hook을 설치하지 않고, project file을 쓰지 않고, network call을 하지 않고, global command도 요구하지 않습니다.

`--json`을 사용하면 `{ schemaVersion, ok, target, adapter, summary, checks }`를 반환합니다. Check 항목은 `doctor`와 같은 `id`, `level`, `category`, `name`, `message`, `paths` 구조를 사용하므로 hook 또는 setup automation이 사람이 읽는 text를 parsing하지 않고도 일찍 실패할 수 있습니다.

## Plan과 worklog 생성

- Plan은 `ai-playbook/plans/YYYY-MM-DD-<slug>.md`에 생성됩니다.
- Worklog는 `ai-playbook/worklogs/YYYY-MM/YYYY-MM-DD-<slug>.md`에 생성됩니다.
- 월간 summary는 `ai-playbook/worklogs/summaries/YYYY-MM.md`에 생성됩니다.

이 파일들은 비어 있는 초안이 아니라, 목표, 범위, 검증, 체크포인트, 근거, 남은 리스크를 기록하도록 유도하는 구조를 포함합니다.

## 설계 제약

- CLI는 대상 프로젝트의 패키지 매니저, framework, test command를 추측하지 않습니다.
- CLI는 `ai-playbook/`을 커밋할지 local-only로 둘지 자동 결정하지 않습니다. 사용자가 `--local-only`를 명시해야 합니다.
- CLI는 스킬 설치를 대체하지 않습니다. 스킬은 `install.ps1`, `update.ps1`, `scripts/sync-skills.ps1` 흐름으로 관리합니다.
- CLI는 수동 검토를 대체하지 않습니다. 기존 agent docs가 있는 프로젝트에서는 먼저 `--dry-run`을 사용합니다.
- 기본 하네스는 plugin hook, slash command, global install, network access를 요구하지 않습니다.
- 선택적 hook adapter는 context나 reminder만 주입해야 하며 tool output을 다시 쓰거나 project file을 자동 편집하지 않습니다.
