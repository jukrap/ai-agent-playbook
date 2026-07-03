# 명령어 가이드

이 문서는 AI Agent Playbook 명령어 reference입니다. 각 명령이 무엇을 하는지, 파일을 쓰는지, 어떤 순서로 실행하면 안전한지 설명합니다.

처음 사용하는 경우에는 전체 reference를 보기 전에 [처음 10분 사용법](quick-start.ko.md)을 먼저 읽는 것을 권장합니다.

설치, 업데이트, 삭제, npm 사용 방식은 [설치, 업데이트, 삭제](installation.ko.md)를 보세요. Runtime 설계와 JSON contract 설명은 [Runtime harness](harness-runtime.ko.md)를 보세요.

## 명령 실행 방식

아래 세 가지 형태 중 하나를 사용합니다.

| 형태 | 언제 쓰나 |
| ---- | --------- |
| `npx ai-agent-playbook ...` | 현재 프로젝트에 dependency를 추가하지 않고 최신 배포 패키지를 실행할 때 기본으로 사용합니다. |
| `ai-playbook ...` | `npm install -g ai-agent-playbook` 뒤에 짧은 전역 명령을 쓰고 싶을 때 사용합니다. |
| `node .\bin\ai-playbook.mjs ...` | 이 repository를 checkout한 폴더 안에서 직접 실행할 때 사용합니다. |
| `npx ai-agent-playbook mcp` | AI 앱이 read-only playbook 도구를 대신 호출하게 하려면 로컬 stdio MCP 서버 명령으로 등록합니다. 명시적 opt-in scaffold/managed-write tool이 필요할 때만 `--enable-write-tools`를 추가합니다. |

아래 예시의 `npx ai-agent-playbook`은 설치 방식에 따라 `ai-playbook` 또는 `node .\bin\ai-playbook.mjs`로 바꿔 실행할 수 있습니다.

`<target>` 또는 `<target-project>`는 playbook을 적용하거나 검사할 대상 프로젝트 폴더입니다. 터미널이 이미 그 프로젝트 안에 있다면 `.`을 쓸 수 있습니다.

### 예시 입력 방법

- 꺾쇠괄호를 그대로 입력하지 않습니다. `<target-project>`, `<file>`, `<text>`, `<run-id>` 같은 placeholder를 실제 값으로 바꿉니다.
- 이미 대상 프로젝트 폴더 안에 있다면 target으로 `.`을 쓰는 편이 간단합니다.
- 공백이 있는 경로나 문장은 따옴표로 감쌉니다. 예: `".\example app"`, `"auth flow change"`.
- `--path <file>`은 보통 target project 안의 경로입니다. 예: `src/example.ts`. 절대 경로일 필요는 없습니다.
- 익숙하지 않다면 명령은 한 줄로 입력합니다. PowerShell에서 긴 명령을 여러 줄로 나눌 때만 backtick을 사용합니다.
- `> preflight.json` 같은 redirection은 shell이 처리합니다. CLI는 JSON을 출력하고, shell이 파일로 저장합니다.
- 공유 예시에는 개인 폴더, 고객명, credential, internal URL을 넣지 않습니다. 대신 `<target-project>` 같은 placeholder를 사용합니다.

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
| `--apply` | preview-first 명령의 실제 적용을 수행합니다. path migration이나 uninstall에 사용합니다. |
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
| `--to v2` | `migrate layout`의 대상 layout을 선택합니다. |
| `--max-chars N` | 생성되는 context 크기를 제한합니다. |
| `--strict` | doctor warning도 실패로 처리합니다. |
| `--reminder` | 전체 doctor report 대신 작은 reminder signal을 반환합니다. |
| `--profile <name>` | 대상 stack을 확인한 뒤 stack-specific bootstrap profile을 추가합니다. |
| `--local-only` | bootstrap 중 대상 프로젝트 `.gitignore`에 `.ai-playbook/`을 추가합니다. |
| `--title <text>` | 생성할 plan, worklog, run 제목입니다. |
| `--month YYYY-MM` | worklog summary 대상 월입니다. |
| `--cols N` | `qa tui-check`에서 기대하는 terminal width입니다. |
| `--run-id <id>` | `.ai-playbook/runs/` 아래 특정 run을 선택합니다. |
| `--recipe <id>` | `workflow run-preview`에서 workflow recipe를 선택합니다. |
| `--user-config <path>` | `config preview`에 명시적인 user-level config file을 추가합니다. 그래도 target-local config가 우선합니다. |
| `--type note|criterion|evidence|blocker|cleanup` | `run record`에 기록할 event type입니다. |
| `--status pass|fail|blocked|info` | `run record`에 기록할 event status입니다. |
| `--evidence <path>` | `run record`에 남길 portable relative evidence path입니다. |
| `--before <preflight-json>` | 이전에 `operator preflight --json`으로 저장한 JSON 파일입니다. |
| `--contract <id>` | `contracts snapshot`을 특정 contract id 하나로 제한합니다. |
| `--threshold N` | 허용할 image diff ratio입니다. `0`부터 `1`까지 쓰며, `0`은 픽셀이 하나라도 바뀌면 실패입니다. |
| `--deep` | `operator analyze`에 AST-grep, 정확한 함수 본문 중복 단서, TypeScript/JavaScript 언어 분석 signal을 추가합니다. |

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

