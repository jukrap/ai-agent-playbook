# Event Tracking Plan

Use this when adding or reviewing analytics events, tracking properties, or instrumentation contracts.

## Event Contract

- Name event owner, business question, event trigger, actor, object, timestamp source, and delivery path.
- Define user, account, session, device, anonymous, and merged-identity behavior.
- Define required properties, optional properties, types, units, enums, privacy classification, and null behavior.
- Include sample payloads without credentials, tokens, emails, phone numbers, payment details, or private identifiers.

## Implementation Checks

- Confirm whether the event is emitted client-side, server-side, queued, batched, retried, or deduplicated.
- Check naming convention, versioning, rollout, backward compatibility, and deprecation path.
- Verify consent, opt-out, regional privacy, and sensitive-property handling.
- Confirm downstream dashboards, funnels, experiments, exports, and data contracts.

## Stop Conditions

- Event owner, grain, trigger, or identity behavior is unclear.
- Sensitive properties are collected without explicit review.
- Client and server emit duplicate or conflicting events.
- Sample payloads would expose private user data.
