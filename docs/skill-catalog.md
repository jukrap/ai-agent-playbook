# Skill Catalog

This document is the long-form skill index. The install and sync source of truth is `skills/**/SKILL.md`; read [Capability taxonomy](capability-taxonomy.md) for category and compatibility wrapper policy.

Each `SKILL.md` stays short and trigger-focused. Longer procedures, examples, stack details, and reusable checklists belong in skill references.

## Project And Documentation

- `project-bootstrap`: use when setting up root agent guidance and `.ai-agent-playbook/` structure for a new or inherited project.
- `repo-onboarding`: use when inspecting an unfamiliar repository before planning architecture, tooling, edits, or workflow answers.
- `project-doc-system`: use when organizing `AGENTS.md`, `.ai-agent-playbook/`, maps, runbooks, decisions, plans, and worklogs.
- `adr-spec-handoff`: use when turning decisions, architecture constraints, specs, milestone results, or handoffs into durable memory.
- `requirements-prd-scope-review`: use when turning broad requests into PRDs, specs, scope boundaries, acceptance criteria, and open questions.
- `issue-planning-triage`: use when converting specs, bugs, review findings, worklogs, and follow-ups into scoped issues and task batches.
- `release-notes-changelog`: use when preparing release notes, internal changelogs, migration notes, rollback notes, and verified summaries.
- `documentation-artifact-package`: use when bundling docs, runbooks, diagrams, screenshots, reports, references, and evidence for handoff.
- `natural-writing-humanization`: use when editing Korean or English prose so it reads naturally while preserving facts, meaning, technical terms, and author intent.

## Delivery, Verification, And Git

- `git-worklog-guardrails`: use when staging, committing, pushing, preparing PR text, writing release notes, or recording worklogs.
- `test-verification-strategy`: use when planning or reviewing risk-based verification, test scope, coverage gaps, and release confidence.
- `ci-quality-gate`: use when deciding required, optional, skipped, or stale checks for merge and release gates.
- `ci-failure-triage`: use when diagnosing failed CI jobs, build pipelines, deployments, flaky tests, or environment drift.
- `flaky-test-triage`: use when reproducing, stabilizing, quarantining, or documenting nondeterministic tests.
- `test-fixture-data-design`: use when designing or repairing fixtures, factories, mocks, seeds, snapshots, golden files, and test data boundaries.
- `eval-harness-design`: use when designing agent, harness, workflow, MCP, prompt, grader, or release-gate evaluations.

## AI Harness

- `mcp-server-design`: use when designing MCP tools, resources, prompts, permission tiers, write gates, and cache/index surfaces.
- `context-engineering-memory-design`: use when designing agent instructions, context surfaces, prompt/cache budgets, project memory, compaction, or stale fact handling.
- `agent-orchestration-handoff`: use when coordinating agents, subagents, workers, review passes, or long-running handoffs with bounded contracts.
- `forge-automation-control`: use when coordinating or automating resumable work through GitHub or Gitea issues, pull requests, Actions, scheduled ticks, or local fallback runs.
- `skill-pack-governance`: use when managing skill packs, taxonomy categories, compatibility wrappers, reference routing, translations, and install/sync behavior.
- `runtime-index-cache-design`: use when designing runtime reports, indexes, graphs, caches, artifact schemas, invalidation, and canon promotion.
- `capability-witness-history`: use when managing capability witnesses, baseline comparisons, skipped/degraded status, and reliability history.
- `pre-action-fact-gate`: use before broad, destructive, owner-creating, or high-blast-radius actions that need facts and rollback paths.
- `evidence-locator-integrity`: use when checking claims, reports, citations, memory updates, or handoffs for locators, scan ranges, freshness, and confidence.

## Architecture

- `boundary-review`: use when reviewing FSD, layered architecture, DDD, monorepo, package ownership, dependency direction, or coupling boundaries.
- `feature-slice-boundary`: use when changing or reviewing feature-sliced, vertical-slice, route-level, module-level, or component-domain boundaries.
- `domain-model-change`: use when changing or reviewing entities, aggregates, value objects, services, policies, use cases, invariants, or transaction boundaries.
- `monorepo-package-boundary`: use when changing or reviewing workspace packages, exports, dependency graphs, generated types, and cross-package release impact.

## Backend And Integrations

