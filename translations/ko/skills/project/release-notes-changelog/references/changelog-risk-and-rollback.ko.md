# Changelog Risk And Rollback

Release documentation이 risk, mitigation, rollback 맥락을 가져야 할 때 사용합니다.

## Risk Notes

- Compatibility: API, schema, file format, browser/device, dependency, runtime, integration change.
- Data: migration, backfill, reconciliation, retention, reporting, freshness, metric definition change.
- Security/privacy: auth, authorization, secret, sensitive data, logging, audit, consent, license.
- Operations: deploy order, feature flag, monitor, alert, queue, batch, cache, rollback window.
- UX/support: changed workflow, confusing state, known issue, accessibility, localization, support script.

## Rollback And Mitigation

- Rollback lever를 이름 붙입니다. revert, feature flag, config switch, data repair, migration rollback, package downgrade, manual mitigation.
- 특히 data migration, external side effect, user notification, published package처럼 rollback이 되돌리지 못하는 것을 씁니다.
- 관련되면 post-rollback verification과 support communication을 포함합니다.
- Project가 정의하지 않은 rollback을 약속하지 않습니다.

## Verification Evidence

- 실제로 검토한 command, manual check, environment, screenshot, query, log, monitor만 포함합니다.
- Skipped check와 remaining risk를 표시하고 confidence를 지어내지 않습니다.
- Generated report는 durable docs로 승격하기 전까지 evidence reference로 둡니다.

## Changelog Hygiene

- Date와 version을 repository release process와 일관되게 유지합니다.
- Public changelog에 private branch name, PR number, internal ticket ID, raw reference excerpt를 복사하지 않습니다.
- Audience가 다르면 public user note와 internal maintainer note를 분리합니다.
