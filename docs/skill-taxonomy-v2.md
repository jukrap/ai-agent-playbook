# Skill Taxonomy v2

Skill taxonomy v2 uses capability categories as the primary axis. Stack-specific details move into references or profiles.

## Categories

- `foundation`: repo onboarding, bootstrap, project docs, requirements, planning, release notes, and documentation packages.
- `delivery`: planning, evals, verification, testing, git, PR, and worklog flows.
- `architecture`: FSD, layered architecture, DDD, monorepos, and boundary review.
- `frontend`: UI, style policy, state, data, accessibility, performance, visual QA, design-system handoff, and interactive media.
- `backend`: API contracts, request/error contracts, job/worker reliability, connectors, auth, server-rendered flows, workers, and integrations.
- `database`: schema change, migration, SQL, reporting, and data integrity.
- `devops`: CI/CD, containers, package releases, deployment, configuration, and observability.
- `design`: design direction, brand identity, reference analysis, visual evidence, and image/Figma handoff.
- `security`: secrets, threat modeling, authorization, dependency risk, and compliance evidence.
- `mobile`: Expo, React Native, native app release, permissions, offline sync, WebView bridge, and device QA.
- `data`: analytics, pipelines, ETL, dashboards, source registries, and data quality.
- `ai-harness`: MCP, skills, agents, context engineering, fact gates, witness history, cache, and index design.
- `legacy`: legacy change safety and compatibility strategy.

## Wrapper Policy

Stack-named skills can remain as compatibility wrappers when they still provide useful trigger names. The wrapper should point to a primary capability skill and keep stack details in `references/`.

For example, `legacy-java-spring-mvc` routes to backend server-rendered change work and keeps Spring MVC specifics in its reference file.

## AI Harness Governance Pack

AI harness skills separate MCP surface design from context engineering, skill-pack governance, and runtime index/cache contracts:

- `ai-harness/mcp-server-design`: MCP tools, resources, prompts, permission tiers, write gates, and cache/index surfaces.
- `ai-harness/context-engineering-memory-design`: agent instructions, context surfaces, prompt/cache budget, project memory, compaction behavior, durable memory promotion, and stale fact handling.
- `ai-harness/agent-orchestration-handoff`: multi-agent worker contracts, bounded context, evidence ledgers, reconciliation gates, and handoffs.
- `ai-harness/skill-pack-governance`: skill taxonomy growth, compatibility wrappers, reference routing, translations, install/sync behavior, and reusable skill-pack adoption.
- `ai-harness/runtime-index-cache-design`: runtime reports, indexes, graphs, caches, artifact schemas, invalidation, canon promotion, generated evidence, and local-only runtime storage.
- `ai-harness/capability-witness-history`: append-only capability witnesses, baseline comparison, skipped/degraded status, and runtime reliability history.
- `ai-harness/pre-action-fact-gate`: concrete facts, scan ranges, owners, importers, schemas, rollback paths, and write-tier escalation before risky action.
- `meta/agent-skill-authoring`: reusable skill structure, trigger descriptions, references, and skill/template boundaries.

AI harness guidance should keep always-on prompt and core tool surfaces narrow. Prefer selected skills, references, recipes, CLI commands, MCP resources, or opt-in tools before growing default context.

## Backend And Security Pack

Backend and security skills use capability-first names:

- `backend/api-contract-boundary`: API and DTO boundary work.
- `backend/backend-change-safety`: services, modules, jobs, workers, queues, config, and integrations.
- `backend/request-validation-error-contract`: request parsing, validation, error envelopes, exception mapping, and client-visible failure contracts.
- `backend/job-worker-reliability`: jobs, workers, queues, schedulers, retries, dead-letter handling, replay, and long-running tasks.
- `backend/connector-integration-change`: API connectors, workflow nodes, MCP adapters, webhooks, OAuth apps, import/export bridges, sync jobs, registration metadata, and credential handling.
- `backend/server-rendered-change`: controllers, templates, sessions, forms, redirects, and server-rendered view contracts.
- `security/auth-access-control`: authentication, authorization, RBAC, tenants, scopes, and object-level access.
- `security/dependency-supply-chain-review`: dependencies, lockfiles, SBOMs, licenses, provenance, containers, and CVEs.
- `security/license-notice-review`: first-party licenses, third-party notices, attribution, vendored code, generated artifacts, copied snippets, redistribution scope, and compliance evidence.
- `security/security-review`: broad security risk review and threat-model triage.
- `security/security-compliance-gate`: merge, release, publication, and handoff security/compliance gate decisions.

