# 명령어 가이드

이 문서는 AI Agent Playbook 명령어 설명서입니다. 각 명령이 무엇을 하는지, 파일을 쓰는지, 어떤 순서로 실행하면 안전한지 설명합니다.

처음 사용하는 경우에는 전체 설명서를 보기 전에 [처음 10분 사용법](quick-start.ko.md)을 먼저 읽는 것을 권장합니다.

설치, 업데이트, 삭제, npm 사용 방식은 [사용 수명주기](lifecycle.ko.md)를 보세요. 런타임 설계와 JSON 계약 설명은 [런타임 하네스](harness-runtime.ko.md)를 보세요.

## 명령 실행 방식

아래 세 가지 형태 중 하나를 사용합니다.

| 형태 | 언제 쓰나 |
| ---- | --------- |
| `npx ai-agent-playbook ...` | 현재 프로젝트에 의존성을 추가하지 않고 최신 배포 패키지를 실행할 때 기본으로 사용합니다. |
| `aapb ...` | `npm install -g ai-agent-playbook` 뒤에 짧은 전역 명령을 쓰고 싶을 때 사용합니다. |
| `node .\bin\aapb.mjs ...` | 이 저장소를 체크아웃한 폴더 안에서 직접 실행할 때 사용합니다. |
| `npx ai-agent-playbook mcp` | AI 앱이 기본 읽기 전용 플레이북 도구를 호출하게 할 때 로컬 표준 입출력 MCP 서버 명령으로 등록합니다. `--enable-write-tools`와 `--enable-forge-write-tools`는 서로 독립적인 명시적 opt-in입니다. |

아래 예시의 `npx ai-agent-playbook`은 설치 방식에 따라 `aapb` 또는 `node .\bin\aapb.mjs`로 바꿔 실행할 수 있습니다.

`<target>` 또는 `<target-project>`는 플레이북을 적용하거나 검사할 대상 프로젝트 폴더입니다. 터미널이 이미 그 프로젝트 안에 있다면 `.`을 쓸 수 있습니다.

### 예시 입력 방법

- 꺾쇠괄호를 그대로 입력하지 않습니다. `<target-project>`, `<file>`, `<text>`, `<run-id>` 같은 자리표시자를 실제 값으로 바꿉니다.
- 이미 대상 프로젝트 폴더 안에 있다면 target으로 `.`을 쓰는 편이 간단합니다.
- 공백이 있는 경로나 문장은 따옴표로 감쌉니다. 예: `".\example app"`, `"auth flow change"`.
- `--path <file>`은 보통 대상 프로젝트 안의 경로입니다. 예: `src/example.ts`. 절대 경로일 필요는 없습니다.
- 익숙하지 않다면 명령은 한 줄로 입력합니다. PowerShell에서 긴 명령을 여러 줄로 나눌 때만 backtick을 사용합니다.
- `> preflight.json` 같은 redirection은 shell이 처리합니다. CLI는 JSON을 출력하고, shell이 파일로 저장합니다.
- 공유 예시에는 개인 폴더, 고객명, 자격 증명, 내부 URL을 넣지 않습니다. 대신 `<target-project>` 같은 자리표시자를 사용합니다.

터미널이 대상 프로젝트 안에 있다면 아래처럼 쓸 수 있습니다.

```powershell
npx ai-agent-playbook operator check . --json
npx ai-agent-playbook operator search . --query "auth flow" --json
```

대상 경로에 공백이 있으면 따옴표로 감쌉니다.

```powershell
npx ai-agent-playbook bootstrap ".\example app" --dry-run
```

## 공통 옵션

| 옵션 | 의미 |
| ---- | ---- |
| `--dry-run` | 파일을 쓰는 작업을 미리 보기만 합니다. install, update, bootstrap, guide sync 전에 먼저 사용합니다. |
| `--check` | 파일을 쓰지 않고 상태를 확인합니다. guide sync에서 사용합니다. |
| `--json` | 기계가 읽기 쉬운 출력을 냅니다. 에이전트, script, 자세한 점검에 유용합니다. |
| `--apply` | Path migration, remote forge bootstrap/sync, scheduler 설치 같은 preview-first 명령을 실제로 적용합니다. |
| `--force` | 기본적으로 거부되는 overwrite를 허용합니다. 출력 내용을 검토한 뒤에만 사용합니다. |
| `--force-managed` | 로컬 hash가 바뀐 managed skill도 덮어쓰거나 삭제합니다. |
| `--force-unmanaged` | 같은 이름의 unmanaged skill을 이 playbook이 소유하도록 전환합니다. 이 playbook에서 온 것이 확실할 때만 사용합니다. |

명령별 option은 필요한 곳에서 사용합니다.

| 옵션 | 쓰는 곳 |
| ---- | ------- |
| `--path <file>` | rule, context, search, research, ledger, operator check를 한 file 또는 영역으로 좁힐 때 사용합니다. |
| `--query <text>` | 검색 또는 조사할 주제입니다. |
| `--intent <text>` | `operator preflight`에서 점검할 예정 작업 설명입니다. |
| `--max-results N` | search 또는 research 출력 개수를 제한합니다. |
| `--to structured` | `migrate layout`의 대상 레이아웃을 선택합니다. |
| `--max-chars N` | 생성되는 context 크기를 제한합니다. |
| `--strict` | doctor warning도 실패로 처리합니다. |
| `--reminder` | 전체 doctor report 대신 작은 reminder signal을 반환합니다. |
| `--profile <name>` | Stack-specific bootstrap profile을 추가하거나 configured authority보다 넓지 않은 automation profile을 요청합니다. |
| `--local-only` | bootstrap 중 대상 프로젝트 `.gitignore`에 `.ai-agent-playbook/`을 추가합니다. |
| `--title <text>` | 생성할 plan, worklog, run 제목입니다. |
| `--month YYYY-MM` | worklog summary 대상 월입니다. |
| `--cols N` | `qa tui-check`에서 기대하는 terminal width입니다. |
| `--run-id <id>` | `.ai-agent-playbook/workflows/runs/` 아래 특정 run을 선택합니다. |
| `--recipe <id>` | `workflow run-preview`에서 workflow recipe를 선택합니다. |
| `--user-config <path>` | `config preview`에 명시적인 user-level config file을 추가합니다. 그래도 target-local config가 우선합니다. |
| `--type note|criterion|evidence|blocker|cleanup` | `run record`에 기록할 event type입니다. |
| `--status pass|fail|blocked|info` | `run record`에 기록할 event status입니다. |
| `--evidence <path>` | `run record`에 남길 portable relative evidence path입니다. |
| `--before <preflight-json>` | 이전에 `operator preflight --json`으로 저장한 JSON 파일입니다. |
| `--contract <id>` | `contracts snapshot`을 특정 contract id 하나로 제한합니다. |
| `--threshold N` | 허용할 image diff ratio입니다. `0`부터 `1`까지 쓰며, `0`은 픽셀이 하나라도 바뀌면 실패입니다. |
| `--deep` | `operator analyze`에 AST-grep, 정확한 함수 본문 중복 단서, TypeScript/JavaScript 언어 분석 signal을 추가합니다. |
| `--engine auto\|js\|python` | `writing naturalness-check`의 글 분석 엔진을 고릅니다. `auto`는 Python이 있으면 함께 쓰고 JavaScript 대체 분석도 유지합니다. |
| `--root <dir>` | `writing naturalness-report`에서 검사할 대상 프로젝트 안의 폴더입니다. |
| `--max-files N` | 제한된 보고 명령이 살펴볼 글 파일 개수를 제한합니다. |
| `--provider auto\|github\|gitea` | Forge provider 탐지를 선택하거나 제한합니다. 확정할 수 없는 self-hosted provider에는 쓰기를 허용하지 않습니다. |
| `--remote <name>` | `forge status`가 inspect할 Git remote를 선택합니다. 지속 설정에는 project config를 사용합니다. |
| `--lang auto\|ko\|en` | `plan new --automation`이 기록하는 human-facing language를 선택합니다. |
| `--no-remote` | 이번 호출의 forge API와 remote Git delivery를 끄고 허용된 local work는 유지합니다. |
| `--remote-read-only` | Forge 조회는 허용하지만 forge mutation과 remote Git delivery를 끕니다. |
| `--no-git` | 이번 호출의 branch, commit, tag, push를 끕니다. |
| `--offline` | Network access를 끕니다. Harness가 process-level network isolation을 증명할 수 없으므로 `automation tick`과 `supervise`는 executor 실행 전에 fail-closed합니다. Agent network를 사용할 수 있는 local execution에는 `--no-remote`를 사용합니다. |
| `--no-interactive` | Configured isolated workspace policy로 automation tick 또는 supervisor를 unattended mode에서 실행합니다. |
| `--approve-review` | 검증 뒤 `review` 상태에서 기다리는 task에 explicit review gate를 제공합니다. |
| `--enable-github-agent-task` | `github-agent-task` executor adapter의 explicit preview selection을 허용합니다. 자동 선택되지는 않습니다. |
| `--instruction <text>` | 현재 요청의 restriction을 forge/automation policy resolver에 전달합니다. 명확한 remote opt-out은 권한을 줄일 수 있지만 확대하지 못합니다. |
| `--platform <name>` | `automation schedule`에서 `github-actions`, `gitea-actions`, `windows-task`, `systemd-user` 중 하나를 선택합니다. |

## 처음 설정할 때

재사용 스킬과 대상 프로젝트 playbook을 설정하려면 아래 순서로 시작합니다.

