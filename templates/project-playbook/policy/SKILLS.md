# Project Skill Policy

Use this file when a project wants portable guidance for selecting agent skills. Keep it small and adapt it to the project before committing or sharing the project playbook.

## Default rule

- Use the fewest skills that clearly apply to the current task.
- Let the repository, current user instruction, and actual code override generic skill advice.
- Announce selected skills briefly so the user can see which working rules are active.
- Do not load every installed skill just because it exists.

## Process skills

External process skill packs can be useful for planning, debugging, TDD, triage, architecture review, issue slicing, and handoff work. Treat them as optional helpers unless this project explicitly requires them.

Use process skills before project guardrail skills when the task is about how to work, then use the smallest project-specific skill or doc that constrains the repository.

## Project guardrail skills

Use installed playbook skills for recurring repository concerns:

- `project-bootstrap`: setting up a thin root agent bootstrap and `.ai-playbook/`.
- `repo-onboarding`: entering an unfamiliar or stale repository.
- `project-doc-system`: organizing `AGENTS.md`, `.ai-playbook/`, maps, runbooks, plans, and worklogs.
- `natural-writing-humanization`: writing or translating README text, docs, PR bodies, release notes, public summaries, or Korean/English prose.
- `git-worklog-guardrails`: staging, committing, pushing, PR bodies, or worklogs.
- `pre-action-fact-gate`: checking facts, source locators, write risk, and rollback before high-impact actions.
- `change-safety` or `review-work-light`: reviewing recent implementation work before handoff.
- `cleanup-ai-slop`: cleaning low-trust code in a bounded behavior-preserving way.

## Capability routing

Prefer capability-first skills before stack-name skills:

- Foundation and docs: `project-bootstrap`, `repo-onboarding`, `project-doc-system`, `documentation-artifact-package`, `natural-writing-humanization`, `adr-spec-handoff`.
- Delivery and quality gates: `git-worklog-guardrails`, `ci-quality-gate`, `ci-failure-triage`, `flaky-test-triage`, `eval-harness-design`, `capability-witness-history`.
- Architecture: `boundary-review`, `feature-slice-boundary`, `domain-model-change`, `monorepo-package-boundary`.
- Frontend and design implementation: `style-policy-selection`, `frontend-ui-polish`, `frontend-state-data-flow`, `frontend-accessibility-review`, `browser-dom-change`, `design-system-handoff`.
- Design direction and source handoff: `design-brief-direction`, `brand-identity-system`, `design-reference-analysis`, `image-to-code-handoff`.
- Interactive and 3D surfaces: `interactive-media-3d-review` plus frontend quality skills for rendered verification.
- Backend and integrations: `backend-change-safety`, `api-contract-boundary`, `request-validation-error-contract`, `job-worker-reliability`, `server-rendered-change`, `connector-integration-change`.
- Database and data: `database-change-safety`, `schema-migration-plan`, `query-performance-review`, `data-integrity-constraints`, `data-pipeline-review`, `data-contract-lineage-review`.
- DevOps and release: `container-change-safety`, `deployment-release-check`, `package-publish-readiness`, `observability-incident-triage`.
- Security and compliance: `security-review`, `auth-access-control`, `dependency-supply-chain-review`, `license-notice-review`, `security-compliance-gate`.
- Mobile: `native-release-readiness`, `device-permission-qa`, `offline-sync-review`.
- AI harness: `mcp-server-design`, `agent-skill-authoring`, `skill-pack-governance`, `context-engineering-memory-design`, `runtime-index-cache-design`, `agent-orchestration-handoff`.
- Legacy compatibility: use `legacy-change-safety` first, then stack wrappers such as `legacy-java-spring-mvc`, `legacy-php-lamp`, `legacy-dotnet-webforms`, `legacy-jquery-web`, or `legacy-android-webview-hybrid` only when that stack detail matters.

## MCP-aware use

When an AI app has the playbook MCP server available, prefer read-only discovery before editing:

- Read resources: `ai-playbook://capabilities`, `ai-playbook://skills`, `ai-playbook://workflows`, `ai-playbook://adapters`, `ai-playbook://playbook-layout`, and `ai-playbook://mcp-permission-model`.
- Use catalog and layout tools to choose skills, recipes, and playbook files.
- Use `operator_context`, `operator_search`, `index_search`, `operator_preflight`, `write_gate_preview`, and domain-specific tools before broad edits or when the relevant `.ai-playbook/` context is unclear.
- Use `writing_naturalness_check` with `engine: "auto"` and the `natural_writing_review` prompt when reviewing README text, docs, translations, PR bodies, release notes, or reader-facing summaries.
- Do not assume write-capable MCP tools exist. They require `mcp --enable-write-tools` and an explicit tool-call `apply: true`.
- Do not treat runtime reports, indexes, screenshots, or graph hints as trusted memory until reviewed and promoted.

## Structural evidence

Repository audit or structural evidence tools can help when a repository-wide structural claim needs machine evidence. Use them only when installed and appropriate for the stack.

- Prefer a full audit for first checkups, stale baselines, major refactors, or due diligence.
- Prefer quick follow-up checks after a fresh baseline for small localized questions.
- Do not claim absence, duplicate structure, dead exports, cycles, or cleanup counts without stating scan range and freshness.
- Do not assume automatic before-write or after-write gates are active unless this project has installed and chosen that workflow.

## Compatibility

Do not assume another agent runtime's hooks, slash commands, or plugin environment variables work here. If a skill or tool was written for another agent, translate its intent into supported commands and repository-local rules.

If this project later enables runtime hooks, keep them optional and documented. Hooks may remind or inject context, but the durable rule must still live in `AGENTS.md`, `.ai-playbook/`, or project docs.

## When to write project docs instead of a skill

- Put only the root entrypoint in `AGENTS.md`; put standing skill policy here and longer project instructions in `.ai-playbook/` docs.
- Put product scope in product/spec docs.
- Put milestones in planning docs.
- Put project memory under `.ai-playbook/`.
- Create or install a skill only when the behavior is reusable across projects.