Stack profiles belong under the relevant primary skill reference tree. For backend change safety, Java, Kotlin, Go, Python, Node, .NET, and PHP details live under `skills/backend/backend-change-safety/references/stacks/` instead of creating stack-first primary skills. Use `skills/backend/backend-change-safety/references/stack-profile-selection.md` to decide which profile applies and when to pair it with server-rendered, database, connector, API contract, or security skills.

## Architecture Boundary Pack

Architecture skills separate broad boundary review from feature slicing, domain modeling, and monorepo/package ownership:

- `architecture/boundary-review`: broad architecture boundaries, dependency direction, public APIs, ownership, and coupling review.
- `architecture/feature-slice-boundary`: FSD, feature-sliced, vertical-slice, feature-first, route-level, module-level, and component-domain boundaries.
- `architecture/domain-model-change`: domain entities, aggregates, value objects, services, policies, use cases, repositories, adapters, invariants, and transaction boundaries.
- `architecture/monorepo-package-boundary`: workspace packages, package exports, dependency graphs, generated types, build graphs, versioning, and cross-package release impact.

Architecture guidance should verify the repository's actual pattern before recommending FSD, DDD, clean architecture, layered architecture, or monorepo restructuring.

## Database Depth Pack

Database skills separate broad database change safety from schema rollout planning, query performance review, and data integrity enforcement:

- `database/database-change-safety`: broad schema, migration, SQL, reporting query, stored procedure, and data integrity changes.
- `database/schema-migration-plan`: schema migrations, DDL, indexes, constraints, defaults, nullability, seeds, views, triggers, stored procedures, rollout order, compatibility windows, and rollback evidence.
- `database/query-performance-review`: slow SQL, reporting/dashboard/API/export queries, joins, aggregates, sort/pagination, full scans, N+1 patterns, explain plans, and index choices.
- `database/data-integrity-constraints`: uniqueness, foreign keys, checks, not-null rules, triggers, stored procedures, generated columns, repair scripts, reconciliation queries, and invariant boundaries.

Database guidance should prefer read-before-write evidence: schema inspection, migration dry-run, explain/estimate, before/after queries, rendered consumer checks, and explicit confirmation for destructive operations.

## Delivery And Testing Pack

Delivery testing skills separate release confidence planning, flaky test stabilization, and fixture/test-data design:

- `delivery/git-worklog-guardrails`: staging, commits, PR text, release notes, and worklogs.
- `delivery/eval-harness-design`: agent, harness, workflow, MCP, prompt, capability, regression, grader, and release-gate evals.
- `delivery/test-verification-strategy`: risk-based verification strategy, test scope, coverage gaps, check selection, and release confidence.
- `delivery/flaky-test-triage`: flaky, nondeterministic, timing-dependent, order-dependent, environment-sensitive, and intermittent test failures.
- `delivery/test-fixture-data-design`: fixtures, factories, mocks, seeds, snapshots, golden files, sample payloads, test databases, and fixture maintenance boundaries.

Verification guidance should prefer project-defined commands, deterministic graders, generated evidence kept in `runtime/`, and explicit remaining risk when a check cannot be run.

## DevOps And Release Pack

DevOps skills use operational capability names rather than cloud-provider or orchestrator names:

