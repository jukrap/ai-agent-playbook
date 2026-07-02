# Security Compliance Gate Evidence Routing

## Route To Existing Skills

- Use `security-review` for threat model, input validation, sensitive data flow, logging, transport, and general security regression review.
- Use `auth-access-control` for authentication, session, token, RBAC, tenant, scope, role, and object-level authorization changes.
- Use `dependency-supply-chain-review` for dependencies, lockfiles, package scripts, SBOMs, provenance, containers, and vulnerability remediation.
- Use `license-notice-review` for license policy, NOTICE files, attribution, vendored code, copied snippets, generated artifacts, and redistribution scope.
- Use `evidence-locator-integrity` when claims, handoffs, or release notes cite evidence that must be reopened later.

## Required Evidence

- Artifact scope: source revision, release candidate, package, image digest, build id, document package, or generated bundle.
- Gate scope: merge, release, publish, customer handoff, internal handoff, documentation publication, or compliance review.
- Source boundaries: local file, source registry, CI system, dependency scanner, license scanner, issue tracker, dashboard, or manual review.
- Verification commands: repository-defined scanner, `validate-public-docs`, `validate-translations`, `runtime schema-check`, `evidence locator-check`, catalog or skill validation, and relevant tests/builds.
- Residual risk: owner, expiry, caveat, accepted-risk record, and follow-up path.

## Evidence Hygiene

- Prefer target-relative paths and source registry ids over personal absolute paths or private URLs.
- Keep generated reports under `.ai-playbook/runtime/` and promote only reviewed facts into durable memory.
- Do not paste credentials, token-shaped examples, private URLs, long logs, personal paths, customer data, or internal incident details into public docs.
- Use bounded summaries instead of raw scanner output when the output contains private paths or environment details.
- Include scan range for absence claims such as no secrets found, no affected routes found, or no license obligations found.

## Gate Checklist

- Public docs contain no personal paths, credentials, internal URLs, branch names, PR numbers, or noisy reference labels.
- Runtime evidence validates against known schema or locator checks when available.
- Translation or NOTICE coverage is updated when public source text changes.
- Auth/access-control-sensitive changes have allowed, denied, expired, cross-tenant, and direct-object-access evidence when applicable.
- Dependency/license changes have lockfile, SBOM/provenance, scanner, and redistribution evidence when applicable.
- Generated artifacts and packages exclude unrelated local files, tests, private docs, and raw reference material.
