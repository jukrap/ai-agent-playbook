# 설치

이 저장소는 한 번 clone한 뒤 루트 installer를 실행하는 방식이 가장 쉽습니다. 컴퓨터마다 Git 인증 방식과 PowerShell 정책이 다를 수 있어 여러 설치 방식을 지원합니다.

`<repo-url>`은 최종 Git 저장소 URL로 바꿉니다.

## Option 1: GitHub CLI로 빠르게 설치

`gh`가 설치되어 있고 인증되어 있을 때 사용합니다.

```powershell
$target = Join-Path $env:USERPROFILE 'Documents\ai-agent-playbook'
if (Test-Path $target) {
  $updater = Join-Path $target 'update.ps1'
  if (Test-Path $updater) {
    pwsh -NoProfile -ExecutionPolicy Bypass -File $updater
  } else {
    git -C $target pull --ff-only
    pwsh -NoProfile -ExecutionPolicy Bypass -File (Join-Path $target 'install.ps1')
  }
} else {
  gh repo clone <owner>/<repo> $target
  pwsh -NoProfile -ExecutionPolicy Bypass -File (Join-Path $target 'install.ps1')
}
```

installer 또는 updater가 끝나면 Codex를 재시작합니다.

Windows용 Codex App에서는 이 저장소를 일반 checkout으로 유지하고 그 checkout에서 PowerShell 명령을 실행합니다. Windows app 작업 흐름, 기존 프로젝트 dry run, 안전한 수동 병합 경로는 `../adapters/codex/README.ko.md`를 봅니다.

## Option 2: 일반 Git 설치

GitHub CLI를 쓰지 않거나 일반 `git clone`을 선호할 때 사용합니다.

### 1. Git 인증

private repository라면 clone 전에 아래 중 하나로 로그인합니다.

- GitHub CLI: `gh auth login`
- `git clone` 중 브라우저 prompt를 통한 Git Credential Manager
- 해당 host에 설정된 SSH key

### 2. 저장소 clone

```powershell
$target = Join-Path $env:USERPROFILE 'Documents\ai-agent-playbook'
git clone <repo-url> $target
Set-Location $target
```

원하면 다른 로컬 경로를 사용해도 됩니다. 이 clone을 source of truth로 유지합니다.

### 3. 스킬 설치

```powershell
.\install.ps1
```

installer는 저장소를 검증하고 `skills/<category>/<skill>`의 설치형 skill을 아래 위치로 복사합니다.

- `%USERPROFILE%\.codex\skills\<skill>`
- `%USERPROFILE%\.agents\skills\<skill>`
- legacy skill은 `%USERPROFILE%\.agents\skills\legacys\<legacy-skill>`

설치된 skill에는 `.ai-agent-playbook-install.json` ownership marker가 추가됩니다. 이후 update는 marker가 있는 managed skill, 예전 installer가 만든 것으로 보이는 동일 내용 unmanaged copy, 또는 사용자가 `-ForceUnmanaged`를 명시한 unmanaged copy만 교체합니다. Managed 설치본을 로컬에서 수정한 경우 updater는 기본적으로 덮어쓰지 않으며, 백업 후 `-ForceManaged`를 명시해야 교체합니다.

동기화 뒤에는 Codex를 재시작해 다음 세션이 skill metadata를 읽게 합니다.

선택적 Codex home 지침:

```powershell
$codexHome = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path $env:USERPROFILE '.codex' }
New-Item -ItemType Directory -Force -Path $codexHome | Out-Null
Copy-Item .\templates\codex-home\AGENTS.md (Join-Path $codexHome 'AGENTS.md')
```

이 파일은 개인 Codex 기본값 전용입니다. 저장소 규칙은 프로젝트 `AGENTS.md` 파일에 둡니다.

### 4. 설치 확인

```powershell
Test-Path "$env:USERPROFILE\.codex\skills\repo-onboarding\SKILL.md"
Test-Path "$env:USERPROFILE\.codex\skills\commit-worklog-guardrails\SKILL.md"
```

둘 다 `True`를 출력해야 합니다.

## Option 3: 기존 clone 업데이트

```powershell
Set-Location "$env:USERPROFILE\Documents\ai-agent-playbook"
.\update.ps1
```

update script는 `--ff-only`로 pull한 뒤 installer를 실행합니다. 이미 clone이 있는 컴퓨터의 일반적인 업데이트 경로입니다. 동기화 뒤에는 Codex를 재시작합니다.

위험한 update 전에는 dry run을 먼저 사용합니다.

```powershell
.\update.ps1 -WhatIf
```

Updater가 unmanaged conflict를 보고하면 해당 폴더를 먼저 확인합니다. 같은 이름의 skill이 이 playbook에서 온 것이 확실하거나 의도적으로 대체 가능한 경우가 아니라면 `-ForceUnmanaged`를 쓰지 않습니다.

## Option 4: 사용자 지정 경로에 수동 동기화

