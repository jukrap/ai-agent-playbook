# 스킬 카탈로그

이 문서는 한국어 독자를 위한 스킬 목록입니다. 실제 설치·동기화 기준은 영어 `skills/**/SKILL.md` 원본이며, 세부 분류 정책은 [Skill taxonomy v2](skill-taxonomy-v2.ko.md)를 함께 봅니다.

각 `SKILL.md`는 짧고 상황 중심으로 유지합니다. 긴 절차, 예시, 스택별 세부사항은 skill reference에 둡니다.

## 프로젝트와 문서

- `project-bootstrap`: 새 프로젝트 또는 기존 저장소에 루트 agent 지침과 `.ai-playbook/` 구조를 설정할 때.
- `repo-onboarding`: 낯선 저장소에서 아키텍처, 도구, 작업 흐름, 수정 방향을 답하기 전에 먼저 살필 때.
- `project-doc-system`: `AGENTS.md`, `.ai-playbook/`, maps, runbooks, decisions, plans, worklogs를 정리할 때.
- `adr-spec-handoff`: 결정, 아키텍처 제약, spec, milestone 결과, handoff를 durable project memory로 정리할 때.
- `requirements-prd-scope-review`: 넓은 요청을 PRD, spec, scope boundary, acceptance criteria, open question으로 정리할 때.
- `issue-planning-triage`: spec, bug, review finding, worklog, follow-up을 scoped issue와 task batch로 바꿀 때.
- `release-notes-changelog`: user-facing release note, internal changelog, migration note, rollback note를 준비할 때.
- `documentation-artifact-package`: docs, runbook, diagram, screenshot, report, evidence를 stakeholder handoff나 knowledge artifact로 묶을 때.

## 전달, 검증, Git

- `git-worklog-guardrails`: staging, commit, push, PR text, release note, worklog를 다룰 때.
- `test-verification-strategy`: risk-based verification, test scope, coverage gap, release confidence를 계획하거나 검토할 때.
- `ci-quality-gate`: required/optional/skipped/stale check와 merge/release gate를 판단할 때.
- `ci-failure-triage`: 실패한 CI job, build pipeline, deployment, flaky test, environment drift를 진단할 때.
- `flaky-test-triage`: nondeterministic test를 재현, 안정화, quarantine, 문서화할 때.
- `test-fixture-data-design`: fixture, factory, mock, seed, snapshot, golden file, test data boundary를 설계하거나 복구할 때.
- `eval-harness-design`: agent, harness, workflow, MCP, prompt, grader, release-gate eval을 설계할 때.

## AI 하네스

- `mcp-server-design`: MCP tool, resource, prompt, 권한 단계, write gate, cache/index 표면을 설계할 때.
- `context-engineering-memory-design`: agent instruction, context surface, prompt/cache budget, project memory, compaction, stale fact 처리를 설계하거나 검토할 때.
- `agent-orchestration-handoff`: agent, subagent, worker, review pass, long-running handoff의 bounded contract와 evidence ledger를 다룰 때.
- `skill-pack-governance`: skill pack, taxonomy category, compatibility wrapper, reference routing, 번역, install/sync 동작을 다룰 때.
- `runtime-index-cache-design`: runtime report, index, graph, cache, artifact schema, invalidation, canon promotion을 설계하거나 검토할 때.
- `capability-witness-history`: capability witness, baseline comparison, skipped/degraded status, runtime reliability history를 다룰 때.
- `pre-action-fact-gate`: 위험한 행동 전에 fact, scan range, owner, rollback path, write-tier escalation을 확인할 때.
- `evidence-locator-integrity`: claim, report, citation, memory update, handoff의 locator, scan range, freshness, confidence를 확인할 때.

## 아키텍처

- `boundary-review`: FSD, layered architecture, DDD, monorepo, dependency direction, coupling boundary를 검토할 때.
- `feature-slice-boundary`: feature-sliced, vertical-slice, route-level, module-level, component-domain boundary를 바꾸거나 검토할 때.
- `domain-model-change`: domain entity, aggregate, value object, service, policy, use case, invariant, transaction boundary를 바꾸거나 검토할 때.
- `monorepo-package-boundary`: workspace package, package export, dependency graph, generated type, cross-package release impact를 다룰 때.