```powershell
npx ai-agent-playbook --help
npx ai-agent-playbook skills install --dry-run
npx ai-agent-playbook skills install
npx ai-agent-playbook bootstrap <target-project> --dry-run
npx ai-agent-playbook bootstrap <target-project>
npx ai-agent-playbook operator check <target-project> --json
```

`skills install`은 사용자 수준 skill 폴더를 바꿉니다. `bootstrap`은 대상 프로젝트를 바꿉니다. 둘은 별도 단계입니다.

## 스킬

스킬은 재사용 가능한 사용자 수준 지침입니다. 각 대상 저장소 안이 아니라 Codex와 에이전트의 일반 스킬 루트에 설치됩니다.

| 명령 | 언제 쓰나 | 파일을 쓰나 | 예시 |
| ---- | --------- | ----------- | ---- |
| `skills check` | 이 플레이북의 스킬이 설치됐는지, 누락됐는지, 수정됐는지, 같은 이름의 비관리 복사본과 충돌하는지 봅니다. | 아니오 | `npx ai-agent-playbook skills check --json` |
| `skills lint` | 공개 전 원본 `SKILL.md`의 사용 조건 중심 설명, frontmatter 형태, 누락된 참고 링크, 얕은 참고 파일을 점검합니다. | 아니오 | `npx ai-agent-playbook skills lint --json` |
| `skills install` | 재사용 스킬을 처음 설치합니다. | `--dry-run`이 없으면 예 | `npx ai-agent-playbook skills install --dry-run` 뒤 `npx ai-agent-playbook skills install` |
| `skills update` | 패키지나 체크아웃이 바뀐 뒤 설치된 관리 대상 스킬을 갱신합니다. | `--dry-run`이 없으면 예 | `npx ai-agent-playbook skills update --dry-run` 뒤 `npx ai-agent-playbook skills update` |
| `skills uninstall` | 이 플레이북이 설치한 수정되지 않은 관리 대상 스킬을 제거합니다. | `--dry-run`이 없으면 예 | `npx ai-agent-playbook skills uninstall --dry-run` 뒤 `npx ai-agent-playbook skills uninstall` |

스킬 명령은 `.ai-agent-playbook-install.json` 표식과 내용 해시를 사용합니다. 기본적으로 다른 사람이 만든 스킬은 제거하지 않습니다.

## 프로젝트 플레이북

프로젝트 플레이북 명령은 대상 저장소 하나의 `.ai-agent-playbook/`을 관리합니다.

| 명령 | 언제 쓰나 | 파일을 쓰나 | 예시 |
| ---- | --------- | ----------- | ---- |
| `bootstrap <target>` | 대상 프로젝트에 root `AGENTS.md`와 `.ai-agent-playbook/` 구조를 만듭니다. | `--dry-run`이 없으면 예 | `npx ai-agent-playbook bootstrap <target-project> --dry-run` |
| `guides sync <target>` | 기존 `.ai-agent-playbook/knowledge/references/guides/`에 누락된 guide template을 복사합니다. | `--dry-run` 또는 `--check`가 없으면 예 | `npx ai-agent-playbook guides sync <target-project> --check --diff --json` |
| `migrate path <target>` | legacy `ai-playbook/`에서 `.ai-agent-playbook/`로 이동하는 작업을 preview하거나 적용합니다. | `--apply`가 있을 때만 예 | `npx ai-agent-playbook migrate path <target-project> --json` |
| `migrate layout <target>` | 구조화 `.ai-agent-playbook` 디렉터리, 구 레이아웃 이동, 참조 갱신, 보관 작업을 미리 보거나 적용합니다. | `--apply`가 있을 때만 예 | `npx ai-agent-playbook migrate layout <target-project> --to structured --json` |
| `layout status <target>` | 대상 플레이북에 구조화 레이아웃 파일과 디렉터리가 있는지 보고합니다. | 아니오 | `npx ai-agent-playbook layout status <target-project> --json` |
| `doctor <target>` | project playbook 상태, adaptation 상태, worklog summary freshness, local path risk를 점검합니다. | 아니오 | `npx ai-agent-playbook doctor <target-project> --json` |
| `config preview <target>` | built-in 값, 명시적 user config, target config, target-local config, 좁은 env override 순서로 플레이북 기본값을 해석합니다. | 아니오 | `npx ai-agent-playbook config preview <target-project> --json` |
| `context <target>` | 선택적 hook 또는 점검용으로 core `.ai-agent-playbook/` 파일에서 compact context를 만듭니다. | 아니오 | `npx ai-agent-playbook context <target-project> --json` |
| `context list <target>` | `.ai-agent-playbook/memory/context/**/*.md` 파일과 frontmatter를 나열합니다. | 아니오 | `npx ai-agent-playbook context list <target-project> --json` |
| `context status <target>` | 한 파일에 적용되는 경로별 문맥과 `memory/maps/doc-map.md` 존재 여부를 보여줍니다. | 아니오 | `npx ai-agent-playbook context status <target-project> --path src/example.ts --json` |
| `context init <target>` | starter `memory/context/root.md`, `_registry.json`, `memory/maps/doc-map.md`를 만듭니다. | `--dry-run`이 없으면 예 | `npx ai-agent-playbook context init <target-project> --dry-run --json` |

대상 프로젝트의 `.ai-agent-playbook/`을 `.gitignore`에 추가해야 하면 `bootstrap`에 `--local-only`를 사용합니다.

`config preview`는 존재하는 경우 `.ai-agent-playbook/config.json`과 `.ai-agent-playbook/config.local.json`을 읽습니다. 두 파일을 생성하지는 않습니다. 우선순위는 built-in default, optional `--user-config`, target config, target-local config, 명시적 environment override입니다.

0.5.4 기본값에는 `automation`, `forge`, `git`, `executor` section이 추가됩니다. `automation.profile: "deliver"`, `automation.killSwitch: false`, 한 번에 task 하나, 30분 tick, attempt 3회, stall 3회, 전체 8시간, `forge.provider: "auto"`, remote `origin`, `forge.apiBaseUrl: null`, hybrid sync, working language 자동 선택, 첫 sync bootstrap, branch delivery, isolated unattended checkout, executor 자동 선택을 사용합니다. Custom port 또는 subpath의 self-hosted Gitea에는 `https://code.example/gitea/api/v1` 같은 credential-free API base를 설정합니다. Embedded credential, query string, fragment, non-local HTTP URL은 거부합니다. 이 기본값만으로 run이 시작되거나 schedule이 설치되지는 않습니다. Copy 가능한 `forge.example.json`은 안전한 도입을 위해 kill switch를 의도적으로 `true`로 바꿉니다. `automation start`는 쓰기 명령이며 effective remote-write permission이 있으면 approved plan을 coordinate하고 누락된 managed asset을 자동 bootstrap할 수 있습니다. Local run만 만들려면 forge preview를 먼저 확인하고 `--no-remote`를 사용합니다.

Automation 환경 변수는 기존 context/runtime/MCP 변수 외에 `AI_AGENT_PLAYBOOK_AUTOMATION_PROFILE`, `AI_AGENT_PLAYBOOK_AUTOMATION_KILL_SWITCH`, `AI_AGENT_PLAYBOOK_AUTOMATION_MAX_PARALLEL`, `AI_AGENT_PLAYBOOK_AUTOMATION_TICK_MINUTES`, `AI_AGENT_PLAYBOOK_AUTOMATION_MAX_ATTEMPTS`, `AI_AGENT_PLAYBOOK_AUTOMATION_MAX_STALLED`, `AI_AGENT_PLAYBOOK_AUTOMATION_MAX_WALL_MINUTES`, `AI_AGENT_PLAYBOOK_FORGE_PROVIDER`, `AI_AGENT_PLAYBOOK_FORGE_REMOTE`, `AI_AGENT_PLAYBOOK_FORGE_SYNC`, `AI_AGENT_PLAYBOOK_FORGE_LANGUAGE`, `AI_AGENT_PLAYBOOK_FORGE_AUTO_BOOTSTRAP`, `AI_AGENT_PLAYBOOK_GIT_AUTO_COMMIT`, `AI_AGENT_PLAYBOOK_GIT_AUTO_PUSH`, `AI_AGENT_PLAYBOOK_EXECUTOR_PROVIDER`로 제한합니다. Custom executor 설정은 interpolated shell command가 아니라 `["agent-cli", "--json"]` 같은 argv array입니다.

현재 요청의 deny flag와 명확한 opt-out instruction은 config 뒤에 적용됩니다. 더 넓은 profile, remote write, Git delivery, network access를 활성화할 수는 없습니다.

Context file은 `id`, `globs`, `alwaysApply`, `freshness`, `priority` frontmatter를 지원합니다. 특정 path 작업 전에 어떤 project memory를 읽어야 할지 보려면 `context status`를 사용합니다. 이 명령은 read-only라 자주 실행해도 안전합니다.

`CURRENT.md`에는 현재 기준선 사실, 활성 리스크, 결정, 프로젝트별 working vocabulary를 둡니다. 더 큰 구조 사실, scan range, clone 또는 duplicate-code cue는 map에 두어 `CURRENT.md`를 긴 보고서로 만들지 않고도 검토 가능하게 유지합니다.

`.ai-agent-playbook/`이 너무 커 보이면 더 많은 메모를 읽기 전에 읽을 범위를 좁힙니다. `operator context --path <file> --json`을 실행한 뒤, 특정 관심사는 `operator search` 또는 `index search`로 찾습니다. 일치하는 map, runbook, contract, guide, worklog만 읽고, 검토된 사실은 runtime report를 통째로 복사하지 말고 `memory/` 또는 `knowledge/`로 승격합니다.