## Skills

Skill은 재사용 가능한 사용자 수준 지침입니다. 각 대상 repository 안이 아니라 Codex와 agent의 일반 skill root에 설치됩니다.

| 명령 | 언제 쓰나 | 파일을 쓰나 | 예시 |
| ---- | --------- | ----------- | ---- |
| `skills check` | 이 playbook의 skill이 설치됐는지, 누락됐는지, 수정됐는지, 같은 이름의 unmanaged copy와 충돌하는지 봅니다. | 아니오 | `npx ai-agent-playbook skills check --json` |
| `skills lint` | 공개 전 source `SKILL.md`의 trigger 중심 description, frontmatter 형태, missing reference link를 점검합니다. | 아니오 | `npx ai-agent-playbook skills lint --json` |
| `skills install` | 재사용 스킬을 처음 설치합니다. | `--dry-run`이 없으면 예 | `npx ai-agent-playbook skills install --dry-run` 뒤 `npx ai-agent-playbook skills install` |
| `skills update` | 패키지나 checkout이 바뀐 뒤 설치된 managed skill을 갱신합니다. | `--dry-run`이 없으면 예 | `npx ai-agent-playbook skills update --dry-run` 뒤 `npx ai-agent-playbook skills update` |
| `skills uninstall` | 이 playbook이 설치한 수정되지 않은 managed skill을 제거합니다. | `--dry-run`이 없으면 예 | `npx ai-agent-playbook skills uninstall --dry-run` 뒤 `npx ai-agent-playbook skills uninstall` |

Skills 명령은 `.ai-agent-playbook-install.json` marker와 content hash를 사용합니다. 기본적으로 다른 사람이 만든 skill은 제거하지 않습니다.

## Project playbook

Project playbook 명령은 대상 repository 하나의 `.ai-playbook/`을 관리합니다.

| 명령 | 언제 쓰나 | 파일을 쓰나 | 예시 |
| ---- | --------- | ----------- | ---- |
| `bootstrap <target>` | 대상 프로젝트에 root `AGENTS.md`와 `.ai-playbook/` 구조를 만듭니다. | `--dry-run`이 없으면 예 | `npx ai-agent-playbook bootstrap <target-project> --dry-run` |
| `guides sync <target>` | 기존 `.ai-playbook/guides/`에 누락된 guide template을 복사합니다. | `--dry-run` 또는 `--check`가 없으면 예 | `npx ai-agent-playbook guides sync <target-project> --check --diff --json` |
| `migrate path <target>` | legacy `ai-playbook/`에서 `.ai-playbook/`로 이동하는 작업을 preview하거나 적용합니다. | `--apply`가 있을 때만 예 | `npx ai-agent-playbook migrate path <target-project> --json` |
| `migrate layout <target>` | `.ai-playbook` layout v2 디렉터리와 v1 compatibility file 복사를 preview하거나 적용합니다. | `--apply`가 있을 때만 예 | `npx ai-agent-playbook migrate layout <target-project> --to v2 --json` |
| `layout status <target>` | 대상 playbook에 v2 layout file과 directory가 있는지 보고합니다. | 아니오 | `npx ai-agent-playbook layout status <target-project> --json` |
| `doctor <target>` | project playbook 상태, adaptation 상태, worklog summary freshness, local path risk를 점검합니다. | 아니오 | `npx ai-agent-playbook doctor <target-project> --json` |
| `config preview <target>` | built-in 값, 명시적 user config, target config, target-local config, 좁은 env override 순서로 Harness OS 기본값을 해석합니다. | 아니오 | `npx ai-agent-playbook config preview <target-project> --json` |
| `context <target>` | 선택적 hook 또는 점검용으로 core `.ai-playbook/` 파일에서 compact context를 만듭니다. | 아니오 | `npx ai-agent-playbook context <target-project> --json` |
| `context list <target>` | `.ai-playbook/context/**/*.md` 파일과 frontmatter를 나열합니다. | 아니오 | `npx ai-agent-playbook context list <target-project> --json` |
| `context status <target>` | 한 file에 적용되는 path-scoped context와 `maps/doc-map.md` 존재 여부를 보여줍니다. | 아니오 | `npx ai-agent-playbook context status <target-project> --path src/example.ts --json` |
| `context init <target>` | starter `context/root.md`, `_registry.json`, `maps/doc-map.md`를 만듭니다. | `--dry-run`이 없으면 예 | `npx ai-agent-playbook context init <target-project> --dry-run --json` |

