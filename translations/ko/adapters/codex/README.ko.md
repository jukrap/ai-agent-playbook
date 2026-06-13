# Codex 어댑터

Codex는 이 저장소의 스킬이 npm CLI 또는 로컬 checkout으로 Codex 스킬 디렉터리에 복사된 뒤 사용할 수 있습니다.

## Windows용 Codex App

Windows용 Codex App에서는 이 저장소 checkout을 로컬 source of truth로 두고 PowerShell에서 설정을 실행합니다. 대상 저장소 경로에 공백이나 비ASCII 문자가 들어갈 수 있으므로 경로는 변수나 따옴표, `-LiteralPath`로 다룹니다.

Codex에는 서로 다른 두 `AGENTS.md` 계층이 있습니다.

- Codex home 전역: `~/.codex/AGENTS.md`에 두는 개인 기본값. `CODEX_HOME`을 설정하면 다른 디렉터리를 사용합니다.
- 프로젝트 루트: 대상 프로젝트의 `AGENTS.md`에 두는 얇은 부트스트랩. 저장소 playbook 문서로 안내합니다.

`templates/codex-home/AGENTS.md`는 첫 번째 계층용입니다. `templates/agents/global/AGENTS.md`는 두 번째 계층용이며 `ai-playbook bootstrap`이 대상 프로젝트에 쓰는 파일입니다. Skill/Git 정책은 `.ai-playbook/SKILLS.md`와 `.ai-playbook/GIT.md` 아래에 둡니다.

처음 설정할 때의 권장 흐름:

```powershell
npx ai-agent-playbook skills install --dry-run
npx ai-agent-playbook skills install
```

스킬을 동기화한 뒤에는 Codex App을 재시작하거나 새 세션을 시작해 skill metadata가 갱신되게 합니다. 로컬 checkout에서는 `node .\bin\ai-playbook.mjs skills install` 또는 호환용 `.\install.ps1` 스크립트를 사용할 수 있습니다.

선택적 개인 Codex 전역 설정:

```powershell
$playbookRepo = '<path-to-ai-agent-playbook>'
$codexHome = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path $env:USERPROFILE '.codex' }
New-Item -ItemType Directory -Force -Path $codexHome | Out-Null
Copy-Item -LiteralPath (Join-Path $playbookRepo 'templates\codex-home\AGENTS.md') -Destination (Join-Path $codexHome 'AGENTS.md')
```

프로젝트별 규칙은 Codex home 전역 파일에 넣지 않습니다. 대상 프로젝트의 루트 `AGENTS.md`는 진입점으로만 쓰고, 저장소 동작은 `.ai-playbook/` 문서에 둡니다.

기존 프로젝트에는 첫 시도에서 root agent docs를 덮어쓰지 않습니다. 먼저 dry run으로 시작합니다.

```powershell
$targetRepo = '<path-to-target-project>'
npx ai-agent-playbook bootstrap $targetRepo --local-only --dry-run
```

대상 프로젝트에 이미 `AGENTS.md` 또는 `.ai-playbook/`이 있으면 `--force`를 쓰지 말고 conflict를 확인합니다. 더 안전한 시험 경로는 임시 폴더에 scaffold를 만든 뒤 생성된 파일을 보고 프로젝트에 필요한 부분만 수동 병합하는 것입니다.

```powershell
$scratch = Join-Path $env:TEMP 'ai-playbook-scaffold'
Remove-Item -LiteralPath $scratch -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $scratch | Out-Null
npx ai-agent-playbook bootstrap $scratch --local-only
```

레거시 또는 문서가 많은 프로젝트에는 보통 `.ai-playbook/START_HERE.md`, `CURRENT.md`, docs map만 먼저 얹습니다. 기존 worklog와 plan은 사람이 migration을 검토하기 전까지 제자리에 둡니다.

## 로컬 동기화

새 컴퓨터에서의 전체 설정은 `../../../docs/installation.md`를 봅니다. 저장소 루트에서 clone 뒤 한 번 실행합니다.