## 백엔드와 연동

- `api-contract-boundary`: 프론트엔드/백엔드 계약, DTO, mock, payload, adapter를 구현·디버깅·검토할 때.
- `backend-change-safety`: backend service, module, worker, job, integration, queue, config, server-side business logic을 바꿀 때.
- `connector-integration-change`: API connector, workflow node, MCP adapter, webhook, OAuth app, sync job, credential handling을 바꿀 때.
- `server-rendered-change`: controller, template, form, session, redirect, validation, server-rendered view contract를 바꿀 때.

## 데이터와 데이터베이스

- `data-pipeline-review`: analytics pipeline, ETL, batch job, data contract, dashboard, quality check를 검토할 때.
- `analytics-reporting-review`: metric, dashboard, report, KPI definition, chart/table consistency, freshness, caveat를 검토할 때.
- `analytics-instrumentation-review`: tracking plan, event schema, funnel, cohort, experiment, consent, downstream metric impact를 검토할 때.
- `data-migration-integrity`: data migration, backfill, warehouse transformation, reconciliation, idempotency, rollback을 다룰 때.
- `data-contract-lineage-review`: dataset contract, lineage, source-of-truth ownership, freshness target, downstream impact를 검토할 때.
- `data-quality-observability`: freshness alert, anomaly detection, null/duplicate/orphan check, quarantine, repair를 설계하거나 검토할 때.
- `knowledge-retrieval-pipeline-review`: document ingestion, parsing, chunking, metadata, retrieval quality, citation, access control을 검토할 때.
- `knowledge-source-registry`: source registry, locator contract, freshness, credential boundary, promotion policy를 다룰 때.
- `database-change-safety`: schema, migration, SQL, reporting query, stored procedure, data integrity rule을 바꿀 때.
- `schema-migration-plan`: DDL, index, constraint, default, nullability, seed, view, trigger, expand/contract rollout을 계획할 때.
- `query-performance-review`: slow SQL, reporting/dashboard/API/export query, join, aggregate, pagination, full scan, N+1, index choice를 검토할 때.
- `data-integrity-constraints`: uniqueness, foreign key, check, not-null, trigger, generated column, repair script, reconciliation query를 다룰 때.

## DevOps와 릴리스

- `container-change-safety`: Dockerfile, container image, Compose/Kubernetes manifest, runtime config, healthcheck, volume, network를 바꿀 때.
- `deployment-release-check`: release, deploy, rollback, feature flag, artifact, migration gate, post-deploy check를 준비·검토할 때.
- `package-publish-readiness`: package metadata, registry dry-run, generated bundle, binary, marketplace distribution을 준비·검토할 때.
- `observability-incident-triage`: incident, production error, alert, latency, error rate, queue backlog, log, metric, trace를 triage할 때.

## 디자인과 프론트엔드

- `design-brief-direction`: 모호한 제품, 페이지, 브랜드, UI 요청을 디자인 방향과 결정 가능한 brief로 정리할 때.
- `brand-identity-system`: typography, color, logo usage, iconography, voice, brand application rule을 정의하거나 검토할 때.
- `design-reference-analysis`: screenshot, competitor site, reference app, visual sample, design board를 분석할 때.
- `image-to-code-handoff`: image, screenshot, mockup, reference board, Figma frame을 UI contract로 변환할 때.
- `frontend-ui-polish`: 제품 의도와 기존 디자인 관례를 보존하면서 보이는 UI를 구현하거나 다듬을 때.
- `ui-polish`: visible UI, responsive layout, accessibility state, interaction feedback, production polish를 다룰 때.
- `frontend-state-data-flow`: state ownership, server/client cache, data fetching, optimistic update, URL state, stale UI bug를 바꿀 때.
- `frontend-accessibility-review`: keyboard access, focus management, semantic, form, dialog, menu, announcement, contrast를 검토할 때.
- `browser-dom-change`: DOM behavior, jQuery flow, event handler, selector, form, plugin, script-loaded UI를 바꿀 때.
- `visual-regression-qa`: screenshot, responsive breakpoint, overflow, clipping, visual diff, text fit, canvas/media rendering을 확인할 때.
- `interactive-media-3d-review`: Three.js, WebGL, canvas, SVG, chart, map, animation, video, media-heavy interactive UI를 구현하거나 검토할 때.
- `design-system-handoff`: Figma, brand, token, component library, theme, variant, visual spec을 maintainable frontend implementation으로 옮길 때.