대상 프로젝트의 `.ai-playbook/`을 `.gitignore`에 추가해야 하면 `bootstrap`에 `--local-only`를 사용합니다.

`config preview`는 존재하는 경우 `.ai-playbook/config.json`과 `.ai-playbook/config.local.json`을 읽습니다. 두 파일을 생성하지는 않습니다. 우선순위는 built-in default, optional `--user-config`, target config, target-local config, 그리고 `AI_PLAYBOOK_CONTEXT_MAX_CHARS`, `AI_PLAYBOOK_DEFAULT_RECIPE`, `AI_PLAYBOOK_RUNTIME_CACHE_DIR`, `AI_PLAYBOOK_INDEX_MAX_FILES`, `AI_PLAYBOOK_ENABLE_WRITE_TOOLS` 같은 명시적 environment override입니다.

Context file은 `id`, `globs`, `alwaysApply`, `freshness`, `priority` frontmatter를 지원합니다. 특정 path 작업 전에 어떤 project memory를 읽어야 할지 보려면 `context status`를 사용합니다. 이 명령은 read-only라 자주 실행해도 안전합니다.

`CURRENT.md`에는 현재 기준선 사실, 활성 리스크, 결정, 프로젝트별 working vocabulary를 둡니다. 더 큰 구조 사실, scan range, clone 또는 duplicate-code cue는 map에 두어 `CURRENT.md`를 긴 보고서로 만들지 않고도 검토 가능하게 유지합니다.

## Harness OS catalog와 runtime

아래 명령은 v2 capability model과 생성된 local runtime surface를 노출합니다. 코드 수정 전에 안전하게 실행할 수 있습니다.