- `api-contract-boundary`: use when implementing, debugging, or reviewing frontend/backend contracts, DTOs, mocks, payloads, and adapters.
- `backend-change-safety`: use when changing backend services, modules, workers, jobs, integrations, queues, config, or server-side business logic.
- `request-validation-error-contract`: use when changing request parsing, validation, error responses, exception mapping, or client-visible failure contracts.
- `job-worker-reliability`: use when changing jobs, workers, queues, schedulers, retries, dead-letter handling, replay, or long-running tasks.
- `connector-integration-change`: use when changing API connectors, workflow nodes, MCP adapters, webhooks, OAuth apps, sync jobs, or credential handling.
- `server-rendered-change`: use when changing controllers, templates, forms, sessions, redirects, validation, and server-rendered view contracts.

## Data And Database

- `data-pipeline-review`: use when reviewing analytics pipelines, ETL, batch jobs, data contracts, dashboards, and quality checks.
- `analytics-reporting-review`: use when reviewing metrics, dashboards, reports, KPI definitions, chart/table consistency, freshness, and caveats.
- `analytics-instrumentation-review`: use when reviewing tracking plans, event schemas, funnels, cohorts, experiments, consent, and metric impact.
- `data-migration-integrity`: use when handling migrations, backfills, warehouse transformations, reconciliation, idempotency, rollback, and repair.
- `data-contract-lineage-review`: use when reviewing dataset contracts, lineage, source-of-truth ownership, freshness targets, and downstream impact.
- `data-quality-observability`: use when designing or reviewing freshness alerts, anomaly detection, null/duplicate/orphan checks, quarantine, and repair.
- `knowledge-retrieval-pipeline-review`: use when reviewing document ingestion, parsing, chunking, metadata, retrieval quality, citations, and access control.
- `knowledge-source-registry`: use when managing source registries, locator contracts, freshness, credential boundaries, and promotion policy.
- `database-change-safety`: use when changing schema, migrations, SQL, reporting queries, stored procedures, or data integrity rules.
- `schema-migration-plan`: use when planning DDL, indexes, constraints, defaults, nullability, seeds, views, triggers, and expand/contract rollouts.
- `query-performance-review`: use when reviewing slow SQL, reporting/dashboard/API/export queries, joins, aggregates, pagination, scans, N+1 patterns, and index choices.
- `data-integrity-constraints`: use when changing uniqueness, foreign keys, checks, not-null rules, triggers, generated columns, repair scripts, or reconciliation queries.

## DevOps And Release

- `container-change-safety`: use when changing Dockerfiles, images, Compose/Kubernetes manifests, runtime config, healthchecks, volumes, or networks.
- `deployment-release-check`: use when preparing or reviewing releases, deploys, rollbacks, feature flags, artifacts, migration gates, and post-deploy checks.
- `package-publish-readiness`: use when preparing or reviewing package metadata, registry dry-runs, bundles, binaries, or marketplace distribution.
- `observability-incident-triage`: use when triaging incidents, production errors, alerts, latency, error rates, queue backlogs, logs, metrics, or traces.

## Design And Frontend

- `design-brief-direction`: use when turning vague product, page, brand, or UI requests into design direction and decision-ready briefs.
- `brand-identity-system`: use when defining or reviewing typography, color, logo usage, iconography, voice, and brand application rules.
- `design-reference-analysis`: use when analyzing screenshots, competitor sites, reference apps, visual samples, or design boards before UI work.
- `image-to-code-handoff`: use when turning images, screenshots, mockups, reference boards, or Figma frames into UI contracts.
- `frontend-ui-polish`: use when implementing or refining visible frontend surfaces while preserving product intent and local design conventions.
- `ui-polish`: use when working on visible UI, responsive layout, accessibility states, interaction feedback, and production polish.
- `style-policy-selection`: use when selecting or reconciling repository UI styling method before visible UI edits.
- `frontend-state-data-flow`: use when changing state ownership, server/client cache behavior, data fetching, optimistic updates, URL state, or stale UI bugs.
- `frontend-accessibility-review`: use when reviewing keyboard access, focus management, semantics, forms, dialogs, menus, announcements, and contrast.
- `browser-dom-change`: use when changing DOM behavior, jQuery flows, event handlers, selectors, forms, plugins, or script-loaded UI.
- `visual-regression-qa`: use when checking screenshots, responsive breakpoints, overflow, clipping, visual diffs, text fit, or canvas/media rendering.
- `interactive-media-3d-review`: use when implementing or reviewing Three.js, WebGL, canvas, SVG, charts, maps, animation, video, or media-heavy UI.
- `design-system-handoff`: use when turning Figma, brand, tokens, component libraries, themes, variants, or visual specs into maintainable frontend implementation.

