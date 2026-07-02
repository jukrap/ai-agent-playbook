---
name: security-review
description: Use when reviewing secrets, authentication, authorization, input validation, dependency risk, sensitive data flow, or threat-model changes.
---

# Security Review

Use this as the primary security skill for development-time risk review.

## Workflow

1. Define scope, assets, actors, trust boundaries, and sensitive data.
2. Check authn, authz, input validation, output encoding, secrets, logging, transport, and dependency exposure.
3. Prefer concrete exploit paths and regression tests over generic warnings.
4. Record risk level, mitigation, residual risk, and verification evidence.