| 명령 | 언제 쓰나 | 파일을 쓰나 | 예시 |
| ---- | --------- | ----------- | ---- |
| `catalog list` | capability category와 skill/workflow 개수를 나열합니다. | 아니오 | `npx ai-agent-playbook catalog list --json` |
| `catalog check` | skill taxonomy, duplicate name, wrapper route, wrapper reference를 검증합니다. | 아니오 | `npx ai-agent-playbook catalog check --json` |
| `workflow list` | built-in workflow recipe를 나열합니다. | 아니오 | `npx ai-agent-playbook workflow list --json` |
| `workflow run-preview <target>` | target 또는 bundled recipe에서 workflow run manifest를 run file 생성 없이 preview합니다. | 아니오 | `npx ai-agent-playbook workflow run-preview <target-project> --recipe backend-contract-change --json` |
| `workflow run-start <target>` | `.ai-playbook/workflows/runs/` 아래 제한된 scaffold-tier run record를 preview하거나 생성합니다. | `--apply`가 있을 때만 예 | `npx ai-agent-playbook workflow run-start <target-project> --recipe deployment-release --json` |
| `reference inventory <reference-dir>` | 채택할 항목을 판단하기 전에 local reference collection을 요약합니다. | 아니오 | `npx ai-agent-playbook reference inventory _reference --json` |
| `reference inspect <reference-dir>` | Source content를 복사하지 않고 하나의 top-level reference project를 compact adoption review packet으로 inspect합니다. | 아니오 | `npx ai-agent-playbook reference inspect _reference --project hermes-agent-main --json` |
| `reference adoption-queue <reference-dir>` | local reference collection을 compact adoption backlog로 점수화하고 필요하면 ledger status를 붙입니다. | 아니오 | `npx ai-agent-playbook reference adoption-queue _reference --ledger .ai-playbook/knowledge/reference-adoption-ledger.md --json` |
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
| `runtime capability-history <target>` | benchmark나 telemetry를 실행하지 않고 local append-only capability history를 요약합니다. | 아니오 | `npx ai-agent-playbook runtime capability-history <target-project> --json` |
| `runtime schema-check <target>` | runtime eval, witness, evidence-envelope, repo-graph, artifact, source-registry JSON을 파일 쓰기 없이 검증합니다. | 아니오 | `npx ai-agent-playbook runtime schema-check <target-project> --path .ai-playbook/runtime/reports/evals/example.json --json` |
| `evidence locator-check <target>` | JSON 또는 Markdown evidence locator의 portable path, scan range, source boundary, freshness, credential-looking value를 확인합니다. | 아니오 | `npx ai-agent-playbook evidence locator-check <target-project> --path .ai-playbook/runtime/reports/evidence/example.json --json` |
| `index build <target>` | `.ai-playbook/runtime/indexes/file-inventory.json` 생성을 preview하거나 씁니다. | `--apply`가 있을 때만 예 | `npx ai-agent-playbook index build <target-project> --json` |
| `index status <target>` | runtime file inventory 존재 여부를 확인합니다. | 아니오 | `npx ai-agent-playbook index status <target-project> --json` |
| `index search <target>` | runtime index를 쓰지 않고 local project text를 검색합니다. | 아니오 | `npx ai-agent-playbook index search <target-project> --query "auth flow" --json` |
| `index symbol-outline <target>` | function, class, component, method, binding hint를 file, line, confidence, source pattern metadata와 함께 preview합니다. | 아니오 | `npx ai-agent-playbook index symbol-outline <target-project> --json` |
| `index dependency-inventory <target>` | dependency manifest, lockfile, container base image, package script, CI action usage를 script 실행이나 network scan 없이 preview합니다. | 아니오 | `npx ai-agent-playbook index dependency-inventory <target-project> --json` |
| `index route-api-hints <target>` | route, client API, SQL query, migration, data-object hint를 source pattern metadata와 함께 preview합니다. | 아니오 | `npx ai-agent-playbook index route-api-hints <target-project> --json` |
| `graph preview <target>` | runtime file, symbol, route/API, dependency signal을 조합한 compact generated graph를 preview합니다. | 아니오 | `npx ai-agent-playbook graph preview <target-project> --json` |
| `canon draft <target>` | runtime index와 report에서 promotion-ready fact 후보를 작성합니다. | 아니오 | `npx ai-agent-playbook canon draft <target-project> --json` |
| `canon check <target>` | memory에 승격된 canon fact를 runtime evidence와 현재 file 기준으로 확인합니다. | 아니오 | `npx ai-agent-playbook canon check <target-project> --json` |
| `canon promote <target>` | runtime report의 reviewed canon fact를 memory 또는 knowledge references로 preview하거나 씁니다. | `--apply --reviewed`가 있을 때만 예 | `npx ai-agent-playbook canon promote <target-project> --source .ai-playbook/runtime/reports/example.json --to .ai-playbook/memory/maps/canon.json --json` |
| `write-gate preview <target>` | 수정 전에 intent와 optional path 기준 write risk를 preview합니다. | 아니오 | `npx ai-agent-playbook write-gate preview <target-project> --intent "change auth flow" --path src/example.ts --json` |
| `write-gate advisory <target>` | playbook runtime 아래 pre-write advisory report를 preview하거나 저장합니다. | `--apply`가 있을 때만 예 | `npx ai-agent-playbook write-gate advisory <target-project> --intent "change auth flow" --path src/example.ts --apply --json` |
| `write-gate post-check <target>` | 수정 뒤 saved advisory snapshot과 현재 file을 비교합니다. | 아니오 | `npx ai-agent-playbook write-gate post-check <target-project> --advisory .ai-playbook/runtime/reports/write-gate/pre-write-advisory.<id>.json --json` |

`reference inspect`는 local reference directory에서 하나의 top-level project를 열고, content를 복사하지 않는 adoption packet을 반환합니다. Packet에는 summary count, signal highlight, capability hint, representative file read order, adoption question, next action이 포함됩니다. Traversal, absolute path, nested project path를 거부해 reference review가 한 collection 범위 안에 머물게 합니다.

`reference adoption-queue`는 `reference inventory` 위에서 동작합니다. Skills, agents, MCP, workflows, memory, indexes, connectors, security, compliance, docs, tests, package metadata 같은 local signal로 top-level reference collection을 점수화합니다. Raw reference contents를 복사하지 않고 recommended capability area, representative file path, next adoption action만 반환합니다. `--ledger <ledger.md>`를 추가하면 reference adoption ledger의 `ledgerStatus`, `ledgerCapability`, `ledgerDecisionDate`를 queue item에 붙입니다.

