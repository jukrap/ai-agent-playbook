# 런타임 하네스

`ai-playbook`은 이 저장소를 대상 프로젝트에 적용하기 위한 실행 표면입니다. AI 모델을 호출하지 않습니다. 템플릿을 복사하고, 프로젝트 메모리 상태를 점검하고, 예측 가능한 plan/worklog 파일을 만들어 에이전트가 임의의 markdown 경로를 계속 새로 만들지 않게 합니다.

이 CLI와 project playbook이 기본 하네스입니다. Runtime hook 또는 plugin은 선택 확장이며, 동작이 명시적이고 local이며 쉽게 끌 수 있기 전까지 기본 경로 밖에 둡니다. 단계적 설계는 `runtime-roadmap.ko.md`를 봅니다.

## 명령

```powershell
node .\bin\ai-playbook.mjs bootstrap <target> [--profile <name>] [--local-only] [--dry-run] [--force]
node .\bin\ai-playbook.mjs doctor <target> [--strict] [--json]
node .\bin\ai-playbook.mjs doctor <target> --reminder [--json]
node .\bin\ai-playbook.mjs guides sync <target> [--dry-run] [--force]
node .\bin\ai-playbook.mjs guides sync <target> --check [--diff] [--json]
node .\bin\ai-playbook.mjs migrate path <target> [--apply] [--json]
node .\bin\ai-playbook.mjs context <target> [--json] [--max-chars N]
node .\bin\ai-playbook.mjs rules check <target> [--path <file>] [--json]
node .\bin\ai-playbook.mjs diagnostics check <target> [--json]
node .\bin\ai-playbook.mjs qa tui-check <capture-file> [--cols N] [--json]
node .\bin\ai-playbook.mjs adapter config <target> --adapter codex|claude-code [--json]
node .\bin\ai-playbook.mjs adapter check <target> --adapter codex|claude-code [--json] [--max-chars N] [--settings <path>]
node .\bin\ai-playbook.mjs plan new <target> --title <text> [--date YYYY-MM-DD] [--dry-run] [--force]
node .\bin\ai-playbook.mjs worklog new <target> --title <text> [--date YYYY-MM-DD] [--dry-run] [--force]
node .\bin\ai-playbook.mjs worklog summarize <target> --month YYYY-MM [--dry-run] [--force]
```

공개 뒤에는 같은 CLI를 package `bin`으로 노출해 `ai-playbook` 명령처럼 사용할 수 있습니다.

## Bootstrap 동작

- `templates/project-playbook/`을 `<target>/.ai-playbook/`로 복사합니다.
- `templates/agents/global/AGENTS.md`를 얇은 `<target>/AGENTS.md`로 복사합니다. 이 파일은 프로젝트 루트 부트스트랩이며, Codex의 개인 `~/.codex/AGENTS.md`가 아닙니다.
- `.ai-playbook/SKILLS.md`와 `.ai-playbook/GIT.md`는 project playbook의 일부로 포함됩니다.
- `--profile <name>`이 있으면 `templates/agents/profiles/<name>/AGENTS.md`를 root `AGENTS.md`에 병합합니다.
- `--local-only`가 있으면 대상 `.gitignore`에만 `.ai-playbook/`을 추가합니다.
- 기존 파일은 `--force`가 없으면 덮어쓰지 않습니다.
- 파일을 만들기 전에 예정된 모든 쓰기 작업을 먼저 점검합니다. 충돌이 있으면 부분적인 `.ai-playbook/` 트리를 남기지 않고 충돌만 보고합니다.

호환성: 새 bootstrap 결과는 `.ai-playbook/`을 사용합니다. 다만 `.ai-playbook/`이 없고 기존 `ai-playbook/` 폴더만 있는 프로젝트에서는 runtime 명령이 legacy 폴더를 계속 읽고 씁니다. 두 폴더가 모두 있으면 `.ai-playbook/`을 우선합니다.

## 경로 마이그레이션

`migrate path`는 프로젝트가 legacy `ai-playbook/` 폴더에서 `.ai-playbook/`로 이동할 때 사용합니다.

```powershell
node .\bin\ai-playbook.mjs migrate path <target> --json
node .\bin\ai-playbook.mjs migrate path <target> --apply --json
```

기본 모드는 파일을 쓰지 않는 preview입니다. 폴더 이동, root/playbook 문서의 `ai-playbook/` 참조를 `.ai-playbook/`로 바꾸는 작업, 전환 기간 동안 기존 ignore 항목을 유지하면서 `.gitignore`에 `.ai-playbook/`을 추가해야 하는지 보고합니다.

