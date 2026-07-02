# Skill Taxonomy v2

Skill taxonomy v2는 capability category를 1차 축으로 씁니다. 스택별 세부사항은 reference나 profile로 내립니다.

## Categories

- `foundation`: repo onboarding, bootstrap, project docs.
- `delivery`: planning, verification, testing, git, PR, worklog flow.
- `architecture`: FSD, layered architecture, DDD, monorepo, boundary review.
- `frontend`: UI, state, data, accessibility, performance, visual QA.
- `backend`: API contract, connector, auth, server-rendered flow, worker, integration.
- `database`: schema change, migration, SQL, reporting, data integrity.
- `devops`: CI/CD, container, package release, deployment, configuration, observability.
- `security`: secret, threat modeling, authorization, dependency risk, compliance evidence.
- `mobile`: Expo, React Native, native app release, permission, offline sync, WebView bridge, device QA.
- `data`: analytics, pipeline, ETL, dashboard, data quality.
- `ai-harness`: MCP, skill, agent, context engineering, cache, index design.
- `legacy`: legacy change safety와 compatibility strategy.

## Wrapper Policy

스택명 스킬은 유용한 trigger name이면 compatibility wrapper로 남길 수 있습니다. Wrapper는 primary capability skill을 가리키고, 스택 세부사항은 `references/`에 둡니다.

예를 들어 `legacy-java-spring-mvc`는 backend server-rendered change 작업으로 라우팅하고 Spring MVC 세부사항은 reference 파일에 둡니다.

## AI Harness Governance Pack

AI harness skill은 MCP surface design을 context engineering, skill-pack governance, runtime index/cache contract와 분리합니다.

- `ai-harness/mcp-server-design`: MCP tool, resource, prompt, permission tier, write gate, cache/index surface.
- `ai-harness/context-engineering-memory-design`: agent instruction, context surface, prompt/cache budget, project memory, compaction behavior, durable memory promotion, stale fact handling.
- `ai-harness/skill-pack-governance`: skill taxonomy growth, compatibility wrapper, reference routing, translation, install/sync behavior, reusable skill-pack adoption.
- `ai-harness/runtime-index-cache-design`: runtime report, index, graph, cache, artifact schema, invalidation, canon promotion, generated evidence, local-only runtime storage.
- `meta/agent-skill-authoring`: reusable skill structure, trigger description, reference, skill/template boundary.

AI harness guidance는 always-on prompt와 core tool surface를 좁게 유지해야 합니다. Default context를 키우기 전에 selected skill, reference, recipe, CLI command, MCP resource, opt-in tool을 우선합니다.

## Backend And Security Pack

Backend와 security skill은 capability-first name을 씁니다.

- `backend/api-contract-boundary`: API와 DTO boundary 작업.
- `backend/backend-change-safety`: service, module, job, worker, queue, config, integration.
- `backend/connector-integration-change`: API connector, workflow node, MCP adapter, webhook, OAuth app, import/export bridge, sync job, registration metadata, credential handling.
- `backend/server-rendered-change`: controller, template, session, form, redirect, server-rendered view contract.
- `security/auth-access-control`: authentication, authorization, RBAC, tenant, scope, object-level access.
- `security/dependency-supply-chain-review`: dependency, lockfile, SBOM, license, provenance, container, CVE.
- `security/license-notice-review`: first-party license, third-party notice, attribution, vendored code, generated artifact, copied snippet, redistribution scope, compliance evidence.
- `security/security-review`: broad security risk review와 threat-model triage.

Stack profile은 관련 primary skill reference tree 아래에 둡니다. Backend change safety의 Java, Kotlin, Go, Python, Node, .NET, PHP 세부사항은 stack-first primary skill을 만들지 않고 `skills/backend/backend-change-safety/references/stacks/` 아래에 둡니다.

## Architecture Boundary Pack

Architecture skill은 broad boundary review를 feature slicing, domain modeling, monorepo/package ownership과 분리합니다.