## 카탈로그와 런타임

아래 명령은 능력 모델과 생성된 로컬 런타임 표면을 보여줍니다. 코드 수정 전에 안전하게 실행할 수 있습니다.

| 명령 | 언제 쓰나 | 파일을 쓰나 | 예시 |
| ---- | --------- | ----------- | ---- |
| `catalog list` | capability category와 skill/workflow 개수를 나열합니다. | 아니오 | `npx ai-agent-playbook catalog list --json` |
| `catalog check` | skill taxonomy, duplicate name, wrapper route, wrapper reference를 검증합니다. | 아니오 | `npx ai-agent-playbook catalog check --json` |
| `workflow list` | built-in workflow recipe를 나열합니다. | 아니오 | `npx ai-agent-playbook workflow list --json` |
| `workflow run-preview <target>` | target 또는 bundled recipe에서 workflow run manifest를 run file 생성 없이 preview합니다. | 아니오 | `npx ai-agent-playbook workflow run-preview <target-project> --recipe backend-contract-change --json` |
| `workflow run-start <target>` | `.ai-agent-playbook/workflows/runs/` 아래 제한된 scaffold-tier run record를 preview하거나 생성합니다. | `--apply`가 있을 때만 예 | `npx ai-agent-playbook workflow run-start <target-project> --recipe deployment-release --json` |
| `reference inventory <reference-dir>` | 채택할 항목을 판단하기 전에 local reference collection을 요약합니다. | 아니오 | `npx ai-agent-playbook reference inventory _reference --json` |
| `reference inspect <reference-dir>` | Source content를 복사하지 않고 하나의 top-level reference project를 compact adoption review packet으로 inspect합니다. | 아니오 | `npx ai-agent-playbook reference inspect _reference --project hermes-agent-main --json` |
| `reference adoption-queue <reference-dir>` | local reference collection을 compact adoption backlog로 점수화하고 필요하면 ledger status를 붙입니다. | 아니오 | `npx ai-agent-playbook reference adoption-queue _reference --ledger .ai-agent-playbook/knowledge/reference-adoption-ledger.md --json` |
| `reference capability-matrix <reference-dir>` | 점수화된 reference candidate를 capability별로 묶고 optional capability filter와 ledger status annotation을 제공합니다. | 아니오 | `npx ai-agent-playbook reference capability-matrix _reference --capability ai-harness --json` |
| `reference adoption-plan <reference-dir>` | Matrix와 inspect packet에서 bounded capability-focused planning packet을 만듭니다. | 아니오 | `npx ai-agent-playbook reference adoption-plan _reference --capability runtime-index-canon --json` |
| `reference adoption-status <target>` | Local reference queue를 target source registry 및 adoption ledger 상태와 대조합니다. | 아니오 | `npx ai-agent-playbook reference adoption-status <target-project> --reference-dir _reference --json` |
| `reference source-registry-preview <reference-dir>` | Adoption queue item을 쓰기 없이 `knowledge/sources.json` 후보로 변환합니다. | 아니오 | `npx ai-agent-playbook reference source-registry-preview _reference --json` |
| `reference source-registry-check <target>` | `knowledge/sources.json` schema, freshness, duplicate, optional local reference path drift를 검증합니다. | 아니오 | `npx ai-agent-playbook reference source-registry-check <target-project> --reference-dir _reference --json` |
| `reference source-registry-update <target>` | Local reference queue에서 누락된 `knowledge/sources.json` reference entry를 preview하거나 append합니다. | `--apply`가 있을 때만 예 | `npx ai-agent-playbook reference source-registry-update <target-project> --reference-dir _reference --json` |
| `reference ledger-init <target>` | Local reference queue에서 missing reference adoption ledger를 preview하거나 생성합니다. | `--apply`가 있을 때만 예 | `npx ai-agent-playbook reference ledger-init <target-project> --reference-dir _reference --json` |
| `reference ledger-update <target>` | Local reference queue에서 누락된 reference adoption ledger row를 preview하거나 append합니다. | `--apply`가 있을 때만 예 | `npx ai-agent-playbook reference ledger-update <target-project> --reference-dir _reference --json` |
| `reference ledger-decision <target>` | 기존 reference adoption ledger row 하나의 decision을 preview하거나 update합니다. | `--apply`가 있을 때만 예 | `npx ai-agent-playbook reference ledger-decision <target-project> --reference reference-pack --status reviewed --json` |
| `reference ledger-check <target>` | reference adoption ledger의 status 값과 local-only leak를 검증합니다. | 아니오 | `npx ai-agent-playbook reference ledger-check <target-project> --json` |
| `runtime python-status` | 선택형 로컬 Python 엔진이 사용 가능한지, 어떤 인터프리터가 선택됐는지 보고합니다. | 아니오 | `npx ai-agent-playbook runtime python-status --json` |
| `runtime capability-history <target>` | benchmark나 telemetry를 실행하지 않고 local append-only capability history를 요약합니다. | 아니오 | `npx ai-agent-playbook runtime capability-history <target-project> --json` |
| `runtime schema-check <target>` | runtime eval, witness, evidence-envelope, repo-graph, artifact, source-registry JSON을 파일 쓰기 없이 검증합니다. | 아니오 | `npx ai-agent-playbook runtime schema-check <target-project> --path .ai-agent-playbook/runtime/reports/evals/example.json --json` |
| `evidence locator-check <target>` | JSON 또는 Markdown evidence locator의 portable path, scan range, source boundary, freshness, credential-looking value를 확인합니다. | 아니오 | `npx ai-agent-playbook evidence locator-check <target-project> --path .ai-agent-playbook/runtime/reports/evidence/example.json --json` |
| `index build <target>` | `.ai-agent-playbook/runtime/indexes/file-inventory.json` 생성을 preview하거나 씁니다. | `--apply`가 있을 때만 예 | `npx ai-agent-playbook index build <target-project> --json` |
| `index status <target>` | runtime file inventory 존재 여부를 확인합니다. | 아니오 | `npx ai-agent-playbook index status <target-project> --json` |
| `index search <target>` | runtime index를 쓰지 않고 local project text를 검색합니다. | 아니오 | `npx ai-agent-playbook index search <target-project> --query "auth flow" --json` |
| `index symbol-outline <target>` | function, class, component, method, binding hint를 file, line, confidence, source pattern metadata와 함께 preview합니다. | 아니오 | `npx ai-agent-playbook index symbol-outline <target-project> --json` |
| `index dependency-inventory <target>` | dependency manifest, lockfile, container base image, package script, CI action usage를 script 실행이나 network scan 없이 preview합니다. | 아니오 | `npx ai-agent-playbook index dependency-inventory <target-project> --json` |
| `index route-api-hints <target>` | route, client API, SQL query, migration, data-object hint를 source pattern metadata와 함께 preview합니다. | 아니오 | `npx ai-agent-playbook index route-api-hints <target-project> --json` |
| `graph preview <target>` | runtime file, symbol, route/API, dependency signal을 조합한 compact generated graph를 preview합니다. | 아니오 | `npx ai-agent-playbook graph preview <target-project> --json` |
| `canon draft <target>` | runtime index와 report에서 promotion-ready fact 후보를 작성합니다. | 아니오 | `npx ai-agent-playbook canon draft <target-project> --json` |
| `canon check <target>` | memory에 승격된 canon fact를 runtime evidence와 현재 file 기준으로 확인합니다. | 아니오 | `npx ai-agent-playbook canon check <target-project> --json` |
| `canon promote <target>` | runtime report의 reviewed canon fact를 memory 또는 knowledge references로 preview하거나 씁니다. | `--apply --reviewed`가 있을 때만 예 | `npx ai-agent-playbook canon promote <target-project> --source .ai-agent-playbook/runtime/reports/example.json --to .ai-agent-playbook/memory/maps/canon.json --json` |
| `write-gate preview <target>` | 수정 전에 intent와 optional path 기준 write risk를 preview합니다. | 아니오 | `npx ai-agent-playbook write-gate preview <target-project> --intent "change auth flow" --path src/example.ts --json` |
| `write-gate advisory <target>` | playbook runtime 아래 pre-write advisory report를 preview하거나 저장합니다. | `--apply`가 있을 때만 예 | `npx ai-agent-playbook write-gate advisory <target-project> --intent "change auth flow" --path src/example.ts --apply --json` |
| `write-gate post-check <target>` | 수정 뒤 saved advisory snapshot과 현재 file을 비교합니다. | 아니오 | `npx ai-agent-playbook write-gate post-check <target-project> --advisory .ai-agent-playbook/runtime/reports/write-gate/pre-write-advisory.<id>.json --json` |

`reference inspect`는 local reference directory에서 하나의 top-level project를 열고, content를 복사하지 않는 adoption packet을 반환합니다. Packet에는 summary count, signal highlight, capability hint, representative file read order, adoption question, next action이 포함됩니다. Traversal, absolute path, nested project path를 거부해 reference review가 한 collection 범위 안에 머물게 합니다.

`reference adoption-queue`는 `reference inventory` 위에서 동작합니다. Skills, agents, MCP, workflows, architecture, frontend, backend, database, DevOps, mobile, data, design, observability, memory, indexes, connectors, security, compliance, docs, tests, package metadata 같은 local signal로 top-level reference collection을 점수화합니다. Raw reference contents를 복사하지 않고 recommended capability area, representative file path, next adoption action만 반환합니다. `--ledger <ledger.md>`를 추가하면 reference adoption ledger의 `ledgerStatus`, `ledgerCapability`, `ledgerDecisionDate`를 queue item에 붙입니다.

