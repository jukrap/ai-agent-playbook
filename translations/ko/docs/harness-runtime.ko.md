# 런타임 하네스

`aapb`은 재사용 스킬을 설치하고 이 저장소를 대상 프로젝트에 적용하기 위한 실행 표면입니다. AI 모델을 호출하지 않습니다. 템플릿을 복사하고, 프로젝트 메모리 상태를 점검하고, 예측 가능한 context, run, contract, plan, worklog 파일을 만들어 에이전트가 임의의 markdown 경로를 계속 새로 만들지 않게 합니다.

MCP 서버는 AI 앱을 위한 read-only 도구 표면입니다. MCP를 지원하는 앱이 같은 로컬 진단과 분석 helper를 호출할 수 있게 하므로, 사용자가 모든 CLI 명령을 외울 필요가 줄어듭니다. 이 버전에서는 여전히 local stdio, no-network, no-write입니다.

이 CLI와 project playbook이 기본 하네스입니다. Runtime hook 또는 plugin은 선택 확장이며, 동작이 명시적이고 local이며 쉽게 끌 수 있기 전까지 기본 경로 밖에 둡니다. 단계적 설계는 `runtime-roadmap.ko.md`를 봅니다.

설치 범위는 구분해서 봅니다.

- `npx ai-agent-playbook ...`은 현재 프로젝트에 패키지를 추가하지 않고 배포된 패키지를 실행합니다.
- `npm install -g ai-agent-playbook`은 `aapb` 명령을 전역으로 설치합니다.
- `npm install -D ai-agent-playbook`은 한 프로젝트에 CLI를 고정하지만 스킬을 복사하거나 `.ai-agent-playbook/`을 만들지 않습니다.
- `aapb mcp`는 AI 앱용 로컬 stdio MCP 서버를 시작합니다. 그 자체로 project file을 쓰지는 않습니다.
- `skills install`과 `skills update`는 사용자 수준 스킬 복사본만 씁니다.
- `bootstrap`, `guides sync`, `managed` 명령은 project-level playbook 작업입니다.

## 명령

자세한 명령어 reference는 [명령어 가이드](commands.ko.md)에 둡니다. 이 문서는 runtime 동작과 안전 규칙에 집중합니다.

배포 패키지는 `npx ai-agent-playbook ...`, 전역 설치 뒤에는 `aapb ...`, local checkout에서는 `node .\bin\aapb.mjs ...` 형태로 실행합니다.

역할을 짧게 나누면 아래와 같습니다.

- CLI: 사람이 명시적으로 실행하는 operator 명령입니다. Preview-first write도 여기에 속합니다.
- MCP: AI가 호출하는 read-only 도구입니다. Context, diagnostics, search, contracts, managed state, QA, AST search, 정확한 함수 본문 중복 단서, TypeScript/JavaScript analysis를 다룹니다.
- Skills: 에이전트 환경이 읽는 재사용 작업 지침입니다.
- `.ai-agent-playbook/`: 대상 프로젝트의 memory, runs, contracts, guides, plans, worklogs입니다.
- Adapters: 환경별 선택적 hook/config 렌더링입니다. 기본 설치 경로가 아닙니다.

## 여러 언어를 쓰는 capability engine

공개 실행 표면은 계속 Node 기반으로 유지합니다. `npx ai-agent-playbook`, 전역 `aapb` 명령, stdio MCP 서버는 같은 JavaScript 진입점을 사용합니다. Python은 그 뒤에서 동작하는 로컬 capability engine이며, 한국어/영어 글 점검과 이후 분석/색인 보조처럼 이득이 분명한 영역에 사용합니다.

Python은 권장 사항이지 필수 조건이 아닙니다. Bridge는 JSON 표준 입력/출력 계약만 사용하고, 장기 daemon을 띄우지 않고, 파일을 쓰지 않고, network를 호출하지 않습니다. 탐지 순서는 `AI_AGENT_PLAYBOOK_PYTHON`, 저장소 로컬 `.venv`, `python`, `python3`, Windows `py -3`입니다.

선택된 인터프리터는 아래 명령으로 확인합니다.

```powershell
npx ai-agent-playbook runtime python-status --json
```

소스 체크아웃에서는 `.\scripts\bootstrap-python.ps1`로 `.venv`를 만들고 선택 한국어 분석 패키지를 설치할 수 있습니다. 패키지 사용자는 Python 3.11 이상 환경을 `AI_AGENT_PLAYBOOK_PYTHON`으로 지정하면 됩니다. `kss`, `kiwipiepy` 같은 선택 라이브러리는 설치되어 있으면 사용하고, 없으면 건너뜁니다. Python이 없으면 Python 기반 명령은 `engines.unavailable`을 반환하고 JavaScript 대체 분석을 유지합니다.

## Repo-local config preview

`config preview`는 플레이북 기본값을 read-only로 해석하는 resolver입니다. 최종 값, source map, source file 상태, warning, conflict를 보고하지만 runtime behavior를 바꾸거나 파일을 쓰지 않습니다.

우선순위는 다음과 같습니다.

1. Built-in default.
2. 명시적인 `--user-config <path>` 파일.
3. `.ai-agent-playbook/config.json`.
4. `.ai-agent-playbook/config.local.json`.
5. 좁은 environment override.

