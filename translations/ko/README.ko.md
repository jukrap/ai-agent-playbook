<p align="center">
  <img src="../../docs/assets/logo-wide.png" alt="AI Agent Playbook" width="520">
</p>

<h1 align="center">AI Agent Playbook</h1>

<p align="center">
  실제 소프트웨어 저장소에서 조심스럽게 일해야 하는 AI 에이전트를 위한 실용적인 재사용 플레이북입니다.
</p>

<p align="center">
  <a href="../../LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-2f9e44?style=flat-square"></a>
  <a href="https://www.npmjs.com/package/ai-agent-playbook"><img alt="npm package" src="https://img.shields.io/npm/v/ai-agent-playbook?style=flat-square"></a>
  <img alt="Node 18 plus" src="https://img.shields.io/badge/node-18%2B-1c7ed6?style=flat-square">
  <img alt="PowerShell installer" src="https://img.shields.io/badge/installer-PowerShell-f08c00?style=flat-square">
  <img alt="Agent agnostic" src="https://img.shields.io/badge/agents-Codex%20%7C%20Claude%20Code%20%7C%20more-e03131?style=flat-square">
</p>

## 언어 / Languages

- English (canonical): [README.md](../../README.md)
- Korean (한국어): 이 문서

## 이 저장소는 무엇인가

AI Agent Playbook은 재사용 가능한 에이전트 스킬, 프로젝트 템플릿, 프로젝트 메모리 가이드, 의존성이 적은 런타임 CLI, read-only 분석용 로컬 MCP 도구 서버를 함께 제공하는 저장소입니다.

코딩 에이전트가 추측을 줄이도록 돕습니다. 저장소를 먼저 살피고, 로컬 규칙을 존중하고, API 경계를 흐리지 않고, 쓸모 있는 작업 기록을 남기고, 완료를 말하기 전에 검증하도록 유도합니다.

이 저장소는 특정 에이전트에 종속되지 않습니다. Codex, Claude Code, 그 외 코딩 에이전트는 같은 원본을 사용할 수 있고, 에이전트별 설치 방식은 `adapters/`에서 분리해 다룹니다.

이 저장소는 slash command 묶음, Codex plugin, 자동 실행 에이전트가 아닙니다. 기본 방식은 operator-in-the-loop입니다. 사람 또는 에이전트가 CLI를 명시적으로 실행하고, dry-run 결과를 검토한 뒤 파일을 쓸지 선택합니다. MCP는 선택적 로컬 도구 표면입니다. AI 앱이 자연어 요청 중 read-only 진단을 도구 이름으로 호출할 수 있게 합니다.

## 제공하는 것

| 구성             | 역할                                                                                            | 위치               |
| ---------------- | ----------------------------------------------------------------------------------------------- | ------------------ |
| 재사용 스킬      | 온보딩, 문서화, 품질, Git, 메타 작업, 레거시 시스템을 위한 상황 중심 작업 가이드입니다.         | `skills/`          |
| 프로젝트 템플릿  | current facts, vocabulary, maps, decisions, evidence를 위한 복사용 루트 에이전트 규칙, 스택 프로필, 프로젝트 메모리 파일입니다. | `templates/`       |
| 런타임 하네스    | `.ai-playbook/` 생성, 상태 점검, context, run, contract, plan, worklog 관리를 위한 작은 CLI입니다. | `bin/`, `src/`     |
| MCP 도구         | AI 앱이 호출할 수 있는 로컬 read-only tool, resource, prompt입니다. catalog, layout status, index search, write-gate preview, context, operator check/search/research, contract, image diff, AST 검색, 함수 본문 중복 단서, TypeScript/JavaScript 분석을 다룹니다. | `src/`             |
| 사람이 읽는 문서 | 설치, 분류, 유지보수, 공개 준비, 번역 정책 문서입니다.                                          | `docs/`            |
| 번역             | 영어 원본을 따라가는 한국어 읽기용 문서입니다.                                                  | `translations/ko/` |
| 에이전트 어댑터  | 특정 에이전트 환경별 설정 메모입니다.                                                           | `adapters/`        |

## 빠른 시작

