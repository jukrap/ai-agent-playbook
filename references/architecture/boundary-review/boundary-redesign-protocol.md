# Boundary Redesign Protocol

Use this reference when a codebase may need architecture cleanup, FSD adoption, DDD/module reshaping, package boundary repair, or a larger directory restructure.

## First Pass

- Read the current architecture from code before applying a named pattern.
- Identify entrypoints, feature areas, domain concepts, shared utilities, data access, UI surfaces, build packages, and deployment boundaries.
- Compare docs to code. If they disagree, treat code and current tests as the operational truth, then record doc drift.
- Mark boundary evidence with paths: imports, public APIs, route ownership, database ownership, package manifests, and test fixtures.

## Pattern Fit

| Pattern | Use when | Avoid when |
|---|---|---|
| FSD | Frontend features, pages, entities, shared UI/lib boundaries are already partly visible or can be introduced slice by slice. | Backend-only code, tiny apps, or teams that do not want explicit frontend layers. |
| Layered architecture | Controller/service/repository/domain/infrastructure roles exist and coupling mainly violates direction. | Domain behavior is not stable enough to name layers clearly. |
| DDD modules | Business concepts, invariants, aggregates, and bounded contexts are central to the change. | The system is mostly CRUD, integration glue, or reporting without strong domain rules. |
| Monorepo packages | Ownership, build boundaries, release cadence, or dependency direction needs enforcement. | Package splits would only mirror folders without independent build/test value. |
| Legacy seam isolation | Risk comes from hard-to-change legacy code and compatibility boundaries matter more than clean new structure. | The team is actively replacing the legacy surface and can tolerate larger moves. |

## Redesign Decision

- Keep local pattern when the issue is one or two misplaced imports, helpers, or files.
- Repair a boundary when dependency direction is mostly right but one surface leaks data, UI, request state, or infrastructure detail.
- Introduce a named pattern when multiple changes will repeat the same boundary decision and the pattern can be documented in a small rule.
- Split packages only when the split gives ownership, release, build, test, dependency, or runtime isolation.
- Propose broad restructuring only when current coupling blocks delivery, testability, ownership, or safe rollout across multiple areas.

## Refactor Shape

- Prefer move-only or adapter-first commits before behavior changes.
- Keep public API shims or compatibility wrappers when existing callers are broad.
- Add boundary tests or import lint when the repository already has a lint/test place for architectural rules.
- Avoid creating shared utility dumping grounds. Promote shared code only when at least two real owners need the same stable behavior.
- Record new architecture rules in project docs, not only in the PR description.

## Verification

- Import/dependency check for the boundary under review.
- Existing unit/integration/build tests for moved or wrapped modules.
- Search for old paths, public imports, package names, and stale docs.
- Runtime smoke test for the primary entrypoint affected by the move.
- Worklog or ADR for broad restructures, with rollback path and unresolved tradeoffs.
