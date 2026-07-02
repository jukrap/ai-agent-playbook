# Classification

This repository separates runtime CLI code, installable skills, copyable templates, examples, docs, and adapters.

## Why not keep everything under one agent

The content is not agent-specific. Codex is one installation target. The source should stay agent-agnostic, with agent-specific setup in `adapters/`.

## Skill categories

- `skills/ai-harness`: MCP, skill, agent, context, cache, index, and harness design workflows.
- `skills/architecture`: boundary, feature slice, domain model, monorepo/package ownership, dependency direction, and coupling review workflows.
- `skills/backend`: API contract, backend change safety, connector, server-rendered flow, worker, and integration workflows.
- `skills/data`: analytics pipeline, ETL, reporting, data contract, and quality workflows.
- `skills/database`: schema, migration, SQL, reporting query, and data integrity workflows.
- `skills/delivery`: planning, verification, testing, Git, PR, release note, and worklog workflows.
- `skills/devops`: CI/CD, container, package release, deployment, rollback, and operations triage workflows.
- `skills/frontend`: UI, browser behavior, state/data, accessibility, and visual QA workflows.
- `skills/git`: commit, PR, push, and worklog guardrails.
- `skills/legacy`: maintenance workflows where runtime coupling and compatibility dominate.
- `skills/meta`: skill-authoring and repository-maintenance skills.
- `skills/mobile`: native release, permission, offline sync, hybrid, WebView, and device QA workflows.
- `skills/project`: project bootstrap, onboarding, and project-memory maintenance.
- `skills/quality`: UI style policy, visual quality, cleanup, and lightweight review workflows.
- `skills/security`: authentication, authorization, dependency supply chain, license/notice evidence, security review, and risk workflows.

Add a new category only when the first real skill in that category exists. When a new category or skill changes this map, update `README.md`, this file, Korean translations, and installed skill copies through `docs/maintenance.md`.

## Runtime category

- `bin/ai-playbook.mjs`: CLI entrypoint.
- `src/`: dependency-free Node runtime implementation.
- `test/`: Node test coverage for bootstrap, doctor, context, guide checks, path migration, adapter hooks, adapter readiness, lifecycle reminders, plan, and worklog commands.

The runtime applies templates and creates scaffold files. It must not encode private project facts or replace the installable skills.

Optional hook or plugin experiments belong in a clearly separated adapter or experimental package until they have a stable contract. They may call the core CLI contracts, but they must not become required for the default document and CLI harness or the only place where project policy exists.

## Template categories

- `templates/agents`: thin root `AGENTS.md` bootstrap files and stack-specific profiles.
- `templates/codex-home`: optional personal Codex home guidance for `~/.codex/AGENTS.md`; it is not copied into target repositories by the runtime.
- `templates/project-playbook`: copyable project-memory template that becomes `.ai-playbook/` in target repositories, including internal `SKILLS.md` and `GIT.md` policy files.

Keep the target project root small. The runtime writes only a thin root `AGENTS.md` bootstrap by default; skill and Git policy belong under `.ai-playbook/`.

## Process skill compatibility

This repository does not replace external process skill packs. Use `docs/superpowers-integration.md` to decide how process skills and playbook skills should be combined.

Use `docs/runtime-roadmap.md` when deciding whether a runtime hook layer should remain a local experiment, become an adapter, or be promoted into documented CLI behavior.

## Project-memory map

- `project-bootstrap`: sets up root policies and an `.ai-playbook/` layout after inspecting the repository.
- `repo-onboarding`: reads repo state and existing `.ai-playbook/` context before planning or editing.
- `project-doc-system`: organizes `.ai-playbook/`, maps, runbooks, decisions, plans, worklogs, and archived notes.
- `adr-spec-handoff`: promotes reviewed decisions, specs, milestone outcomes, worklogs, and handoffs into durable project memory.

## Delivery and verification map

- `git-worklog-guardrails`: handles staging, commits, PR text, release notes, and worklogs.
- `test-verification-strategy`: maps change risk to unit, integration, contract, E2E, visual, migration, smoke, manual, or monitor-based checks.
- `flaky-test-triage`: diagnoses nondeterministic, timing-dependent, order-dependent, environment-sensitive, or intermittent test failures.
- `test-fixture-data-design`: designs fixtures, factories, mocks, seeds, snapshots, golden files, sample payloads, and test data boundaries.

## Backend and integration map

- `api-contract-boundary`: reviews frontend/backend contracts, DTOs, payloads, mocks, and adapters.
- `backend-change-safety`: reviews services, modules, jobs, workers, queues, config, integrations, and server-side business logic.
- `connector-integration-change`: reviews API connectors, workflow nodes, MCP adapters, webhooks, OAuth apps, import/export bridges, sync jobs, registration metadata, and credential handling.
- `server-rendered-change`: reviews controllers, templates, sessions, forms, redirects, and server-rendered view contracts.

## Architecture map

- `boundary-review`: reviews broad architecture boundaries, dependency direction, public APIs, ownership, and cross-module coupling.
- `feature-slice-boundary`: reviews FSD, feature-sliced, vertical-slice, feature-first, route-level, module-level, and component-domain boundaries.
- `domain-model-change`: reviews domain entities, aggregates, value objects, services, policies, use cases, repositories, adapters, invariants, and transaction boundaries.
- `monorepo-package-boundary`: reviews monorepo packages, workspace dependencies, package exports, internal libraries, build graphs, generated types, and cross-package release impact.