기본 skill 디렉터리가 아닌 곳을 써야 할 때만 사용합니다.

```powershell
.\scripts\validate-skills.ps1
.\scripts\validate-translations.ps1
.\scripts\sync-skills.ps1 `
  -CodexSkillsRoot "$env:USERPROFILE\.codex\skills" `
  -AgentsSkillsRoot "$env:USERPROFILE\.agents\skills"
```

Sync script는 기본적으로 다른 사람이 만든 같은 이름의 skill을 삭제하거나 덮어쓰지 않습니다. Obsolete skill도 ownership marker가 이 playbook 설치본임을 증명할 때만 제거합니다.

## 프로젝트 템플릿 적용

템플릿은 skill처럼 자동 설치되지 않습니다. 각 프로젝트에 복사하거나 조정합니다.

이 경로가 기본 project harness입니다. Runtime hook 또는 agent plugin은 선택 확장이며 `install.ps1`, `update.ps1`, 현재 CLI가 설치하지 않습니다.

권장 경로는 런타임 CLI입니다.

```powershell
node .\bin\ai-playbook.mjs bootstrap <target-project> --dry-run
node .\bin\ai-playbook.mjs bootstrap <target-project>
node .\bin\ai-playbook.mjs guides sync <target-project> --dry-run
node .\bin\ai-playbook.mjs guides sync <target-project> --check
node .\bin\ai-playbook.mjs doctor <target-project>
node .\bin\ai-playbook.mjs doctor <target-project> --json
node .\bin\ai-playbook.mjs doctor <target-project> --reminder --json
node .\bin\ai-playbook.mjs context <target-project> --json
node .\bin\ai-playbook.mjs adapter check <target-project> --adapter codex --json
```

대상 스택이 확인된 뒤에만 `--profile <name>`을 사용합니다. `ai-playbook/`을 대상 `.gitignore`에 추가해야 하면 `--local-only`를 사용합니다.

이미 `ai-playbook/`이 있는 프로젝트에서 새 playbook checkout의 누락된 가이드 템플릿만 가져오려면 `guides sync`를 사용합니다. `guides sync --check --json`은 source와 target hash를 사용해 stale guide도 보고합니다. 이 명령은 `--force`로 가이드 파일 덮어쓰기를 명시하지 않는 한 루트 `AGENTS.md`, playbook 정책 파일, 프로젝트별 메모를 수정하지 않습니다.

선택적 adapter hook 예시는 내부적으로 `context` 명령을 사용합니다. 이 예시는 read-only이며 `adapters/`에서 수동으로 활성화해야 합니다. Local hook 설정을 편집하기 전에 선택한 adapter에 대해 `adapter check`를 실행합니다.

Plan과 worklog는 CLI로 생성할 수 있습니다.

```powershell
node .\bin\ai-playbook.mjs plan new <target-project> --title "Feature slice"
node .\bin\ai-playbook.mjs worklog new <target-project> --title "Feature slice"
node .\bin\ai-playbook.mjs worklog summarize <target-project> --month 2026-06
```

일반적인 시작점:

```powershell
$projectRoot = Join-Path $env:USERPROFILE 'Documents\example-project'
Copy-Item .\templates\agents\global\AGENTS.md (Join-Path $projectRoot 'AGENTS.md')
Copy-Item .\templates\project-playbook (Join-Path $projectRoot 'ai-playbook') -Recurse
```

`templates/agents/global/`은 `AGENTS.md`용 프로젝트 루트 부트스트랩 템플릿 폴더입니다. skill/Git 정책은 `templates/project-playbook/`에서 복사되는 `ai-playbook/SKILLS.md`, `ai-playbook/GIT.md`에 둡니다. 그 다음 stack이 확인된 경우에만 `templates/agents/profiles/**`에서 가장 가까운 profile을 병합하고, 필요한 guide는 `templates/project-playbook/guides/**`에서 고릅니다.

## Codex skill installer 참고

Codex의 skill installer는 인증이 가능할 때 Git repository path에서 개별 skill을 설치할 수 있습니다. 하지만 이 playbook은 clone 후 `install.ps1`, 이후 `update.ps1`를 사용하는 방식을 권장합니다.

- 저장소에 여러 skill이 있습니다.
- 복사용 template과 docs도 함께 있습니다.
- installer가 먼저 검증하고 `.codex`와 `.agents` layout을 함께 설치합니다.
- 업데이트는 `.\update.ps1`로 단순합니다.

## 외부 작업 흐름 스킬

이 저장소는 외부 작업 흐름 스킬 묶음을 설치하지 않습니다. 별도로 설치한 뒤 필요할 때 이 skill들과 함께 사용합니다.

프로젝트가 나중에 hook 기반 runtime을 채택하더라도 opt-in으로 유지하고 대상 프로젝트의 `ai-playbook/`에 문서화합니다. 프로젝트는 문서 하네스만으로도 이해하고 사용할 수 있어야 합니다.