이 명령은 개인 home config를 자동으로 읽지 않습니다. Target-local config는 명시적 user config보다 우선합니다. Environment override는 `AI_AGENT_PLAYBOOK_CONTEXT_MAX_CHARS`, `AI_AGENT_PLAYBOOK_DEFAULT_RECIPE`, `AI_AGENT_PLAYBOOK_RUNTIME_CACHE_DIR`, `AI_AGENT_PLAYBOOK_INDEX_MAX_FILES`, `AI_AGENT_PLAYBOOK_ENABLE_WRITE_TOOLS`로 제한합니다.

신뢰하는 target config file은 target playbook root 아래의 일반 JSON 파일이어야 합니다. Malformed JSON, symlink된 config file, `.ai-agent-playbook/runtime/` 밖의 runtime path는 conflict로 보고합니다.

## Runtime index

Runtime index는 generated evidence이지 trusted memory가 아닙니다. 파일로 쓸 때는 `.ai-agent-playbook/runtime/indexes/` 아래에 두고, memory로 옮길 때는 명시적인 canon review를 거쳐야 합니다.

`index build`는 `--apply`가 있을 때 file inventory를 쓸 수 있습니다. `index search`는 항상 read-only이며 필요할 때 local text를 직접 스캔합니다. `index symbol-outline`은 이번 batch에서 read-only preview입니다. Function, class, component, method, binding hint를 file, line, language, confidence, source pattern metadata와 함께 반환하지만 `.ai-agent-playbook/runtime/indexes/symbol-outline.json`은 만들지 않습니다.

Symbol outline은 JS/TS, Python, Java, Kotlin, C#, Go, PHP, Ruby, Rust source file에 대해 lightweight local pattern을 사용합니다. Dependency/generated folder, large file, `.ai-agent-playbook/runtime/`은 건너뜁니다. Low-confidence entry는 canonical architecture가 아니라 탐색 단서로 취급합니다.

`index dependency-inventory`도 read-only입니다. Package script를 실행하거나, container를 build하거나, registry에 접속하거나, vulnerability database를 가져오지 않고 dependency manifest, 인접 lockfile, package script name, Docker/Compose image hint, GitHub Actions `uses:` entry를 보고합니다. 인접 lockfile 부재는 failure가 아니라 warning입니다.

`index route-api-hints`는 route declaration, client API call, SQL query target, migration, data-object hint를 preview합니다. 일반 server framework와 SQL syntax에 대한 lightweight local pattern을 사용하고 file/line/confidence/source metadata를 포함하지만, 완전한 API map이나 data map이라고 주장하지 않습니다.

Runtime artifact JSON은 안정적인 evidence envelope를 유지해야 합니다. 필수 field는 `schemaVersion`, `kind`, `target`, `mode`, `generatedAt`, `summary`, `warnings`, `conflicts`입니다. Canon promotion은 이 envelope를 만족하지 않는 runtime source를 거부하므로, 오래되었거나 malformed된 generated evidence가 조용히 trusted memory로 승격되지 않습니다.

`runtime capability-history`는 optional append-only local signal로 `.ai-agent-playbook/runtime/reports/capability-history.jsonl`을 읽습니다. Benchmark 실행, network 접속, telemetry 활성화 없이 capability status, latest duration, baseline, drift를 요약합니다. Entry는 portable evidence path를 사용해야 하며, non-portable path는 output에서 생략하고 warning으로 보고합니다.

`runtime schema-check`는 target-relative JSON을 파일 쓰기 없이 검증합니다. Generic runtime artifact envelope와 eval definition, eval run report, capability witness, evidence envelope, repo graph, `.ai-agent-playbook/knowledge/sources.json`용 compact schema를 지원합니다. Compact schema check는 local absolute path, credential처럼 보이는 값, 중복 source id, 잘못된 enum 값, non-portable artifact 또는 graph path, dangling graph edge, oversized inline evidence를 거부하므로 generated report와 source registry entry를 canon 또는 documentation promotion 전에 검토 가능한 상태로 유지합니다.

`graph preview`는 현재 file inventory, symbol outline, dependency inventory, route/API/data hint에서 read-only `runtime.repo-graph` report를 만듭니다. 검토용 compact node와 source-backed edge를 기록하지만 여전히 generated runtime evidence입니다. 안정적인 fact를 memory map으로 옮기기 전에는 canon 또는 documentation promotion을 사용합니다.

`writing naturalness-check`도 읽기 전용입니다. 대상 프로젝트 안의 상대 경로 파일 하나를 읽고 한국어 또는 영어 글의 번역투, AI식 표현, 과한 어조, 반복 문장 리듬, 영어 용어 과다를 보고합니다. `--engine auto`는 기본 JavaScript 대체 분석과, 사용 가능한 경우 선택 Python 엔진을 함께 사용합니다. JSON 결과에는 `engines.used`와 `engines.unavailable`이 포함됩니다. 파일을 다시 쓰지 않고, 네트워크를 호출하지 않고, 저자성을 판정하지 않고, 탐지 우회를 돕지 않습니다. README, 문서, 번역, PR 본문, 배포 노트, 공개 요약을 고치기 전의 편집 점검표로 사용합니다.

## Workflow run record

`workflow run-preview`는 현재 구현된 workflow 명령입니다. Target-local recipe를 먼저 읽고, 없으면 bundled recipe로 fallback하며, run contract를 parse한 뒤 파일을 쓰지 않고 generated evidence를 반환합니다.

