# Skill Taxonomy v2

Skill taxonomy v2 uses capability categories as the primary axis. Stack-specific details move into references or profiles.

## Categories

- `foundation`: repo onboarding, bootstrap, and project docs.
- `delivery`: planning, verification, git, PR, and worklog flows.
- `architecture`: FSD, layered architecture, DDD, monorepos, and boundary review.
- `frontend`: UI, state, data, accessibility, performance, and visual QA.
- `backend`: API contracts, auth, server-rendered flows, workers, and integrations.
- `database`: schema change, migration, SQL, reporting, and data integrity.
- `devops`: CI/CD, containers, deployment, configuration, and observability.
- `security`: secrets, threat modeling, authorization, and dependency risk.
- `mobile`: Expo, React Native, native app, WebView bridge, and device QA.
- `data`: analytics, pipelines, ETL, dashboards, and data quality.
- `ai-harness`: MCP, skills, agents, context engineering, cache, and index design.
- `legacy`: legacy change safety and compatibility strategy.

## Wrapper Policy

Stack-named skills can remain as compatibility wrappers when they still provide useful trigger names. The wrapper should point to a primary capability skill and keep stack details in `references/`.

For example, `legacy-java-spring-mvc` routes to backend server-rendered change work and keeps Spring MVC specifics in its reference file.

## Backend And Security Pack

Backend and security skills use capability-first names:

- `backend/api-contract-boundary`: API and DTO boundary work.
- `backend/backend-change-safety`: services, modules, jobs, workers, queues, config, and integrations.
- `backend/server-rendered-change`: controllers, templates, sessions, forms, redirects, and server-rendered view contracts.
- `security/auth-access-control`: authentication, authorization, RBAC, tenants, scopes, and object-level access.
- `security/dependency-supply-chain-review`: dependencies, lockfiles, SBOMs, licenses, provenance, containers, and CVEs.
- `security/security-review`: broad security risk review and threat-model triage.

Stack profiles belong under the relevant primary skill reference tree. For backend change safety, Java, Kotlin, Go, Python, Node, .NET, and PHP details live under `skills/backend/backend-change-safety/references/stacks/` instead of creating stack-first primary skills.

## DevOps And Release Pack

DevOps skills use operational capability names rather than cloud-provider or orchestrator names:

- `devops/ci-failure-triage`: CI jobs, build pipelines, deployment checks, flaky tests, environment drift, and release automation failures.
- `devops/container-change-safety`: Dockerfiles, container images, Compose/Kubernetes manifests, service runtime config, healthchecks, volumes, networks, and containerized deployment behavior.
- `devops/deployment-release-check`: release readiness, deploys, rollbacks, feature flags, changelogs, artifacts, migration gates, and post-deploy checks.
- `devops/observability-incident-triage`: active incidents, production errors, alerts, latency, error rates, queue backlogs, job failures, logs, metrics, traces, and post-incident runbooks.

Provider-specific details belong in references or project playbooks. The primary skills should still work for containers, virtual machines, managed platforms, serverless, and simple script-based deployments.

## Frontend Quality Pack

Frontend quality skills separate user-visible polish from state/data correctness, accessibility behavior, and rendered regression QA:

- `frontend/browser-dom-change`: DOM-first behavior, jQuery flows, selectors, event handlers, forms, plugins, and script-loaded UI.
- `frontend/frontend-state-data-flow`: state ownership, server/client cache behavior, data fetching, optimistic updates, URL state, loading/error/empty states, and stale UI bugs.
- `frontend/frontend-accessibility-review`: keyboard access, focus management, semantics, forms, dialogs, menus, announcements, contrast, reduced motion, and accessible interaction states.
- `frontend/ui-polish`: visible UI quality, responsive layout, accessibility states, visual hierarchy, interaction feedback, and production polish.
- `frontend/visual-regression-qa`: screenshots, responsive breakpoints, layout overflow, clipping, visual diffs, text fit, canvas/media rendering, and browser-rendered regressions.

Framework-specific details belong in references or project-local playbooks. The primary skills should work for React, Vue, Svelte, Angular, server-rendered pages, and lighter DOM-first frontends.

## Data And Documentation Pack

Data and documentation skills separate pipeline reliability, reporting correctness, migration integrity, and durable project memory:

- `data/data-pipeline-review`: analytics pipelines, ETL, batch jobs, data contracts, dashboards, quality checks, freshness, ownership, and lineage.
- `data/analytics-reporting-review`: metric definitions, KPI ownership, dashboard/report consistency, chart/table checks, segmentation, caveats, and reader handoff.
- `data/data-migration-integrity`: data migrations, backfills, warehouse transformations, reconciliation queries, idempotency, batching, rollback, and repair.
- `project/project-doc-system`: `.ai-playbook` maps, runbooks, decisions, plans, worklogs, archives, and project-memory hygiene.
- `project/adr-spec-handoff`: ADRs, specs, milestone outcomes, implementation handoffs, reviewed evidence, and durable memory promotion.

Generated runtime reports should not be promoted into `memory/` without review. Reporting, migration, and handoff skills should preserve source evidence while keeping private paths, credentials, branch names, PR numbers, and noisy reference names out of public documentation.

## Validation

The catalog command reports duplicate skill names, wrapper routing gaps, missing wrapper references, and category drift:

```bash
ai-playbook catalog check --json
```
