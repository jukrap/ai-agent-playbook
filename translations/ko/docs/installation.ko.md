# 설치, 업데이트, 삭제

이 패키지는 npm 또는 npx로 사용하는 방식이 가장 쉽습니다. 로컬 Git checkout과 PowerShell 스크립트는 개발, private fork, 명시적 local script를 선호하는 Windows 환경을 위해 계속 지원합니다.

세 계층은 서로 다릅니다.

1. npm 패키지는 `ai-playbook` CLI와 함께 묶인 원본 파일을 설치합니다.
2. `skills install`은 재사용 스킬을 사용자 수준 스킬 루트에 복사합니다.
3. `bootstrap`은 대상 저장소 하나에 project playbook을 복사합니다.

npm 패키지 설치만으로는 스킬 복사, `.ai-playbook/` 생성, hook 활성화, slash command 등록이 일어나지 않습니다. 그런 작업은 명시적으로 실행해야 합니다.

## CLI 설치 방식 선택

Node.js를 사용할 수 있을 때 사용합니다. 공개 패키지는 [`ai-agent-playbook`](https://www.npmjs.com/package/ai-agent-playbook)입니다.

`npm i`는 `npm install`의 짧은 별칭입니다. 패키지가 어디에 들어가는지는 scope option이 결정합니다.

| 목표 | 명령 | 결과 |
| ---- | ---- | ---- |
| 도구를 시험하거나 가끔 실행 | `npx ai-agent-playbook --help` | npm이 해당 명령에 필요한 패키지를 받아 실행합니다. 프로젝트 dependency는 추가하지 않습니다. |
| 어느 디렉터리에서든 `ai-playbook` 사용 | `npm install -g ai-agent-playbook` | global CLI 명령을 설치합니다. 업데이트는 `npm install -g ai-agent-playbook@latest`를 사용합니다. |
| 한 프로젝트에 도구 고정 | `npm install -D ai-agent-playbook` | dev dependency와 `node_modules/ai-agent-playbook`을 추가합니다. 실행은 `npx ai-playbook ...`을 사용합니다. |
| source checkout에서 작업 | `node .\bin\ai-playbook.mjs --help` | checkout된 repository를 직접 실행합니다. |

그냥 `npm install ai-agent-playbook`을 일반적인 첫 단계처럼 쓰지는 않는 편이 좋습니다. 현재 프로젝트의 runtime dependency처럼 추가하고 싶을 때만 사용합니다. 이 명령은 현재 프로젝트의 `node_modules`에 설치하지만, 그래도 스킬 설치나 project playbook bootstrap은 하지 않습니다.

## 권장 첫 설정

먼저 read-only preview로 시작합니다.

```powershell
npx ai-agent-playbook --help
npx ai-agent-playbook skills install --dry-run
npx ai-agent-playbook skills install
npx ai-agent-playbook bootstrap <target-project> --dry-run
npx ai-agent-playbook operator check <target-project> --json
```

스킬 설치 뒤에는 새 스킬 메타데이터를 읽도록 Codex를 재시작하거나 새 agent session을 시작합니다.

짧은 명령이 필요할 때만 global install을 사용합니다.

```powershell
npm install -g ai-agent-playbook
ai-playbook --help
ai-playbook skills check
```

전역 설치 후에는 아래 예시의 `npx ai-agent-playbook`을 `ai-playbook`으로 바꿔 실행할 수 있습니다.

전체 명령어 reference는 [명령어 가이드](commands.ko.md)를 봅니다.

## 스킬 lifecycle

재사용 스킬은 대상 저장소가 아니라 사용자 수준 스킬 루트에 설치됩니다.

- `%USERPROFILE%\.codex\skills\<skill>`
- `%USERPROFILE%\.agents\skills\<skill>`
- 레거시 스킬은 `%USERPROFILE%\.agents\skills\legacys\<legacy-skill>`

관리 대상 로컬 스킬 설치 또는 업데이트:

```powershell
npx ai-agent-playbook skills check --json
npx ai-agent-playbook skills install --dry-run
npx ai-agent-playbook skills install
npx ai-agent-playbook skills update --dry-run
npx ai-agent-playbook skills update
```

관리 대상 로컬 스킬 제거:

```powershell
npx ai-agent-playbook skills uninstall --dry-run
npx ai-agent-playbook skills uninstall
```

`skills install`과 `skills update`는 반복 실행해도 안전합니다. 관리 대상 스킬을 일반 Codex/agent 스킬 디렉터리로 동기화합니다. 로컬에서 수정한 관리 대상 스킬은 `--force-managed`가 없으면 덮어쓰지 않고, 같은 이름의 다른 관리되지 않는 스킬은 `--force-unmanaged`가 없으면 덮어쓰지 않습니다.

`skills uninstall`은 이 playbook이 설치한 수정되지 않은 관리 대상 스킬만 제거합니다. 먼저 `--dry-run`으로 확인합니다. 관리 대상 스킬을 로컬에서 수정했다면, 유지할지 아니면 `--force-managed`로 의도적으로 지울지 결정할 때까지 중단합니다.

Ownership marker는 각 설치된 스킬 폴더 안의 `.ai-agent-playbook-install.json`입니다. 이 marker에는 `source: "ai-agent-playbook"`과 hash가 들어 있어 CLI가 이 playbook의 관리 대상 복사본과 다른 사람이 만든 스킬을 구분합니다.

스킬 설치나 업데이트 뒤에는 다음 세션이 스킬 메타데이터를 읽도록 Codex를 재시작합니다.

## 전역 CLI lifecycle

전역 npm 패키지와 복사된 스킬은 서로 다릅니다. 전역 패키지를 삭제해도 이미 복사된 스킬은 삭제되지 않습니다.

```powershell
npm install -g ai-agent-playbook@latest
npm uninstall -g ai-agent-playbook
```

복사된 스킬을 제거하려면 `npx ai-agent-playbook skills uninstall` 또는 `ai-playbook skills uninstall`을 사용합니다.

## 어떤 명령이 파일을 쓰는가

| 명령 | 기본으로 쓰는가? | 대상 |
| ---- | ---------------- | ---- |
| `npx ai-agent-playbook --help` | 아니오 | CLI help를 출력합니다. |
| `npm install -g ai-agent-playbook` | 예 | npm 전역 패키지 위치만 변경합니다. |
| `npm install -D ai-agent-playbook` | 예 | 현재 프로젝트의 `package.json`, lockfile, `node_modules`를 변경합니다. |
| `skills check` | 아니오 | 스킬 상태를 보고합니다. |
| `skills install` / `skills update` | `--dry-run`이 없으면 예 | 사용자 스킬 루트를 변경합니다. |
| `skills uninstall` | `--dry-run`이 없으면 예 | 사용자 스킬 루트에서 관리 대상 스킬을 제거합니다. |
| `bootstrap <target>` | `--dry-run`이 없으면 예 | 대상 프로젝트의 루트 `AGENTS.md`와 `.ai-playbook/`을 변경합니다. |
| `guides sync <target>` | `--dry-run` 또는 `--check`가 없으면 예 | 대상 프로젝트의 `.ai-playbook/guides/`를 변경합니다. |
| `managed adopt/prune/uninstall` | `--apply`가 없으면 아니오 | 대상 프로젝트의 `.ai-playbook/` managed file을 변경합니다. |
| `operator check/search/research/context/analyze/map/audit` | 아니오 | 대상 프로젝트를 read-only로 진단합니다. |
| `operator gc` | `--apply`가 없으면 아니오 | 대상 프로젝트의 obsolete unmodified managed playbook file을 변경합니다. |
| `adapter config/check` | 아니오 | local adapter 설정을 렌더링하거나 검증합니다. |

## Option 2: GitHub CLI로 빠른 local checkout

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

## Option 3: 일반 Git 설치

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

원하면 다른 로컬 경로를 사용해도 됩니다. 이 clone을 기준 원본으로 유지합니다.

### 3. 스킬 설치

```powershell
node .\bin\ai-playbook.mjs skills install --dry-run
node .\bin\ai-playbook.mjs skills install
```

Node CLI는 `skills/<category>/<skill>`의 설치형 스킬을 아래 위치로 복사합니다.

- `%USERPROFILE%\.codex\skills\<skill>`
- `%USERPROFILE%\.agents\skills\<skill>`
- 레거시 스킬은 `%USERPROFILE%\.agents\skills\legacys\<legacy-skill>`

설치된 스킬에는 `.ai-agent-playbook-install.json` ownership marker가 추가됩니다. 이후 update는 marker가 있는 관리 대상 스킬, 예전 installer가 만든 것으로 보이는 동일 내용 unmanaged copy, 또는 사용자가 `--force-unmanaged`를 명시한 unmanaged copy만 교체합니다. 관리 대상 설치본을 로컬에서 수정한 경우 updater는 기본적으로 덮어쓰지 않으며, 백업 후 `--force-managed`를 명시해야 교체합니다.

호환용 PowerShell 경로도 계속 사용할 수 있습니다.

```powershell
.\install.ps1
```

동기화 뒤에는 Codex를 재시작해 다음 세션이 스킬 메타데이터를 읽게 합니다.

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

## Option 4: 기존 clone 업데이트

```powershell
Set-Location "$env:USERPROFILE\Documents\ai-agent-playbook"
node .\bin\ai-playbook.mjs skills update
```

CLI update는 현재 checkout의 관리 대상 설치 스킬을 갱신합니다. 더 최신 source가 필요하면 먼저 checkout을 pull합니다. 동기화 뒤에는 Codex를 재시작합니다.

위험한 update 전에는 dry run을 먼저 사용합니다.

```powershell
node .\bin\ai-playbook.mjs skills update --dry-run
```

호환용 PowerShell updater는 여전히 `--ff-only` pull 후 installer를 실행합니다.

```powershell
.\update.ps1
```

Updater가 unmanaged conflict를 보고하면 해당 폴더를 먼저 확인합니다. 같은 이름의 스킬이 이 playbook에서 온 것이 확실하거나 의도적으로 대체 가능한 경우가 아니라면 `--force-unmanaged` 또는 `-ForceUnmanaged`를 쓰지 않습니다.

## Option 5: 사용자 지정 경로에 수동 동기화

기본 스킬 디렉터리가 아닌 곳을 써야 할 때만 사용합니다.

```powershell
node .\bin\ai-playbook.mjs skills install `
  --codex-root "$env:USERPROFILE\.codex\skills" `
  --agents-root "$env:USERPROFILE\.agents\skills"
```

Skills lifecycle 명령은 기본적으로 다른 사람이 만든 같은 이름의 스킬을 삭제하거나 덮어쓰지 않습니다. Obsolete skill도 ownership marker가 이 playbook 설치본임을 증명할 때만 제거합니다. 로컬 checkout workflow에는 PowerShell `scripts/sync-skills.ps1` wrapper도 계속 사용할 수 있습니다.

## 프로젝트 playbook 설치, 업데이트, 제거

템플릿은 스킬처럼 자동 설치되지 않습니다. 스킬은 사용자 수준 재사용 guidance이고, project playbook은 저장소별 project memory입니다. 권장 경로는 runtime CLI이며, 더 세밀한 제어가 필요할 때만 수동으로 복사하거나 조정합니다.

이 경로가 기본 project harness입니다. Runtime hook 또는 agent plugin은 선택 확장이며 `install.ps1`, `update.ps1`, 현재 CLI가 설치하지 않습니다.

Project-level 작업은 preview로 시작합니다.

```powershell
npx ai-agent-playbook bootstrap <target-project> --dry-run
npx ai-agent-playbook operator check <target-project> --json
```

전역 설치 후에는 `npx ai-agent-playbook`을 `ai-playbook`으로 바꿔 실행합니다. Local checkout에서는 `node .\bin\ai-playbook.mjs`로 바꿔 실행합니다. Project playbook, managed cleanup, operator, adapter, plan, worklog 명령 전체 목록은 [명령어 가이드](commands.ko.md)를 봅니다.

대상 스택이 확인된 뒤에만 `--profile <name>`을 사용합니다. `.ai-playbook/`을 대상 `.gitignore`에 추가해야 하면 `--local-only`를 사용합니다.

이미 `.ai-playbook/`이 있는 프로젝트에서 새 playbook checkout의 누락된 가이드 템플릿만 가져오려면 `guides sync`를 사용합니다. `guides sync --check --json`은 source와 target hash를 사용해 stale guide도 보고하고, `--diff`를 추가하면 파일을 쓰지 않고 첫 차이 line을 보여줍니다. 이 명령은 `--force`로 가이드 파일 덮어쓰기를 명시하지 않는 한 루트 `AGENTS.md`, playbook 정책 파일, 프로젝트별 메모를 수정하지 않습니다.

경로 전환 기간에는 `.ai-playbook/`이 없고 기존 `ai-playbook/` 폴더만 있는 프로젝트도 runtime 명령이 지원합니다. 새 bootstrap 결과는 `.ai-playbook/`을 사용합니다. Legacy 폴더 이동과 참조 갱신은 먼저 `migrate path --json`으로 preview하고, 검토한 뒤에만 `--apply`를 추가합니다.

Bootstrap과 guide sync는 project-level marker인 `.ai-playbook/.ai-agent-playbook-install.json`을 관리합니다. `managed check`로 확인하고, `managed catalog`로 소유 파일을 kind/status별로 검토하고, 오래된 matching install에는 `managed adopt --apply`를, 선택한 수정되지 않은 managed file 제거에는 `managed prune --apply --path <managed-path>`를, 전체 수정되지 않은 managed file 제거에는 `managed uninstall --apply`를 사용합니다. Prune과 uninstall 명령은 로컬에서 수정된 파일을 보존하고 `.gitignore` 정리는 operator에게 맡깁니다.

대상 repository에서 project playbook을 제거할 때는 아래 preview-first 흐름을 사용합니다.

```powershell
npx ai-agent-playbook managed check <target-project> --json
npx ai-agent-playbook managed uninstall <target-project> --json
npx ai-agent-playbook managed uninstall <target-project> --apply --json
```

`managed uninstall --apply`는 `.ai-playbook/.ai-agent-playbook-install.json`에 기록되어 있고 현재 hash가 manifest와 같은 파일만 제거합니다. 수정된 project memory는 보존하며 `.gitignore`는 수정하지 않습니다.

선택적 adapter hook 예시는 내부적으로 `context` 명령을 사용합니다. 이 예시는 read-only이며 `adapters/`에서 수동으로 활성화해야 합니다. `adapter config`로 placeholder 없는 local 설정을 렌더링한 뒤, local settings file을 수동으로 편집한 후 `adapter check --settings <local-settings-path>`로 확인합니다. Operator diagnostics, rules, diagnostics, TUI, adapter 명령 예시는 [명령어 가이드](commands.ko.md)를 봅니다.

Plan과 worklog는 CLI로 생성할 수 있습니다.

```powershell
npx ai-agent-playbook plan new <target-project> --title "Feature slice"
npx ai-agent-playbook worklog new <target-project> --title "Feature slice"
npx ai-agent-playbook worklog summarize <target-project> --month 2026-06
```

일반적인 시작점:

```powershell
$projectRoot = Join-Path $env:USERPROFILE 'Documents\example-project'
Copy-Item .\templates\agents\global\AGENTS.md (Join-Path $projectRoot 'AGENTS.md')
Copy-Item .\templates\project-playbook (Join-Path $projectRoot '.ai-playbook') -Recurse
```

`templates/agents/global/`은 `AGENTS.md`용 프로젝트 루트 부트스트랩 템플릿 폴더입니다. 스킬/Git 정책은 `templates/project-playbook/`에서 복사되는 `.ai-playbook/SKILLS.md`, `.ai-playbook/GIT.md`에 둡니다. 그 다음 stack이 확인된 경우에만 `templates/agents/profiles/**`에서 가장 가까운 profile을 병합하고, 필요한 guide는 `templates/project-playbook/guides/**`에서 고릅니다.

## Codex skill installer 참고

Codex의 skill installer는 인증이 가능할 때 Git repository path에서 개별 스킬을 설치할 수 있습니다. 하지만 이 playbook은 `npx ai-agent-playbook skills install` 또는 전역 `ai-playbook skills update` 경로를 권장합니다.

- 저장소에 여러 스킬이 있습니다.
- 복사용 template과 docs도 함께 있습니다.
- CLI가 `.codex`와 `.agents` layout을 함께 설치합니다.
- PowerShell script는 local checkout workflow용으로 계속 사용할 수 있습니다.

## 외부 작업 흐름 스킬

이 저장소는 외부 작업 흐름 스킬 묶음을 설치하지 않습니다. 별도로 설치한 뒤 필요할 때 이 스킬들과 함께 사용합니다.

프로젝트가 나중에 hook 기반 runtime을 채택하더라도 opt-in으로 유지하고 대상 프로젝트의 `.ai-playbook/`에 문서화합니다. 프로젝트는 문서 하네스만으로도 이해하고 사용할 수 있어야 합니다.
