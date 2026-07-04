# FSD DDD Fit Matrix

Use this reference when choosing a boundary model for frontend, backend, full-stack, or monorepo code.

## Fit Matrix

| Approach | Strong fit | Weak fit | First safe move |
| --- | --- | --- | --- |
| Feature-Sliced Design | UI-heavy apps with pages, widgets, features, entities, shared UI/lib, and repeated cross-feature coupling. | Backend-only services, tiny apps, or apps without stable feature boundaries. | Define public imports for one feature or shared layer. |
| Layered architecture | Controllers, services, repositories, adapters, and infrastructure already exist but dependency direction leaks. | Domain behavior is unclear or layers would be artificial names. | Move request/session concerns out of lower layers. |
| DDD modules | Business invariants, aggregates, policies, and bounded contexts drive change risk. | CRUD/reporting/integration glue without durable domain language. | Name one aggregate or policy boundary and protect its invariants. |
| Modular monolith | One deployable app needs internal ownership, dependency rules, and future extraction optionality. | Package split is only aesthetic or build tooling cannot enforce it. | Create module entrypoints and forbid deep imports. |
| Monorepo packages | Independent build/test/release ownership matters. | Shared code would become a dumping ground. | Add package exports and dependency direction checks. |
| Legacy seam | Compatibility and hidden coupling dominate the risk. | Rewrite is already planned and safe to scope separately. | Add adapter/shim around the risky surface before behavior change. |

## Decision Rules

- Start from evidence in imports, entrypoints, package manifests, routes, tests, and runtime ownership.
- Pick the smallest boundary model that prevents the next likely regression.
- Do not apply FSD to backend code just because the organization uses FSD elsewhere.
- Do not apply DDD names unless the business language is stable enough to protect invariants.
- Prefer documented public APIs over folder naming alone.

## Output

- Chosen boundary model and why other models were not selected.
- Directories or modules covered by the decision.
- Allowed imports, forbidden imports, and exception path.
- Verification command or search that can detect boundary drift.
