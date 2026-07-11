# 사용 수명주기

이 문서는 명령 실행 방식 선택, 재사용 스킬 설치/업데이트/삭제, MCP 수동 등록, `.ai-agent-playbook/` 생성과 제거, 로컬 체크아웃 스크립트 사용까지 전체 흐름을 다룹니다.

이 패키지는 npm 또는 npx로 사용하는 방식이 가장 쉽습니다. 로컬 Git 체크아웃과 PowerShell 스크립트는 개발, 비공개 포크, 명시적인 로컬 스크립트를 선호하는 Windows 환경을 위해 계속 지원합니다.

처음 사용하는 경우에는 [처음 10분 사용법](quick-start.ko.md)을 먼저 보고, 업데이트, 삭제, 로컬 체크아웃, 정리 절차가 필요할 때 이 문서로 돌아오는 흐름을 권장합니다.

세 계층은 서로 다릅니다.

1. npm 패키지는 `aapb` CLI와 함께 묶인 원본 파일을 설치합니다.
2. `skills install`은 재사용 스킬을 사용자 수준 스킬 루트에 복사합니다.
3. `bootstrap`은 대상 저장소 하나에 프로젝트 플레이북을 복사합니다.
4. `mcp`는 MCP를 지원하는 AI 앱이 실행할 때만 로컬 stdio 서버를 시작합니다.

npm 패키지 설치만으로는 스킬 복사, `.ai-agent-playbook/` 생성, 훅 활성화, MCP 설정 등록, 명령 단축 등록이 일어나지 않습니다. 그런 작업은 명시적으로 실행해야 합니다.

## CLI 설치 방식 선택