`--apply`는 preview를 검토한 뒤에만 사용합니다. Apply mode는 폴더를 rename하고, root `AGENTS.md`와 playbook markdown 또는 JSON 파일의 참조를 갱신하며, 필요하면 `.gitignore`에 `.ai-playbook/`을 추가합니다. Network call, hook 설치, 관련 없는 project file 편집은 하지 않습니다.

`ai-playbook/`과 `.ai-playbook/`이 둘 다 있으면 conflict를 보고하고 아무 파일도 쓰지 않습니다.

## Doctor 점검

`doctor`는 최소 `.ai-playbook/` layout, root `AGENTS.md`, root `AGENTS.md`가 핵심 playbook 파일을 가리키는지, 예상치 못한 root `SKILLS.md` 또는 `GIT.md`, local-only 정책, 아직 조정되지 않은 핵심 템플릿 문구, worklog summary freshness, 분리된 예전 스타일 스킬 참조, 고정 로컬 절대경로를 점검합니다. 기본 모드에서는 warning이 실패로 처리되지 않습니다. `--strict` 모드에서는 warning도 실패합니다.

방금 bootstrap한 결과는 `START_HERE.md`, `CURRENT.md`, `questions.md`에 템플릿 문구가 남아 있어 `playbook adaptation` warning을 낼 수 있습니다. 이는 bootstrap 실패가 아니라 저장소 점검 뒤 playbook을 조정하라는 알림입니다.

Hook, wrapper, automation이 안정적인 machine-readable output을 필요로 하면 `--json`을 사용합니다. JSON 계약은 `schemaVersion: "1"`로 versioning되며, `summary`와 `id`, `level`, `category`, `name`, `message`, `paths`를 가진 `checks[]` 항목을 포함합니다. 현재 text output은 사람이 읽는 기본값으로 유지합니다.

Worklog summary freshness check는 read-only입니다. `.ai-playbook/worklogs/YYYY-MM/` 아래 상세 worklog가 있는데 `.ai-playbook/worklogs/summaries/YYYY-MM.md`가 없거나, 같은 달의 상세 entry보다 summary가 오래된 경우 warning을 냅니다.

Wrapper나 script가 전체 doctor report 대신 작은 non-blocking signal만 필요하면 `doctor --reminder --json`을 사용합니다. 반환값은 `{ schemaVersion, ok, target, reminders }`입니다. Reminder 항목은 `{ id, level, message, paths }` 구조입니다. 이 명령은 파일을 쓰지 않고 signal을 출력한 뒤 성공 종료하므로 caller는 `ok`와 `reminders`를 확인해야 합니다.

## 가이드 동기화

`guides sync`는 이 저장소의 현재 가이드 템플릿을 `<target>/.ai-playbook/guides/`로 복사합니다.

- 기본 동작은 기존 가이드 파일을 유지하고, 없는 가이드 파일만 추가합니다.
- 먼저 `--dry-run`으로 추가될 파일을 확인합니다.
- 파일을 쓰지 않고 누락된 가이드만 보고하려면 `--check`를 사용합니다. 자동화에는 `--json`을 추가합니다.
- `--check --json`은 source guide manifest 기준으로 guide template을 비교하고 각 guide를 `present`, `missing`, `stale`로 보고합니다. 항목에는 `sourceHash`와, target file이 있으면 `targetHash`가 포함됩니다.
- `--check`에 `--diff`를 함께 쓰면 stale guide의 첫 차이 line과 source/target line count를 포함합니다. 이 모드도 read-only입니다.
- Stale guide는 기본 check를 실패시키지 않습니다. Local guide edit을 조용히 덮어쓰지 않도록 review signal로만 사용합니다.
- 기존 가이드를 현재 템플릿 버전으로 바꾸기로 결정한 경우에만 `--force`를 사용합니다.
- 이 명령은 `AGENTS.md`, `.ai-playbook/SKILLS.md`, `.ai-playbook/GIT.md`, `CURRENT.md`, plans, worklogs, 프로젝트별 메모리를 수정하지 않습니다.

## Context 출력

`context`는 아래 project playbook 파일에서 hook에 넣기 좋은 compact context를 만듭니다.

- `.ai-playbook/START_HERE.md`
- `.ai-playbook/CURRENT.md`
- `.ai-playbook/SKILLS.md`
- `.ai-playbook/GIT.md`

