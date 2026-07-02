---
name: security-review
description: Use when reviewing secrets, authentication, authorization, input validation, dependency risk, sensitive data flow, or threat-model changes.
---

# Security Review

개발 중 risk review를 위한 primary security skill입니다.

## Workflow

1. scope, asset, actor, trust boundary, sensitive data를 정의합니다.
2. authn, authz, input validation, output encoding, secret, logging, transport, dependency exposure를 확인합니다.
3. 일반 경고보다 구체적인 exploit path와 regression test를 우선합니다.
4. risk level, mitigation, residual risk, verification evidence를 기록합니다.