## Quality map

- `ui-style-policy`: selects or documents the repository styling method across design system, CSS/classes, utility classes, or inline styles.
- `style-quality-review`: reviews visible UI quality while preserving product intent.
- `frontend-ui-polish`: implements or refines visible UI surfaces while preserving product intent and existing design conventions.
- `cleanup-ai-slop`: removes low-trust code noise in a behavior-preserving, bounded cleanup.
- `review-work-light`: reviews recent implementation work without turning review into an automatic blocking gate.

## DevOps map

- `ci-failure-triage`: diagnoses failing CI jobs, build pipelines, deployment checks, flaky tests, environment drift, and release automation failures.
- `container-change-safety`: reviews Dockerfile, image, Compose/Kubernetes, runtime config, healthcheck, volume, network, and containerized deployment changes.
- `deployment-release-check`: reviews release readiness, deploy gates, rollback paths, feature flags, artifacts, migrations, and post-deploy checks.
- `package-publish-readiness`: reviews package metadata, included files, entrypoints, binaries, generated bundles, registry dry-runs, provenance, and artifact rollback constraints.
- `observability-incident-triage`: triages active incidents, production alerts, logs, metrics, traces, latency, error rates, queues, jobs, and post-incident handoff.

## Security and compliance map

- `security-review`: reviews broad security risk, threat-model changes, sensitive data flow, input validation, and security regressions.
- `auth-access-control`: reviews authentication, sessions, OAuth/OIDC, JWTs, RBAC, tenants, scopes, roles, and object-level access.
- `dependency-supply-chain-review`: reviews dependencies, lockfiles, SBOMs, containers, provenance, vulnerable packages, package scripts, and CVE remediation.
- `license-notice-review`: reviews first-party licenses, third-party notices, attribution, vendored code, generated artifacts, copied snippets, dual-license choices, redistribution scope, and compliance evidence.

## Frontend map

- `browser-dom-change`: changes DOM-first behavior, jQuery flows, event handlers, selectors, forms, plugins, and script-loaded UI.
- `frontend-state-data-flow`: reviews state ownership, data fetching, server/client cache boundaries, optimistic updates, URL state, and stale UI behavior.
- `frontend-accessibility-review`: reviews keyboard access, focus management, semantics, forms, dialogs, menus, announcements, contrast, and accessible interaction states.
- `ui-polish`: refines visible UI, responsive layout, visual hierarchy, interaction feedback, and production polish.
- `visual-regression-qa`: checks screenshots, responsive breakpoints, overflow, clipping, visual diffs, text fit, canvas/media rendering, and browser-rendered regressions.

## Mobile map

- `native-release-readiness`: reviews mobile release artifacts, signing, provisioning, build channels, store distribution, and release-build cleanup.
- `device-permission-qa`: reviews runtime permissions, device capabilities, manifests, privacy prompts, lifecycle behavior, and real-device versus simulator/emulator evidence.
- `offline-sync-review`: reviews offline mode, local cache, durable queues, sync jobs, conflict handling, retries, idempotency, and network transition behavior.
- `webview-bridge`: reviews WebView bridges, native-to-web messaging, deep links, embedded auth, uploads, downloads, and hybrid navigation.

## Data map

- `data-pipeline-review`: reviews analytics pipelines, ETL, batch jobs, data contracts, dashboard sources, quality checks, freshness, and lineage.
- `analytics-reporting-review`: reviews metric definitions, KPI ownership, dashboard/report consistency, chart/table checks, segmentation, caveats, and reader handoff.
- `data-migration-integrity`: reviews data migrations, backfills, transformations, reconciliation queries, idempotency, batching, rollback, and repair.

## Skill authoring map

- `agent-skill-authoring`: reusable skill structure, trigger descriptions, references, and skill/template boundaries.

## Legacy expansion map

- `legacy-general`: default legacy maintenance discipline.
- `legacy-risk-check`: hidden blast-radius check before risky edits.
- `legacy-feature-addition`: adding behavior without rewriting the host system.
- `legacy-jquery-web`: jQuery/plugin/direct DOM browser pages.
- `legacy-server-rendered-web`: server templates, forms, sessions, validation.
- `legacy-android-webview-hybrid`: native shell plus WebView and bridge.
- `legacy-database-heavy-system`: stored procedures, triggers, direct SQL, DB-shaped business rules.
- `legacy-java-spring-mvc`: Spring MVC/JSP/MyBatis/Servlet/WAR systems.
- `legacy-dotnet-webforms`: ASP.NET Web Forms, ViewState, code-behind, IIS.
- `legacy-php-lamp`: PHP include/session/direct SQL pages.
- `legacy-ie-activex-compat`: IE mode, ActiveX, intranet browser/device constraints.
- `legacy-reporting-printing`: report, export, print, label, barcode, invoice flows.
- `legacy-batch-file-transfer`: scheduled batch, CSV/Excel/SFTP/file-drop integrations.