기본적으로 root `AGENTS.md`를 읽거나 다시 주입하지 않습니다. `--json`을 사용하면 `{ schemaVersion, ok, target, sources, additionalContext, warnings }`를 반환합니다. Hook 환경에 넣을 context 길이를 제한하려면 `--max-chars N`을 사용합니다.

## Operator diagnostics

Diagnostics 명령은 read-only operator signal입니다. 사람이나 agent가 다음에 무엇을 확인할지 판단하게 돕지만, hook을 설치하지 않고, project command를 실행하지 않고, file을 쓰지 않고, network call을 하지 않습니다.

`rules check`는 portable rule file을 찾아 특정 path에 어떤 rule이 적용되는지 보고합니다.

```powershell
node .\bin\ai-playbook.mjs rules check <target> --json
node .\bin\ai-playbook.mjs rules check <target> --path src/example.ts --json
```

Rule discovery는 root `AGENTS.md`를 의도적으로 제외합니다. 지원되는 agent는 보통 이 파일을 native로 읽기 때문입니다. 현재 rule source는 `.ai-playbook/rules/**/*.md`, `.github/instructions/**/*.md`, `.cursor/rules/**/*.md`, `.claude/rules/**/*.md`, `.github/copilot-instructions.md`, `CONTEXT.md`입니다. Directory rule은 `alwaysApply: true` 또는 `globs: ["src/**/*.ts"]` 같은 단순 frontmatter를 사용할 수 있습니다. JSON output은 `{ schemaVersion, ok, target, path, summary, rules, warnings }`를 반환합니다.

`diagnostics check`는 local project metadata를 읽고, 실행하지 않은 상태로 검증 command 후보를 나열합니다.

```powershell
node .\bin\ai-playbook.mjs diagnostics check <target> --json
```

현재는 흔한 `package.json` script와 기본 Python, Rust, Go project marker를 감지합니다. Package script는 `pnpm-lock.yaml`, `yarn.lock`, `package-lock.json`, Bun lockfile 같은 lockfile에서 감지한 package manager 문법으로 렌더링합니다. JSON output에는 `packageManager`가 포함됩니다. Command set이 없어도 failure가 아니라 warning입니다. 일부 프로젝트는 verification을 runbook이나 외부 CI에 둘 수 있기 때문입니다.

`qa tui-check`는 terminal capture에서 width overflow, CJK wide-character column, ANSI 존재 여부, 단순 box-drawing alignment를 확인합니다.

```powershell
node .\bin\ai-playbook.mjs qa tui-check .\capture.txt --cols 100 --json
```

Overflow 또는 border misalignment가 발견되면 이 명령은 non-zero로 종료합니다. Terminal UI, CLI table, log, report, 한국어/일본어/중국어 text layout 확인에 사용합니다. Browser screenshot review는 여전히 대상 프로젝트의 browser tooling 또는 visual QA guide가 담당합니다.

## Adapter config와 준비 점검

`adapter config`는 수동 설정에 붙여 넣을 수 있는 local hook 설정을 렌더링합니다. 이 명령은 read-only입니다. Settings file을 만들지 않고, hook을 설치하지 않고, project file을 편집하지 않고, network call을 하지 않습니다.

```powershell
node .\bin\ai-playbook.mjs adapter config <target> --adapter codex --json
node .\bin\ai-playbook.mjs adapter config <target> --adapter claude-code --json
```

`--json`을 사용하면 `{ schemaVersion, ok, target, adapter, hookCommand, config, warnings }`를 반환합니다. `hookCommand`와 `config`는 현재 checkout 경로를 사용하며 `<path-to-ai-agent-playbook>` placeholder를 포함하지 않습니다. `.ai-playbook/` 폴더가 없어도 config 렌더링은 실패하지 않고 warning으로만 보고합니다.

`adapter check`는 선택적 hook adapter를 수동으로 켜기 전에 실행하는 read-only self-check입니다.

```powershell
node .\bin\ai-playbook.mjs adapter check <target> --adapter codex --json
node .\bin\ai-playbook.mjs adapter check <target> --adapter claude-code --json
node .\bin\ai-playbook.mjs adapter check <target> --adapter codex --settings <local-settings-path> --json
```

이 명령은 대상 경로, `.ai-playbook/`, 비어 있지 않은 core context, adapter hook 파일, 예시 설정, `SessionStart`와 `PostCompact`의 지원 hook JSON, unsupported event 또는 missing playbook context의 quiet behavior를 확인합니다. Hook을 설치하지 않고, project file을 쓰지 않고, network call을 하지 않고, global command도 요구하지 않습니다.

