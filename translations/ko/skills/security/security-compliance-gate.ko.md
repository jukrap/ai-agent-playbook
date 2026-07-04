---
name: security-compliance-gate
description: merge, release, publication, handoff 전 security 또는 compliance gate를 결정할 때 사용합니다.
---

# Security Compliance Gate

Merge, release, publication, handoff gate를 통과할 수 있는지 결정하기 위한 primary security skill입니다.

## Workflow

1. Artifact, audience, environment, data scope, trust boundary, 필요한 policy 또는 compliance evidence를 식별합니다.
2. 구현별 질문은 중복하지 말고 `security-review`, `auth-access-control`, `dependency-supply-chain-review`, `license-notice-review`로 라우팅합니다.
3. Finding을 `block`, `warn`, `document`로 분류하고, accepted risk에는 owner, expiry, compensating evidence, verification path를 기록합니다.
4. Gate 통과를 말하기 전에 public-doc hygiene, translation 또는 notice coverage, runtime evidence safety, 필요한 local scanner 또는 repository-defined check output을 검증합니다.

## Reference

block, warn, document, accepted-risk outcome을 기록하기 전에 `references/gate-severity-model.md`를 읽습니다.

security, dependency, license, runtime schema, locator, public documentation check를 연결할 때 `references/evidence-routing.md`를 읽습니다.
