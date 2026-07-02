# Security Compliance Gate Evidence Routing

## Route To Existing Skills

- Threat model, input validation, sensitive data flow, logging, transport, general security regression review에는 `security-review`를 사용합니다.
- Authentication, session, token, RBAC, tenant, scope, role, object-level authorization 변경에는 `auth-access-control`을 사용합니다.
- Dependency, lockfile, package script, SBOM, provenance, container, vulnerability remediation에는 `dependency-supply-chain-review`를 사용합니다.
- License policy, NOTICE file, attribution, vendored code, copied snippet, generated artifact, redistribution scope에는 `license-notice-review`를 사용합니다.
- Claim, handoff, release note가 나중에 다시 열어야 하는 evidence를 인용하면 `evidence-locator-integrity`를 사용합니다.

## Required Evidence

- Artifact scope: source revision, release candidate, package, image digest, build id, document package 또는 generated bundle.
- Gate scope: merge, release, publish, customer handoff, internal handoff, documentation publication 또는 compliance review.
- Source boundaries: local file, source registry, CI system, dependency scanner, license scanner, issue tracker, dashboard 또는 manual review.
- Verification commands: repository-defined scanner, `validate-public-docs`, `validate-translations`, `runtime schema-check`, `evidence locator-check`, catalog 또는 skill validation, 관련 test/build.
- Residual risk: owner, expiry, caveat, accepted-risk record, follow-up path.

## Evidence Hygiene

- Personal absolute path나 private URL 대신 target-relative path와 source registry id를 우선합니다.
- Generated report는 `.ai-playbook/runtime/` 아래에 두고, reviewed fact만 durable memory로 승격합니다.
- Credential, token-shaped example, private URL, 긴 log, personal path, customer data, internal incident detail을 public docs에 붙여 넣지 않습니다.
- Output에 private path나 environment detail이 있으면 raw scanner output 대신 bounded summary를 사용합니다.
- no secrets found, no affected routes found, no license obligations found 같은 absence claim에는 scan range를 포함합니다.

## Gate Checklist

- Public docs에 personal path, credential, internal URL, branch name, PR number, noisy reference label이 없습니다.
- 가능한 경우 runtime evidence가 known schema 또는 locator check를 통과합니다.
- Public source text가 바뀌면 translation 또는 NOTICE coverage도 갱신합니다.
- Auth/access-control-sensitive change에는 적용 가능한 경우 allowed, denied, expired, cross-tenant, direct-object-access evidence가 있습니다.
- Dependency/license change에는 적용 가능한 경우 lockfile, SBOM/provenance, scanner, redistribution evidence가 있습니다.
- Generated artifact와 package는 unrelated local file, test, private doc, raw reference material을 제외합니다.