`reference capability-matrix`는 adoption queue 위에서 동작하며 candidate를 recommended/candidate capability id별로 묶습니다. 각 group은 priority count, optional ledger status count, recommended/candidate match count, signal highlight, representative file, next action이 포함된 bounded top-reference list를 담습니다. `--capability <id>`를 추가하면 `ai-harness`나 `security` 같은 특정 capability만 볼 수 있고, `--ledger <ledger.md>`를 추가하면 기존 adoption decision을 함께 볼 수 있습니다. 이 command는 read-only이며 raw reference source content를 출력하지 않습니다.

`reference adoption-plan`은 capability matrix와 선택된 inspect packet 위에서 동작합니다. `--capability <id>`가 필요하며 selected reference, ledger status, suggested local surface, read order, adoption question, stop condition, verification, follow-up이 담긴 bounded plan을 반환합니다. Packet은 triage evidence일 뿐이며 adopted 표시를 하지 않고 ledger row, source registry entry, runtime report, skill, workflow, MCP file을 쓰지 않습니다.

`reference adoption-status`는 adoption queue를 target project의 source registry 및 optional adoption ledger와 결합합니다. `knowledge/sources.json`, ledger row, matrix output을 수동으로 비교하지 않고도 reference adoption 작업을 이어갈 수 있도록 source-registered/source-missing queue row, ledger status count, capability rollup을 보고합니다. 기본 registry나 ledger file이 없으면 warning이고, 명시한 path가 잘못되면 conflict입니다. 이 command는 read-only이며 adoption decision을 쓰거나 promotion하지 않습니다.

`reference source-registry-preview`는 adoption queue 위에서 동작하며 `knowledge/sources.json` candidate object를 반환합니다. Entry locator는 scanned reference root 기준 relative path를 유지하고 privacy tier, credential boundary, freshness, promotion policy, caveat, capability hint, representative file을 포함합니다. 이 명령은 생성된 registry shape를 검증하지만 파일을 쓰거나 source를 memory로 promotion하지 않습니다.

`reference source-registry-check`는 기본적으로 `.ai-playbook/knowledge/sources.json`을 읽고 schema shape, duplicate id, status/privacy/type summary, stale freshness value를 검증합니다. Target project 내부의 다른 registry를 확인하려면 `--path <sources.json>`를 추가합니다. Local reference directory 아래에서 등록된 `referencePath`와 representative file이 아직 존재하는지 내용 읽기 없이 확인하려면 `--reference-dir <dir>`를 추가합니다.

`reference source-registry-update`는 기존 `.ai-playbook/knowledge/sources.json`에 누락된 local reference source entry만 append합니다. 기존 source entry와 top-level registry metadata를 보존하고, 병합된 registry를 write 전에 검증하며, 쓰기는 `--apply`가 있을 때만 수행합니다.

`reference ledger-init`은 local reference adoption queue에서 `.ai-playbook/knowledge/reference-adoption-ledger.md`를 seed합니다. `--apply`가 있을 때만 쓰고, 기존 ledger overwrite는 거부하며, 생성 row는 status, reference id, capability, useful pattern summary, local adoption note, risk/noise note, decision date placeholder로 compact하게 유지합니다.

`reference ledger-update`는 기존 reference adoption ledger에 누락된 `new` row만 append합니다. 현재 ledger를 사용해 이미 reviewed, adopted, deferred, rejected로 기록된 reference를 중복 추가하지 않고, 실제 row를 append할 때 starter blank template row를 제거하며, 쓰기는 `--apply`가 있을 때만 수행합니다.

`reference ledger-decision`은 기존 reference adoption ledger row 하나를 `reviewed`, `adopted`, `deferred`, `rejected` 중 하나로 update합니다. 기본값은 정확한 row replacement preview이고, 쓰기는 `--apply`가 있을 때만 수행합니다. Optional `--capability`, `--pattern`, `--adoption`, `--risk`, `--decision-date YYYY-MM-DD` flag로 선택한 row cell을 갱신할 수 있습니다. Local absolute path, internal URL, token-like secret, table separator, newline, oversized raw excerpt 같은 unsafe cell value는 어떤 write 전에도 거부됩니다.

`reference ledger-check`는 기본적으로 `.ai-playbook/knowledge/reference-adoption-ledger.md`를 검증합니다. 파일을 쓰지 않고 adoption status, local absolute path, internal URL, secret-like token, oversized excerpt를 확인합니다. 대상 프로젝트 내부의 다른 ledger를 확인하려면 `--path <ledger.md>`를 사용합니다. JSON output에는 capability 영역별 adoption status를 볼 수 있도록 `summary.capabilities`가 포함됩니다. Oversized fenced excerpt를 warning이 아니라 실패로 다루려면 `--strict`를 추가합니다.

