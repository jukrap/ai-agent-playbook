---
name: security-compliance-gate
description: Use when deciding security or compliance gates before merge, release, publication, or handoff.
---

# Security Compliance Gate

Use this as the primary security skill for deciding whether a change can proceed through a merge, release, publication, or handoff gate.

## Workflow

1. Identify the artifact, audience, environment, data scope, trust boundary, and required policy or compliance evidence.
2. Route implementation-specific questions to `security-review`, `auth-access-control`, `dependency-supply-chain-review`, or `license-notice-review` instead of duplicating their checks.
3. Classify findings as `block`, `warn`, or `document`, and record the owner, expiry, compensating evidence, and verification path for any accepted risk.
4. Verify public-doc hygiene, translation or notice coverage, runtime evidence safety, and required local scanner or repository-defined check output before calling the gate passed.

## Reference

Read `references/gate-severity-model.md` before recording block, warn, document, or accepted-risk outcomes.

Read `references/evidence-routing.md` when connecting security, dependency, license, runtime schema, locator, or public documentation checks.