`--settings <path>`는 local settings file을 수동으로 편집한 뒤에만 사용합니다. Settings file 존재 여부, JSON parsing 가능 여부, `SessionStart`와 `PostCompact`가 렌더링된 local hook command를 가리키는지 확인합니다. `--json`을 사용하면 `{ schemaVersion, ok, target, adapter, summary, checks }`를 반환합니다. Check 항목은 `doctor`와 같은 `id`, `level`, `category`, `name`, `message`, `paths` 구조를 사용하므로 hook 또는 setup automation이 사람이 읽는 text를 parsing하지 않고도 일찍 실패할 수 있습니다.

## Adapter package shell

Adapter package shell entrypoint는 같은 hook, config, check helper를 감싸는 선택적 local wrapper입니다. 자동 설치되지 않고 local settings를 바꾸지 않습니다.

```powershell
node .\adapters\codex\package.mjs config <target> --json
node .\adapters\codex\package.mjs check <target> --json
node .\adapters\codex\package.mjs hook
node .\adapters\claude-code\package.mjs config <target> --json
node .\adapters\claude-code\package.mjs check <target> --json
node .\adapters\claude-code\package.mjs hook
```

안정적인 기본 표면은 main CLI입니다. Package shell은 adapter-local experiment와 packaging smoke test를 위한 편의 기능입니다.

## Lifecycle reminder hook

Adapter hook 예시는 기본적으로 context refresh event만 켭니다.

- `SessionStart`
- `PostCompact`

`UserPromptSubmit`, `PostToolUse`, `Stop`은 opt-in reminder event입니다. Local hook 설정에서 `AI_PLAYBOOK_HOOK_EVENTS`를 comma-separated list로 설정한 경우에만 켭니다.

```powershell
$env:AI_PLAYBOOK_HOOK_EVENTS = 'UserPromptSubmit,PostToolUse,Stop'
```

`UserPromptSubmit`은 prompt가 commit, push, PR, merge, worklog, doctor 같은 handoff 작업으로 보일 때만 짧은 guardrail reminder를 출력합니다. `PostToolUse`는 edit-like tool payload에서 변경 file path를 읽을 수 있을 때만 짧은 reminder를 출력합니다. 두 event 모두 `.ai-playbook/`이 없거나, event가 opt-in 되지 않았거나, 관련 intent/path가 없으면 조용히 빠집니다.

`Stop`은 명시적으로 opt in했고 대상에 playbook이 있을 때만 짧은 end-of-session reminder를 출력합니다. 마지막 handoff 알림일 뿐 blocking이나 continuation mechanism이 아닙니다.

이 reminder는 의도적으로 좁게 유지합니다. `doctor`를 실행하지 않고, tool call을 block하지 않고, session을 continuation하지 않고, tool output을 다시 쓰지 않고, file을 쓰지 않고, network call을 하지 않습니다.

## Plan과 worklog 생성

- Plan은 `.ai-playbook/plans/YYYY-MM-DD-<slug>.md`에 생성됩니다.
- Worklog는 `.ai-playbook/worklogs/YYYY-MM/YYYY-MM-DD-<slug>.md`에 생성됩니다.
- 월간 summary는 `.ai-playbook/worklogs/summaries/YYYY-MM.md`에 생성됩니다.

이 파일들은 비어 있는 초안이 아니라, 목표, 범위, 검증, 체크포인트, 근거, 남은 리스크를 기록하도록 유도하는 구조를 포함합니다.

## 설계 제약

- CLI는 대상 프로젝트의 패키지 매니저, framework, test command를 추측하지 않습니다.
- CLI는 `.ai-playbook/`을 커밋할지 local-only로 둘지 자동 결정하지 않습니다. 사용자가 `--local-only`를 명시해야 합니다.
- CLI는 스킬 설치를 대체하지 않습니다. 스킬은 `install.ps1`, `update.ps1`, `scripts/sync-skills.ps1` 흐름으로 관리합니다.
- CLI는 수동 검토를 대체하지 않습니다. 기존 agent docs가 있는 프로젝트에서는 먼저 `--dry-run`을 사용합니다.
- 기본 하네스는 plugin hook, slash command, global install, network access를 요구하지 않습니다.
- 선택적 hook adapter는 context나 reminder만 주입해야 하며 tool output을 다시 쓰거나 project file을 자동 편집하지 않습니다.