`runtime capability-history`는 존재할 때 `.ai-playbook/runtime/reports/capability-history.jsonl`을 읽습니다. Entry를 capability별로 묶고 latest status, latest duration, baseline, drift를 보고하며, machine-local path를 그대로 출력하지 않도록 non-portable evidence path는 output에서 생략합니다. History가 없으면 정상적인 empty state입니다.

`runtime schema-check`는 target-relative JSON file을 읽고 `runtime.eval-definition`, `runtime.eval-run-report`, `runtime.capability-witness`, `runtime.evidence-envelope`, `runtime.repo-graph`, `runtime.source-registry` 또는 generic runtime artifact envelope 같은 compact local schema를 검증합니다. 알려진 `kind` 값은 자동 감지하며, 모호한 evidence envelope를 확인할 때는 `--kind <kind>`를 사용할 수 있습니다. 이 명령은 read-only입니다. Compact schema check는 local absolute path, credential처럼 보이는 값, non-portable graph path, dangling graph edge, oversized inline evidence를 conflict로 보고합니다.

`evidence locator-check`는 target-relative JSON 또는 Markdown file을 읽고 locator처럼 보이는 object, fenced evidence block, locator table을 재귀적으로 검사합니다. Missing scan range, missing/unknown source boundary, non-portable locator path, local absolute path, credential처럼 보이는 string을 파일 쓰기 없이 보고합니다. Locator block이 없는 Markdown file은 실패가 아니라 advisory warning을 반환합니다.

`graph preview`는 기존 read-only runtime signal을 조합해 compact `runtime.repo-graph` report를 만듭니다. File, doc, symbol, route, data, package node와 `contains`, `defines-route`, `mentions`, `uses-package` 같은 source-backed edge를 포함합니다. Graph는 generated evidence일 뿐입니다. Report를 durable memory로 취급하지 말고 검토된 fact만 별도로 promote합니다.

`write-gate preview`는 `.ai-playbook/runtime/reports/write-gate/` 아래 planned `transaction.advisoryPath`와 `transaction.invocationId`를 반환합니다. Preview는 read-only를 유지하며, transaction field는 이후 post-write 또는 advisory file 작업의 안정적인 handoff로 씁니다.

`write-gate advisory`는 같은 preview engine을 사용하지만 `--apply`가 있을 때 pre-write advisory JSON file을 저장할 수 있습니다. 파일은 `.ai-playbook/runtime/reports/write-gate/` 내부에만 쓰며, `--apply`가 없으면 planned advisory만 반환하고 파일을 쓰지 않습니다.

`write-gate post-check`는 saved advisory를 읽고 그 snapshot을 현재 file과 비교합니다. Advisory가 없거나, 유효하지 않거나, snapshot이 없으면 변경이 clean하다고 꾸미지 않고 `summary.status: "unknown"`을 보고합니다.

`canon draft`는 `.ai-playbook/runtime/indexes/file-inventory.json`과 `.ai-playbook/runtime/reports/` 아래 JSON report에서 fact 후보를 제안합니다. `canon check`는 `.ai-playbook/memory/` 아래 승격된 JSON fact 또는 특정 `--path <canon-json>`을 읽고 파일을 쓰지 않은 채 `verified`, `missing`, `stale`, `changed`, `unverified` 상태를 보고합니다.

`canon promote`는 `--source <runtime-index-or-report-json>`와 `--to <memory-or-reference-json>`를 받습니다. source는 `.ai-playbook/runtime/indexes/` 또는 `.ai-playbook/runtime/reports/` 아래 JSON file이어야 합니다. `--apply`와 `--reviewed`가 모두 있을 때만 쓰며, 목적지는 `.ai-playbook/memory/` 또는 `.ai-playbook/knowledge/references/` 내부 JSON file로 제한합니다.

Promotion source는 `schemaVersion`, `kind`, `target`, `mode`, `generatedAt`, `summary`, `warnings`, `conflicts`를 가진 유효한 runtime artifact여야 합니다. Runtime report가 malformed 상태이거나 오래된 shape를 쓰면 `canon promote`는 fact를 만들지 않고 conflict를 보고합니다.

Runtime output은 `.ai-playbook/runtime/` 아래에 둡니다. 검토와 명시적 승격 없이 generated output을 `.ai-playbook/memory/`로 복사하지 않습니다.

## Managed files

Managed 명령은 `.ai-playbook/.ai-agent-playbook-install.json`을 확인하거나 관리합니다. 파일을 제거하거나 adopt하기 전에 hash를 비교해 수정된 project memory를 보호합니다.

