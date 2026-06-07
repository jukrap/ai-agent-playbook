# 런타임 하네스

`ai-playbook`은 이 저장소를 대상 프로젝트에 적용하기 위한 실행 표면입니다. AI 모델을 호출하지 않습니다. 템플릿을 복사하고, 프로젝트 메모리 상태를 점검하고, 예측 가능한 plan/worklog 파일을 만들어 에이전트가 임의의 markdown 경로를 계속 새로 만들지 않게 합니다.

## 명령

```powershell
node .\bin\ai-playbook.mjs bootstrap <target> [--profile <name>] [--local-only] [--with-skills] [--with-git] [--dry-run] [--force]
node .\bin\ai-playbook.mjs doctor <target> [--strict]
node .\bin\ai-playbook.mjs plan new <target> --title <text> [--date YYYY-MM-DD] [--dry-run] [--force]
node .\bin\ai-playbook.mjs worklog new <target> --title <text> [--date YYYY-MM-DD] [--dry-run] [--force]
node .\bin\ai-playbook.mjs worklog summarize <target> --month YYYY-MM [--dry-run] [--force]
```

공개 뒤에는 같은 CLI를 package `bin`으로 노출해 `ai-playbook` 명령처럼 사용할 수 있습니다.

## Bootstrap 동작

- `templates/project-playbook/`을 `<target>/ai-playbook/`로 복사합니다.
- `templates/agents/global/AGENTS.md`를 `<target>/AGENTS.md`로 복사합니다.
- `--with-skills`가 있으면 `SKILLS.md`를 추가합니다.
- `--with-git`이 있으면 `GIT.md`를 추가합니다.
- `--profile <name>`이 있으면 `templates/agents/profiles/<name>/AGENTS.md`를 root `AGENTS.md`에 병합합니다.
- `--local-only`가 있으면 대상 `.gitignore`에만 `ai-playbook/`을 추가합니다.
- 기존 파일은 `--force`가 없으면 덮어쓰지 않습니다.

## Doctor 점검

`doctor`는 최소 `ai-playbook/` layout, root `AGENTS.md`, local-only 정책, 분리된 예전 스타일 스킬 참조, 고정 로컬 절대경로를 점검합니다. 기본 모드에서는 warning이 실패로 처리되지 않습니다. `--strict` 모드에서는 warning도 실패합니다.

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