- `devops/ci-failure-triage`: CI jobs, build pipelines, deployment checks, flaky tests, environment drift, and release automation failures.
- `devops/container-change-safety`: Dockerfiles, container images, Compose/Kubernetes manifests, service runtime config, healthchecks, volumes, networks, and containerized deployment behavior.
- `devops/deployment-release-check`: release readiness, deploys, rollbacks, feature flags, changelogs, artifacts, migration gates, and post-deploy checks.
- `devops/package-publish-readiness`: package metadata, included files, entrypoints, binaries, generated bundles, registry dry-runs, provenance, and artifact rollback constraints.
- `devops/observability-incident-triage`: active incidents, production errors, alerts, latency, error rates, queue backlogs, job failures, logs, metrics, traces, and post-incident runbooks.

Provider-specific details belong in references or project playbooks. The primary skills should still work for containers, virtual machines, managed platforms, serverless, and simple script-based deployments.

## Package And Connector Governance Pack

Package, license, and connector governance skills keep artifact compliance separate from generic dependency review:

- `devops/package-publish-readiness`: package, CLI, plugin, library, extension, binary, generated bundle, and marketplace distribution readiness.
- `security/license-notice-review`: license policy evidence, NOTICE files, attribution, vendored code, generated artifacts, copied snippets, and redistribution scope.
- `security/security-compliance-gate`: block/warn/document severity, accepted-risk evidence, public-doc hygiene, runtime evidence safety, and release compliance handoff.
- `backend/connector-integration-change`: connector contracts, credential handling, webhook lifecycle, retry behavior, registration metadata, and host-runtime compatibility.

Review guidance should not log into registries, publish packages, make live external calls, or claim legal approval unless the project explicitly defines those steps and the user asks for them.

## Design Reference Pack

Design skills separate visual direction and source interpretation from frontend implementation:

- `design/design-brief-direction`: product type, audience, visual language, style dials, constraints, anti-patterns, and decision-ready briefs.
- `design/brand-identity-system`: typography, color, logo usage, iconography, imagery, voice, brand applications, and identity review gates.
- `design/design-reference-analysis`: reference screenshots, competitor sites, design boards, reusable principles, source boundaries, and visual evidence packages.
- `design/image-to-code-handoff`: generated images, screenshots, mockups, reference boards, Figma frames, UI contracts, responsive rules, and verification criteria.

Design guidance should not copy upstream visuals, brand marks, private Figma URLs, local paths, generated mockup artifacts, or proprietary copy into public docs. Generated design evidence belongs in runtime reports until a design brief, identity rule, or implementation contract is reviewed and accepted.

## Frontend Quality Pack

Frontend quality skills separate user-visible polish from state/data correctness, accessibility behavior, and rendered regression QA:

- `frontend/browser-dom-change`: DOM-first behavior, jQuery flows, selectors, event handlers, forms, plugins, and script-loaded UI.
- `frontend/style-policy-selection`: repository styling method selection across design systems, CSS/classes, utility classes, and inline styles.
- `frontend/frontend-state-data-flow`: state ownership, server/client cache behavior, data fetching, optimistic updates, URL state, loading/error/empty states, and stale UI bugs.
- `frontend/frontend-accessibility-review`: keyboard access, focus management, semantics, forms, dialogs, menus, announcements, contrast, reduced motion, and accessible interaction states.
- `frontend/ui-polish`: visible UI quality, responsive layout, accessibility states, visual hierarchy, interaction feedback, and production polish.
- `frontend/visual-regression-qa`: screenshots, responsive breakpoints, layout overflow, clipping, visual diffs, text fit, canvas/media rendering, and browser-rendered regressions.
- `frontend/interactive-media-3d-review`: Three.js, WebGL, canvas, SVG, chart, map, animation, video, media-heavy interaction, asset loading, nonblank rendering, and responsive scene verification.
- `frontend/design-system-handoff`: Figma, brand, design-token, component-library, theme, variant, and visual-spec handoff into repository-native UI primitives.