`reference capability-matrix`는 adoption queue 위에서 동작하며 candidate를 recommended/candidate capability id별로 묶습니다. 각 group은 priority count, optional ledger status count, recommended/candidate match count, signal highlight, representative file, next action이 포함된 bounded top-reference list를 담습니다. `--capability <id>`를 추가하면 `ai-harness`, `devops`, `design`, `frontend`, `database`, `data`, `mobile`, `security` 같은 특정 capability만 볼 수 있고, `--ledger <ledger.md>`를 추가하면 기존 adoption decision을 함께 볼 수 있습니다. 이 command는 read-only이며 raw reference source content를 출력하지 않습니다.

`reference adoption-plan`은 capability matrix와 선택된 inspect packet 위에서 동작합니다. `--capability <id>`가 필요하며 selected reference, ledger status, suggested local surface, read order, adoption question, stop condition, verification, follow-up이 담긴 bounded plan을 반환합니다. Packet은 triage evidence일 뿐이며 adopted 표시를 하지 않고 ledger row, source registry entry, runtime report, skill, workflow, MCP file을 쓰지 않습니다.

`reference adoption-status`는 adoption queue를 target project의 source registry 및 optional adoption ledger와 결합합니다. `knowledge/sources.json`, ledger row, matrix output을 수동으로 비교하지 않고도 reference adoption 작업을 이어갈 수 있도록 source-registered/source-missing queue row, ledger status count, capability rollup을 보고합니다. 기본 registry나 ledger file이 없으면 warning이고, 명시한 path가 잘못되면 conflict입니다. 이 command는 read-only이며 adoption decision을 쓰거나 promotion하지 않습니다.

`reference source-registry-preview`는 adoption queue 위에서 동작하며 `knowledge/sources.json` candidate object를 반환합니다. Entry locator는 scanned reference root 기준 relative path를 유지하고 privacy tier, credential boundary, freshness, promotion policy, caveat, capability hint, representative file을 포함합니다. 이 명령은 생성된 registry shape를 검증하지만 파일을 쓰거나 source를 memory로 promotion하지 않습니다.

`reference source-registry-check`는 기본적으로 `.ai-agent-playbook/knowledge/sources.json`을 읽고 schema shape, duplicate id, status/privacy/type summary, stale freshness value를 검증합니다. Target project 내부의 다른 registry를 확인하려면 `--path <sources.json>`를 추가합니다. Local reference directory 아래에서 등록된 `referencePath`와 representative file이 아직 존재하는지 내용 읽기 없이 확인하려면 `--reference-dir <dir>`를 추가합니다.

`reference source-registry-update`는 기존 `.ai-agent-playbook/knowledge/sources.json`에 누락된 local reference source entry만 append합니다. 기존 source entry와 top-level registry metadata를 보존하고, 병합된 registry를 write 전에 검증하며, 쓰기는 `--apply`가 있을 때만 수행합니다.

`reference ledger-init`은 local reference adoption queue에서 `.ai-agent-playbook/knowledge/reference-adoption-ledger.md`를 seed합니다. `--apply`가 있을 때만 쓰고, 기존 ledger overwrite는 거부하며, 생성 row는 status, reference id, capability, useful pattern summary, local adoption note, risk/noise note, decision date placeholder로 compact하게 유지합니다.

`reference ledger-update`는 기존 reference adoption ledger에 누락된 `new` row만 append합니다. 현재 ledger를 사용해 이미 reviewed, adopted, deferred, rejected로 기록된 reference를 중복 추가하지 않고, 실제 row를 append할 때 starter blank template row를 제거하며, 쓰기는 `--apply`가 있을 때만 수행합니다.

`reference ledger-decision`은 기존 reference adoption ledger row 하나를 `reviewed`, `adopted`, `deferred`, `rejected` 중 하나로 update합니다. 기본값은 정확한 row replacement preview이고, 쓰기는 `--apply`가 있을 때만 수행합니다. Optional `--capability`, `--pattern`, `--adoption`, `--risk`, `--decision-date YYYY-MM-DD` flag로 선택한 row cell을 갱신할 수 있습니다. Local absolute path, internal URL, token-like secret, table separator, newline, oversized raw excerpt 같은 unsafe cell value는 어떤 write 전에도 거부됩니다.

`reference ledger-check`는 기본적으로 `.ai-agent-playbook/knowledge/reference-adoption-ledger.md`를 검증합니다. 파일을 쓰지 않고 adoption status, local absolute path, internal URL, secret-like token, oversized excerpt를 확인합니다. 대상 프로젝트 내부의 다른 ledger를 확인하려면 `--path <ledger.md>`를 사용합니다. JSON output에는 capability 영역별 adoption status를 볼 수 있도록 `summary.capabilities`가 포함됩니다. Oversized fenced excerpt를 warning이 아니라 실패로 다루려면 `--strict`를 추가합니다.

`runtime python-status`는 선택형 Python capability engine을 확인합니다. 탐지 순서는 `AI_AGENT_PLAYBOOK_PYTHON`, 저장소 로컬 `.venv`, `python`, `python3`, Windows `py -3`입니다. Python이 없다고 하네스 전체가 실패하지 않습니다. `--engine auto`를 지원하는 명령은 JavaScript 대체 분석을 유지하고, JSON에 사용할 수 없는 Python 엔진을 보고합니다.

`runtime capability-history`는 존재할 때 `.ai-agent-playbook/runtime/reports/capability-history.jsonl`을 읽습니다. Entry를 capability별로 묶고 latest status, latest duration, baseline, drift를 보고하며, machine-local path를 그대로 출력하지 않도록 non-portable evidence path는 output에서 생략합니다. History가 없으면 정상적인 empty state입니다.

`runtime schema-check`는 target-relative JSON file을 읽고 `runtime.eval-definition`, `runtime.eval-run-report`, `runtime.capability-witness`, `runtime.evidence-envelope`, `runtime.repo-graph`, `runtime.source-registry` 또는 generic runtime artifact envelope 같은 compact local schema를 검증합니다. 알려진 `kind` 값은 자동 감지하며, 모호한 evidence envelope를 확인할 때는 `--kind <kind>`를 사용할 수 있습니다. 이 명령은 read-only입니다. Compact schema check는 local absolute path, credential처럼 보이는 값, non-portable graph path, dangling graph edge, oversized inline evidence를 conflict로 보고합니다.

`evidence locator-check`는 target-relative JSON 또는 Markdown file을 읽고 locator처럼 보이는 object, fenced evidence block, locator table을 재귀적으로 검사합니다. Missing scan range, missing/unknown source boundary, non-portable locator path, local absolute path, credential처럼 보이는 string을 파일 쓰기 없이 보고합니다. Locator block이 없는 Markdown file은 실패가 아니라 advisory warning을 반환합니다.

`graph preview`는 기존 read-only runtime signal을 조합해 compact `runtime.repo-graph` report를 만듭니다. File, doc, symbol, route, data, package node와 `contains`, `defines-route`, `mentions`, `uses-package` 같은 source-backed edge를 포함합니다. Graph는 generated evidence일 뿐입니다. Report를 durable memory로 취급하지 말고 검토된 fact만 별도로 promote합니다.

`write-gate preview`는 `.ai-agent-playbook/runtime/reports/write-gate/` 아래 planned `transaction.advisoryPath`와 `transaction.invocationId`를 반환합니다. Preview는 read-only를 유지하며, transaction field는 이후 post-write 또는 advisory file 작업의 안정적인 handoff로 씁니다.

`write-gate advisory`는 같은 preview engine을 사용하지만 `--apply`가 있을 때 pre-write advisory JSON file을 저장할 수 있습니다. 파일은 `.ai-agent-playbook/runtime/reports/write-gate/` 내부에만 쓰며, `--apply`가 없으면 planned advisory만 반환하고 파일을 쓰지 않습니다.

`write-gate post-check`는 saved advisory를 읽고 그 snapshot을 현재 file과 비교합니다. Advisory가 없거나, 유효하지 않거나, snapshot이 없으면 변경이 clean하다고 꾸미지 않고 `summary.status: "unknown"`을 보고합니다.

`canon draft`는 `.ai-agent-playbook/runtime/indexes/file-inventory.json`과 `.ai-agent-playbook/runtime/reports/` 아래 JSON report에서 fact 후보를 제안합니다. `canon check`는 `.ai-agent-playbook/memory/` 아래 승격된 JSON fact 또는 특정 `--path <canon-json>`을 읽고 파일을 쓰지 않은 채 `verified`, `missing`, `stale`, `changed`, `unverified` 상태를 보고합니다.

`canon promote`는 `--source <runtime-index-or-report-json>`와 `--to <memory-or-reference-json>`를 받습니다. source는 `.ai-agent-playbook/runtime/indexes/` 또는 `.ai-agent-playbook/runtime/reports/` 아래 JSON file이어야 합니다. `--apply`와 `--reviewed`가 모두 있을 때만 쓰며, 목적지는 `.ai-agent-playbook/memory/` 또는 `.ai-agent-playbook/knowledge/references/` 내부 JSON file로 제한합니다.

