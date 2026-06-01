# Installation

이 저장소는 한 번 clone한 뒤, 루트 installer를 실행하는 방식이 가장 단순합니다. 컴퓨터마다 GitHub 인증 방식과 PowerShell 정책이 다를 수 있으므로 여러 설치 방식을 지원합니다.

## Option 1: GitHub CLI 빠른 설치

`gh`가 설치되어 있고 인증되어 있을 때 사용합니다. 가장 짧게 반복할 수 있는 설치/업데이트 흐름입니다.

```powershell
$target = Join-Path $env:USERPROFILE 'Documents\ai-agent-playbook'
if (Test-Path $target) {
  git -C $target pull
} else {
  gh repo clone jukrap/ai-agent-playbook $target
}
pwsh -NoProfile -ExecutionPolicy Bypass -File (Join-Path $target 'install.ps1')
```

Installer가 끝난 뒤 Codex를 재시작합니다.

## Option 2: 표준 Git 설치

GitHub CLI가 없거나 일반 `git clone`을 선호할 때 사용합니다.

### 1. GitHub 인증

Private repository라면 clone 전에 아래 중 하나로 로그인합니다.

- GitHub CLI: `gh auth login`
- `git clone` 중 브라우저 prompt로 Git Credential Manager 로그인
- GitHub에 등록된 SSH key

### 2. 저장소 clone

```powershell
$target = Join-Path $env:USERPROFILE 'Documents\ai-agent-playbook'
git clone https://github.com/jukrap/ai-agent-playbook.git $target
Set-Location $target
```

원하면 다른 local path를 써도 됩니다. 이 clone을 source of truth로 둡니다.

### 3. Skill 설치

```powershell
.\install.ps1
```

Installer는 저장소를 검증하고 `skills/<category>/<skill>` 아래의 설치형 skill을 아래 위치로 복사합니다.

- `%USERPROFILE%\.codex\skills\<skill>`
- `%USERPROFILE%\.agents\skills\<skill>`
- legacy skill은 `%USERPROFILE%\.agents\skills\legacys\<legacy-skill>`

Sync 후 Codex를 재시작해야 session이 skill metadata를 다시 잡을 수 있습니다.

### 4. 설치 확인

```powershell
Test-Path "$env:USERPROFILE\.codex\skills\repo-onboarding\SKILL.md"
Test-Path "$env:USERPROFILE\.codex\skills\commit-worklog-guardrails\SKILL.md"
```

둘 다 `True`가 나오면 됩니다.

## Option 3: 기존 clone 업데이트

```powershell
Set-Location "$env:USERPROFILE\Documents\ai-agent-playbook"
.\update.ps1
```

Update script는 `--ff-only`로 pull한 뒤 installer를 실행합니다. Sync 후 Codex를 재시작합니다.

## Option 4: custom path 수동 sync

기본 skill directory가 아닌 다른 경로를 써야 할 때만 사용합니다.

```powershell
.\scripts\validate-skills.ps1
.\scripts\validate-translations.ps1
.\scripts\sync-skills.ps1 `
  -CodexSkillsRoot "$env:USERPROFILE\.codex\skills" `
  -AgentsSkillsRoot "$env:USERPROFILE\.agents\skills"
```

## 프로젝트 템플릿 적용

Templates는 skill처럼 자동 설치되지 않습니다. 프로젝트마다 복사하거나 조정해서 사용합니다.

일반적인 시작점:

```powershell
$projectRoot = Join-Path $env:USERPROFILE 'Documents\example-project'
Copy-Item .\templates\agents\global\AGENTS.md (Join-Path $projectRoot 'AGENTS.md')
```

그 다음 `templates/agents/profiles/**`에서 가장 가까운 profile과 `templates/local-ai/**`의 필요한 문서를 병합합니다.

## Codex skill installer 참고

Codex skill installer는 인증이 가능한 경우 GitHub repository path에서 개별 skill을 설치할 수 있습니다. 다만 이 playbook은 clone 후 `install.ps1`를 실행하는 방식을 권장합니다.

- skill이 여러 개입니다.
- copyable templates와 docs도 함께 있습니다.
- installer가 먼저 검증하고 `.codex`와 `.agents` layout을 함께 설치합니다.
- 업데이트가 `.\update.ps1`로 단순합니다.

## Superpowers 참고

이 저장소는 Superpowers를 설치하지 않습니다. Superpowers는 별도로 설치해두고, 이 skill들을 함께 사용합니다.