미래 `workflow run-start` 동작은 project-write가 아니라 scaffold tier에 속합니다. 명시적 command와 apply flag가 있을 때만 `.ai-agent-playbook/workflows/runs/` 아래에 쓸 수 있습니다. 유효한 run-start write는 제한된 run manifest, criteria checklist, evidence notes stub, handoff stub을 만들어야 합니다. Missing recipe, empty manifest, path traversal, project-source destination, trusted memory destination, 기존 run record overwrite는 safe unique path가 없으면 거부해야 합니다.

Run record는 운영 로그이지 durable project truth가 아닙니다. Reviewed stable fact만 canon/documentation flow를 통해 `memory/`, `contracts/`, map, decision, runbook으로 승격합니다.

## MCP 도구 표면

로컬 서버는 아래 명령으로 시작합니다.

```powershell
npx ai-agent-playbook mcp
```

MCP를 지원하는 AI 앱은 이 명령을 등록한 뒤 `runtime_schema_check`, `writing_naturalness_check`, `operator_search`, `operator_research`, `operator_analyze_deep`, `source_function_clones`, `ast_grep_search`, `lsp_symbols`, `contracts_check`, `managed_check`, `qa_image_diff` 같은 도구를 호출할 수 있습니다. 글 점검 도구는 `engine: "auto" | "js" | "python"`을 받으며, 선택형 로컬 Python 엔진을 호출해도 계속 읽기 전용입니다.

MCP 서버는 read-only 도구만 노출합니다. Bootstrap, skill install/update/uninstall, managed apply 작업, contract snapshot apply, run record, AST rewrite/apply, LSP rename, automatic doctor execution, blocking/continuation 동작은 노출하지 않습니다.

## Skills lifecycle

`skills` 명령은 PowerShell wrapper 없이 설치형 스킬을 관리합니다.

- `skills check`는 read-only이며 missing, managed, modified, adoptable, conflict 상태를 보고합니다.
- `skills lint`는 read-only이며 공개 전에 source `SKILL.md`의 trigger 중심 description, frontmatter 형태, missing reference link, shallow reference file을 점검합니다. JSON output에는 depth metric이 포함되어 짧은 trigger file은 짧게 유지하고 재사용 절차는 reference에 둘 수 있습니다.
- `skills install`과 `skills update`는 반복 실행 가능한 sync 명령입니다. `--dry-run`은 파일을 쓰지 않습니다.
- `skills check`는 read-only이며 필요한 설치 스킬이 없거나, 로컬에서 수정되었거나, unmanaged conflict에 막히면 non-zero로 종료합니다.
- `skills uninstall`은 수정되지 않은 관리 대상 스킬만 제거하고, `--dry-run`으로 먼저 preview할 수 있습니다.
- 현재 hash가 marker와 일치하는 관리 대상 스킬만 교체하거나 제거합니다. 예외가 필요하면 `--force-managed`를 사용합니다.
- 같은 이름의 관리되지 않는 스킬은 source와 내용이 같을 때만 adopt합니다. 예외가 필요하면 `--force-unmanaged`를 사용합니다.
- 기본 root는 사용자 `.codex/skills`와 `.agents/skills`이며, 레거시 스킬은 `.agents/skills/legacys/`에도 둡니다.

## Bootstrap 동작

- `templates/project-playbook/`을 `<target>/.ai-agent-playbook/`로 복사합니다.
- `templates/agents/global/AGENTS.md`를 얇은 `<target>/AGENTS.md`로 복사합니다. 이 파일은 프로젝트 루트 부트스트랩이며, Codex의 개인 `~/.codex/AGENTS.md`가 아닙니다.
- `.ai-agent-playbook/policy/SKILLS.md`와 `.ai-agent-playbook/policy/GIT.md`는 project playbook의 일부로 포함됩니다.
- `--profile <name>`이 있으면 `templates/agents/profiles/<name>/AGENTS.md`를 root `AGENTS.md`에 병합합니다.
- `--local-only`가 있으면 대상 `.gitignore`에만 `.ai-agent-playbook/`을 추가합니다.
- `.ai-agent-playbook/.ai-agent-playbook-install.json`을 써서 이 playbook이 복사한 파일을 표시합니다. Marker에는 portable relative path와 content hash만 저장합니다.
- 기존 파일은 `--force`가 없으면 덮어쓰지 않습니다.
- 파일을 만들기 전에 예정된 모든 쓰기 작업을 먼저 점검합니다. 충돌이 있으면 부분적인 `.ai-agent-playbook/` 트리를 남기지 않고 충돌만 보고합니다.

호환성: 새 bootstrap 결과는 `.ai-agent-playbook/`을 사용합니다. 기존 `ai-playbook/` 폴더는 더 이상 활성 runtime root가 아니므로, project playbook 명령을 실행하기 전에 `migrate path`로 명시적 폴더 전환을 preview하고 적용합니다. 두 폴더가 모두 있으면 runtime 명령은 `.ai-agent-playbook/`을 읽고 diagnostic은 legacy folder 경고를 냅니다.

## 경로 마이그레이션

`migrate path`는 프로젝트가 legacy `ai-playbook/` 폴더에서 `.ai-agent-playbook/`로 이동할 때 사용합니다.

