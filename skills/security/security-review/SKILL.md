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

## Reference

Read `references/security-review-protocol.md` for risk classification, data-flow review, evidence, and mitigation notes.

Read `references/threat-model-data-exposure.md` when sensitive data, tenant boundaries, exports, logs, cache, analytics, or AI/tool context may expose information.

Read `references/secrets-credential-boundary.md` when credentials, API keys, tokens, env vars, OAuth apps, CI secrets, or provider configs are touched.

Read `references/agent-tool-threats.md` when the system involves AI agents, MCP/tools, prompt injection, untrusted content, memory, local config, or external communication.
