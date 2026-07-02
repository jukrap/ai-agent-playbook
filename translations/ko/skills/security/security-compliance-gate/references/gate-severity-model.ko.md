# Security Compliance Gate Severity Model

## Decision States

- `pass`: required evidence가 최신이고 named artifact에 scoped되어 있으며 blocking finding이 남아 있지 않습니다.
- `block`: finding을 해결하거나 owner가 formal accepted risk로 남기기 전에는 merge, release, publish, handoff를 진행하지 않습니다.
- `warn`: finding은 관련 있지만 current gate를 막지 않습니다. Caveat와 follow-up owner를 기록합니다.
- `document`: gate action은 필요 없지만 release note, handoff note, policy evidence, worklog에 decision을 남깁니다.
- `accepted-risk`: blocking finding이 남아 있고 accountable owner가 expiry, compensating control, review evidence와 함께 risk를 수락했습니다.

## Block

다음 중 하나라도 해당하면 `block`을 사용합니다.

- Secret-like value, credential, token, private key, session material, private endpoint가 committed file, public docs, log, screenshot, runtime report, generated artifact에 있습니다.
- Release path의 authentication, authorization, tenant isolation, object-level access, sensitive data exposure를 검증할 수 없습니다.
- Released 또는 redistributed artifact의 dependency, container, package, generated artifact provenance가 unknown입니다.
- Required license, notice, attribution, policy exception, redistribution evidence가 누락되었습니다.
- Runtime evidence에 personal absolute path, private URL, credential-shaped string, uncapped sensitive excerpt가 있습니다.
- Required security scanner, repository-defined check, public-doc hygiene check, translation coverage check, runtime schema/locator check가 실패했습니다.

## Warn

Risk는 실제지만 named gate를 막지 않을 때 `warn`을 사용합니다.

- 영향받은 코드가 unreachable, disabled 또는 released artifact 밖에 있고 그 scope가 evidence로 확인됩니다.
- Finding이 published되지 않는 internal-only documentation 또는 generated runtime output에만 영향을 주며 cleanup이 추적됩니다.
- Optional scanner output은 unavailable이지만 repository-required check와 source evidence가 최신입니다.
- Dependency 또는 license issue가 current distribution mode에서는 advisory-only입니다.

## Document

Blocking이 아닌 compliance context에는 `document`를 사용합니다.

- Project owner가 이미 승인한 policy exception.
- Handoff, release note, runbook, worklog에 남겨야 하는 residual risk.
- Private URL이나 긴 log를 복사하지 않고 source registry boundary가 필요한 external system check.
- Automated check가 없는 manual review decision.

## Accepted Risk Requirements

Accepted risk에는 다음이 모두 필요합니다.

- Named owner와 decision date.
- Affected artifact, version, environment 또는 audience.
- Expiry 또는 re-review condition.
- Compensating control 또는 rollback path.
- Public docs에서 credential 없이 다시 열 수 있는 evidence locator.
- Risk가 current gate 이후에도 남는 경우 follow-up issue, worklog 또는 handoff note.
