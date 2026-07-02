# 분류

이 저장소는 설치형 스킬, 런타임 CLI, 복사용 템플릿, 예시, 문서, 어댑터를 분리합니다.

## 왜 한 에이전트 아래에 모두 두지 않는가

이 내용은 특정 에이전트 전용이 아닙니다. Codex는 설치 대상 중 하나일 뿐입니다. 원본은 에이전트에 독립적으로 유지하고, 에이전트별 설정은 `adapters/`에 둡니다.

## 스킬 분류

- `skills/ai-harness`: MCP, skill, agent, context, cache, index, harness design 작업 흐름.
- `skills/architecture`: boundary, architecture, ownership, dependency direction, coupling review 작업 흐름.
- `skills/backend`: API contract, backend change safety, server-rendered flow, worker, integration 작업 흐름.
- `skills/data`: analytics pipeline, ETL, reporting, data contract, quality 작업 흐름.
- `skills/database`: schema, migration, SQL, reporting query, data integrity 작업 흐름.
- `skills/delivery`: planning, verification, testing, Git, PR, release note, worklog 작업 흐름.
- `skills/devops`: CI/CD, container, release, deployment, rollback, operations triage 작업 흐름.
- `skills/frontend`: UI, browser behavior, state/data, accessibility, visual QA 작업 흐름.
- `skills/git`: commit, PR, push, worklog 보호 규칙.
- `skills/legacy`: 런타임 결합과 호환성이 중요한 유지보수 작업 흐름.
- `skills/meta`: 스킬 작성과 저장소 유지보수 스킬.
- `skills/mobile`: native, hybrid, WebView, device QA 작업 흐름.
- `skills/project`: 프로젝트 bootstrap, onboarding, 프로젝트 메모리 유지보수.
- `skills/quality`: UI 스타일 정책, 시각 품질, cleanup, lightweight review 작업 흐름.
- `skills/security`: authentication, authorization, dependency supply chain, security review, risk 작업 흐름.

새 분류는 그 분류에 들어갈 실제 스킬이 생겼을 때만 추가합니다. 새 분류나 스킬이 이 지도를 바꾸면 `README.md`, 이 파일, 한국어 번역, 설치된 스킬 복사본을 `docs/maintenance.md`에 따라 함께 갱신합니다.

## 런타임 CLI 분류

- `bin/ai-playbook.mjs`: CLI 진입점.
- `src/`: bootstrap, doctor, context, guide check, path migration, plan/worklog 생성 구현.
- `test/`: Node test runner 기반 CLI, path migration, adapter hook, adapter readiness, lifecycle reminder 테스트.

CLI는 설치형 스킬이 아닙니다. 이 저장소 checkout에서 실행해 대상 프로젝트에 템플릿을 적용하고 하네스 상태를 점검합니다.

선택적 hook 또는 plugin 실험은 안정된 계약이 생길 때까지 명확히 분리된 adapter나 실험 패키지에 둡니다. Core CLI 계약을 호출할 수는 있지만, 기본 문서와 CLI 하네스에 필수 조건이 되거나 project policy의 유일한 위치가 되어서는 안 됩니다.

## 템플릿 분류

- `templates/agents`: 얇은 루트 `AGENTS.md` 부트스트랩 파일과 스택별 프로필.
- `templates/codex-home`: `~/.codex/AGENTS.md`용 선택적 개인 Codex home 지침. 런타임이 대상 저장소에 복사하지 않습니다.
- `templates/project-playbook`: 대상 저장소에서 `.ai-playbook/`가 되는 복사용 프로젝트 메모리 템플릿. 내부 `SKILLS.md`와 `GIT.md` 정책 파일을 포함합니다.

대상 프로젝트 루트는 작게 유지합니다. 런타임은 기본적으로 얇은 루트 `AGENTS.md` 부트스트랩만 쓰고, skill/Git 정책은 `.ai-playbook/` 아래에 둡니다.

## 작업 흐름 스킬 호환성

이 저장소는 외부 작업 흐름 스킬 묶음을 대체하지 않습니다. 작업 흐름 스킬과 playbook 스킬을 어떻게 조합할지는 `docs/superpowers-integration.md`를 기준으로 판단합니다.

Runtime hook layer를 local experiment로 둘지, adapter로 만들지, 문서화된 CLI behavior로 승격할지 판단할 때는 `runtime-roadmap.ko.md`를 사용합니다.

## 프로젝트 메모리 지도

- `project-bootstrap`: 저장소를 확인한 뒤 루트 정책과 `.ai-playbook/` 구조를 설정합니다.
- `repo-onboarding`: 계획이나 편집 전에 저장소 상태와 기존 `.ai-playbook/` 맥락을 읽습니다.
- `project-doc-system`: `.ai-playbook/`, map, runbook, decision, plan, worklog, archive를 정리합니다.
- `adr-spec-handoff`: 검토된 decision, spec, milestone outcome, worklog, handoff를 durable project memory로 승격합니다.

