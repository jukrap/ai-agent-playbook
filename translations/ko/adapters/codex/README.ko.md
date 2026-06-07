# Codex 어댑터

Codex는 이 저장소의 스킬이 Codex 스킬 디렉터리에 복사된 뒤 사용할 수 있습니다.

## Windows용 Codex App

Windows용 Codex App에서는 이 저장소 checkout을 로컬 source of truth로 두고 PowerShell에서 설정을 실행합니다. 대상 저장소 경로에 공백이나 비ASCII 문자가 들어갈 수 있으므로 경로는 변수나 따옴표, `-LiteralPath`로 다룹니다.

처음 설정할 때의 권장 흐름:

```powershell
$playbookRepo = '<path-to-ai-agent-playbook>'
Set-Location -LiteralPath $playbookRepo
.\install.ps1
```

스킬을 동기화한 뒤에는 Codex App을 재시작하거나 새 세션을 시작해 skill metadata가 갱신되게 합니다.

기존 프로젝트에는 첫 시도에서 root agent docs를 덮어쓰지 않습니다. 먼저 dry run으로 시작합니다.

```powershell
$playbookRepo = '<path-to-ai-agent-playbook>'
$targetRepo = '<path-to-target-project>'
Set-Location -LiteralPath $playbookRepo
node .\bin\ai-playbook.mjs bootstrap $targetRepo --local-only --with-skills --with-git --dry-run
```

대상 프로젝트에 이미 `AGENTS.md`, `SKILLS.md`, `GIT.md`가 있으면 `--force`를 쓰지 말고 conflict를 확인합니다. 더 안전한 시험 경로는 임시 폴더에 scaffold를 만든 뒤 생성된 파일을 보고 프로젝트에 필요한 부분만 수동 병합하는 것입니다.

```powershell
$scratch = Join-Path $env:TEMP 'ai-playbook-scaffold'
Remove-Item -LiteralPath $scratch -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $scratch | Out-Null
node .\bin\ai-playbook.mjs bootstrap $scratch --local-only --with-skills --with-git
```

레거시 또는 문서가 많은 프로젝트에는 보통 `ai-playbook/START_HERE.md`, `CURRENT.md`, docs map만 먼저 얹습니다. 기존 worklog와 plan은 사람이 migration을 검토하기 전까지 제자리에 둡니다.

## 로컬 동기화

새 컴퓨터에서의 전체 설정은 `../../../docs/installation.md`를 봅니다. 저장소 루트에서 clone 뒤 한 번 실행합니다.

```powershell
.\install.ps1
```

같은 컴퓨터에서 나중에 업데이트할 때는:

```powershell
.\update.ps1
```

Codex 대상 디렉터리만 바꾸려면:

```powershell
.\scripts\sync-skills.ps1 -CodexSkillsRoot "$env:USERPROFILE\.codex\skills"
```

이 스크립트는 `skills/<category>/<skill>`을 로컬 스킬 디렉터리에 평평한 구조로 복사합니다. 일부 에이전트는 이 layout에서 스킬을 더 명확히 표시합니다.

## GitHub 설치

저장소가 공개되거나 접근 가능해진 뒤에는 skill manager가 최종 저장소 URL에서 직접 설치할 수도 있습니다.

```text
<repo-url>
```

private repository는 대상 도구에서 Git 인증이 필요할 수 있습니다.

## 원본 규칙

로컬 설치 스킬 디렉터리 아래 파일을 source of truth처럼 수정하지 않습니다. 이 저장소를 수정하고, 검증한 뒤, 동기화합니다.

## 런타임 CLI

이 저장소에는 프로젝트 하네스 설정과 유지보수를 위한 작은 Node CLI도 포함되어 있습니다. 설치형 Codex 스킬이 아니므로 이 저장소 checkout에서 실행합니다.

```powershell
node .\bin\ai-playbook.mjs bootstrap <target-repo> --dry-run
node .\bin\ai-playbook.mjs bootstrap <target-repo> --local-only --with-skills --with-git
node .\bin\ai-playbook.mjs doctor <target-repo> --strict
node .\bin\ai-playbook.mjs plan new <target-repo> --title "short-plan-title"
node .\bin\ai-playbook.mjs worklog new <target-repo> --title "short-worklog-title"
```

대상 프로젝트에 반복 가능한 `AGENTS.md`, `SKILLS.md`, `GIT.md`, `ai-playbook/` scaffold가 필요하면 CLI를 사용합니다. 코딩 세션 중 재사용할 작업 행동이 필요하면 설치된 skill을 사용합니다.

Codex App에서는 `ai-playbook`을 global command로 설치할 필요가 없습니다. 안정적인 호출 방식은 아래입니다.

```powershell
node .\bin\ai-playbook.mjs <command>
```

수동 병합 뒤에는 `doctor`를 실행해 누락된 playbook 파일, 고정 로컬 절대경로, 예전 style skill 참조를 확인합니다.

## 휴대 가능한 지침

다른 컴퓨터에 Codex 계정 수준 사용자 지침이 있다고 의존하지 않습니다. 재사용할 작업 합의는 project `AGENTS.md` template이나 `templates/project-playbook` 문서에 두고, 기기별 경로는 local setup notes에만 둡니다.

루트 수준 project policy에는 `templates/agents/global/AGENTS.md`, `templates/agents/global/SKILLS.md`, `templates/agents/global/GIT.md`를 우선 사용합니다. 외부 스킬의 hook, slash command, runtime-specific instruction은 Codex 기본값이 아니라 옮겨 해석할 아이디어로 다룹니다.
