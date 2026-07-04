# Event Tracking Plan

Analytics event, tracking property, instrumentation contract를 추가하거나 검토할 때 사용합니다.

## Event Contract

- Event owner, business question, event trigger, actor, object, timestamp source, delivery path를 명시합니다.
- User, account, session, device, anonymous, merged-identity behavior를 정의합니다.
- Required property, optional property, type, unit, enum, privacy classification, null behavior를 정의합니다.
- Credential, token, email, phone number, payment detail, private identifier가 없는 sample payload를 포함합니다.

## Implementation Checks

- Event가 client-side, server-side, queued, batched, retried, deduplicated 중 어디에서 발생하는지 확인합니다.
- Naming convention, versioning, rollout, backward compatibility, deprecation path를 확인합니다.
- Consent, opt-out, regional privacy, sensitive-property handling을 확인합니다.
- Downstream dashboard, funnel, experiment, export, data contract를 확인합니다.

## Stop Conditions

- Event owner, grain, trigger, identity behavior가 불명확합니다.
- Explicit review 없이 sensitive property를 수집합니다.
- Client와 server가 duplicate 또는 conflicting event를 발생시킵니다.
- Sample payload가 private user data를 노출합니다.