패키지는 [`ai-agent-playbook`](https://www.npmjs.com/package/ai-agent-playbook)으로 배포되어 있습니다. 가장 단순한 경로는 `npx`로 npm 패키지를 바로 실행하는 것입니다.

```powershell
npx ai-agent-playbook --help
npx ai-agent-playbook skills install --dry-run
npx ai-agent-playbook skills install
npx ai-agent-playbook bootstrap <target-project> --dry-run
npx ai-agent-playbook bootstrap <target-project>
npx ai-agent-playbook operator check <target-project> --json
```

처음 쓰는 경우에는 [처음 10분 사용법](docs/quick-start.ko.md)부터 봅니다. `npx`, global install, skills, project bootstrap이 각각 무엇을 하는지 파일을 쓰기 전에 설명합니다.

예시에서 꺾쇠괄호 안의 이름은 placeholder입니다. `<target-project>`는 검사할 프로젝트 폴더로 바꾸거나, 터미널이 이미 그 프로젝트 안에 있다면 `.`을 씁니다. 공백이 있는 경로는 따옴표로 감싸고, 공유 이슈, 문서, PR에는 개인 로컬 경로를 넣지 않습니다.

사용 중인 AI 앱이 MCP를 지원한다면 `npx ai-agent-playbook mcp` 같은 로컬 서버 명령을 등록할 수 있습니다. 그러면 명령어를 전부 외우지 않아도 AI에게 playbook context 점검, operator search, deep local analysis를 자연어로 요청할 수 있습니다. 이 버전의 MCP 도구는 read-only입니다.

어느 디렉터리에서든 짧은 `ai-playbook` 명령을 쓰고 싶다면 전역으로 설치합니다.

```powershell
npm install -g ai-agent-playbook
ai-playbook --help
```

npm 패키지는 CLI를 설치합니다. 스킬 복사, `.ai-playbook/` 생성, hook 활성화, slash command 등록은 자동으로 하지 않습니다. 이 작업들은 명시적으로 실행합니다.

- `skills install`, `skills update`, `skills uninstall`은 사용자 수준 재사용 스킬을 관리합니다.
- `bootstrap`, `guides sync`, `managed *`, `contracts *`, `operator *`, `qa *`는 대상 프로젝트 하나를 관리하거나 점검합니다.
- `mcp`는 AI 앱용 로컬 stdio MCP 서버를 시작합니다. 그 자체로 파일을 쓰지는 않습니다.
- Runtime hook과 adapter 설정은 선택 사항이며 기본 설치 경로에서 자동 설치되지 않습니다.

명령어별 사용법은 [명령어 가이드](docs/commands.ko.md)를 봅니다. 업데이트, 삭제, 로컬 checkout, PowerShell 호환 경로, ownership marker, 정리 절차는 [설치, 업데이트, 삭제](docs/installation.ko.md)를 봅니다.

## 평소 작업 흐름

```text
npx 또는 global install
  -> skills install 또는 update
  -> 에이전트 재시작
  -> 대상 프로젝트 점검
  -> 프로젝트에 로컬 playbook file이 필요할 때만 .ai-playbook/ bootstrap
  -> operator check/search와 managed cleanup을 명시적으로 실행
```

기존 프로젝트에서는 먼저 dry run을 실행하고 충돌을 확인한 뒤 파일을 씁니다.

```powershell
npx ai-agent-playbook bootstrap <target-project> --local-only --dry-run
npx ai-agent-playbook bootstrap <target-project> --local-only
npx ai-agent-playbook operator check <target-project> --json
npx ai-agent-playbook operator preflight <target-project> --intent "planned change" --json
npx ai-agent-playbook operator research <target-project> --query "project risks" --json
```

검색, 관리 파일 정리, adapter 설정, plan, worklog 명령은 [명령어 가이드](docs/commands.ko.md)를 봅니다.

## 저장소 지도

```text
bin/                  ai-playbook CLI 진입점
src/                  CLI 런타임 구현
skills/
  ai-harness/        MCP, skill, agent, context, cache, index design 스킬
  architecture/      boundary와 architecture review 스킬
  backend/           API, backend change safety, connector, server-rendered flow 스킬
  data/              data pipeline, analytics, reporting, migration integrity 스킬
  database/          schema, migration, SQL, data integrity 스킬
  delivery/          planning, verification, testing, Git, PR, worklog 스킬
  devops/            CI/CD, container, package release, deployment, operations triage 스킬
  frontend/          UI, browser, state/data, accessibility, visual QA 스킬
  mobile/            native, hybrid, WebView, device QA 스킬
  security/          auth, dependency supply chain, license/notice, security review, risk 스킬
  project/            bootstrap, onboarding, project-memory 스킬
  quality/            UI quality, cleanup, review 스킬
  git/                commit, PR, push, worklog 스킬
  meta/               skill-authoring 스킬
  legacy/             legacy-system maintenance 스킬
templates/
  agents/             루트 에이전트 지침 템플릿과 프로젝트 profile
  codex-home/         선택적 개인 Codex home AGENTS.md 템플릿
  project-playbook/   복사용 ai-playbook project-memory 템플릿
examples/             worklog, prompt, handoff 예시
translations/         사람이 읽는 번역본. 스킬 설치 대상이 아님
adapters/             에이전트별 설치 메모와 선택적 hook PoC
docs/                 분류, 설치, 공개, 유지보수 문서
docs/assets/          README와 문서용 이미지
scripts/              검증과 로컬 동기화 helper
test/                 Node CLI와 adapter 테스트
.github/              GitHub Actions 검증 workflow
```

## 스킬 카탈로그

각 `SKILL.md`는 짧고 상황 중심으로 유지합니다. 더 긴 재사용 상세 내용은 `references/`에 둡니다.

### 프로젝트

- `project-bootstrap`: 새 프로젝트 시작, 기존 저장소 인수, 프로젝트 메모리와 루트 에이전트 지침 설정.
- `repo-onboarding`: 낯선 저장소에서 아키텍처, 도구, 수정 방향, 작업 흐름을 답하기 전에 먼저 살필 때.
- `project-doc-system`: 프로젝트 AI 문서, map, runbook, decision, plan, worklog를 만들거나 재정리할 때.
- `adr-spec-handoff`: decision, architecture constraint, spec, milestone outcome, worklog, handoff를 durable project memory로 정리할 때.

### 품질

- `ui-style-policy`: 저장소 UI 스타일 정책을 선택, 문서화, 강제할 때.
- `style-quality-review`: UI 스타일, 반응형 동작, 레이아웃 넘침, 시각적 회귀를 검토하거나 개선할 때.
- `frontend-ui-polish`: 제품 의도와 기존 디자인 관례를 보존하면서 보이는 프론트엔드 UI를 구현하거나 다듬을 때.
- `cleanup-ai-slop`: 신뢰가 낮거나 과하게 복잡하거나 중복된 코드를 동작 변경 없이 정리할 때.
- `review-work-light`: 차단형 리뷰 절차 없이 최근 구현 작업을 인수인계 전에 검토할 때.

### Git과 메타

- `commit-worklog-guardrails`: staging, commit, push, PR, release note, worklog를 다룰 때.
- `agent-skill-authoring`: 재사용 agent skill과 reference를 만들거나 검토·재정리할 때.

### Harness OS v2 Capabilities

- `mcp-server-design`: MCP tool, resource, prompt, permission tier, write gate, cache/index surface를 설계할 때.
- `boundary-review`: FSD, layered, DDD, monorepo, package ownership, dependency direction, coupling boundary를 검토할 때.
- `api-contract-boundary`: 프론트엔드/백엔드 계약, DTO, mock, payload, adapter를 구현·디버깅·검토할 때.
- `backend-change-safety`: backend service, module, worker, job, integration, queue, config, server-side business logic을 바꿀 때.
- `connector-integration-change`: API connector, workflow node, MCP adapter, webhook, OAuth app, import/export bridge, sync job, connector registration, credential handling을 바꿀 때.
- `server-rendered-change`: backend-rendered controller, template, form, session, redirect, validation, view contract를 바꿀 때.
- `data-pipeline-review`: analytics pipeline, ETL, batch job, data contract, dashboard, quality check를 검토할 때.
- `analytics-reporting-review`: metric, dashboard, report, KPI definition, chart/table consistency, analytics query, freshness, caveat를 검토할 때.
- `data-migration-integrity`: data migration, backfill, warehouse transformation, reconciliation, idempotency, rollback, data repair를 계획·검토·검증할 때.
- `database-change-safety`: database schema, migration, SQL, reporting query, stored procedure, data integrity rule을 바꿀 때.
- `git-worklog-guardrails`: staging, commit, PR text, release note, worklog를 위한 primary delivery skill.
- `test-verification-strategy`: risk-based verification, test scope, check selection, coverage gap, release confidence를 계획하거나 검토할 때.
- `flaky-test-triage`: flaky/nondeterministic test를 진단, 재현, 안정화, quarantine, 문서화할 때.
- `test-fixture-data-design`: fixture, factory, mock, seed, snapshot, golden file, test data boundary를 설계하거나 복구할 때.
- `ci-failure-triage`: 실패한 CI job, build pipeline, deployment, flaky test, environment drift를 진단할 때.
- `container-change-safety`: Dockerfile, container image, Compose/Kubernetes manifest, runtime config, healthcheck, volume, network를 바꿀 때.
- `deployment-release-check`: release, deploy, rollback, feature flag, artifact, migration gate, post-deploy check를 준비·검토·진단할 때.
- `package-publish-readiness`: package publishing, release artifact, package metadata, registry dry-run, generated bundle, binary, marketplace distribution을 준비·검토·진단할 때.
- `observability-incident-triage`: incident, production error, alert, latency, error rate, queue backlog, job failure, log, metric, trace를 triage할 때.
- `browser-dom-change`: browser DOM behavior, jQuery flow, event handler, selector, form, plugin, script-loaded UI를 바꿀 때.
- `frontend-state-data-flow`: frontend state ownership, server/client cache behavior, data fetching, optimistic update, URL state, stale UI bug를 바꿀 때.
- `frontend-accessibility-review`: keyboard access, focus management, semantic, form, dialog, menu, announcement, contrast, accessible state를 검토할 때.
- `ui-polish`: visible UI, responsive layout, accessibility state, interaction feedback, production polish를 위한 primary frontend skill.
- `visual-regression-qa`: screenshot, responsive breakpoint, layout overflow, clipping, visual diff, text fit, canvas/media rendering, browser-rendered UI regression을 확인할 때.
- `webview-bridge`: WebView bridge, native-to-web messaging, deep link, embedded auth, upload, download, hybrid navigation을 바꿀 때.
- `legacy-change-safety`: hidden coupling이나 deployment risk가 있는 compatibility-first legacy change를 다룰 때.
- `security-review`: secret, authentication, authorization, input validation, dependency risk, sensitive data flow를 검토할 때.
- `auth-access-control`: login, session, OAuth/OIDC, JWT, RBAC, permission, role, tenant, scope, object-level authorization을 바꿀 때.
- `dependency-supply-chain-review`: dependency, lockfile, SBOM, license, container, package script, provenance, vulnerability remediation을 바꿀 때.
- `license-notice-review`: first-party license, third-party notice, attribution, vendored code, generated artifact, copied snippet, dual-license choice, redistribution scope, compliance evidence를 검토할 때.

### 레거시

일반 레거시 작업:

- `legacy-general`: 흐름이 불명확하고 결합이 숨겨져 있거나 test/documentation이 약한 레거시 코드를 유지보수할 때.
- `legacy-risk-check`: 공유 상태, CSS/JS, selector, template, form, API, build, deploy에 영향을 줄 수 있는 변경 전.
- `legacy-feature-addition`: 주변 architecture를 다시 쓰지 않고 동작, 화면, 필드, 규칙, integration을 추가할 때.

웹, 모바일, 호환성 화면:

- `legacy-jquery-web`: jQuery, plugin, direct DOM, global script, AJAX callback, script order coupling을 유지보수할 때.
- `legacy-server-rendered-web`: template, controller, form post, server validation, session, layout, partial을 유지보수할 때.
- `legacy-php-lamp`: include, session, mixed HTML/PHP, direct SQL, global, shared hosting 제약이 있는 PHP/LAMP를 유지보수할 때.
- `legacy-android-webview-hybrid`: Android WebView, web asset, JavaScript bridge, permission, device API를 유지보수할 때.
- `legacy-ie-activex-compat`: IE mode, ActiveX, old browser API, compatibility constraint가 필요한 intranet system을 유지보수할 때.

엔터프라이즈 스택과 데이터 중심 흐름:

- `legacy-java-spring-mvc`: Spring MVC, JSP, Servlet, MyBatis, WAR, XML config, server-rendered Java app을 유지보수할 때.
- `legacy-dotnet-webforms`: ASP.NET Web Forms, .NET Framework, code-behind, ViewState, Web.config, IIS를 유지보수할 때.
- `legacy-database-heavy-system`: stored procedure, trigger, view, direct SQL, scheduled job처럼 데이터베이스에 강하게 묶인 업무 규칙을 유지보수할 때.
- `legacy-reporting-printing`: report, print preview, PDF/Excel export, label, barcode, invoice, printer-specific flow를 유지보수할 때.
- `legacy-batch-file-transfer`: scheduled batch, cron, Windows Task Scheduler, CSV/Excel import/export, SFTP, file drop을 유지보수할 때.

## 문서

- [저장소 작업 규칙](AGENTS.ko.md): 이 저장소를 수정하는 에이전트를 위한 유지보수 규칙.
- [저장소 맥락](CONTEXT.ko.md): playbook의 핵심 용어와 설계 의도.
- [처음 10분 사용법](docs/quick-start.ko.md): 처음 실행 순서, 용어, 안전한 명령 순서.
- [명령어 가이드](docs/commands.ko.md): 각 CLI 명령이 무엇을 하는지, 언제 쓰는지, 파일을 쓰는지 설명.
- [설치, 업데이트, 삭제](docs/installation.ko.md): npm/npx 사용, 전역 CLI 설정, skill lifecycle, project bootstrap, cleanup, legacy PowerShell 경로.
- [런타임 하네스](docs/harness-runtime.ko.md): runtime 원칙, JSON contract note, overwrite policy, 대상 프로젝트 적용 흐름.
- [Harness OS](docs/harness-os.ko.md): catalog, layout, runtime, MCP, skill을 위한 v1 재설계 원칙.
- [Playbook layout v2](docs/playbook-layout-v2.ko.md): `.ai-playbook` v2 디렉터리 역할과 migration 명령.
- [Skill taxonomy v2](docs/skill-taxonomy-v2.ko.md): capability-first category와 compatibility wrapper 정책.
- [MCP permission model](docs/mcp-permission-model.ko.md): read, scaffold, managed-write, project-write tier.
- [Reference adoption](docs/reference-adoption.ko.md): 외부 reference를 prompt noise 없이 local capability로 정제하는 방법.
- [런타임 로드맵](docs/runtime-roadmap.ko.md): 단계적 강화 계획과 선택적 hook layer 경계.
- [Codex 어댑터](adapters/codex/README.ko.md): Codex 기준 로컬 동기화 방식과 Windows용 Codex App 작업 흐름.
- [Claude Code 어댑터](adapters/claude-code/README.ko.md): Claude Code 설정 메모와 선택적 read-only context hook 예시.
- [템플릿](templates/README.ko.md): 프로젝트 저장소에 복사할 문서와 설치형 스킬의 차이.
- [분류](docs/classification.ko.md): skills, templates, examples, docs, adapters를 나누는 이유.
- [Superpowers 연동](docs/superpowers-integration.ko.md): 외부 작업 흐름 스킬과 함께 쓰는 기준.
- [유지보수 작업 흐름](docs/maintenance.ko.md): 내용을 추가하거나 바꿀 때 함께 갱신할 항목.
- [번역 정책](docs/translation-policy.ko.md): 영어 원문과 한국어 번역본 관리 규칙.
- [공개 체크리스트](docs/publishing-checklist.ko.md): 공개 전 위생 점검.

## 유지보수 담당자용

이 README는 사용자를 위한 공개 진입점입니다. 이 원본 저장소를 수정한다면 먼저 [저장소 작업 규칙](AGENTS.ko.md)과 [유지보수 작업 흐름](docs/maintenance.ko.md)을 읽습니다. 릴리스 전 위생 점검은 [공개 체크리스트](docs/publishing-checklist.ko.md)에 둡니다.

영어 원문을 기준으로 유지하고, 영어 원문을 바꾸면 한국어 번역도 같은 변경에서 갱신합니다. 개인 경로, credential, 내부 URL, branch name, PR number, 설치된 로컬 스킬 복사본은 commit하지 않습니다.

## 라이선스

[MIT](../../LICENSE) 라이선스를 사용합니다.