- `architecture/boundary-review`: broad architecture boundary, dependency direction, public API, ownership, coupling review.
- `architecture/feature-slice-boundary`: FSD, feature-sliced, vertical-slice, feature-first, route-level, module-level, component-domain boundary.
- `architecture/domain-model-change`: domain entity, aggregate, value object, service, policy, use case, repository, adapter, invariant, transaction boundary.
- `architecture/monorepo-package-boundary`: workspace package, package export, dependency graph, generated type, build graph, versioning, cross-package release impact.

Architecture guidance는 FSD, DDD, clean architecture, layered architecture, monorepo restructuring을 권하기 전에 repository의 실제 pattern을 검증해야 합니다.

## Database Depth Pack

Database skill은 broad database change safety를 schema rollout planning, query performance review, data integrity enforcement와 분리합니다.

- `database/database-change-safety`: broad schema, migration, SQL, reporting query, stored procedure, data integrity change.
- `database/schema-migration-plan`: schema migration, DDL, index, constraint, default, nullability, seed, view, trigger, stored procedure, rollout order, compatibility window, rollback evidence.
- `database/query-performance-review`: slow SQL, reporting/dashboard/API/export query, join, aggregate, sort/pagination, full scan, N+1 pattern, explain plan, index choice.
- `database/data-integrity-constraints`: uniqueness, foreign key, check, not-null rule, trigger, stored procedure, generated column, repair script, reconciliation query, invariant boundary.

Database guidance는 read-before-write evidence를 우선해야 합니다. Schema inspection, migration dry-run, explain/estimate, before/after query, rendered consumer check, destructive operation explicit confirmation을 사용합니다.

## Delivery And Testing Pack

Delivery testing skill은 release confidence planning, flaky test stabilization, fixture/test-data design을 분리합니다.

- `delivery/git-worklog-guardrails`: staging, commit, PR text, release note, worklog.
- `delivery/test-verification-strategy`: risk-based verification strategy, test scope, coverage gap, check selection, release confidence.
- `delivery/flaky-test-triage`: flaky, nondeterministic, timing-dependent, order-dependent, environment-sensitive, intermittent test failure.
- `delivery/test-fixture-data-design`: fixture, factory, mock, seed, snapshot, golden file, sample payload, test database, fixture maintenance boundary.

Verification guidance는 project-defined command를 우선하고, check result를 지어내지 않으며, 실행할 수 없는 check에는 remaining risk를 기록해야 합니다.

## DevOps And Release Pack

DevOps skill은 cloud provider나 orchestrator 이름이 아니라 operational capability 이름을 사용합니다.

- `devops/ci-failure-triage`: CI job, build pipeline, deployment check, flaky test, environment drift, release automation failure.
- `devops/container-change-safety`: Dockerfile, container image, Compose/Kubernetes manifest, service runtime config, healthcheck, volume, network, containerized deployment behavior.
- `devops/deployment-release-check`: release readiness, deploy, rollback, feature flag, changelog, artifact, migration gate, post-deploy check.
- `devops/package-publish-readiness`: package metadata, included file, entrypoint, binary, generated bundle, registry dry-run, provenance, artifact rollback constraint.
- `devops/observability-incident-triage`: active incident, production error, alert, latency, error rate, queue backlog, job failure, log, metric, trace, post-incident runbook.

Provider-specific detail은 reference 또는 project playbook에 둡니다. Primary skill은 container, virtual machine, managed platform, serverless, 단순 script-based deployment에서도 작동해야 합니다.

## Package And Connector Governance Pack

Package, license, connector governance skill은 artifact compliance를 generic dependency review와 분리합니다.

- `devops/package-publish-readiness`: package, CLI, plugin, library, extension, binary, generated bundle, marketplace distribution readiness.
- `security/license-notice-review`: license policy evidence, NOTICE file, attribution, vendored code, generated artifact, copied snippet, redistribution scope.
- `backend/connector-integration-change`: connector contract, credential handling, webhook lifecycle, retry behavior, registration metadata, host-runtime compatibility.

Review guidance는 project가 명시적으로 정의하고 사용자가 요청하지 않는 한 registry login, package publish, live external call, legal approval claim을 하지 않습니다.

## Frontend Quality Pack