```powershell
node .\bin\ai-playbook.mjs skills install
```

호환용 PowerShell 경로는 `.\install.ps1`로 계속 사용할 수 있습니다.

같은 컴퓨터에서 나중에 업데이트할 때는:

```powershell
node .\bin\ai-playbook.mjs skills update
```

호환용 PowerShell updater는 `.\update.ps1`로 계속 사용할 수 있습니다.

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

이 저장소에는 프로젝트 하네스 설정과 유지보수를 위한 작은 Node CLI도 포함되어 있습니다. 설치형 Codex 스킬은 아닙니다. Package publish 뒤에는 `npx ai-agent-playbook`, global install 뒤에는 `ai-playbook`, 로컬 checkout에서는 `node .\bin\ai-playbook.mjs`를 사용합니다. Adapter hook path를 settings에 보관할 때는 렌더링된 hook command가 안정적인 위치를 가리키도록 global install 또는 로컬 checkout을 권장합니다.

```powershell
npx ai-agent-playbook bootstrap <target-repo> --dry-run
npx ai-agent-playbook bootstrap <target-repo> --local-only
npx ai-agent-playbook guides sync <target-repo> --dry-run
npx ai-agent-playbook guides sync <target-repo> --check --diff --json
npx ai-agent-playbook migrate path <target-repo> --json
npx ai-agent-playbook doctor <target-repo> --strict
npx ai-agent-playbook doctor <target-repo> --json
npx ai-agent-playbook doctor <target-repo> --reminder --json
npx ai-agent-playbook context <target-repo> --json
npx ai-agent-playbook adapter config <target-repo> --adapter codex --json
npx ai-agent-playbook adapter check <target-repo> --adapter codex --json
npx ai-agent-playbook adapter check <target-repo> --adapter codex --settings <local-settings-path> --json
npx ai-agent-playbook plan new <target-repo> --title "short-plan-title"
npx ai-agent-playbook worklog new <target-repo> --title "short-worklog-title"
```

대상 프로젝트에 반복 가능한 루트 `AGENTS.md`와 `.ai-playbook/` scaffold가 필요하면 CLI를 사용합니다. 코딩 세션 중 재사용할 작업 행동이 필요하면 설치된 skill을 사용합니다.

Codex App에서는 `ai-playbook`을 global command로 설치할 필요가 없습니다. 로컬 checkout에서 안정적인 호출 방식은 아래입니다.

```powershell
node .\bin\ai-playbook.mjs <command>
```

선택적 adapter-local package shell은 Codex adapter를 고정한 같은 hook, config, check 경로를 노출합니다.

```powershell
node .\adapters\codex\package.mjs config <target-repo> --json
node .\adapters\codex\package.mjs check <target-repo> --json
node .\adapters\codex\package.mjs hook
```

이 shell은 자동 설치되지 않고 settings를 쓰지 않으며 packaging 편의 기능일 뿐입니다. 기본 문서 하네스에는 main CLI를 우선 사용합니다.

수동 병합 뒤에는 `doctor`를 실행해 누락된 playbook 파일, 고정 로컬 절대경로, 예전 style skill 참조를 확인합니다.

대상 프로젝트에 이미 `.ai-playbook/`이 있고 이 checkout의 누락된 가이드 템플릿만 가져오려면 `guides sync`를 사용합니다. 기본값은 기존 가이드 파일을 유지합니다. `guides sync --check --diff --json`은 source와 target hash와 첫 차이 line으로 stale guide file도 보고합니다. 가이드 덮어쓰기를 검토한 뒤에만 `--force`를 사용합니다.

Legacy `ai-playbook/`에서 `.ai-playbook/`로 옮기기 전에는 `migrate path --json`으로 먼저 preview합니다. 이 흐름은 hook 설정과 분리되어 있으며 adapter settings를 설치하거나 편집하지 않습니다.

