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

동기화 뒤에는 Codex를 재시작해 다음 세션이 skill metadata를 읽게 합니다.

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

## Option 4: 사용자 지정 경로에 수동 동기화

기본 skill 디렉터리가 아닌 곳을 써야 할 때만 사용합니다.

```powershell
.\scripts\validate-skills.ps1
.\scripts\validate-translations.ps1
.\scripts\sync-skills.ps1 `
  -CodexSkillsRoot "$env:USERPROFILE\.codex\skills" `
  -AgentsSkillsRoot "$env:USERPROFILE\.agents\skills"
```

## 프로젝트 템플릿 적용

템플릿은 skill처럼 자동 설치되지 않습니다. 각 프로젝트에 복사하거나 조정합니다.

권장 경로는 런타임 CLI입니다.

```powershell
node .\bin\ai-playbook.mjs bootstrap <target-project> --with-skills --with-git --dry-run
node .\bin\ai-playbook.mjs bootstrap <target-project> --with-skills --with-git
node .\bin\ai-playbook.mjs doctor <target-project>
```

대상 스택이 확인된 뒤에만 `--profile <name>`을 사용합니다. `ai-playbook/`을 대상 `.gitignore`에 추가해야 하면 `--local-only`를 사용합니다.

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

프로젝트에 휴대 가능한 skill 또는 Git 정책이 필요하면 `templates/agents/global/SKILLS.md` 또는 `templates/agents/global/GIT.md`를 선택적으로 복사합니다. 그 다음 `templates/agents/profiles/**`에서 가장 가까운 profile을 병합하고, 필요한 guide는 `templates/project-playbook/guides/**`에서 고릅니다.

## Codex skill installer 참고

Codex의 skill installer는 인증이 가능할 때 Git repository path에서 개별 skill을 설치할 수 있습니다. 하지만 이 playbook은 clone 후 `install.ps1`, 이후 `update.ps1`를 사용하는 방식을 권장합니다.

- 저장소에 여러 skill이 있습니다.
- 복사용 template과 docs도 함께 있습니다.
- installer가 먼저 검증하고 `.codex`와 `.agents` layout을 함께 설치합니다.
- 업데이트는 `.\update.ps1`로 단순합니다.

## 외부 작업 흐름 스킬

이 저장소는 외부 작업 흐름 스킬 묶음을 설치하지 않습니다. 별도로 설치한 뒤 필요할 때 이 skill들과 함께 사용합니다.
