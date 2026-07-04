# AI Agent Playbook v2 Reference Adoption Plan

## Status

AI Agent Playbook v1 introduced the v2 playbook layout, capability taxonomy, workflow recipes, runtime file inventory, read-only MCP catalog/search tools, and a preview-only write gate.

The first review found two issues that should be fixed before expanding the surface:

- The write gate treated any path segment named `runtime` as generated output, which could block ordinary project source such as `src/runtime/index.ts`.
- The database primary skill used the global name `change-safety`, which was too broad for installed skill environments and could collide with existing compatibility skills.

## Reference Sweep

The local reference collection is large enough that adoption must be indexed and staged rather than copied directly. The first sweep covered top-level project shape, package/config files, README/AGENTS/SKILL surfaces, and selected reference-heavy skill examples.

Observed reusable patterns:

- Thin trigger skills route to deeper reference files instead of embedding every procedure in the trigger surface.
- Some tools model code changes as transactions with pre-write advisory artifacts and post-write delta checks.
- Repository fact systems separate generated reports from promoted canonical facts, then check promoted facts for drift.
- Graph/index systems use explicit extraction schemas, confidence labels, and security validation before producing reports.
- Connector-heavy systems keep source-specific reference files separate from generic search/read workflows.
- Mature harnesses treat commands, hooks, agents, skills, MCP tools, and validation as one coordinated surface.
- Security-focused references repeat prompt-defense and input-sanitization baselines across specialized agents.

Adoption rule: import patterns and contracts, not noisy upstream branding or raw copied text. If a reference inspires a reusable feature, record the resulting local decision in a plan, reference note, or validator.

## Direction

AI Agent Playbook v2 should move from "layout plus catalogs" to "evidence-backed operating system":

- Every structural claim should state the scan range or artifact that supports it.
- Runtime reports stay generated and local by default.
- Human-trusted memory is promoted deliberately from reviewed artifacts.
- MCP remains read-only by default; any write surface requires explicit enablement, dry-run data, target validation, and an audit record.
- Skill names remain globally meaningful even when category paths are flattened by an installer.
- Reference packs grow by capability and problem type first, with stack details in profiles.

## Workstreams

### 1. Reference Adoption Ledger

Create a compact local ledger for local reference analysis:

- project id, domain, useful surfaces, adoption candidate, rejected noise, risk notes
- no personal absolute paths
- no raw large upstream excerpts
- clear status: `new`, `reviewed`, `adopted`, `rejected`, `deferred`

Acceptance:

- A validator rejects personal paths and oversized excerpts in public docs.
- The ledger can be summarized by capability category.

### 2. Transaction Write Gate v2

Extend the current preview-only write gate into a transaction model:

- pre-write advisory with invocation id, intent, scan range, candidates, blockers, warnings
- post-write check that reads the matching advisory instead of a moving latest pointer
- delta checks for unexpected new files, changed generated output, new unsafe casts or escape hatches where detectable
- machine-readable artifact manifest under `.ai-playbook/runtime/reports`

Acceptance:

- Pre-write is read-only and stable.
- Post-write reports `unknown` when the matching advisory is absent.
- Generated runtime files are blocked only under playbook runtime paths.

### 3. Canon Promotion and Drift

Add a deliberate path from generated facts to trusted memory:

- draft facts from runtime indexes/reports
- human or explicit command promotion into `memory/maps`, `memory/contracts`, or `knowledge/references`
- drift check that compares promoted memory with fresh runtime reports
- promotion notes in `memory/decisions`

Acceptance:

- No runtime report is copied into memory automatically.
- Drift output names missing, stale, changed, and unverified sources separately.

### 4. Index and Graph v2

Expand the runtime index beyond file inventory:

- doc/source registry
- skill/capability registry snapshot
- symbol/function outline
- route/API/data map hints
- duplicate/clone cues
- dependency and ownership graph draft

Acceptance:

- Each index has a schema version and confidence/source fields.
- Graph and report artifacts stay under `runtime/` until promoted.
- No embedding provider is required by default.

### 5. Capability Pack Expansion

Add broad development coverage without returning to stack-first taxonomy:

- backend reviewers/resolvers: Java, Kotlin, Go, Python, Node, .NET, PHP
- frontend and design: visual QA, accessibility, design tokens, state/data flows
- database/data: migration safety, query performance, BI/reporting, ETL
- devops: container, deployment, CI, observability, release
- security: threat modeling, dependency/CVE review, secrets, authz
- mobile: Expo/RN, native, WebView, release QA
- documentation/project management: specs, ADRs, handoffs, onboarding
- 3D/media/tooling: Three.js, canvas, presentation/report packages

Acceptance:

- Each primary skill has a globally meaningful name.
- Stack-specific material lives in `references/stacks` or equivalent profiles.
- Compatibility wrappers remain short and route to primary skills.

### 6. MCP v2 Surface

Grow MCP as resources, prompts, and tools:

- resources: catalogs, layout, index status, workflow recipes, recent reports
- prompts: onboarding, pre-write, post-write, canon promotion, security audit
- tools: read-only search/status first, opt-in scaffold/write second

Acceptance:

- Write tools are hidden or disabled unless explicitly enabled.
- Every write-capable tool requires `apply: true`, target validation, dry-run operations, and audit output.

### 7. Workflow Runs

Make workflow execution visible:

- run manifest with recipe id, inputs, selected skills, commands, artifacts, blockers, verification
- handoff files for long tasks and resumed sessions
- run summaries promoted to worklogs only after review

Acceptance:

- A workflow run can be inspected without reading the whole conversation.
- Worklogs distinguish completed facts from open risks.

## First Implementation Batch

1. Keep the v1 review fixes in place and cover them with tests.
2. Add a reference-adoption ledger template and validator.
3. Add a `reference inventory` CLI preview command for local reference collection directories.
4. Add transaction ids to write-gate preview artifacts without enabling project writes.
5. Add canon draft/check docs and a small runtime-to-memory promotion recipe.
6. Add the next primary skill pack for language/backend/database/security review, using wrappers only where compatibility requires them.
7. Extend MCP resources/prompts to expose the new read-only artifacts.

## Verification

Required after each batch:

- `npm run check`
- `npm test`
- `.\scripts\validate-skills.ps1`
- `.\scripts\validate-translations.ps1`
- `.\scripts\sync-skills.ps1 -WhatIf`
- targeted tests for changed CLI/MCP/validator behavior

## Non-goals For This Batch

- No default network indexing.
- No default embedding provider.
- No automatic project code editing through MCP.
- No raw copy of large upstream references into public docs.
- No public docs containing personal absolute paths, credentials, internal URLs, branch names, or PR numbers.