Local wrapper code가 missing playbook, stale guide, worklog summary freshness에 대한 작은 read-only signal만 필요로 하면 `doctor --reminder --json`을 사용합니다. Adapter hook 예시는 이 명령을 자동 실행하지 않습니다.

## 선택적 context hook PoC

`hook.mjs`는 Codex hook 환경을 위한 read-only proof of concept입니다. Stdin에서 hook payload를 읽고, payload의 `cwd`를 대상 프로젝트로 사용하며, 아래 event에서 `hookSpecificOutput.additionalContext`를 출력합니다.

- `SessionStart`
- `PostCompact`

이 hook은 아래 shared runtime context builder를 사용합니다.

```powershell
node .\bin\ai-playbook.mjs context <target-repo> --json
```

Hook은 스스로 설치되지 않고, project file을 편집하지 않고, tool output을 다시 쓰지 않고, network call을 하지 않습니다. `.ai-playbook/`이 없거나 지원되지 않거나 읽을 수 없으면 stdout 없이 성공 종료합니다.

기본적으로 hook은 `SessionStart`와 `PostCompact`만 처리합니다. 좁은 lifecycle reminder를 실험하려면 local에서 명시적으로 opt in합니다.

```powershell
$env:AI_PLAYBOOK_HOOK_EVENTS = 'UserPromptSubmit,PostToolUse,Stop'
```

`UserPromptSubmit`은 commit, push, PR, merge, worklog, doctor 계열 intent에서만 reminder를 냅니다. `PostToolUse`는 edit-like tool payload에서 changed path를 읽을 수 있을 때만 reminder를 냅니다. `Stop`은 짧은 end-of-session handoff reminder만 냅니다. 관련 없는 prompt, missing playbook, unsupported payload에서는 조용히 빠지며, block, session continuation, doctor 실행, file write, network call을 하지 않습니다.

Hook을 local Codex 설정에 연결하기 전에 local config를 렌더링하고 검토합니다.

```powershell
node .\bin\ai-playbook.mjs adapter config <target-repo> --adapter codex --json
```

Renderer는 read-only입니다. 이 checkout의 absolute hook path를 사용한 hook command와 붙여 넣을 수 있는 config를 출력하며, settings file을 쓰거나 output에 placeholder path를 남기지 않습니다.

그 다음 adapter check를 실행합니다.

```powershell
node .\bin\ai-playbook.mjs adapter check <target-repo> --adapter codex --json
```

Failure가 있으면 hook을 켜기 전에 대상 프로젝트나 adapter checkout의 설정 문제로 보고 수정합니다. 이 check는 read-only이며 지원 hook JSON과 quiet unsupported path를 모두 확인합니다.

Local Codex plugin 또는 hook 설정을 수동으로 편집한 뒤에는 settings file도 검증합니다.

```powershell
node .\bin\ai-playbook.mjs adapter check <target-repo> --adapter codex --settings <local-settings-path> --json
```

`hooks.example.json`은 renderer만으로 충분하지 않을 때의 수동 참고용으로만 사용합니다. Timeout은 짧게 유지하고, troubleshooting 중에만 `AI_PLAYBOOK_DEBUG=1`로 debug output을 stderr에 남깁니다.

## 휴대 가능한 지침

다른 컴퓨터에 Codex 계정 수준 사용자 지침이 있다고 의존하지 않습니다. 재사용할 작업 합의는 project `AGENTS.md` template이나 `templates/project-playbook` 문서에 두고, 기기별 경로는 local setup notes에만 둡니다.

루트 수준 project policy에는 `templates/agents/global/AGENTS.md`를 우선 사용합니다. skill/Git 정책은 `templates/project-playbook/SKILLS.md`와 `templates/project-playbook/GIT.md`에 둡니다. 외부 스킬의 hook, slash command, runtime-specific instruction은 Codex 기본값이 아니라 옮겨 해석할 아이디어로 다룹니다.
