# AI Agent Playbook v2 Package And Connector Governance Plan

> **For implementers:** Continue after testing/QA delivery pack expansion. This plan covers the next high-signal reference pattern: package/release artifact governance, license/notice evidence, and connector/integration safety.

**Goal:** Add capability-first guidance for package publishing, compliance evidence, and connector changes without duplicating the existing supply-chain skill or making vendor-specific primary skills.

**Reference inputs:** The refreshed local reference inventory shows broad recurring signals for compliance, package metadata, release dry-runs, connector manifests, MCP surfaces, credential handling, and test evidence. Adopt the patterns as local skills, workflow contracts, prompts, and validators. Do not copy upstream prose, project names, personal paths, internal URLs, credentials, branch names, PR numbers, or large excerpts into public docs.

## Baseline

- Skill catalog contains 51 skills after the testing/QA delivery pack.
- `security/dependency-supply-chain-review` already covers dependency, lockfile, SBOM, license, provenance, container, and CVE review.
- `devops/deployment-release-check` covers deployment gates and rollback readiness.
- MCP prompts cover deployment, frontend quality, data integrity, and ADR/spec handoff review.
- Workflow run scaffold exists for creating bounded run records under `.ai-agent-playbook/workflows/runs/`.

## Reference-Derived Rules To Adopt

- **Separate package contents from dependency risk:** A dependency audit is not enough; shipped artifacts need file inclusion, metadata, version, generated asset, and registry dry-run checks.
- **Treat compliance evidence as evidence:** License and notice notes should name policy, source, artifact, exception owner, and review date rather than broad reassurance.
- **Connector changes are runtime contracts:** Credentials, permissions, registration metadata, retry behavior, pagination, rate limits, webhooks, and error wrapping are part of the public integration contract.
- **No vendor-first primary skill:** Platform-specific package, connector, or marketplace details belong in references, profiles, or local project docs.
- **No hidden network or writes:** Default review skills and MCP prompts stay read-only. Publishing, registry access, token checks, and artifact writes require explicit project commands and user intent.

## Workstream A: Package Release Governance

### Task A1: Package Publish Readiness Skill

**Skill:** `devops/package-publish-readiness`

**References:**

- `package-metadata-checks.md`
- `artifact-dry-run-checks.md`

**Coverage:**

- Package manager and registry detection without assuming npm.
- Version, changelog, files/include list, entrypoints, binary assets, platform packages, generated output, README, license, and notice presence.
- Dry-run pack/publish commands where the repository defines them.
- Provenance, signing, tag, dist-channel, and rollback notes when the project supports them.

### Task A2: Package Release Recipe

**Recipe:** `package-release-readiness`

**Purpose:** Multi-step run for packages, CLIs, plugins, libraries, and marketplace bundles.

**Acceptance:**

- Inputs, outputs, skills, tools, stop conditions, and verification are explicit.
- The recipe points to `package-publish-readiness`, `dependency-supply-chain-review`, `deployment-release-check`, and `test-verification-strategy`.
- Preview smoke tests include the new recipe.

## Workstream B: License And Notice Evidence

### Task B1: License Notice Review Skill

**Skill:** `security/license-notice-review`

**References:**

- `license-policy-evidence.md`
- `notice-attribution-checks.md`

**Coverage:**

- First-party license, third-party licenses, vendored code, generated artifacts, copied snippets, dual-license choices, and notice/attribution requirements.
- Repository policy vs artifact contents.
- Exceptions with owner, expiry or revisit condition, and redistribution scope.

### Task B2: Evidence Boundary

**Purpose:** Keep license/notice review portable and noise-free.

**Acceptance:**

- Do not paste full licenses or large third-party excerpts into skill docs.
- Do not infer legal approval; record evidence, risk, and unresolved policy questions.
- Public docs stay free of personal paths, internal URLs, customer names, and raw reference labels.

## Workstream C: Connector And Integration Safety

### Task C1: Connector Integration Change Skill

**Skill:** `backend/connector-integration-change`

**References:**

- `connector-contract-checks.md`
- `credential-webhook-error-handling.md`

**Coverage:**

- API connector, workflow node, MCP adapter, webhook, OAuth app, import/export bridge, sync job, and third-party integration changes.
- Credential references, scopes, secret handling, auth helper usage, pagination, rate limits, idempotency, retries, timeouts, and partial failure handling.
- Registration metadata, generated schemas, discoverability, and compatibility with host runtime conventions.

### Task C2: Connector Review Prompt

**Prompt:** `connector_integration_review`

**Purpose:** Route integration changes through connector, API contract, auth/access, supply-chain, and verification skills.

**Acceptance:**

- Required evidence includes affected connector files, credential/auth boundaries, contract examples, failure/retry behavior, and verification commands.
- Stop conditions include missing credential contract, widened permission scope without review, untested webhook lifecycle, or artifact registration drift.
- Prompt remains read-only and never suggests applying writes by default.

## Workstream D: Catalog, Docs, And Translation

### Task D1: Catalog And Public Docs

**Acceptance:**

- README skill list and category summaries include the new skills.
- `docs/classification.md` and `docs/skill-taxonomy-v2.md` document the package/compliance/connector map.
- Korean translations are updated in the same change.
- Skill count expectations are updated.

### Task D2: MCP And Workflow Docs

**Acceptance:**

- `docs/commands.md` and Korean translation list the new prompt when implemented.
- Workflow recipes and MCP prompts are covered by existing drift/smoke tests.

## Workstream E: Verification

Run after each implementation slice:

- `npm run check`
- `node --test --test-reporter=dot test/*.test.mjs`
- `.\scripts\validate-skills.ps1`
- `.\scripts\validate-translations.ps1`
- `.\scripts\validate-public-docs.ps1`
- `.\scripts\sync-skills.ps1 -WhatIf`
- `.\install.ps1 -SkipValidation -WhatIf`
- `.\update.ps1 -SkipValidation -WhatIf`
- `git diff --check`

## Suggested Order

1. Add and commit this plan.
2. Add package publish readiness, license notice review, and connector integration change skills with references and translations.
3. Update catalog/docs/tests and commit the skill pack.
4. Add `package-release-readiness` recipe with translation and smoke coverage.
5. Add `connector_integration_review` MCP prompt with prompt contract tests and docs.
6. Re-run full verification and choose the next pack from refreshed reference signals.

## Non-Goals

- No default registry login, publishing, network vulnerability lookup, telemetry, or marketplace sync.
- No legal advice or legal approval claims.
- No vendor-specific primary skills.
- No project source writes through MCP.