Promotion source는 `schemaVersion`, `kind`, `target`, `mode`, `generatedAt`, `summary`, `warnings`, `conflicts`를 가진 유효한 runtime artifact여야 합니다. Runtime report가 malformed 상태이거나 오래된 shape를 쓰면 `canon promote`는 fact를 만들지 않고 conflict를 보고합니다.

Runtime output은 `.ai-agent-playbook/runtime/` 아래에 둡니다. 검토와 명시적 승격 없이 generated output을 `.ai-agent-playbook/memory/`로 복사하지 않습니다.

## 글 다듬기 검토

| 명령 | 언제 쓰나 | 파일을 쓰나 | 예시 |
| ---- | --------- | ----------- | ---- |
| `writing naturalness-check <target>` | 한국어 또는 영어 글에서 번역투, AI식 표현, 과한 홍보 문구, 반복 리듬, 영어 용어 과다를 점검합니다. | 아니오 | `npx ai-agent-playbook writing naturalness-check <target-project> --path README.md --lang auto --engine auto --json` |
| `writing naturalness-report <target>` | Markdown 또는 text 파일이 있는 폴더를 제한된 범위로 훑고, 어느 파일을 다듬어야 하는지 요약합니다. | 아니오 | `npx ai-agent-playbook writing naturalness-report <target-project> --root docs --lang ko --engine auto --json` |

`writing naturalness-check`는 대상 프로젝트 안의 상대 경로 파일 하나를 읽고 휴리스틱 결과를 반환합니다. `--engine auto`는 기본 JavaScript 점검과, Python이 있을 때 선택형 Python 엔진을 함께 사용합니다. `--engine js`는 의존성이 없는 대체 분석만 강제하고, `--engine python`은 Python을 명시적으로 요청합니다. 이 명령은 파일을 고치지 않고, 네트워크를 호출하지 않고, 저자성을 판정하지 않고, 탐지 우회를 돕지 않습니다. README, 번역본, PR 본문, 배포 노트, 문서 페이지, 공개 요약을 다듬기 전에 사용합니다. 결과는 검토 단서일 뿐입니다. 사실, 명령어, 파일 경로, 경고, 배포 범위는 여전히 원문과 비교해야 합니다.

`writing naturalness-report`는 `--root` 아래의 Markdown, MDX, text 파일을 재귀적으로 훑고, 최대 `--max-files`개까지 검사합니다. 한도는 50개입니다. `naturalness-check`와 같은 읽기 전용 점검을 사용하되, 글을 판단하기 전에 코드 블록, 인라인 코드, 셸 명령, URL, HTML 배지 줄, 경로 예시는 제외합니다. 번역 폴더나 문서 묶음을 먼저 훑은 뒤, 신호가 큰 파일부터 하나씩 열어 고칩니다.

## Managed files

Managed 명령은 `.ai-agent-playbook/.ai-agent-playbook-install.json`을 확인하거나 관리합니다. 파일을 제거하거나 adopt하기 전에 hash를 비교해 수정된 project memory를 보호합니다.

| 명령 | 언제 쓰나 | 파일을 쓰나 | 예시 |
| ---- | --------- | ----------- | ---- |
| `managed check <target>` | managed marker를 확인하고 누락되거나 수정된 managed file을 보고합니다. | 아니오 | `npx ai-agent-playbook managed check <target-project> --json` |
| `managed catalog <target>` | cleanup 전에 managed file을 kind와 status별로 봅니다. | 아니오 | `npx ai-agent-playbook managed catalog <target-project> --json` |
| `managed adopt <target>` | 현재 template과 일치하는 오래된 playbook file에 marker를 추가합니다. | `--apply`가 있을 때만 예 | `npx ai-agent-playbook managed adopt <target-project> --json` |
| `managed prune <target>` | 선택한 수정되지 않은 managed file 하나를 제거합니다. | `--apply`가 있을 때만 예 | `npx ai-agent-playbook managed prune <target-project> --path .ai-agent-playbook/knowledge/references/guides/runtime-harness.md --json` |
| `managed uninstall <target>` | 수정되지 않은 managed playbook file 전체를 제거합니다. | `--apply`가 있을 때만 예 | `npx ai-agent-playbook managed uninstall <target-project> --json` |

Cleanup은 먼저 preview합니다.

```powershell
npx ai-agent-playbook managed check <target-project> --json
npx ai-agent-playbook managed uninstall <target-project> --json
npx ai-agent-playbook managed uninstall <target-project> --apply --json
```

`managed uninstall --apply`는 로컬에서 수정한 파일을 보존하고 `.gitignore`도 수정하지 않습니다.

## Operator check, search, research

Operator 명령은 사람이 명시적으로 실행하는 signal입니다. 명령 설명에 따로 적힌 경우를 제외하면 hook을 설치하지 않고, project command를 실행하지 않고, network call을 하지 않고, 파일을 쓰지 않습니다.

| 명령 | 언제 쓰나 | 파일을 쓰나 | 예시 |
| ---- | --------- | ----------- | ---- |
| `operator check <target>` | doctor, guide freshness, diagnostics, matching rules를 묶은 주요 checkpoint를 실행합니다. | 아니오 | `npx ai-agent-playbook operator check <target-project> --path src/example.ts --json` |
| `operator search <target>` | local source, playbook file, rule, plan, worklog에서 query를 빠르게 찾습니다. | 아니오 | `npx ai-agent-playbook operator search <target-project> --query "auth flow" --json` |
| `operator preflight <target>` | 수정 전 intent term, candidate file, rule/context/contract signal, portable file snapshot을 모읍니다. | 아니오 | `npx ai-agent-playbook operator preflight <target-project> --intent "auth flow change" --path src/example.ts --json > preflight.json` |
| `operator delta <target>` | 저장한 preflight JSON과 현재 target을 비교해 추가, 삭제, 수정, intent 밖 변경, playbook 변경을 보고합니다. | 아니오 | `npx ai-agent-playbook operator delta <target-project> --before preflight.json --json` |
| `operator research <target>` | evidence, gaps, next steps, markdown summary text를 포함한 더 깊은 local-only 조사를 실행합니다. | 아니오 | `npx ai-agent-playbook operator research <target-project> --query "auth flow risk" --path src/example.ts --json` |
| `operator context <target>` | 한 파일에 대한 path-scoped playbook context, rules, maps, runbooks, decisions를 미리 봅니다. | 아니오 | `npx ai-agent-playbook operator context <target-project> --path src/example.ts --json` |
| `operator analyze <target>` | diagnostics, map, rules, context, optional local setup signal을 하나의 report로 묶습니다. AST, 중복 단서, 언어 분석 signal이 필요하면 `--deep`을 더합니다. | 아니오 | `npx ai-agent-playbook operator analyze <target-project> --deep --path src/example.ts --json` |
| `operator map <target>` | stack, source layout, quality config, test file, verification command 후보를 요약합니다. | 아니오 | `npx ai-agent-playbook operator map <target-project> --json` |
| `operator audit <target>` | broken link, stale context glob, duplicate, manifest drift 같은 playbook drift를 확인합니다. | 아니오 | `npx ai-agent-playbook operator audit <target-project> --json` |
| `operator gc <target>` | obsolete unmodified managed playbook file을 preview하거나 제거합니다. | `--apply`가 있을 때만 예 | `npx ai-agent-playbook operator gc <target-project> --json` |

빠른 검색은 `operator search`를 사용합니다. 변경 여부를 결정하기 전에 더 넓은 근거가 필요하면 `operator research`를 사용합니다. 둘 다 local-only입니다.

위험도가 있는 수정 전에는 `operator preflight`로 baseline을 만들 수 있습니다. 이 명령은 JSON 파일을 직접 만들지 않으므로 보관하려면 shell redirect를 사용합니다. 수정 뒤에는 저장한 JSON을 `operator delta`에 넘깁니다. Delta는 무엇이 달라졌는지만 보여주며 구현이 맞는지 판정하지 않습니다.

Text search만으로 부족하고 구조와 언어 signal이 필요하면 `operator analyze --deep`을 사용합니다. Deep mode는 local AST-grep 검색, 정확히 정규화된 함수 본문 중복 단서, TypeScript/JavaScript diagnostics, symbols, references, definitions를 추가합니다. JSON output에는 `summary.functionCloneGroups`와 `deep.functionClones`가 포함됩니다. 중복 단서는 검토 시작점일 뿐 semantic equivalence를 주장하지 않습니다. 그래도 파일을 쓰지 않고, project command를 실행하지 않고, symbol rename이나 AST rewrite/apply를 하지 않고, network도 호출하지 않습니다.

## Runs와 evidence

Runs는 진행 중 작업 상태를 추적합니다. 작업이 길어져 다음 agent가 전체 worklog를 읽기 전에 evidence, criteria, blocker, cleanup 상태를 봐야 할 때 유용합니다.

| 명령 | 언제 쓰나 | 파일을 쓰나 | 예시 |
| ---- | --------- | ----------- | ---- |
| `run start <target>` | `.ai-agent-playbook/workflows/runs/<run-id>/` 아래 brief, criteria file, append-only ledger, evidence folder, summary를 만듭니다. | `--dry-run`이 없으면 예 | `npx ai-agent-playbook run start <target-project> --title "Auth flow" --dry-run --json` |
| `run status <target>` | 최신 run 또는 선택한 run의 event, criteria, blocker, evidence, cleanup 상태를 요약합니다. | 아니오 | `npx ai-agent-playbook run status <target-project> --run-id auth-flow --json` |
| `run record <target>` | `ledger.jsonl`에 note, criterion, evidence, blocker, cleanup event를 append합니다. | 예 | `npx ai-agent-playbook run record <target-project> --run-id auth-flow --type evidence --status pass --message "Auth flow test passed" --evidence .ai-agent-playbook/workflows/runs/auth-flow/evidence/auth.txt --json` |
| `run summarize <target>` | append-only ledger를 사람이 읽는 `summary.md`로 정리합니다. | `--dry-run`이 없으면 예 | `npx ai-agent-playbook run summarize <target-project> --run-id auth-flow --dry-run --json` |

