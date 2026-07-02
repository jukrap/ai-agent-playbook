# Skill Taxonomy v2

Skill taxonomy v2는 capability category를 1차 축으로 씁니다. 스택별 세부사항은 reference나 profile로 내립니다.

## Categories

- `foundation`: repo onboarding, bootstrap, project docs.
- `delivery`: planning, verification, git, PR, worklog flow.
- `architecture`: FSD, layered architecture, DDD, monorepo, boundary review.
- `frontend`: UI, state, data, accessibility, performance, visual QA.
- `backend`: API contract, auth, server-rendered flow, worker, integration.
- `database`: schema change, migration, SQL, reporting, data integrity.
- `devops`: CI/CD, container, deployment, configuration, observability.
- `security`: secret, threat modeling, authorization, dependency risk.
- `mobile`: Expo, React Native, native app, WebView bridge, device QA.
- `data`: analytics, pipeline, ETL, dashboard, data quality.
- `ai-harness`: MCP, skill, agent, context engineering, cache, index design.
- `legacy`: legacy change safety와 compatibility strategy.

## Wrapper Policy

스택명 스킬은 유용한 trigger name이면 compatibility wrapper로 남길 수 있습니다. Wrapper는 primary capability skill을 가리키고, 스택 세부사항은 `references/`에 둡니다.

예를 들어 `legacy-java-spring-mvc`는 backend server-rendered change 작업으로 라우팅하고 Spring MVC 세부사항은 reference 파일에 둡니다.

## Backend And Security Pack

Backend와 security skill은 capability-first name을 씁니다.

- `backend/api-contract-boundary`: API와 DTO boundary 작업.
- `backend/backend-change-safety`: service, module, job, worker, queue, config, integration.
- `backend/server-rendered-change`: controller, template, session, form, redirect, server-rendered view contract.
- `security/auth-access-control`: authentication, authorization, RBAC, tenant, scope, object-level access.
- `security/dependency-supply-chain-review`: dependency, lockfile, SBOM, license, provenance, container, CVE.
- `security/security-review`: broad security risk review와 threat-model triage.

Stack profile은 관련 primary skill reference tree 아래에 둡니다. Backend change safety의 Java, Kotlin, Go, Python, Node, .NET, PHP 세부사항은 stack-first primary skill을 만들지 않고 `skills/backend/backend-change-safety/references/stacks/` 아래에 둡니다.

## DevOps And Release Pack

DevOps skill은 cloud provider나 orchestrator 이름이 아니라 operational capability 이름을 사용합니다.

- `devops/ci-failure-triage`: CI job, build pipeline, deployment check, flaky test, environment drift, release automation failure.
- `devops/container-change-safety`: Dockerfile, container image, Compose/Kubernetes manifest, service runtime config, healthcheck, volume, network, containerized deployment behavior.
- `devops/deployment-release-check`: release readiness, deploy, rollback, feature flag, changelog, artifact, migration gate, post-deploy check.
- `devops/observability-incident-triage`: active incident, production error, alert, latency, error rate, queue backlog, job failure, log, metric, trace, post-incident runbook.

Provider-specific detail은 reference 또는 project playbook에 둡니다. Primary skill은 container, virtual machine, managed platform, serverless, 단순 script-based deployment에서도 작동해야 합니다.

## Frontend Quality Pack

Frontend quality skill은 user-visible polish를 state/data correctness, accessibility behavior, rendered regression QA와 분리합니다.

- `frontend/browser-dom-change`: DOM-first behavior, jQuery flow, selector, event handler, form, plugin, script-loaded UI.
- `frontend/frontend-state-data-flow`: state ownership, server/client cache behavior, data fetching, optimistic update, URL state, loading/error/empty state, stale UI bug.
- `frontend/frontend-accessibility-review`: keyboard access, focus management, semantic, form, dialog, menu, announcement, contrast, reduced motion, accessible interaction state.
- `frontend/ui-polish`: visible UI quality, responsive layout, accessibility state, visual hierarchy, interaction feedback, production polish.
- `frontend/visual-regression-qa`: screenshot, responsive breakpoint, layout overflow, clipping, visual diff, text fit, canvas/media rendering, browser-rendered regression.

Framework-specific detail은 reference 또는 project-local playbook에 둡니다. Primary skill은 React, Vue, Svelte, Angular, server-rendered page, 가벼운 DOM-first frontend에서도 작동해야 합니다.

## Data And Documentation Pack

Data와 documentation skill은 pipeline reliability, reporting correctness, migration integrity, durable project memory를 분리합니다.

- `data/data-pipeline-review`: analytics pipeline, ETL, batch job, data contract, dashboard, quality check, freshness, ownership, lineage.
- `data/analytics-reporting-review`: metric definition, KPI ownership, dashboard/report consistency, chart/table check, segmentation, caveat, reader handoff.
- `data/data-migration-integrity`: data migration, backfill, warehouse transformation, reconciliation query, idempotency, batching, rollback, repair.
- `project/project-doc-system`: `.ai-playbook` map, runbook, decision, plan, worklog, archive, project-memory hygiene.
- `project/adr-spec-handoff`: ADR, spec, milestone outcome, implementation handoff, reviewed evidence, durable memory promotion.

Generated runtime report는 검토 없이 `memory/`로 승격하지 않습니다. Reporting, migration, handoff skill은 source evidence를 보존하되 private path, credential, branch name, PR number, noisy reference name이 public documentation에 들어가지 않게 해야 합니다.

## Validation

Catalog 명령은 duplicate skill name, wrapper routing 누락, wrapper reference 누락, category drift를 보고합니다.

```bash
ai-playbook catalog check --json
```
