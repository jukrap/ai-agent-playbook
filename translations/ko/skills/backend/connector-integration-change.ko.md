# Connector Integration Change

Connector, adapter, webhook, integration contract change를 위한 primary backend skill입니다.

## Workflow

1. Connector type, host runtime, external contract, credential model, scope, registration metadata, supported operation을 확인합니다.
2. Request/response mapping, pagination, rate limit, retry, idempotency, timeout behavior, partial failure, error wrapping을 검토합니다.
3. Credential reference, secret handling, webhook lifecycle, generated schema, discoverability metadata를 확인합니다.
4. Project에 맞는 contract example, mocked 또는 sandbox call, integration test, release note로 검증합니다.

## Reference

Connector contract, metadata, operation, compatibility review에는 `references/connector-contract-checks.md`를 읽습니다.

Credential, webhook lifecycle, retry, error handling check에는 `references/credential-webhook-error-handling.md`를 읽습니다.
