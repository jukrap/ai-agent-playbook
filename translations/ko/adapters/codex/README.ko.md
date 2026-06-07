# Codex 어댑터

Codex는 이 저장소의 스킬이 Codex 스킬 디렉터리에 복사된 뒤 사용할 수 있습니다.

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

## 휴대 가능한 지침

다른 컴퓨터에 Codex 계정 수준 사용자 지침이 있다고 의존하지 않습니다. 재사용할 작업 합의는 project `AGENTS.md` template이나 `templates/project-playbook` 문서에 두고, 기기별 경로는 local setup notes에만 둡니다.

루트 수준 project policy에는 `templates/agents/global/AGENTS.md`, `templates/agents/global/SKILLS.md`, `templates/agents/global/GIT.md`를 우선 사용합니다. 외부 스킬의 hook, slash command, runtime-specific instruction은 Codex 기본값이 아니라 옮겨 해석할 아이디어로 다룹니다.