| 명령 | 언제 쓰나 | 파일을 쓰나 | 예시 |
| ---- | --------- | ----------- | ---- |
| `managed check <target>` | managed marker를 확인하고 누락되거나 수정된 managed file을 보고합니다. | 아니오 | `npx ai-agent-playbook managed check <target-project> --json` |
| `managed catalog <target>` | cleanup 전에 managed file을 kind와 status별로 봅니다. | 아니오 | `npx ai-agent-playbook managed catalog <target-project> --json` |
| `managed adopt <target>` | 현재 template과 일치하는 오래된 playbook file에 marker를 추가합니다. | `--apply`가 있을 때만 예 | `npx ai-agent-playbook managed adopt <target-project> --json` |
| `managed prune <target>` | 선택한 수정되지 않은 managed file 하나를 제거합니다. | `--apply`가 있을 때만 예 | `npx ai-agent-playbook managed prune <target-project> --path .ai-playbook/guides/runtime-harness.md --json` |
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
| `run start <target>` | `.ai-playbook/runs/<run-id>/` 아래 brief, criteria file, append-only ledger, evidence folder, summary를 만듭니다. | `--dry-run`이 없으면 예 | `npx ai-agent-playbook run start <target-project> --title "Auth flow" --dry-run --json` |
| `run status <target>` | 최신 run 또는 선택한 run의 event, criteria, blocker, evidence, cleanup 상태를 요약합니다. | 아니오 | `npx ai-agent-playbook run status <target-project> --run-id auth-flow --json` |
| `run record <target>` | `ledger.jsonl`에 note, criterion, evidence, blocker, cleanup event를 append합니다. | 예 | `npx ai-agent-playbook run record <target-project> --run-id auth-flow --type evidence --status pass --message "Auth flow test passed" --evidence .ai-playbook/runs/auth-flow/evidence/auth.txt --json` |
| `run summarize <target>` | append-only ledger를 사람이 읽는 `summary.md`로 정리합니다. | `--dry-run`이 없으면 예 | `npx ai-agent-playbook run summarize <target-project> --run-id auth-flow --dry-run --json` |

`run record`는 로컬 절대경로나 credential assignment처럼 보이는 message를 거부합니다. Evidence path는 portable relative path만 허용합니다. Runs는 worklog를 대체하지 않습니다. 실행 중에는 runs를 쓰고, 오래 남길 사실은 `CURRENT.md`, maps, runbooks, decisions, contracts, worklogs로 승격합니다.

`workflow run-start`는 기존 `run start` ledger와 별도입니다. Workflow recipe를 사용하고, `--apply`가 있을 때만 `.ai-playbook/workflows/runs/` 아래 새 scaffold file을 씁니다. `--apply`가 없으면 파일을 쓰지 않고 planned file을 반환합니다.

## Contracts

Contracts는 중요한 business rule과 invariant를 기록합니다. 명시적으로 실행하는 read-only check이며, LLM judge, pre-commit block, 자동 승인 기능은 없습니다.

