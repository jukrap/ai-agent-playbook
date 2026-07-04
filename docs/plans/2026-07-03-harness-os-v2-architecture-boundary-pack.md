# AI Agent Playbook v2 Architecture Boundary Pack Plan

> **For implementers:** Continue after the mobile hardening pack. This plan covers the next weak catalog surface: architecture currently has one broad boundary review skill and no dedicated skills for feature slicing, domain modeling, or monorepo/package ownership.

**Goal:** Add capability-first architecture guidance for feature-sliced/FSD boundaries, domain model change, and monorepo/package boundaries without forcing one architecture style on every repository.

**Reference inputs:** The refreshed local reference inventory shows recurring patterns around clean/layered architecture, domain boundaries, module isolation, package exports, dependency direction, workflow graph validation, and trust-boundary thinking. Adopt those patterns as local skills and references. Do not copy upstream prose, project names, personal paths, internal URLs, credentials, branch names, PR numbers, or large excerpts into public docs.

## Baseline

- Skill catalog contains 57 skills after the mobile hardening pack.
- The `architecture` category currently has only `architecture/boundary-review`.
- Existing backend, frontend, and legacy skills mention boundaries, but architecture-specific evidence is not split by problem type.
- No MCP prompt or workflow recipe currently targets architecture review as a first-class workflow.

## Reference-Derived Rules To Adopt

- **Do not force an architecture:** FSD, layered architecture, clean architecture, DDD, hexagonal, vertical slice, and feature-first layouts are choices to verify against project evidence, not defaults to impose.
- **Separate boundary types:** Feature/slice boundaries, domain model boundaries, package/workspace boundaries, and runtime trust boundaries fail in different ways and need separate checklists.
- **Prefer dependency direction over folder names:** A folder named `domain`, `entity`, `feature`, or `shared` is not proof that ownership or dependency rules are correct.
- **Public APIs matter:** Index/barrel files, package exports, shared modules, generated schemas, and adapter interfaces define the usable boundary.
- **Architecture review should produce evidence:** The output should name affected modules, allowed dependencies, coupling risks, migration or compatibility paths, and verification commands.

## Workstream A: Feature Slice Boundaries

### Task A1: Feature Slice Boundary Skill

**Skill:** `architecture/feature-slice-boundary`

**References:**

- `feature-slice-layering.md`
- `slice-public-api-checks.md`

**Coverage:**

- FSD, vertical slice, feature-first, route-level, module-level, or component-domain slice changes.
- Layer ownership, imports, shared/common usage, public API files, cross-slice coupling, UI/state/API boundary, and test placement.
- Migration from stack-first or page-first structure without broad rewrites.

## Workstream B: Domain Model Changes

### Task B1: Domain Model Change Skill

**Skill:** `architecture/domain-model-change`

**References:**

- `domain-modeling-boundaries.md`
- `application-domain-infrastructure.md`

**Coverage:**

- Domain entity, aggregate, value object, service, policy, workflow, use case, command/query, repository, and adapter changes.
- DDD, clean architecture, hexagonal architecture, layered architecture, and simpler service/module designs.
- Persistence leakage, DTO/domain confusion, transaction boundary, invariant ownership, and event/message boundaries.

## Workstream C: Monorepo And Package Boundaries

### Task C1: Monorepo Package Boundary Skill

**Skill:** `architecture/monorepo-package-boundary`

**References:**

- `package-ownership-dependency-direction.md`
- `workspace-release-impact.md`

**Coverage:**

- Workspace packages, internal libraries, package exports, dependency graph, build graph, generated types, versioning, and release impact.
- Cross-package imports, circular dependencies, public/private APIs, package manager workspaces, and affected-test selection.
- Compatibility with package publishing and connector changes.

## Workstream D: Docs, Tests, And Follow-Up Surfaces

### Task D1: Catalog And Docs

**Acceptance:**

- README skill list and category summaries include the new architecture skills.
- `docs/classification.md` and `docs/skill-taxonomy-v2.md` document the architecture boundary map.
- Korean translations are updated in the same change.
- Skill count expectations are updated from 57 to 60.

### Task D2: Follow-Up Workflow And Prompt

**Candidate workflow:** `architecture-boundary-review`

**Candidate prompt:** `architecture_boundary_review`

**Acceptance for a later slice:**

- Workflow preview names inputs, outputs, skills, tools, stop conditions, and verification.
- Prompt remains read-only and routes through `workflow_run_preview`, `symbol_outline`, `operator_search`, `dependency_inventory`, and `write_gate_preview`.

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
2. Add `feature-slice-boundary`, `domain-model-change`, and `monorepo-package-boundary` skills with references and translations.
3. Update catalog docs and skill-count tests, then commit the architecture skill pack.
4. Add `architecture-boundary-review` workflow recipe and smoke coverage.
5. Add `architecture_boundary_review` MCP prompt and prompt contract tests.
6. Re-run full verification and select the next weak surface, likely database depth or AI-harness extension governance.

## Non-Goals

- No mandatory FSD, DDD, clean architecture, or monorepo migration.
- No broad folder reshuffle without local project evidence.
- No automated dependency graph rewrite.
- No project source writes through MCP.