```powershell
npx ai-agent-playbook migrate path <target> --json
```

기본 모드는 파일을 쓰지 않는 preview입니다. 폴더 이동, root/playbook 문서의 `ai-playbook/` 참조를 `.ai-agent-playbook/`로 바꾸는 작업, 전환 기간 동안 기존 ignore 항목을 유지하면서 `.gitignore`에 `.ai-agent-playbook/`을 추가해야 하는지 보고합니다.

`--apply`는 preview를 검토한 뒤에만 사용합니다. Apply mode는 폴더를 rename하고, root `AGENTS.md`와 playbook markdown 또는 JSON 파일의 참조를 갱신하며, 필요하면 `.gitignore`에 `.ai-agent-playbook/`을 추가합니다. Network call, hook 설치, 관련 없는 project file 편집은 하지 않습니다.

`ai-playbook/`과 `.ai-agent-playbook/`이 둘 다 있으면 conflict를 보고하고 아무 파일도 쓰지 않습니다.

## Managed manifest

`managed` 명령은 project-level install marker인 `.ai-agent-playbook/.ai-agent-playbook-install.json`을 확인하거나 관리합니다.

```powershell
npx ai-agent-playbook managed catalog <target> --json
```

`managed check`는 read-only이며 `{ schemaVersion, ok, target, manifestPath, summary, files, warnings, conflicts }`를 반환합니다. Manifest가 없거나 malformed이면 실패합니다. Managed file이 없거나 로컬에서 수정되었으면 project-specific edit을 조용히 제거하지 않도록 conflict로 보고합니다.

`managed catalog`는 read-only이며 `{ schemaVersion, ok, target, manifestPath, manifest, summary, files, warnings, conflicts }`를 반환합니다. Summary는 managed file을 kind와 status별로 묶어 operator가 어떤 bootstrap, playbook, guide file을 marker가 아직 소유하는지 삭제 전에 확인할 수 있게 합니다.

`managed adopt`는 현재 template과 일치하지만 marker가 없는 오래된 프로젝트에 사용합니다. Preview mode는 파일을 쓰지 않습니다. Apply mode는 현재 content hash가 source template hash와 일치하는 파일만 기록합니다.

`managed prune`은 하나의 managed file을 대상으로 하는 preview-first removal입니다. Portable relative path만 받으며 CLI 입력의 Windows-style separator를 허용합니다. Unmanaged, missing, modified, absolute path는 거부하고 `--apply`가 있을 때만 씁니다. Apply mode는 선택된 수정되지 않은 파일을 제거하고 manifest를 갱신합니다. `.gitignore`는 편집하지 않습니다.

`managed uninstall`도 preview-first입니다. Apply mode는 수정되지 않은 managed file만 제거합니다. 수정된 파일은 보존하고 conflict로 보고합니다. 이 명령은 `.gitignore`를 편집하지 않으며, manifest가 local-only 설치였다고 표시하면 manual cleanup warning을 반환합니다.

## Doctor 점검

`doctor`는 최소 `.ai-agent-playbook/` layout, root `AGENTS.md`, root `AGENTS.md`가 핵심 playbook 파일을 가리키는지, 예상치 못한 root `SKILLS.md` 또는 `GIT.md`, local-only 정책, 아직 조정되지 않은 핵심 템플릿 문구, worklog summary freshness, 분리된 예전 스타일 스킬 참조, 고정 로컬 절대경로를 점검합니다. 기본 모드에서는 warning이 실패로 처리되지 않습니다. `--strict` 모드에서는 warning도 실패합니다.

방금 bootstrap한 결과는 `START_HERE.md`, `CURRENT.md`, `questions.md`에 템플릿 문구가 남아 있어 `playbook adaptation` warning을 낼 수 있습니다. 이는 bootstrap 실패가 아니라 저장소 점검 뒤 playbook을 조정하라는 알림입니다.

Hook, wrapper, automation이 안정적인 machine-readable output을 필요로 하면 `--json`을 사용합니다. JSON 계약은 `schemaVersion: "1"`로 versioning되며, `summary`와 `id`, `level`, `category`, `name`, `message`, `paths`를 가진 `checks[]` 항목을 포함합니다. 현재 text output은 사람이 읽는 기본값으로 유지합니다.

Worklog summary freshness check는 read-only입니다. `.ai-agent-playbook/workflows/worklogs/YYYY-MM/` 아래 상세 worklog가 있는데 `.ai-agent-playbook/workflows/worklogs/summaries/YYYY-MM.md`가 없거나, 같은 달의 상세 entry보다 summary가 오래된 경우 warning을 냅니다.

Wrapper나 script가 전체 doctor report 대신 작은 non-blocking signal만 필요하면 `doctor --reminder --json`을 사용합니다. 반환값은 `{ schemaVersion, ok, target, reminders }`입니다. Reminder 항목은 `{ id, level, message, paths }` 구조입니다. 이 명령은 파일을 쓰지 않고 signal을 출력한 뒤 성공 종료하므로 caller는 `ok`와 `reminders`를 확인해야 합니다.

## 가이드 동기화

`guides sync`는 이 저장소의 현재 가이드 템플릿을 `<target>/.ai-agent-playbook/knowledge/references/guides/`로 복사합니다.