## Delivery와 verification 지도

- `git-worklog-guardrails`: staging, commit, PR text, release note, worklog를 다룹니다.
- `test-verification-strategy`: change risk를 unit, integration, contract, E2E, visual, migration, smoke, manual, monitor 기반 check로 매핑합니다.
- `flaky-test-triage`: nondeterministic, timing-dependent, order-dependent, environment-sensitive, intermittent test failure를 진단합니다.
- `test-fixture-data-design`: fixture, factory, mock, seed, snapshot, golden file, sample payload, test data boundary를 설계합니다.

## 품질 지도

- `ui-style-policy`: design system, CSS/class, utility class, inline style 중 저장소 스타일 방식을 선택하거나 문서화합니다.
- `style-quality-review`: 제품 의도를 유지하면서 보이는 UI 품질을 검토합니다.
- `frontend-ui-polish`: 제품 의도와 기존 디자인 관례를 보존하면서 보이는 UI surface를 구현하거나 다듬습니다.
- `cleanup-ai-slop`: 신뢰가 낮아 보이는 코드 잡음을 범위를 제한해 동작 보존 방식으로 제거합니다.
- `review-work-light`: review를 automatic blocking gate로 만들지 않고 최근 구현 작업을 검토합니다.

## DevOps 지도

- `ci-failure-triage`: 실패한 CI job, build pipeline, deployment check, flaky test, environment drift, release automation failure를 진단합니다.
- `container-change-safety`: Dockerfile, image, Compose/Kubernetes, runtime config, healthcheck, volume, network, containerized deployment 변경을 검토합니다.
- `deployment-release-check`: release readiness, deploy gate, rollback path, feature flag, artifact, migration, post-deploy check를 검토합니다.
- `observability-incident-triage`: active incident, production alert, log, metric, trace, latency, error rate, queue, job, post-incident handoff를 triage합니다.

## Frontend 지도

- `browser-dom-change`: DOM-first behavior, jQuery flow, event handler, selector, form, plugin, script-loaded UI를 바꿉니다.
- `frontend-state-data-flow`: state ownership, data fetching, server/client cache boundary, optimistic update, URL state, stale UI behavior를 검토합니다.
- `frontend-accessibility-review`: keyboard access, focus management, semantic, form, dialog, menu, announcement, contrast, accessible interaction state를 검토합니다.
- `ui-polish`: visible UI, responsive layout, visual hierarchy, interaction feedback, production polish를 다듬습니다.
- `visual-regression-qa`: screenshot, responsive breakpoint, overflow, clipping, visual diff, text fit, canvas/media rendering, browser-rendered regression을 확인합니다.

## Data 지도

- `data-pipeline-review`: analytics pipeline, ETL, batch job, data contract, dashboard source, quality check, freshness, lineage를 검토합니다.
- `analytics-reporting-review`: metric definition, KPI ownership, dashboard/report consistency, chart/table check, segmentation, caveat, reader handoff를 검토합니다.
- `data-migration-integrity`: data migration, backfill, transformation, reconciliation query, idempotency, batching, rollback, repair를 검토합니다.

## 스킬 작성 지도

- `agent-skill-authoring`: 재사용 가능한 스킬 구조, trigger description, reference, 스킬/템플릿 경계.

## 레거시 확장 지도

- `legacy-general`: 기본 레거시 유지보수 규율.
- `legacy-risk-check`: 위험한 편집 전 숨은 영향 범위 점검.
- `legacy-feature-addition`: 기존 시스템을 rewrite하지 않고 동작 추가.
- `legacy-jquery-web`: jQuery, plugin, 직접 DOM 조작 기반 브라우저 화면.
- `legacy-server-rendered-web`: 서버 템플릿, form, session, validation 중심 웹.
- `legacy-android-webview-hybrid`: native shell, WebView, bridge가 결합된 앱.
- `legacy-database-heavy-system`: stored procedure, trigger, direct SQL, DB-shaped business rules.
- `legacy-java-spring-mvc`: Spring MVC, JSP, MyBatis, Servlet, WAR 시스템.
- `legacy-dotnet-webforms`: ASP.NET Web Forms, ViewState, code-behind, IIS.
- `legacy-php-lamp`: PHP include, session, direct SQL 중심 화면.
- `legacy-ie-activex-compat`: IE mode, ActiveX, intranet browser/device constraints.
- `legacy-reporting-printing`: report, export, print, label, barcode, invoice 흐름.
- `legacy-batch-file-transfer`: scheduled batch, CSV/Excel/SFTP/file-drop integration.