| 명령 | 언제 쓰나 | 파일을 쓰나 | 예시 |
| ---- | --------- | ----------- | ---- |
| `contracts list <target>` | `.ai-playbook/contracts/` 아래 active/pending contract를 나열합니다. | 아니오 | `npx ai-agent-playbook contracts list <target-project> --json` |
| `contracts check <target>` | 한 path에 적용되는 active/pending contract와 오래되거나 불완전한 contract note를 보여줍니다. | 아니오 | `npx ai-agent-playbook contracts check <target-project> --path src/example.ts --json` |
| `contracts snapshot <target>` | contract, appliesTo, evidence file의 relative path hash를 `.ai-playbook/contracts/.hashes.json`에 쓸지 preview하거나 적용합니다. | `--apply`가 있을 때만 예 | `npx ai-agent-playbook contracts snapshot <target-project> --json` 뒤 `npx ai-agent-playbook contracts snapshot <target-project> --apply --json` |
| `contracts init <target>` | starter `.ai-playbook/contracts/README.md`, `active/`, `pending/` folder를 만듭니다. | `--dry-run`이 없으면 예 | `npx ai-agent-playbook contracts init <target-project> --dry-run --json` |

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
ai-playbook mcp
```

서버는 아래 read-only 도구를 노출합니다.

- playbook context: `playbook_context`, `context_status`, `context_list`
- catalog와 layout: `capability_catalog`, `skill_catalog`, `workflow_list`, `workflow_run_preview`, `reference_inventory`, `reference_inspect`, `reference_adoption_queue`, `reference_capability_matrix`, `reference_adoption_plan`, `reference_adoption_status`, `reference_source_registry_preview`, `reference_source_registry_check`, `reference_ledger_check`, `reference_ledger_decision_preview`, `playbook_layout`, `index_status`, `runtime_schema_check`, `evidence_locator_check`, `index_search`, `symbol_outline`, `dependency_inventory`, `route_api_hints`, `repo_graph_preview`, `write_gate_preview`, `canon_check`
- operator diagnostics: `operator_check`, `operator_search`, `operator_research`, `operator_preflight`, `operator_delta`, `operator_map`, `operator_audit`, `operator_analyze_deep`
- rules와 project state: `rules_check`, `contracts_check`, `contracts_list`, `managed_check`, `managed_catalog`, `diagnostics_check`
- QA와 deep analysis: `qa_image_diff`, `source_function_clones`, `ast_grep_search`, `lsp_status`, `lsp_diagnostics`, `lsp_symbols`, `lsp_references`, `lsp_definition`

서버는 `repo_onboarding_runbook`, `harness_extension_plan`, `harness_governance_review`, `reference_adoption_review`, `backend_change_review`, `architecture_boundary_review`, `auth_access_control_review`, `dependency_supply_chain_review`, `package_release_readiness_review`, `deployment_release_review`, `mobile_release_review`, `connector_integration_review`, `frontend_quality_review`, `data_integrity_review`, `data_pipeline_review`, `database_change_review`, `adr_spec_handoff_review`, `documentation_package_review`, `workflow_run_review`, `eval_harness_review`, `capability_witness_review`, `pre_action_fact_gate_review`, `knowledge_source_review`, `canon_promotion_review`, `index_interpretation_review`, `agent_orchestration_review`, `repo_graph_review`, `ci_quality_gate_review`, `release_deployment_gate_review`, `security_compliance_gate_review` prompt도 노출합니다. Prompt는 재사용 가능한 작업 brief이며, 그 자체로 쓰기 권한을 열지는 않습니다.

MCP 계층은 기본적으로 read-only입니다. `mcp --enable-write-tools`를 쓰면 `workflow_run_start`와 `write_gate_advisory`도 노출하지만, 둘 다 tool-call `apply` boolean을 요구하고 `apply`가 false이면 dry-run으로 남습니다. 그래도 bootstrap, install, update, uninstall, prune, snapshot apply, run record, canon promotion, rename, rewrite, project source write command는 노출하지 않습니다.

## Adapter setup

Adapter는 선택 사항입니다. 기본 harness는 hook이나 agent plugin 없이도 동작합니다.

| 명령 | 언제 쓰나 | 파일을 쓰나 | 예시 |
| ---- | --------- | ----------- | ---- |
| `adapter config <target>` | Codex 또는 Claude Code용 local hook 설정을 copy-paste 가능한 형태로 렌더링합니다. | 아니오 | `npx ai-agent-playbook adapter config <target-project> --adapter codex --json` |
| `adapter check <target>` | 선택적 adapter file, context, local settings가 준비됐는지 확인합니다. | 아니오 | `npx ai-agent-playbook adapter check <target-project> --adapter codex --settings <local-settings-path> --json` |

`adapter config`는 settings file을 만들지 않습니다. Operator가 검토하고 수동으로 복사할 command와 JSON을 출력합니다.

`adapter config --json`은 `npx ai-agent-playbook mcp`를 쓰는 MCP server 예시와 global install용 `ai-playbook mcp` 예시도 함께 포함합니다.

## Plan과 worklog

임의의 markdown 파일을 만들지 않고 예측 가능한 project-memory 경로를 쓰고 싶을 때 사용합니다.

| 명령 | 언제 쓰나 | 파일을 쓰나 | 예시 |
| ---- | --------- | ----------- | ---- |
| `plan new <target>` | `.ai-playbook/plans/` 아래 dated plan을 만듭니다. | `--dry-run`이 없으면 예 | `npx ai-agent-playbook plan new <target-project> --title "Feature slice" --dry-run` |
| `worklog new <target>` | `.ai-playbook/worklogs/YYYY-MM/` 아래 dated worklog를 만듭니다. | `--dry-run`이 없으면 예 | `npx ai-agent-playbook worklog new <target-project> --title "Feature slice" --dry-run` |
| `worklog summarize <target>` | monthly worklog summary를 만들거나 갱신합니다. | `--dry-run`이 없으면 예 | `npx ai-agent-playbook worklog summarize <target-project> --month 2026-06 --dry-run` |

기존 plan과 worklog file은 `--force`가 없으면 덮어쓰지 않습니다.

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