- 기본 동작은 기존 가이드 파일을 유지하고, 없는 가이드 파일만 추가합니다.
- 먼저 `--dry-run`으로 추가될 파일을 확인합니다.
- 파일을 쓰지 않고 누락된 가이드만 보고하려면 `--check`를 사용합니다. 자동화에는 `--json`을 추가합니다.
- `--check --json`은 source guide manifest 기준으로 guide template을 비교하고 각 guide를 `present`, `missing`, `stale`로 보고합니다. 항목에는 `sourceHash`와, target file이 있으면 `targetHash`가 포함됩니다.
- `--check`에 `--diff`를 함께 쓰면 stale guide의 첫 차이 line과 source/target line count를 포함합니다. 이 모드도 read-only입니다.
- Stale guide는 기본 check를 실패시키지 않습니다. Local guide edit을 조용히 덮어쓰지 않도록 review signal로만 사용합니다.
- 기존 가이드를 현재 템플릿 버전으로 바꾸기로 결정한 경우에만 `--force`를 사용합니다.
- 이 명령은 `AGENTS.md`, `.ai-agent-playbook/policy/SKILLS.md`, `.ai-agent-playbook/policy/GIT.md`, `CURRENT.md`, plans, worklogs, 프로젝트별 메모리를 수정하지 않습니다.

## Context 출력

`context`는 아래 project playbook 파일에서 hook에 넣기 좋은 compact context를 만듭니다.

- `.ai-agent-playbook/START_HERE.md`
- `.ai-agent-playbook/CURRENT.md`
- `.ai-agent-playbook/policy/SKILLS.md`
- `.ai-agent-playbook/policy/GIT.md`

`CURRENT.md`는 현재 사실, 활성 리스크, 결정, 짧은 프로젝트 용어를 두는 곳입니다. 더 큰 구조 사실, scan range, duplicate 또는 clone cue는 maps에 둡니다. Context command는 기본적으로 root `AGENTS.md`를 읽거나 다시 주입하지 않습니다. `--json`을 사용하면 `{ schemaVersion, ok, target, sources, additionalContext, warnings }`를 반환합니다. Hook 환경에 넣을 context 길이를 제한하려면 `--max-chars N`을 사용합니다.

문맥이 너무 넓을 때는 더 읽기 전에 좁힙니다. `operator context --path <file> --json`으로 경로별 context, rule, map, runbook, decision, contract, guide를 미리 보고, 필요한 playbook note는 `operator search` 또는 `index search`로 찾습니다. 원시 generated report는 `runtime/`에 두고, 간결하게 검토된 사실만 `memory/` 또는 `knowledge/`로 승격합니다.

Path-scoped context는 `.ai-agent-playbook/memory/context/`에 둡니다. Context markdown은 `id`, `globs`, `alwaysApply`, `freshness`, `priority` frontmatter를 사용할 수 있고, 본문에는 `When to read`, `Current facts`, `Do not assume`, `Verification hints` 같은 섹션을 권장합니다.

`context list`와 `context status`는 read-only입니다. `context status --path <file> --json`은 `{ schemaVersion, ok, target, path, summary, contexts, docMap, warnings, conflicts }`를 반환해 특정 path에 적용되는 context file과 `.ai-agent-playbook/memory/maps/doc-map.md` 존재 여부를 보여줍니다. `context init`은 preview-first이며 `--dry-run`을 빼야 starter context와 documentation map을 씁니다.

## Runs ledger

`runs/`는 진행 중 작업 상태와 증거를 기록합니다. `worklogs/`와 역할이 다릅니다.

- `runs/`: 현재 작업의 criteria, evidence, blocker, cleanup, 재개 상태.
- `worklogs/`: milestone, blocker, 방향 전환, 긴 debugging 뒤에 남기는 오래 보존할 history.

`run start`는 `.ai-agent-playbook/workflows/runs/<run-id>/` 아래 `brief.md`, `criteria.json`, `ledger.jsonl`, `evidence/`, `summary.md`를 만듭니다. Ledger는 append-only JSONL입니다. `run record`는 note, criterion, evidence, blocker, cleanup event를 append하고 로컬 절대경로나 credential처럼 보이는 message를 거부합니다. `run status`는 read-only입니다. `run summarize`는 preview-first이며 ledger를 `summary.md`로 렌더링합니다.

## Contracts

`contracts/`는 중요한 business rule과 invariant를 markdown으로 기록합니다. Active contract는 `.ai-agent-playbook/memory/contracts/active/`, draft는 `.ai-agent-playbook/memory/contracts/pending/`에 둡니다. Contract frontmatter는 `id`, `status`, `appliesTo`, `risk`, `approvedAt`, `freshness`를 지원합니다.

`contracts list`와 `contracts check`는 read-only입니다. `contracts check --path <file> --json`은 matching active/pending contract, 사라진 `appliesTo` path, 오래된 freshness date, pending-only match, 비어 있는 `Required evidence` section, 그리고 `.ai-agent-playbook/memory/contracts/.hashes.json`이 있을 때 contract hash snapshot drift를 보고합니다. Test를 실행하거나, 정합성을 judge하거나, commit을 막거나, rule을 승인하거나, 파일을 수정하지 않습니다.