Frontend quality skill은 user-visible polish를 state/data correctness, accessibility behavior, rendered regression QA와 분리합니다.

- `frontend/browser-dom-change`: DOM-first behavior, jQuery flow, selector, event handler, form, plugin, script-loaded UI.
- `frontend/frontend-state-data-flow`: state ownership, server/client cache behavior, data fetching, optimistic update, URL state, loading/error/empty state, stale UI bug.
- `frontend/frontend-accessibility-review`: keyboard access, focus management, semantic, form, dialog, menu, announcement, contrast, reduced motion, accessible interaction state.
- `frontend/ui-polish`: visible UI quality, responsive layout, accessibility state, visual hierarchy, interaction feedback, production polish.
- `frontend/visual-regression-qa`: screenshot, responsive breakpoint, layout overflow, clipping, visual diff, text fit, canvas/media rendering, browser-rendered regression.

Framework-specific detail은 reference 또는 project-local playbook에 둡니다. Primary skill은 React, Vue, Svelte, Angular, server-rendered page, 가벼운 DOM-first frontend에서도 작동해야 합니다.

## Mobile Hardening Pack

Mobile skill은 release readiness, device permission evidence, offline sync correctness, hybrid bridge boundary를 분리합니다.

- `mobile/native-release-readiness`: mobile release, signing, provisioning, build profile, release channel, store distribution, artifact, rollout, rollback, release-build cleanup.
- `mobile/device-permission-qa`: runtime permission, manifest, privacy prompt, sensitive capability, lifecycle behavior, device matrix, real-device와 simulator/emulator evidence.
- `mobile/offline-sync-review`: offline mode, local cache, durable queue, sync API, conflict, retry, idempotency, reconciliation, network transition behavior.
- `mobile/webview-bridge`: WebView bridge, native-to-web messaging, deep link, embedded auth, upload, download, hybrid navigation.

Platform-specific detail은 reference 또는 project playbook에 둡니다. Primary skill은 stack-first mobile skill을 만들지 않고 Swift/iOS, Kotlin/Android, Expo, React Native, Flutter, hybrid WebView app에서 작동해야 합니다.

## Data And Documentation Pack

Data와 documentation skill은 pipeline reliability, reporting correctness, migration integrity, contract/lineage safety, data quality observability, instrumentation, retrieval pipeline, durable project memory를 분리합니다.

- `data/data-pipeline-review`: analytics pipeline, ETL, batch job, data contract, dashboard, quality check, freshness, ownership, lineage.
- `data/analytics-reporting-review`: metric definition, KPI ownership, dashboard/report consistency, chart/table check, segmentation, caveat, reader handoff.
- `data/data-migration-integrity`: data migration, backfill, warehouse transformation, reconciliation query, idempotency, batching, rollback, repair.
- `data/data-contract-lineage-review`: dataset contract, source-of-truth ownership, grain/schema change, lineage, freshness target, retention, caveat, consumer impact.
- `data/data-quality-observability`: null/duplicate/orphan/range/freshness check, anomaly detection, alert threshold, quarantine, repair path, data incident handoff.
- `data/analytics-instrumentation-review`: tracking plan, event schema, identity grain, funnel, cohort, experiment, attribution, consent, downstream metric impact.
- `data/knowledge-retrieval-pipeline-review`: document ingestion, parsing, chunking, metadata, embedding/vector store, retrieval evaluation, citation, access control, stale index.
- `project/project-doc-system`: `.ai-playbook` map, runbook, decision, plan, worklog, archive, project-memory hygiene.
- `project/adr-spec-handoff`: ADR, spec, milestone outcome, implementation handoff, reviewed evidence, durable memory promotion.

Generated runtime report는 검토 없이 `memory/`로 승격하지 않습니다. Reporting, migration, handoff skill은 source evidence를 보존하되 private path, credential, branch name, PR number, noisy reference name이 public documentation에 들어가지 않게 해야 합니다.

## Validation

Catalog 명령은 duplicate skill name, wrapper routing 누락, wrapper reference 누락, category drift를 보고합니다.

```bash
ai-playbook catalog check --json
```