Framework-specific details belong in references or project-local playbooks. The primary skills should work for React, Vue, Svelte, Angular, server-rendered pages, lighter DOM-first frontends, canvas/media tools, and 3D or chart-heavy interfaces.

`quality/ui-style-policy` remains only as a compatibility route for older prompts and project docs. New project guidance should point to `frontend/style-policy-selection`.

## Mobile Hardening Pack

Mobile skills separate release readiness, device permission evidence, offline sync correctness, and hybrid bridge boundaries:

- `mobile/native-release-readiness`: mobile releases, signing, provisioning, build profiles, release channels, store distribution, artifacts, rollout, rollback, and release-build cleanup.
- `mobile/device-permission-qa`: runtime permissions, manifests, privacy prompts, sensitive capabilities, lifecycle behavior, device matrices, and real-device versus simulator/emulator evidence.
- `mobile/offline-sync-review`: offline mode, local cache, durable queues, sync APIs, conflicts, retries, idempotency, reconciliation, and network transition behavior.
- `mobile/webview-bridge`: WebView bridges, native-to-web messaging, deep links, embedded auth, uploads, downloads, and hybrid navigation.

Platform-specific details belong in references or project playbooks. The primary skills should work for Swift/iOS, Kotlin/Android, Expo, React Native, Flutter, and hybrid WebView apps without creating stack-first mobile skills.

## Data And Documentation Pack

Data and documentation skills separate pipeline reliability, reporting correctness, migration integrity, contract/lineage safety, data quality observability, instrumentation, retrieval pipelines, and durable project memory:

- `data/data-pipeline-review`: analytics pipelines, ETL, batch jobs, data contracts, dashboards, quality checks, freshness, ownership, and lineage.
- `data/analytics-reporting-review`: metric definitions, KPI ownership, dashboard/report consistency, chart/table checks, segmentation, caveats, and reader handoff.
- `data/data-migration-integrity`: data migrations, backfills, warehouse transformations, reconciliation queries, idempotency, batching, rollback, and repair.
- `data/data-contract-lineage-review`: dataset contracts, source-of-truth ownership, grain/schema changes, lineage, freshness targets, retention, caveats, and consumer impact.
- `data/data-quality-observability`: null/duplicate/orphan/range/freshness checks, anomaly detection, alert thresholds, quarantine, repair paths, and data incident handoff.
- `data/analytics-instrumentation-review`: tracking plans, event schemas, identity grain, funnels, cohorts, experiments, attribution, consent, and downstream metric impact.
- `data/knowledge-retrieval-pipeline-review`: document ingestion, parsing, chunking, metadata, embeddings/vector stores, retrieval evaluation, citations, access control, and stale indexes.
- `data/knowledge-source-registry`: source owner, status, freshness, credential boundary, locator shape, search/browse mode, evidence envelope, and promotion policy.
- `project/project-doc-system`: `.ai-playbook` maps, runbooks, decisions, plans, worklogs, archives, and project-memory hygiene.
- `project/adr-spec-handoff`: ADRs, specs, milestone outcomes, implementation handoffs, reviewed evidence, and durable memory promotion.
- `project/requirements-prd-scope-review`: PRDs, lightweight specs, scope briefs, non-goals, acceptance criteria, assumptions, and open-question lists.
- `project/issue-planning-triage`: issue/task breakdown, triage, priority, dependencies, blocked status, ownership, and verification planning.
- `project/release-notes-changelog`: user-facing release notes, internal changelogs, migration/upgrade notes, rollback notes, known issues, and verified change summaries.
- `project/documentation-artifact-package`: stakeholder packages, developer handoffs, runbook/report bundles, knowledge-base artifacts, source evidence, and maintenance rules.

Generated runtime reports should not be promoted into `memory/` without review. Reporting, migration, and handoff skills should preserve source evidence while keeping private paths, credentials, branch names, PR numbers, and noisy reference names out of public documentation.

## Validation

The catalog command reports duplicate skill names, wrapper routing gaps, missing wrapper references, and category drift:

```bash
ai-playbook catalog check --json
```