`contracts snapshot`은 preview-first입니다. 기본 모드는 hash 대상이 될 contract, `appliesTo`, Required evidence path만 보고합니다. `--apply`를 붙였을 때만 `.ai-agent-playbook/memory/contracts/.hashes.json` 하나를 쓰며, portable relative path와 hash만 저장합니다. 이 snapshot은 operator가 freshness를 판단하기 위한 보조 자료이지 승인 cache가 아닙니다. `contracts init`은 preview-first이며 starter folder structure만 씁니다.

## Operator diagnostics

Diagnostics 명령은 operator가 명시적으로 실행하는 signal입니다. 사람이나 agent가 다음에 무엇을 확인할지 판단하게 돕지만, hook을 설치하지 않고, project command를 실행하지 않고, network call을 하지 않습니다. Audit, check, search, preflight, delta, research, context, analyze, map, rules, diagnostics, TUI, PNG image-diff 명령은 read-only입니다. `operator gc`는 preview-first이며 `--apply`가 있을 때만 씁니다.

`operator check`는 통합 사람 중심 checkpoint입니다.

```powershell
npx ai-agent-playbook operator check <target> --json
```

이 명령은 `doctor`, `guides sync --check`, `diagnostics check`, `rules check`를 하나의 report로 묶습니다. `--path`는 rule matching으로 전달됩니다. `--diff`는 `guides sync --check --diff`와 같은 첫 차이 guide detail을 포함합니다. JSON output은 `{ schemaVersion, ok, target, path, summary, checks, sections }`를 반환하며, `sections`에는 원래 `doctor`, `guides`, `diagnostics`, `rules` report가 들어갑니다. Missing guide template이나 doctor failure는 통합 check를 실패시키고, stale guide와 diagnostics warning은 warning-level operator signal로 남깁니다.

`operator search`는 local read-only explorer입니다.

```powershell
npx ai-agent-playbook operator search <target> --query "auth flow" --json
```

이 명령은 target project의 text file을 검색하고 `.git`, `node_modules`, `dist`, `build`, `.next`, `.turbo`, `coverage` 같은 일반 generated/dependency folder는 제외합니다. JSON output은 `{ schemaVersion, ok, target, query, path, summary, results, related }`를 반환합니다. 결과에는 relative path, category, score, match count, snippet이 포함됩니다. Match가 없어도 성공 종료하며 `summary.matches: 0`을 반환합니다. `--path`가 있으면 `related.rules`가 해당 file의 matching project rule을 요약하고, `related.diagnostics`는 실행하지 않은 local verification command 후보를 나열합니다.

`operator research`는 명시적으로 실행하는 깊은 로컬 조사 모드입니다.

```powershell
npx ai-agent-playbook operator research <target> --query "auth flow risk" --path src/example.ts --max-results 50 --json
```

빠른 검색만으로 부족하고 operator가 더 넓은 근거 report를 원할 때 사용합니다. Query를 research axis로 확장하고 local text file을 스캔해 source, tests, `.ai-agent-playbook/`, rules, plans, worklogs, diagnostics, codebase map signal을 연결한 뒤 `gaps`, `nextSteps`, `reportMarkdown` summary를 반환합니다. JSON output은 `{ schemaVersion, ok, target, query, path, mode, summary, axes, evidence, gaps, nextSteps, related, reportMarkdown }`입니다. 이 버전에서 `mode`는 항상 `{ localOnly: true, network: false, writes: false }`입니다. Slash command가 필요하지 않고, AI model을 호출하지 않고, web browsing을 하지 않고, report file도 만들지 않습니다.

`operator context`는 path-scoped playbook context를 주입하지 않고 미리 보여줍니다.

```powershell
npx ai-agent-playbook operator context <target> --path src/example.ts --json
```

이 명령은 존재하는 core context file, path에 `globs` 또는 `alwaysApply` frontmatter가 적용되는 `.ai-agent-playbook/memory/context/**/*.md` file, matching project rule, `.ai-agent-playbook/memory/maps/doc-map.md`, 그리고 path나 file name을 언급하는 관련 maps, runbooks, decisions, guides를 보고합니다. JSON output은 `{ schemaVersion, ok, target, path, summary, coreSources, contexts, docMap, rules, related, warnings }`를 반환합니다. Context file을 쓰지 않고, project command를 실행하지 않고, hook을 설치하지 않습니다.

`operator preflight`와 `operator delta`는 작업을 막지 않는 명시적 before/after evidence gate입니다.

```powershell
npx ai-agent-playbook operator preflight <target> --intent "auth flow change" --path src/example.ts --json > preflight.json
npx ai-agent-playbook operator delta <target> --before preflight.json --json
```

Preflight는 candidate file, rule/context/contract signal, intent term, relative path/hash/size/mtime 기반 portable snapshot을 반환합니다. Snapshot 파일을 직접 만들지는 않으므로 보관하려면 shell redirect를 사용합니다. Delta는 저장한 JSON과 현재 target을 비교해 추가, 삭제, 수정, intent 밖 변경, playbook/rule/context 변경을 보고합니다. 정합성을 판정하거나 완료를 승인하지 않습니다.

`operator analyze`는 현재 read-only operator signal을 묶어 보여줍니다.

```powershell
npx ai-agent-playbook operator analyze <target> --path src/example.ts --json
```