Node.js를 사용할 수 있을 때 사용합니다. 공개 패키지는 [`ai-agent-playbook`](https://www.npmjs.com/package/ai-agent-playbook)입니다.

`npm i`는 `npm install`의 짧은 별칭입니다. 패키지가 어디에 들어가는지는 범위 옵션이 결정합니다.

| 목표 | 명령 | 결과 |
| ---- | ---- | ---- |
| 도구를 시험하거나 가끔 실행 | `npx ai-agent-playbook --help` | npm이 해당 명령에 필요한 패키지를 받아 실행합니다. 프로젝트 의존성은 추가하지 않습니다. |
| 어느 디렉터리에서든 `aapb` 사용 | `npm install -g ai-agent-playbook` | 전역 명령을 설치합니다. 업데이트는 `npm install -g ai-agent-playbook@latest`를 사용합니다. |
| 한 프로젝트에 도구 고정 | `npm install -D ai-agent-playbook` | 개발 의존성과 `node_modules/ai-agent-playbook`을 추가합니다. 실행은 `npx ai-agent-playbook ...`을 사용합니다. |
| 소스 체크아웃에서 작업 | `node .\bin\aapb.mjs --help` | 체크아웃된 저장소를 직접 실행합니다. |
| AI 앱이 기본 read-only tool을 호출하게 하기 | `npx ai-agent-playbook mcp` | AI 앱의 local stdio MCP server 명령으로 등록합니다. Write surface에는 별도 explicit gate가 필요합니다. |

그냥 `npm install ai-agent-playbook`을 일반적인 첫 단계처럼 쓰지는 않는 편이 좋습니다. 현재 프로젝트의 실행 의존성처럼 추가하고 싶을 때만 사용합니다. 이 명령은 현재 프로젝트의 `node_modules`에 설치하지만, 그래도 스킬 설치나 프로젝트 플레이북 부트스트랩은 하지 않습니다.

## 권장 첫 설정

먼저 읽기 전용 미리보기로 시작합니다.

```powershell
npx ai-agent-playbook --help
npx ai-agent-playbook skills install --dry-run
npx ai-agent-playbook skills install
npx ai-agent-playbook bootstrap <target-project> --dry-run
npx ai-agent-playbook operator check <target-project> --json
```

스킬 설치 뒤에는 새 스킬 메타데이터를 읽도록 Codex를 재시작하거나 새 에이전트 세션을 시작합니다.

짧은 명령이 필요할 때만 전역 설치를 사용합니다.

```powershell
npm install -g ai-agent-playbook
aapb --help
aapb skills check
```

전역 설치 후에는 아래 예시의 `npx ai-agent-playbook`을 `aapb`으로 바꿔 실행할 수 있습니다.

전체 명령어 설명은 [명령어 가이드](commands.ko.md)를 봅니다.

## 선택형 Python 엔진

CLI, 스킬 수명주기, 프로젝트 부트스트랩, MCP 서버에는 Node.js만 있어도 됩니다. 한국어 글과 번역 정리처럼 더 강한 로컬 언어 점검이 필요하면 Python 3.11 이상 설치를 권장합니다. Python 엔진은 읽기 전용이고 선택 사항입니다. 사용할 수 없으면 지원 명령은 JavaScript 대체 분석을 유지합니다.

소스 체크아웃에서는 아래 명령으로 로컬 환경을 준비합니다.

```powershell
.\scripts\bootstrap-python.ps1
node .\bin\aapb.mjs runtime python-status --json
```

npm 또는 전역 설치를 사용하는 경우에는 Python 3.11 이상 가상 환경을 만들고 하네스가 그 Python을 보게 합니다.

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\python -m pip install -U pip kss kiwipiepy
$env:AI_AGENT_PLAYBOOK_PYTHON = ".\.venv\Scripts\python.exe"
npx ai-agent-playbook runtime python-status --json
```

일반적인 글 점검은 `writing naturalness-check --engine auto`를 사용합니다. Python을 무시해야 하면 `--engine js`, Python 누락을 명시적으로 보고해야 하면 `--engine python`을 사용합니다.

## 재사용 스킬 수명주기

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

`skills install`과 `skills update`는 반복 실행해도 안전합니다. 관리 대상 스킬을 일반 Codex/에이전트 스킬 디렉터리로 동기화합니다. 로컬에서 수정한 관리 대상 스킬은 `--force-managed`가 없으면 덮어쓰지 않고, 같은 이름의 다른 관리되지 않는 스킬은 `--force-unmanaged`가 없으면 덮어쓰지 않습니다.

`skills uninstall`은 이 playbook이 설치한 수정되지 않은 관리 대상 스킬만 제거합니다. 먼저 `--dry-run`으로 확인합니다. 관리 대상 스킬을 로컬에서 수정했다면, 유지할지 아니면 `--force-managed`로 의도적으로 지울지 결정할 때까지 중단합니다.

소유권 표식은 각 설치된 스킬 폴더 안의 `.ai-agent-playbook-install.json`입니다. 이 표식에는 `source: "ai-agent-playbook"`과 해시가 들어 있어 CLI가 이 플레이북의 관리 대상 복사본과 다른 사람이 만든 스킬을 구분합니다.

스킬 설치나 업데이트 뒤에는 다음 세션이 스킬 메타데이터를 읽도록 Codex를 재시작합니다.

## 전역 명령 수명주기

전역 npm 패키지와 복사된 스킬은 서로 다릅니다. 전역 패키지를 삭제해도 이미 복사된 스킬은 삭제되지 않습니다.

```powershell
npm install -g ai-agent-playbook@latest
npm uninstall -g ai-agent-playbook
```

복사된 스킬을 제거하려면 `npx ai-agent-playbook skills uninstall` 또는 `aapb skills uninstall`을 사용합니다.

## MCP 등록

MCP는 선택 사항입니다. 로컬 MCP 서버를 지원하는 AI 앱에서 에이전트가 CLI 명령을 외우지 않아도 플레이북 도구를 직접 호출하게 하고 싶을 때 사용합니다.

권장 서버 명령은 아래와 같습니다.

```powershell
npx ai-agent-playbook mcp
```

일반적인 MCP 설정 항목은 아래 형태입니다.

```json
{
  "mcpServers": {
    "ai-agent-playbook": {
      "command": "npx",
      "args": ["ai-agent-playbook", "mcp"]
    }
  }
}
```

전역 설치 뒤에는 짧은 형태도 사용할 수 있습니다.

```json
{
  "mcpServers": {
    "ai-agent-playbook": {
      "command": "aapb",
      "args": ["mcp"]
    }
  }
}
```

이 프로젝트는 사용자의 MCP 설정을 자동으로 수정하지 않습니다. `adapter config <target> --adapter codex --json`도 같은 예시를 렌더링하므로 검토 후 수동으로 복사할 수 있습니다. 기본 MCP tool은 read-only입니다. `--enable-write-tools`는 bounded playbook write를, 독립적인 `--enable-forge-write-tools`는 forge bootstrap/sync apply tool만 켭니다. 모든 write에는 call argument `apply: true`가 필요합니다. 해당 write scope를 계속 허용하려는 경우가 아니면 persistent app configuration에 두 flag를 추가하지 않습니다.

## 어떤 명령이 파일을 쓰는가

| 명령 | 기본으로 쓰는가? | 대상 |
| ---- | ---------------- | ---- |
| `npx ai-agent-playbook --help` | 아니오 | CLI 도움말을 출력합니다. |
| `npx ai-agent-playbook mcp` | 아니오 | AI 앱용 로컬 표준 입출력 MCP 서버를 시작합니다. |
| Write gate를 사용한 MCP tool call | Matching server opt-in과 `apply: true`일 때만 예 | Bounded playbook file 또는 authenticated forge coordination. Task execution과 Git delivery는 제외합니다. |
| `npm install -g ai-agent-playbook` | 예 | npm 전역 패키지 위치만 변경합니다. |
| `npm install -D ai-agent-playbook` | 예 | 현재 프로젝트의 `package.json`, lockfile, `node_modules`를 변경합니다. |
| `skills check` | 아니오 | 스킬 상태를 보고합니다. |
| `skills install` / `skills update` | `--dry-run`이 없으면 예 | 사용자 스킬 루트를 변경합니다. |
| `skills uninstall` | `--dry-run`이 없으면 예 | 사용자 스킬 루트에서 관리 대상 스킬을 제거합니다. |
| `bootstrap <target>` | `--dry-run`이 없으면 예 | 대상 프로젝트의 루트 `AGENTS.md`와 `.ai-agent-playbook/`을 변경합니다. |
| `guides sync <target>` | `--dry-run` 또는 `--check`가 없으면 예 | 대상 프로젝트의 `.ai-agent-playbook/knowledge/references/guides/`를 변경합니다. |
| `context init` | `--dry-run`이 없으면 예 | 대상 프로젝트의 `.ai-agent-playbook/memory/context/`와 `.ai-agent-playbook/memory/maps/doc-map.md`를 변경합니다. |
| `context list/status` | 아니오 | 경로 범위 프로젝트 기억을 읽기 전용으로 점검합니다. |
| `run start/summarize` | `--dry-run`이 없으면 예 | 대상 프로젝트의 `.ai-agent-playbook/workflows/runs/`를 변경합니다. |
| `run record` | 예 | 선택한 실행 장부에 이벤트 하나를 추가합니다. |
| `run status` | 아니오 | 실행 상태를 읽기 전용으로 점검합니다. |
| `plan new --automation` | `--dry-run`이 없으면 예 | Human-readable plan과 `workflow.plan.v2` sidecar를 만듭니다. |
| `plan validate` / `forge status` / `automation doctor/status` | Mutation 없음 | Structured plan, provider, executor, policy, run state를 점검합니다. |
| `forge bootstrap/sync` | `--apply`가 없으면 아니오 | 지원되는 remote coordination asset과 task state를 변경합니다. |
| `forge reconcile` | `--apply`가 없으면 아니오 | Local/remote requirement 차이를 preview하고, apply 시 eligible import 또는 reconciliation pause를 schema v2 run ledger에 기록합니다. |
| `automation start/tick/supervise/pause/resume/stop` | 예 | Schema v2 ledger/evidence와 effective policy에 따른 executor, Git, forge effect가 있습니다. |
| `automation schedule` | `--apply`가 없으면 아니오 | Hosted workflow file 또는 OS schedule을 등록합니다. |
| `contracts init` | `--dry-run`이 없으면 예 | 대상 프로젝트의 `.ai-agent-playbook/memory/contracts/`를 변경합니다. |
| `contracts list/check` | 아니오 | 계약 문서를 읽기 전용으로 점검합니다. |
| `managed adopt/prune/uninstall` | `--apply`가 없으면 아니오 | 대상 프로젝트의 `.ai-agent-playbook/` 관리 파일을 변경합니다. |
| `operator check/search/research/context/analyze/map/audit` | 아니오 | 대상 프로젝트를 읽기 전용으로 진단합니다. |
| `operator analyze --deep` | 아니오 | AST-grep, 정확한 함수 본문 중복 단서, TypeScript/JavaScript 분석 신호를 읽기 전용으로 반환합니다. |
| `operator gc` | `--apply`가 없으면 아니오 | 대상 프로젝트의 오래되고 수정되지 않은 관리 플레이북 파일을 변경합니다. |
| `adapter config/check` | 아니오 | 로컬 어댑터 설정을 렌더링하거나 검증합니다. |

## 선택지 2: GitHub CLI로 빠른 로컬 체크아웃

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

설치기 또는 업데이트가 끝나면 Codex를 재시작합니다.

Windows용 Codex App에서는 이 저장소를 일반 체크아웃으로 유지하고 그 체크아웃에서 PowerShell 명령을 실행합니다. Windows 앱 작업 흐름, 기존 프로젝트 미리보기, 안전한 수동 병합 경로는 `../adapters/codex/README.ko.md`를 봅니다.

## 선택지 3: 일반 Git 설치

GitHub CLI를 쓰지 않거나 일반 `git clone`을 선호할 때 사용합니다.

### 1. Git 인증

비공개 저장소라면 복제 전에 아래 중 하나로 로그인합니다.

- GitHub CLI: `gh auth login`
- `git clone` 중 브라우저 안내를 통한 Git Credential Manager
- 해당 호스트에 설정된 SSH 키

### 2. 저장소 복제

```powershell
$target = Join-Path $env:USERPROFILE 'Documents\ai-agent-playbook'
git clone <repo-url> $target
Set-Location $target
```

원하면 다른 로컬 경로를 사용해도 됩니다. 이 복제본을 기준 원본으로 유지합니다.

### 3. 스킬 설치

```powershell
node .\bin\aapb.mjs skills install --dry-run
node .\bin\aapb.mjs skills install
```

Node CLI는 `skills/<category>/<skill>`의 설치형 스킬을 아래 위치로 복사합니다.

- `%USERPROFILE%\.codex\skills\<skill>`
- `%USERPROFILE%\.agents\skills\<skill>`
- 레거시 스킬은 `%USERPROFILE%\.agents\skills\legacys\<legacy-skill>`

설치된 스킬에는 `.ai-agent-playbook-install.json` 소유권 표식이 추가됩니다. 이후 업데이트는 표식이 있는 관리 대상 스킬, 예전 설치기가 만든 것으로 보이는 동일 내용 비관리 복사본, 또는 사용자가 `--force-unmanaged`를 명시한 비관리 복사본만 교체합니다. 관리 대상 설치본을 로컬에서 수정한 경우 업데이트 명령은 기본적으로 덮어쓰지 않으며, 백업 후 `--force-managed`를 명시해야 교체합니다.

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

## 선택지 4: 기존 복제본 업데이트

```powershell
Set-Location "$env:USERPROFILE\Documents\ai-agent-playbook"
node .\bin\aapb.mjs skills update
```

CLI 업데이트는 현재 체크아웃의 관리 대상 설치 스킬을 갱신합니다. 더 최신 원본이 필요하면 먼저 체크아웃을 가져옵니다. 동기화 뒤에는 Codex를 재시작합니다.

위험한 업데이트 전에는 미리보기를 먼저 사용합니다.

```powershell
node .\bin\aapb.mjs skills update --dry-run
```

호환용 PowerShell 업데이트 스크립트는 여전히 `--ff-only` 가져오기 후 설치기를 실행합니다.

```powershell
.\update.ps1
```

업데이트 명령이 비관리 충돌을 보고하면 해당 폴더를 먼저 확인합니다. 같은 이름의 스킬이 이 플레이북에서 온 것이 확실하거나 의도적으로 대체 가능한 경우가 아니라면 `--force-unmanaged` 또는 `-ForceUnmanaged`를 쓰지 않습니다.

## 선택지 5: 사용자 지정 경로에 수동 동기화

기본 스킬 디렉터리가 아닌 곳을 써야 할 때만 사용합니다.

```powershell
node .\bin\aapb.mjs skills install `
  --codex-root "$env:USERPROFILE\.codex\skills" `
  --agents-root "$env:USERPROFILE\.agents\skills"
```

스킬 수명주기 명령은 기본적으로 다른 사람이 만든 같은 이름의 스킬을 삭제하거나 덮어쓰지 않습니다. 오래된 스킬도 소유권 표식이 이 플레이북 설치본임을 증명할 때만 제거합니다. 로컬 체크아웃 작업 흐름에는 PowerShell `scripts/sync-skills.ps1` 래퍼도 계속 사용할 수 있습니다.

## 프로젝트 플레이북 수명주기

템플릿은 스킬처럼 자동 설치되지 않습니다. 스킬은 사용자 수준 재사용 지침이고, 프로젝트 플레이북은 저장소별 프로젝트 기억입니다. 권장 경로는 런타임 CLI이며, 더 세밀한 제어가 필요할 때만 수동으로 복사하거나 조정합니다.

이 경로가 기본 프로젝트 하네스입니다. 런타임 훅 또는 에이전트 플러그인은 선택 확장이며 `install.ps1`, `update.ps1`, 현재 CLI가 설치하지 않습니다.

프로젝트 수준 작업은 미리보기로 시작합니다.

```powershell
npx ai-agent-playbook bootstrap <target-project> --dry-run
npx ai-agent-playbook operator check <target-project> --json
```

전역 설치 후에는 `npx ai-agent-playbook`을 `aapb`으로 바꿔 실행합니다. 로컬 체크아웃에서는 `node .\bin\aapb.mjs`로 바꿔 실행합니다. 프로젝트 플레이북, 문맥, 실행 기록, 계약, 관리 파일 정리, 운영자 점검, 어댑터, 계획, 작업 기록 명령 전체 목록은 [명령어 가이드](commands.ko.md)를 봅니다.

대상 스택이 확인된 뒤에만 `--profile <name>`을 사용합니다. `.ai-agent-playbook/`을 대상 `.gitignore`에 추가해야 하면 `--local-only`를 사용합니다.

이미 `.ai-agent-playbook/`이 있는 프로젝트에서 새 플레이북 체크아웃의 누락된 가이드 템플릿만 가져오려면 `guides sync`를 사용합니다. `guides sync --check --json`은 원본과 대상 해시를 사용해 오래된 가이드도 보고하고, `--diff`를 추가하면 파일을 쓰지 않고 첫 차이 줄을 보여줍니다. 이 명령은 `--force`로 가이드 파일 덮어쓰기를 명시하지 않는 한 루트 `AGENTS.md`, 플레이북 정책 파일, 프로젝트별 메모를 수정하지 않습니다.

런타임 명령은 `.ai-agent-playbook/`을 활성 project playbook root로 사용합니다. 새 부트스트랩 결과는 `.ai-agent-playbook/`을 사용하고, 기존 `ai-playbook/` 폴더는 `migrate path`에서만 다룹니다. 레거시 폴더 이동과 참조 갱신은 먼저 `migrate path --json`으로 미리 보고, 검토한 뒤에만 `--apply`를 추가합니다.

`bootstrap`과 `guides sync`는 프로젝트 수준 표식인 `.ai-agent-playbook/.ai-agent-playbook-install.json`을 관리합니다. `managed check`로 확인하고, `managed catalog`로 소유 파일을 종류와 상태별로 검토하고, 오래된 일치 설치본에는 `managed adopt --apply`를, 선택한 수정되지 않은 관리 파일 제거에는 `managed prune --apply --path <managed-path>`를, 전체 수정되지 않은 관리 파일 제거에는 `managed uninstall --apply`를 사용합니다. 정리와 제거 명령은 로컬에서 수정된 파일을 보존하고 `.gitignore` 정리는 작업자에게 맡깁니다.

대상 저장소에서 프로젝트 플레이북을 제거할 때는 아래 미리보기 우선 흐름을 사용합니다.

```powershell
npx ai-agent-playbook managed check <target-project> --json
npx ai-agent-playbook managed uninstall <target-project> --json
npx ai-agent-playbook managed uninstall <target-project> --apply --json
```

`managed uninstall --apply`는 `.ai-agent-playbook/.ai-agent-playbook-install.json`에 기록되어 있고 현재 해시가 manifest와 같은 파일만 제거합니다. 수정된 프로젝트 기억은 보존하며 `.gitignore`는 수정하지 않습니다.

선택적 어댑터 훅 예시는 내부적으로 `context` 명령을 사용합니다. 이 예시는 읽기 전용이며 `adapters/`에서 수동으로 활성화해야 합니다. `adapter config`로 자리표시자가 없는 로컬 설정을 렌더링한 뒤, 로컬 설정 파일을 수동으로 편집하고 `adapter check --settings <local-settings-path>`로 확인합니다. 운영자 진단, 규칙, TUI, 어댑터 명령 예시는 [명령어 가이드](commands.ko.md)를 봅니다.

Context, run, contract, plan, worklog는 CLI로 생성할 수 있습니다.

```powershell
npx ai-agent-playbook context init <target-project> --dry-run
npx ai-agent-playbook run start <target-project> --title "Feature slice" --dry-run
npx ai-agent-playbook contracts init <target-project> --dry-run
npx ai-agent-playbook plan new <target-project> --title "Feature slice"
npx ai-agent-playbook worklog new <target-project> --title "Feature slice"
npx ai-agent-playbook worklog summarize <target-project> --month 2026-06
```

일반적인 시작점:

```powershell
$projectRoot = Join-Path $env:USERPROFILE 'Documents\example-project'
Copy-Item .\templates\agents\global\AGENTS.md (Join-Path $projectRoot 'AGENTS.md')
Copy-Item .\templates\project-playbook (Join-Path $projectRoot '.ai-agent-playbook') -Recurse
```

`templates/agents/global/`은 `AGENTS.md`용 프로젝트 루트 부트스트랩 템플릿 폴더입니다. 스킬/Git 정책은 `templates/project-playbook/`에서 복사되는 `.ai-agent-playbook/policy/SKILLS.md`, `.ai-agent-playbook/policy/GIT.md`에 둡니다. 그 다음 스택이 확인된 경우에만 `templates/agents/profiles/**`에서 가장 가까운 프로필을 병합하고, 필요한 가이드는 `templates/project-playbook/knowledge/references/guides/**`에서 고릅니다.

## Codex 스킬 설치기 참고

Codex의 스킬 설치기는 인증이 가능할 때 Git 저장소 경로에서 개별 스킬을 설치할 수 있습니다. 하지만 이 플레이북은 `npx ai-agent-playbook skills install` 또는 전역 `aapb skills update` 경로를 권장합니다.

- 저장소에 여러 스킬이 있습니다.
- 복사용 템플릿과 문서도 함께 있습니다.
- CLI가 `.codex`와 `.agents` 배치를 함께 설치합니다.
- PowerShell 스크립트는 로컬 체크아웃 작업 흐름용으로 계속 사용할 수 있습니다.

## 외부 작업 흐름 스킬

이 저장소는 외부 작업 흐름 스킬 묶음을 설치하지 않습니다. 별도로 설치한 뒤 필요할 때 이 스킬들과 함께 사용합니다.

프로젝트가 나중에 훅 기반 런타임을 채택하더라도 명시적 선택으로 유지하고 대상 프로젝트의 `.ai-agent-playbook/`에 문서화합니다. 프로젝트는 문서 하네스만으로도 이해하고 사용할 수 있어야 합니다.