`run record`는 로컬 절대경로나 credential assignment처럼 보이는 message를 거부합니다. Evidence path는 portable relative path만 허용합니다. Runs는 worklog를 대체하지 않습니다. 실행 중에는 runs를 쓰고, 오래 남길 사실은 `CURRENT.md`, maps, runbooks, decisions, contracts, worklogs로 승격합니다.

`run start`와 `workflow run-start`는 수동 note 및 recipe scaffold를 위한 schema v1 생성 표면으로 유지합니다. `run status`는 automation v2 디렉터리를 인식해 공통 reducer/store로 읽고, `run record`와 `run summarize`는 v2 run에 event를 추가하거나 summary를 덮어쓰지 않습니다. `workflow run-start`는 `--apply`가 있을 때만 `.ai-agent-playbook/workflows/runs/` 아래 새 scaffold file을 쓰며, `--apply`가 없으면 파일을 쓰지 않고 planned file을 반환합니다. Schema v1 입력은 automation 표면에서 계속 호환 읽기 전용이며 제자리 변환하지 않습니다.

## Contracts

Contracts는 중요한 business rule과 invariant를 기록합니다. 명시적으로 실행하는 read-only check이며, LLM judge, pre-commit block, 자동 승인 기능은 없습니다.

| 명령 | 언제 쓰나 | 파일을 쓰나 | 예시 |
| ---- | --------- | ----------- | ---- |
| `contracts list <target>` | `.ai-agent-playbook/memory/contracts/` 아래 active/pending contract를 나열합니다. | 아니오 | `npx ai-agent-playbook contracts list <target-project> --json` |
| `contracts check <target>` | 한 path에 적용되는 active/pending contract와 오래되거나 불완전한 contract note를 보여줍니다. | 아니오 | `npx ai-agent-playbook contracts check <target-project> --path src/example.ts --json` |
| `contracts snapshot <target>` | contract, appliesTo, evidence file의 relative path hash를 `.ai-agent-playbook/memory/contracts/.hashes.json`에 쓸지 preview하거나 적용합니다. | `--apply`가 있을 때만 예 | `npx ai-agent-playbook contracts snapshot <target-project> --json` 뒤 `npx ai-agent-playbook contracts snapshot <target-project> --apply --json` |
| `contracts init <target>` | starter `.ai-agent-playbook/memory/contracts/README.md`, `active/`, `pending/` folder를 만듭니다. | `--dry-run`이 없으면 예 | `npx ai-agent-playbook contracts init <target-project> --dry-run --json` |

Contract markdown은 `id`, `status`, `appliesTo`, `risk`, `approvedAt`, `freshness` frontmatter를 지원합니다. `contracts check`는 `appliesTo` path가 사라졌거나, matching contract가 pending이거나, `freshness`가 90일보다 오래됐거나, `Required evidence` section이 비어 있으면 warning을 냅니다. Contract hash snapshot이 있으면 tracked contract, appliesTo, evidence file이 바뀌거나 사라진 경우도 warning으로 보여줍니다.

## Rules, diagnostics, TUI checks

| 명령 | 언제 쓰나 | 파일을 쓰나 | 예시 |
| ---- | --------- | ----------- | ---- |
| `rules check <target>` | 대상 path에 적용되는 portable rule file을 봅니다. | 아니오 | `npx ai-agent-playbook rules check <target-project> --path src/example.ts --json` |
| `diagnostics check <target>` | 실행하지 않은 상태로 local verification command 후보를 나열합니다. | 아니오 | `npx ai-agent-playbook diagnostics check <target-project> --json` |
| `qa tui-check <capture-file>` | terminal capture의 overflow, CJK width, ANSI, box alignment 문제를 확인합니다. | 아니오 | `npx ai-agent-playbook qa tui-check .\capture.txt --cols 100 --json` |
| `qa image-diff <reference.png> <actual.png>` | 두 PNG의 changed pixel, diff ratio, similarity score, hotspot grid를 diff image 생성 없이 반환합니다. | 아니오 | `npx ai-agent-playbook qa image-diff .\before.png .\after.png --threshold 0.01 --json` |

`diagnostics check`는 command 후보만 보고합니다. lint, test, build, language server를 실행하지 않습니다.

`qa image-diff`는 PNG만 지원합니다. Browser capture, baseline 저장, visual oracle, diff image 생성은 하지 않습니다.

## AI 앱용 MCP 도구

MCP는 도구를 직접 호출할 수 있는 AI 앱을 위한 표면입니다. CLI를 대체하지 않습니다. AI가 자연어 작업 중 read-only CLI signal을 더 쉽게 발견하고 호출하게 하는 역할입니다.

MCP를 지원하는 앱에는 아래 로컬 stdio 명령을 등록합니다.

```powershell
npx ai-agent-playbook mcp
```

Global install을 했다면 아래 명령도 같습니다.

```powershell
aapb mcp
```

서버는 `ai-agent-playbook://capabilities`, `ai-agent-playbook://skills`, `ai-agent-playbook://workflows`, `ai-agent-playbook://adapters`, `ai-agent-playbook://adapter-readiness`, `ai-agent-playbook://agent-usage-guide`, `ai-agent-playbook://playbook-layout`, `ai-agent-playbook://reference-adoption`, `ai-agent-playbook://mcp-permission-model` 읽기 전용 resource를 노출합니다. AI 앱은 이 resource로 능력 목록, 스킬 분류, 작업 절차, Codex/Claude 지원, adapter 준비 상태, 사용 순서, `.ai-agent-playbook` 읽기 순서, reference adoption boundary, 권한 단계를 먼저 파악한 뒤 필요한 tool을 고를 수 있습니다.

서버는 아래 read-only 도구를 노출합니다.

- playbook context: `playbook_context`, `context_status`, `context_list`
- 카탈로그와 레이아웃: `capability_catalog`, `skill_catalog`, `workflow_list`, `workflow_run_preview`, `reference_inventory`, `reference_inspect`, `reference_adoption_queue`, `reference_capability_matrix`, `reference_adoption_plan`, `reference_adoption_status`, `reference_source_registry_preview`, `reference_source_registry_check`, `reference_source_registry_update_preview`, `reference_ledger_check`, `reference_ledger_update_preview`, `reference_ledger_decision_preview`, `playbook_layout`, `index_status`, `runtime_schema_check`, `evidence_locator_check`, `writing_naturalness_check`, `writing_naturalness_report`, `index_search`, `symbol_outline`, `dependency_inventory`, `route_api_hints`, `repo_graph_preview`, `write_gate_preview`, `canon_check`
- operator diagnostics: `operator_check`, `operator_search`, `operator_research`, `operator_preflight`, `operator_delta`, `operator_map`, `operator_audit`, `operator_analyze_deep`
- rules와 project state: `rules_check`, `contracts_check`, `contracts_list`, `managed_check`, `managed_catalog`, `diagnostics_check`
- QA와 deep analysis: `qa_image_diff`, `source_function_clones`, `ast_grep_search`, `lsp_status`, `lsp_diagnostics`, `lsp_symbols`, `lsp_references`, `lsp_definition`
- Forge automation 읽기: `automation_status`, `automation_plan_validate`, `forge_status`, `forge_bootstrap_plan`, `forge_sync_plan`

두 forge plan tool은 target project를 요구하고 apply counterpart와 같은 target-aware inspection에서 provider와 effective capability를 결정합니다. 따라서 review한 `auto`/static zero-operation preview가 apply 시 target-specific write로 조용히 확대되지 않습니다. `forge_sync_plan`과 `forge_sync_apply`는 reviewed `coordination` contract도 요구하며, legacy task mode를 명시하지 않은 경우 세밀한 task는 local에 두고 roadmap과 delivery-group issue를 발행합니다.

서버는 `repo_onboarding_runbook`, `harness_extension_plan`, `harness_governance_review`, `reference_adoption_review`, `backend_change_review`, `architecture_boundary_review`, `auth_access_control_review`, `dependency_supply_chain_review`, `package_release_readiness_review`, `deployment_release_review`, `mobile_release_review`, `connector_integration_review`, `design_reference_handoff_review`, `frontend_quality_review`, `interactive_experience_review`, `data_integrity_review`, `data_pipeline_review`, `database_change_review`, `adr_spec_handoff_review`, `documentation_package_review`, `natural_writing_review`, `workflow_run_review`, `eval_harness_review`, `capability_witness_review`, `pre_action_fact_gate_review`, `knowledge_source_review`, `canon_promotion_review`, `index_interpretation_review`, `agent_orchestration_review`, `repo_graph_review`, `ci_quality_gate_review`, `release_deployment_gate_review`, `security_compliance_gate_review` prompt도 노출합니다. Prompt는 재사용 가능한 작업 brief이며, 그 자체로 쓰기 권한을 열지는 않습니다.

MCP 계층은 기본적으로 read-only입니다. `mcp --enable-write-tools`를 쓰면 `workflow_run_start`, `write_gate_advisory`, `reference_ledger_update`, `reference_ledger_decision`, `reference_source_registry_update`도 노출합니다. 쓰기 가능한 모든 tool은 tool-call `apply` boolean을 요구하고, `apply`가 false이면 dry-run으로 남습니다.