## Mobile

- `native-release-readiness`: use when preparing or reviewing mobile releases, signing, provisioning, build channels, store distribution, artifacts, and cleanup.
- `device-permission-qa`: use when changing or verifying runtime permissions, device capabilities, manifests, privacy prompts, lifecycle behavior, and device/emulator QA.
- `offline-sync-review`: use when reviewing offline mode, local cache, durable queues, sync jobs, conflict resolution, retries, idempotency, and network transitions.
- `webview-bridge`: use when changing WebView bridges, native-to-web messaging, deep links, embedded auth, uploads, downloads, or hybrid navigation.

## Security And Compliance

- `security-review`: use when reviewing secrets, authentication, authorization, input validation, dependency risk, and sensitive data flow.
- `auth-access-control`: use when changing login, sessions, OAuth/OIDC, JWT, RBAC, permissions, roles, tenants, scopes, or object-level authorization.
- `dependency-supply-chain-review`: use when changing dependencies, lockfiles, SBOMs, licenses, containers, package scripts, provenance, or vulnerability remediation.
- `license-notice-review`: use when reviewing licenses, third-party notices, attribution, vendored code, generated artifacts, copied snippets, and redistribution scope.
- `security-compliance-gate`: use when deciding security or compliance gates before merge, release, publication, or handoff.

## Quality And Cleanup

- `ui-style-policy`: use as a compatibility trigger for older UI style policy prompts; primary route is `style-policy-selection`.
- `style-quality-review`: use when reviewing or improving UI styling, responsive behavior, layout overflow, and visual regression risk.
- `cleanup-ai-slop`: use when cleaning low-trust, overcomplicated, duplicated, or mechanically generated code without changing behavior.
- `review-work-light`: use when reviewing recent implementation work before handoff without starting a blocking review process.

## Legacy

- `legacy-change-safety`: use for compatibility-first legacy changes with hidden coupling or deployment risk.
- `legacy-general`: use when maintaining legacy code with unclear flow, hidden coupling, weak tests, or mixed documentation.
- `legacy-risk-check`: use before changes that may affect shared state, CSS/JS, selectors, templates, forms, APIs, builds, or deploys.
- `legacy-feature-addition`: use when adding behavior, screens, fields, rules, or integrations without rewriting the host system.
- `legacy-jquery-web`: use when maintaining jQuery, plugins, direct DOM manipulation, global scripts, AJAX callbacks, or script-order coupling.
- `legacy-server-rendered-web`: use when maintaining templates, controllers, form posts, server validation, sessions, layouts, and partials.
- `legacy-php-lamp`: use when maintaining PHP/LAMP pages with includes, sessions, mixed HTML/PHP, direct SQL, globals, or shared hosting limits.
- `legacy-android-webview-hybrid`: use when maintaining Android WebView apps with web assets, JavaScript bridges, permissions, or device APIs.
- `legacy-ie-activex-compat`: use when maintaining intranet systems that depend on IE mode, ActiveX, old browser APIs, or compatibility constraints.
- `legacy-java-spring-mvc`: use when maintaining Spring MVC, JSP, Servlet, MyBatis, WAR deployment, XML config, or server-rendered Java apps.
- `legacy-dotnet-webforms`: use when maintaining ASP.NET Web Forms, .NET Framework, code-behind, ViewState, Web.config, IIS, or old enterprise .NET apps.
- `legacy-database-heavy-system`: use when maintaining stored procedures, triggers, views, direct SQL, scheduled jobs, or database-shaped business rules.
- `legacy-reporting-printing`: use when maintaining reports, print preview, PDF/Excel export, labels, barcodes, invoices, or printer-specific flows.
- `legacy-batch-file-transfer`: use when maintaining scheduled batches, cron jobs, Windows Task Scheduler, CSV/Excel import/export, SFTP, or file drops.