## 모바일

- `native-release-readiness`: mobile release, signing, provisioning, build channel, store distribution, artifact, release-build cleanup을 준비·검토할 때.
- `device-permission-qa`: runtime permission, device capability, manifest, privacy prompt, lifecycle behavior, device/emulator QA를 바꿀 때.
- `offline-sync-review`: offline mode, local cache, durable queue, sync job, conflict resolution, retry, idempotency를 검토할 때.
- `webview-bridge`: WebView bridge, native-to-web messaging, deep link, embedded auth, upload, download, hybrid navigation을 바꿀 때.

## 보안과 컴플라이언스

- `security-review`: secret, authentication, authorization, input validation, dependency risk, sensitive data flow를 검토할 때.
- `auth-access-control`: login, session, OAuth/OIDC, JWT, RBAC, permission, role, tenant, object-level authorization을 바꿀 때.
- `dependency-supply-chain-review`: dependency, lockfile, SBOM, license, container, package script, provenance, vulnerability remediation을 다룰 때.
- `license-notice-review`: first-party license, third-party notice, attribution, vendored code, generated artifact, copied snippet, redistribution scope를 검토할 때.
- `security-compliance-gate`: merge, release, publication, handoff 전 security 또는 compliance gate를 결정할 때.

## 품질과 정리

- `ui-style-policy`: 저장소 UI 스타일 정책을 선택, 문서화, 강제할 때.
- `style-quality-review`: UI style, responsive behavior, layout overflow, visual regression을 검토하거나 개선할 때.
- `cleanup-ai-slop`: 신뢰가 낮거나 과하게 복잡하거나 중복된 코드를 동작 변경 없이 정리할 때.
- `review-work-light`: 차단형 리뷰 절차 없이 최근 구현 작업을 인수인계 전에 검토할 때.

## 레거시

- `legacy-change-safety`: hidden coupling이나 deployment risk가 있는 compatibility-first legacy change를 다룰 때.
- `legacy-general`: 흐름이 불명확하고 결합이 숨겨져 있거나 test/documentation이 약한 레거시 코드를 유지보수할 때.
- `legacy-risk-check`: 공유 상태, CSS/JS, selector, template, form, API, build, deploy에 영향을 줄 수 있는 변경 전.
- `legacy-feature-addition`: 주변 architecture를 다시 쓰지 않고 동작, 화면, 필드, 규칙, integration을 추가할 때.
- `legacy-jquery-web`: jQuery, plugin, direct DOM, global script, AJAX callback, script order coupling을 유지보수할 때.
- `legacy-server-rendered-web`: template, controller, form post, server validation, session, layout, partial을 유지보수할 때.
- `legacy-php-lamp`: include, session, mixed HTML/PHP, direct SQL, global, shared hosting 제약이 있는 PHP/LAMP를 유지보수할 때.
- `legacy-android-webview-hybrid`: Android WebView, web asset, JavaScript bridge, permission, device API를 유지보수할 때.
- `legacy-ie-activex-compat`: IE mode, ActiveX, old browser API, compatibility constraint가 필요한 intranet system을 유지보수할 때.
- `legacy-java-spring-mvc`: Spring MVC, JSP, Servlet, MyBatis, WAR, XML config, server-rendered Java app을 유지보수할 때.
- `legacy-dotnet-webforms`: ASP.NET Web Forms, .NET Framework, code-behind, ViewState, Web.config, IIS를 유지보수할 때.
- `legacy-database-heavy-system`: stored procedure, trigger, view, direct SQL, scheduled job처럼 데이터베이스에 강하게 묶인 업무 규칙을 유지보수할 때.
- `legacy-reporting-printing`: report, print preview, PDF/Excel export, label, barcode, invoice, printer-specific flow를 유지보수할 때.
- `legacy-batch-file-transfer`: scheduled batch, cron, Windows Task Scheduler, CSV/Excel import/export, SFTP, file drop을 유지보수할 때.