Forge write에는 별도 server gate를 사용합니다. `mcp --enable-forge-write-tools`는 `forge_bootstrap_apply`, `forge_sync_apply`만 노출하며 두 도구 모두 tool call의 `apply: true`가 필요합니다. Preview와 apply는 같은 target, provider, effective capability set, configured language를 사용합니다. 인증된 remote coordination write를 수행할 수 있으므로 provider status와 permission을 검토한 제한된 session에서만 켭니다. 이 MCP surface는 push, automation tick/supervisor, merge, release, delete, force-push, arbitrary project source write를 노출하지 않습니다.

## Adapter setup

Adapter는 선택 사항입니다. 기본 harness는 hook이나 agent plugin 없이도 동작합니다.

| 명령 | 언제 쓰나 | 파일을 쓰나 | 예시 |
| ---- | --------- | ----------- | ---- |
| `adapter config <target>` | Codex 또는 Claude Code용 local hook 설정을 copy-paste 가능한 형태로 렌더링합니다. | 아니오 | `npx ai-agent-playbook adapter config <target-project> --adapter codex --json` |
| `adapter check <target>` | 선택적 adapter file, context, local settings가 준비됐는지 확인합니다. | 아니오 | `npx ai-agent-playbook adapter check <target-project> --adapter codex --settings <local-settings-path> --json` |

`adapter config`는 settings file을 만들지 않습니다. Operator가 검토하고 수동으로 복사할 command와 JSON을 출력합니다.

`adapter config --json`은 `npx ai-agent-playbook mcp`를 쓰는 MCP server 예시와 global install용 `aapb mcp` 예시도 함께 포함합니다.

## Plan과 worklog

임의의 markdown 파일을 만들지 않고 예측 가능한 project-memory 경로를 쓰고 싶을 때 사용합니다.

| 명령 | 언제 쓰나 | 파일을 쓰나 | 예시 |
| ---- | --------- | ----------- | ---- |
| `plan new <target>` | `.ai-agent-playbook/workflows/plans/` 아래 dated plan을 만듭니다. | `--dry-run`이 없으면 예 | `npx ai-agent-playbook plan new <target-project> --title "Feature slice" --dry-run` |
| `plan new <target> --automation` | Human-readable Markdown과 stable task field를 가진 `workflow.plan.v2` JSON sidecar를 만듭니다. | `--dry-run`이 없으면 예 | `npx ai-agent-playbook plan new <target-project> --automation --title "Forge loop" --dry-run` |
| `plan validate <target>` | Structured sidecar, dependency graph, criterion, argv verification, approval readiness를 검증합니다. | 아니오 | `npx ai-agent-playbook plan validate <target-project> --plan .ai-agent-playbook/workflows/plans/<plan>.plan.json --json` |
| `worklog new <target>` | `.ai-agent-playbook/workflows/worklogs/YYYY-MM/` 아래 dated worklog를 만듭니다. | `--dry-run`이 없으면 예 | `npx ai-agent-playbook worklog new <target-project> --title "Feature slice" --dry-run` |
| `worklog summarize <target>` | monthly worklog summary를 만들거나 갱신합니다. | `--dry-run`이 없으면 예 | `npx ai-agent-playbook worklog summarize <target-project> --month 2026-06 --dry-run` |

기존 plan과 worklog file은 `--force`가 없으면 덮어쓰지 않습니다. Automation sidecar는 draft로 시작하며 모든 task에 acceptance criterion과 안전한 argv verification command가 있고 `approval.status`가 `approved`여야 실행 준비 상태가 됩니다.

## Forge coordination과 재개 가능한 자동화

Forge 명령은 capability 탐지와 effective permission profile을 사용합니다. GitHub와 Gitea는 issue, label, milestone, pull request, Actions core를 공유하며, 지원하지 않는 Project, View, Discussion, child-task 기능은 문서화된 fallback을 사용합니다. Remote access가 없어도 local ledger 동작은 유지됩니다.

| 명령 | 사용할 때 | 파일 또는 remote state를 쓰는가 | 예시 |
| --- | --- | --- | --- |
| `forge status <target>` | Selected remote/provider, server/API version, tooling, auth, repository permission, capability evidence, policy/verified write mode를 확인할 때. | Mutation 없음. 허용된 read-only inspection은 수행할 수 있음 | `npx ai-agent-playbook forge status <target-project> --json` |
| `forge bootstrap <target>` | 누락된 managed label, milestone, Project field, View, provider fallback을 preview하고 검토 뒤 `--apply`로 만들 때. | `--apply`가 없으면 아니요. Apply는 remote state를 씀 | `npx ai-agent-playbook forge bootstrap <target-project> --milestone 0.5.5 --json` |
| `forge sync <target>` | Plan/run task synchronization을 preview하고 operation 검토 뒤 `--apply`할 때. Sidecar apply에는 complete approved plan이 필요합니다. | `--apply`가 없으면 아니요. Apply는 remote state를 씀 | `npx ai-agent-playbook forge sync <target-project> --run-id <run-id> --json` |
| `forge reconcile <target>` | Reviewed snapshot의 requirement drift를 preview하거나 task issue를 delivery group으로 통합할 때. Supersede에는 `--apply --allow-supersede`가 필요합니다. | `--apply`가 없으면 아니요. Apply는 ledger 또는 reviewed remote issue state를 씀 | `npx ai-agent-playbook forge reconcile <target-project> --plan <plan.json> --json` |
| `automation doctor <target>` | 시작 전에 executor, effective policy, tool version, forge access, dirty-checkout safety, preview-first scheduler mode를 확인할 때. | Mutation 없음 | `npx ai-agent-playbook automation doctor <target-project> --json` |
| `automation start <target>` | Approved `workflow.plan.v2` sidecar를 schema v2 run으로 바꾸고 policy가 허용하면 remote coordination을 시작할 때. | 예. Local run을 쓰고 remote coordination state도 쓸 수 있음 | `npx ai-agent-playbook automation start <target-project> --plan <plan.json> --no-remote --json` |
| `automation tick <target>` | Dependency-ready task 하나 이하를 claim, 실행, controller 검증, 허용된 delivery, checkpoint까지 진행할 때. | 예. Code, ledger/evidence, Git, remote state를 쓸 수 있음 | `npx ai-agent-playbook automation tick <target-project> --run-id <run-id> --no-interactive --json` |
| `automation supervise <target>` | Configured wall/stall budget 안에서 짧은 tick을 반복할 때. | 예. 반복 tick과 같은 bounded effect | `npx ai-agent-playbook automation supervise <target-project> --run-id <run-id> --no-interactive --json` |
| `automation status <target>` | 최신 또는 선택한 schema v2 run, task/criterion progress, blocker, checkpoint를 읽을 때. | 아니요 | `npx ai-agent-playbook automation status <target-project> --run-id <run-id> --json` |
| `automation pause\|resume\|stop <target>` | Operator control event를 지속할 때. Pause는 재개 가능하고 stop은 run을 cancel합니다. | 예. Local ledger와 derived state를 씀 | `npx ai-agent-playbook automation pause <target-project> --run-id <run-id> --reason "quota" --json` |
| `automation schedule <target>` | Scheduler definition 네 종류 중 하나를 preview하고 `--apply`로 hosted workflow를 쓰거나 local schedule을 등록할 때. Hosted start/tick command와 local tick command는 effective deny flag를 유지합니다. Offline apply와 hosted `--no-git` apply는 안전하게 deliver할 수 없어 거부합니다. | `--apply`가 없으면 아니요 | `npx ai-agent-playbook automation schedule <target-project> --platform github-actions --json` |

`automation start`는 dry-run 명령이 아니며 `--apply` gate가 없습니다. `--no-remote`는 forge와 remote Git effect를 막지만 local run은 생성합니다. Remote coordinated run을 시작하기 전에 structured plan을 preview/validate하고 `forge status`, `automation doctor`, 관련 `forge bootstrap`/`forge sync` preview를 실행합니다. 우선 사용하는 GitHub Projects를 의도적으로 사용할 수 없을 때는 `--allow-capability-fallback projects,views`로 이번 start의 milestone coordination을 명시적으로 선택합니다. 이 flag나 동일한 영구 설정이 없으면 remote coordination write 전체를 시작 전에 중단합니다.

`forge sync --plan ... --apply`는 forge inspection이나 transport 생성 전에 draft, invalid, incomplete sidecar를 거부합니다. Plan-only sync가 `updatedAt` baseline 없이 기존 marker-owned child issue를 찾으면 title과 구성한 body가 approved plan과 정확히 일치할 때만 issue를 재사용합니다. 불일치하면 `forge.issue.reconcile-required`를 반환하며 title, body, acceptance criterion, status update에는 명시적으로 검토한 snapshot과 CAS 일치가 필요합니다.

`coordination`이 없는 호환 계획은 local automation에서 계속 유효하지만 remote collaboration artifact를 bootstrap하거나 sync할 수 없습니다. Writable forge가 선택된 상태의 `automation start`는 첫 remote write 전에 중단하며, 이후 task-time sync도 task별 issue mode를 추론하지 않습니다. Local-only start에는 `--no-remote`를 사용하고 remote write를 활성화하기 전에는 reviewed coordination metadata를 추가합니다.