Diagnostics, codebase map, matching rules, optional path-scoped context, optional analysis setup signal을 하나의 report로 반환합니다. AST, LSP, comment-quality tool은 local setup signal로만 보고합니다. 이 명령은 tool 설치, language server 실행, structural search 실행, file edit, network call을 하지 않습니다.

더 강한 로컬 분석이 필요하면 `--deep`을 사용합니다.

```powershell
npx ai-agent-playbook operator analyze <target> --deep --path src/example.ts --json
```

Deep mode는 local AST-grep structural search, 정확히 정규화된 함수 본문 중복 단서, TypeScript/JavaScript status, diagnostics, symbols, references, definitions를 추가합니다. 중복 단서는 검토 시작점일 뿐 semantic equivalence를 주장하지 않습니다. 그래도 read-only입니다. Symbol rename, AST match rewrite, project command 실행, network call은 하지 않습니다.

`operator map`은 local codebase shape를 요약합니다.

```powershell
npx ai-agent-playbook operator map <target> --json
```

이 명령은 local project file을 읽어 stack manifest, 감지한 package manager, source language count, framework dependency, top-level structure, entrypoint 후보, module boundary directory, quality config, test file sample, verification command 후보, TODO/debug/security signal snippet, compact summary를 보고합니다. 일반 dependency/generated folder는 제외합니다. JSON output은 `{ schemaVersion, ok, target, summary, stack, architecture, quality, concerns, warnings }`를 반환합니다. Read-only이며 `.ai-agent-playbook/memory/maps/` file을 만들지 않습니다. Durable project map으로 승격할 내용을 결정하기 전 근거로 사용합니다.

`operator audit`는 파일을 쓰지 않고 playbook drift를 확인합니다.

```powershell
npx ai-agent-playbook operator audit <target> --json
```

project playbook의 broken relative markdown link, `globs`가 현재 project file과 더 이상 맞지 않는 context file, missing doc-map target, contract `appliesTo` drift, duplicate playbook markdown content, `.ai-agent-playbook/`과 legacy `ai-playbook/` 동시 존재, managed manifest drift를 스캔합니다. JSON output은 `{ schemaVersion, ok, target, summary, findings, sections, warnings }`를 반환합니다. Broken internal link와 malformed manifest는 fail-level finding이고, orphan context, missing doc-map target, contract drift, duplicate content, legacy path drift, managed file drift는 warning-level finding입니다.

`operator gc`는 obsolete managed playbook file을 preview-first로 정리합니다.

```powershell
npx ai-agent-playbook operator gc <target> --json
npx ai-agent-playbook operator gc <target> --apply --json
```

Preview mode는 파일을 쓰지 않습니다. Apply mode는 `.ai-agent-playbook/.ai-agent-playbook-install.json`에 기록된 file 중에서 원본 source template이 현재 checkout에 더 이상 없고, target file이 active playbook directory 아래에 있으며, 현재 target hash가 manifest의 `targetHash`와 여전히 일치할 때만 제거합니다. 수정된 파일은 conflict로 보고하고 보존합니다. JSON output은 `{ schemaVersion, ok, target, applied, summary, operations, warnings, conflicts }`를 반환합니다.

`rules check`는 portable rule file을 찾아 특정 path에 어떤 rule이 적용되는지 보고합니다.

```powershell
npx ai-agent-playbook rules check <target> --path src/example.ts --json
```

Rule discovery는 root `AGENTS.md`를 의도적으로 제외합니다. 지원되는 agent는 보통 이 파일을 native로 읽기 때문입니다. 현재 rule source는 `.ai-agent-playbook/rules/**/*.md`, `.github/instructions/**/*.md`, `.cursor/rules/**/*.md`, `.claude/rules/**/*.md`, `.github/copilot-instructions.md`, `CONTEXT.md`입니다. Directory rule은 `alwaysApply: true` 또는 `globs: ["src/**/*.ts"]` 같은 단순 frontmatter를 사용할 수 있습니다. JSON output은 `{ schemaVersion, ok, target, path, summary, rules, warnings }`를 반환합니다.

`diagnostics check`는 local project metadata를 읽고, 실행하지 않은 상태로 검증 command 후보를 나열합니다.

```powershell
npx ai-agent-playbook diagnostics check <target> --json
```

현재는 흔한 `package.json` script와 기본 Python, Rust, Go project marker를 감지합니다. Package script는 `pnpm-lock.yaml`, `yarn.lock`, `package-lock.json`, Bun lockfile 같은 lockfile에서 감지한 package manager 문법으로 렌더링합니다. JSON output에는 `packageManager`가 포함됩니다. Command set이 없어도 실패가 아니라 warning입니다. 일부 프로젝트는 검증 절차를 runbook이나 외부 CI에 둘 수 있기 때문입니다.

`qa tui-check`는 terminal capture에서 width overflow, CJK wide-character column, ANSI 존재 여부, 단순 box-drawing alignment를 확인합니다.

```powershell
npx ai-agent-playbook qa tui-check .\capture.txt --cols 100 --json
```

Overflow 또는 border misalignment가 발견되면 이 명령은 non-zero로 종료합니다. Terminal UI, CLI table, log, report, 한국어/일본어/중국어 text layout 확인에 사용합니다. Browser screenshot review는 여전히 대상 프로젝트의 browser tooling 또는 visual QA guide가 담당합니다.

`qa image-diff`는 diff image를 쓰지 않고 두 PNG를 비교합니다.