`plan new --automation`은 현재 `forge.presentation`과 `forge.projectMode` 기본값을 새 sidecar에 복사합니다. 생성 후에는 reviewed sidecar가 권위 있는 기준이며 이후 config 변경이 approved plan을 조용히 다시 쓰지 않습니다. 명시적인 capability fallback은 현재 operation에서 Project 표현을 milestone mode로 좁힐 수만 있습니다.

기존 이슈나 draft PR을 검토된 표시 구조로 다시 작성해야 할 때는 승인 계획에 `coordination.reconcile.supportingIssues`와 `coordination.reconcile.pullRequests`를 선택적으로 추가할 수 있습니다. 각 항목은 정확한 원격 번호와 충분한 사람용 내용을 가집니다. Reconcile은 계획 전에 최신 `updatedAt`, 제목, draft 상태, branch snapshot을 읽으며, apply는 검토된 그 산출물만 도입하고 drift가 있으면 중단합니다. Supersede는 parent에 연결된 issue를 marker 댓글보다 먼저 종료하고 마지막 계층 해제 전에 Project card를 제거하며, 이미 parent가 해제된 열린 이슈는 승인된 plan의 정확한 supersede marker로만 복구합니다. Preview는 보장할 Project item과 제거할 오래된 Project item을 구분해 보고합니다. Project 연결 해제에는 `--allow-supersede`가 필요하며 기존 issue, comment, label은 삭제하지 않습니다.

Reconcile preview는 이어서 mutation을 차단한 transport 뒤에서 provider adapter를 실행합니다. 재사용 가능하다고 증명된 operation은 `operations`에서 빼고 `noOps`에 표시하며, `summary.artifacts`는 실행 가능한 변경만 세고 `plannedOperations`에는 원래 의도 수를 유지합니다. 검토된 reconcile은 엄격한 과거 생성형 목표·수용 기준 preamble을 교체할 수 있지만, 인식한 marker 형태 밖의 사용자 문서는 보존합니다. GitHub 응답에서 생략된 빈 Project text 값은 빈 목표와 같은 상태로 취급해 필드를 반복해서 쓰지 않습니다.

GitHub Projects를 우선 사용하도록 설정했지만 현재 `gh` 인증에 `project` scope가 없으면, `forge status`는 conflict 다음에 `gh auth refresh -s project`와 `aapb forge status .`를 실행 가능한 다음 단계로 출력합니다. Bootstrap, sync, reconcile preview는 첫 mutation 전에 실행 가능한 operation을 0건으로 반환하면서 검토할 label, milestone, Project, View, issue, Project item의 요청 수는 유지합니다. Projects를 의도적으로 사용하지 않을 때만 `--allow-capability-fallback projects,views`로 별도의 milestone 기반 preview를 만듭니다. 인증 scope 확대는 항상 operator가 직접 수행하는 대화형 작업으로 남습니다. 새 Project는 `Delivery Status`, `Priority`, `Risk` 같은 중립적인 field를 사용하며, 기존 `AAPB *` field는 중복 생성이나 파괴적 rename 없이 재사용하는 호환 alias입니다. 누락 field를 만들기 전에 기존 field의 type과 필수 single-select option 호환성을 확인하므로, 같은 이름의 schema 충돌이 있으면 일부 field만 이관된 상태를 만들지 않고 bootstrap을 중단합니다. 사용자 소유 field와 View REST 경로에는 deprecated GraphQL 숫자 `databaseId` 대신 소유자 login을 사용해 provider 탐지와 mutation의 식별자를 일치시키며, 실패한 실행도 이미 제목이 붙은 Project를 재사용해 재개할 수 있습니다.

GitHub는 새 Project에 system `View 1`을 만듭니다. 안정 공개 View API는 이 system View의 생성 외 rename 또는 delete endpoint를 제공하지 않습니다. 따라서 AAPB는 table View를 하나 더 만들지 않고 이를 managed `all` 역할로 재사용합니다. 화면 이름은 `View 1`로 남을 수 있으며, 이를 바꾸기 위해 private endpoint나 browser automation을 사용하지 않습니다.

Generated GitHub/Gitea workflow는 repository variable `AAPB_AUTOMATION_PLAN`이 commit된 approved plan sidecar를 가리킬 때 fresh runner를 초기화할 수 있습니다. Run cache 복원 뒤 해당 값을 인용된 environment expansion `"$AAPB_AUTOMATION_PLAN"`으로 멱등적인 `automation start`에 전달하고 tick 하나를 실행합니다. 변수가 없으면 checkout 또는 restored cache에 기존 run이 있어야 합니다. 같은 `planId`를 재사용하면 같은 기본 run을 재사용하며 변경된 plan 내용으로 다시 쓰지는 않습니다.

Hosted cache에는 `.ai-agent-playbook/workflows/runs`와 external managed checkout이 들어가며 cache action의 post-job phase에서 저장됩니다. 실행 중 tick을 위한 durable storage가 아니라 완료된 마지막 job/tick checkpoint입니다. Timeout, cancellation, runner loss, cache eviction이 있으면 이전 saved checkpoint로 되돌아갈 수 있습니다. Gitea는 runner cache service가 설정되고 접근 가능해야 합니다. Unattended 사용 전에 두 경로의 save/restore 동작을 검증하고 replay 전에 모호한 forge/Git effect를 reconcile합니다.

Windows Task Scheduler 등록은 project path 기반의 안정적인 suffix를 사용하고 `/F`를 전달하지 않습니다. 기존 task와 충돌하면 덮어쓰지 않고 보고합니다. Systemd user unit과 hosted workflow file도 내용이 다른 기존 파일을 보존합니다.

Default executor selector가 같은 우선순위의 local agent를 여러 개 찾으면 ambiguity를 보고하므로 `executor.provider`를 명시합니다. `github-agent-task`는 preview-only이며 explicit preview enable flag가 필요합니다. `--no-git`을 포함한 unattended task는 dirty/untracked file을 제외하도록 committed Git baseline에서 만든 managed checkout을 사용합니다. Non-Git project는 interactive로 실행하거나 먼저 committed baseline을 만들어야 합니다.

Remote read가 허용되면 `automation start`는 configured ready label이 있는 open issue를 조회해 eligible issue를 approved plan에 추가합니다. Pull request, closed issue, configured pause label이 있는 issue는 제외합니다. 이 discovery는 run을 처음 만들 때와 같은 non-terminal run을 재사용할 때마다 수행하므로, 나중에 label을 추가한 issue도 이후 start에서 멱등 append됩니다. Remote title, body, label, checklist는 untrusted data로 유지하고 remote verification command나 file path는 절대 실행하지 않으며, import한 issue는 검토한 local execution mapping이 제공될 때까지 pause합니다. `--no-remote`, `--offline`은 ready-issue discovery를 건너뜁니다.

Linked forge-issue task는 remote read가 성공할 때 tick의 claim 전과 executor 완료 후 issue를 다시 읽습니다. Pause label, ready label 제거, closed issue는 task와 run을 pause합니다. Claim 전 requirement change는 아직 claim하지 않은 task에 import하고, execution 뒤 change는 verification/delivery를 계속하기 전에 run을 `needs-reconcile`로 pause합니다. Offline, no-remote, unavailable read transport에서는 이 guard를 제공할 수 없으므로 local checkpoint가 기준으로 남고 remote state는 나중에 reconcile해야 합니다.

`automation doctor`는 effective policy에 Git이 필요할 때만 Git `2.39.0`을 최소 버전으로 적용합니다. Detected GitHub read path에서 설치된 `gh`가 `2.80.0`보다 낮으면 conflict입니다. Preferred Projects mode에서 `project` scope가 없으면 coordination write를 차단하고 `gh auth refresh -s project`, `aapb forge status .`를 안내하며 인증을 자동 갱신하지 않습니다. Milestone fallback을 operator가 명시적으로 결정한 경우에만 `--allow-capability-fallback projects,views`를 사용합니다. `policyWrites`는 configured authority이고, `verifiedWrites`와 effective `writes`에는 검증된 authentication과 repository write permission이 필요합니다. Self-hosted Gitea candidate는 explicit provider/API-base trust, public version/OpenAPI inspection, authenticated repository permission 확인이 모두 성공할 때까지 쓰기 불가입니다. 오래된 `tea`는 Gitea REST transport를 사용할 수 있으므로 warning입니다. Dirty user checkout은 `git.unattendedWorkspace`가 `isolated-checkout`일 때만 unattended work에 safe로 보고하며, dirty non-isolated unattended workspace는 conflict입니다. Scheduler mode status는 local executable 또는 detected provider/repository prerequisite만 뜻하며 registration 성공, Actions service 활성화, runner health, credential, remote smoke test 완료를 증명하지 않습니다.

## 안전한 기본 흐름

새 대상 repository나 기존 대상 repository에서는 아래 순서가 가장 안전합니다.

```powershell
npx ai-agent-playbook skills install --dry-run
npx ai-agent-playbook skills install
npx ai-agent-playbook bootstrap <target-project> --dry-run
npx ai-agent-playbook bootstrap <target-project> --local-only
npx ai-agent-playbook operator check <target-project> --json
npx ai-agent-playbook operator preflight <target-project> --intent "planned change" --json > preflight.json
npx ai-agent-playbook operator research <target-project> --query "project risks" --json
```

Cleanup은 먼저 preview합니다.

```powershell
npx ai-agent-playbook managed catalog <target-project> --json
npx ai-agent-playbook managed uninstall <target-project> --json
```

Preview가 제거할 내용을 정확히 보여줄 때만 `--apply`를 추가합니다.