```powershell
npx ai-agent-playbook qa image-diff .\before.png .\after.png --threshold 0.01 --json
```

Dimensions, changed pixels, diff ratio, similarity score, hotspot cell을 반환합니다. PNG만 지원하며 browser capture, baseline 관리, visual oracle, 파일 쓰기를 하지 않습니다.

## Adapter config와 준비 점검

`adapter config`는 수동 설정에 붙여 넣을 수 있는 local hook 설정을 렌더링합니다. 이 명령은 read-only입니다. Settings file을 만들지 않고, hook을 설치하지 않고, project file을 편집하지 않고, network call을 하지 않습니다.

```powershell
npx ai-agent-playbook adapter config <target> --adapter codex --json
```

`--json`을 사용하면 `{ schemaVersion, ok, target, adapter, hookCommand, config, warnings }`를 반환합니다. `hookCommand`와 `config`는 현재 checkout 경로를 사용하며 `<path-to-ai-agent-playbook>` placeholder를 포함하지 않습니다. `.ai-agent-playbook/` 폴더가 없어도 config 렌더링은 실패하지 않고 warning으로만 보고합니다.

`adapter check`는 선택적 hook adapter를 수동으로 켜기 전에 실행하는 read-only self-check입니다.

```powershell
npx ai-agent-playbook adapter check <target> --adapter codex --json
```

이 명령은 대상 경로, `.ai-agent-playbook/`, 비어 있지 않은 core context, adapter hook 파일, 예시 설정, `SessionStart`와 `PostCompact`의 지원 hook JSON, unsupported event 또는 missing playbook context의 quiet behavior를 확인합니다. Hook을 설치하지 않고, project file을 쓰지 않고, network call을 하지 않고, global command도 요구하지 않습니다.

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

`UserPromptSubmit`, `PostToolUse`, `Stop`은 opt-in reminder event입니다. Local hook 설정에서 `AI_AGENT_PLAYBOOK_HOOK_EVENTS`를 comma-separated list로 설정한 경우에만 켭니다.

```powershell
$env:AI_AGENT_PLAYBOOK_HOOK_EVENTS = 'UserPromptSubmit,PostToolUse,Stop'
```

`UserPromptSubmit`은 prompt가 commit, push, PR, merge, worklog, doctor 같은 handoff 작업으로 보일 때만 짧은 guardrail reminder를 출력합니다. `PostToolUse`는 edit-like tool payload에서 변경 file path를 읽을 수 있을 때만 짧은 reminder를 출력합니다. 두 event 모두 `.ai-agent-playbook/`이 없거나, event가 opt-in 되지 않았거나, 관련 intent/path가 없으면 조용히 빠집니다.

`Stop`은 명시적으로 opt in했고 대상에 playbook이 있을 때만 짧은 end-of-session reminder를 출력합니다. 마지막 handoff 알림일 뿐 blocking이나 continuation mechanism이 아닙니다.

이 reminder는 의도적으로 좁게 유지합니다. `doctor`를 실행하지 않고, tool call을 block하지 않고, session을 continuation하지 않고, tool output을 다시 쓰지 않고, file을 쓰지 않고, network call을 하지 않습니다.

## Plan과 worklog 생성

- Plan은 `.ai-agent-playbook/workflows/plans/YYYY-MM-DD-<slug>.md`에 생성됩니다.
- Runs는 `.ai-agent-playbook/workflows/runs/<run-id>/`에 생성됩니다.
- Contract starter는 `.ai-agent-playbook/memory/contracts/`에 생성됩니다.
- Worklog는 `.ai-agent-playbook/workflows/worklogs/YYYY-MM/YYYY-MM-DD-<slug>.md`에 생성됩니다.
- 월간 summary는 `.ai-agent-playbook/workflows/worklogs/summaries/YYYY-MM.md`에 생성됩니다.

이 파일들은 비어 있는 초안이 아니라, 목표, 범위, 검증, 체크포인트, 근거, 남은 리스크를 기록하도록 유도하는 구조를 포함합니다.

## 설계 제약

- Node CLI 표면은 필요한 read-only 기능이 있을 때만 JavaScript runtime dependency를 추가하고, 더 무거운 로컬 언어/분석 작업은 선택형 Python engine을 우선 고려합니다.
- CLI는 대상 프로젝트의 패키지 매니저, framework, test command를 추측하지 않습니다.
- CLI는 `.ai-agent-playbook/`을 커밋할지 local-only로 둘지 자동 결정하지 않습니다. 사용자가 `--local-only`를 명시해야 합니다.
- 스킬 설치와 업데이트는 Node CLI의 `skills` 명령을 기본으로 사용하고, PowerShell 스크립트는 호환 경로로 유지합니다.
- CLI는 수동 검토를 대체하지 않습니다. 기존 agent docs가 있는 프로젝트에서는 먼저 `--dry-run`을 사용합니다.
- 로컬 임시 자료와 참고 자료는 개발 중 참고 입력으로만 다루고, 대상 프로젝트의 지침으로 복사하지 않습니다.
- 기본 하네스는 plugin hook, slash command, global install, network access를 요구하지 않습니다.
- 선택적 hook adapter는 context나 reminder만 주입해야 하며 tool output을 다시 쓰거나 project file을 자동 편집하지 않습니다.
