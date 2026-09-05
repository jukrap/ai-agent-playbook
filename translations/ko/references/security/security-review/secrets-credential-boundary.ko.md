# 비밀값과 자격 증명 경계

API key, token, OAuth app, service account, environment variable, CI secret, local config, provider credential을 다룰 때 사용합니다.

## 목록

- Secret type: API key, token, OAuth client secret, JWT signing key, webhook secret, database password, SSH key, certificate, cookie secret, encryption key.
- Storage: secret manager, environment, CI variable, local `.env`, config file, keychain, database, generated artifact, browser bundle, test fixture.
- Access path: app runtime, worker, CI job, deploy script, MCP server, local tool, browser, SDK, third-party provider.
- Rotation path: owner, expiry, revocation, dual-key period, rollout order, rollback behavior.

## 규칙

- Secret은 source, log, trace, screenshot, generated docs, browser bundle, cache artifact, committed fixture에 들어가면 안 됩니다.
- 문서에는 실제 값 대신 variable name, secret manager path, setup flow name을 사용합니다.
- Public identifier와 secret value를 분리합니다. OAuth client id는 공개될 수 있지만 client secret은 안 됩니다.
- Credential scope는 필요한 최소 권한과 가능한 짧은 수명으로 제한합니다.
- Tool과 MCP credential은 provider와 permission이 명확히 제한되지 않는 한 production-impacting으로 봅니다.
- Credential name, scope, provider, storage location을 바꾸면 rotation 또는 revocation note를 남깁니다.

## CI와 로컬 도구

- Install script, package script, hook, generated config가 예상 밖의 secret을 읽지 않는지 확인합니다.
- CI secret은 trusted branch/job에만 열리고 untrusted origin PR에는 노출되지 않아야 합니다.
- Debug output, command trace, failed test, artifact name에 env var가 찍히지 않게 합니다.
- 값을 직접 붙여 넣는 지침보다 암호화되거나 platform-managed key setup flow를 선호합니다.

## 검증

- Diff와 generated artifact에서 token-like string과 알려진 secret variable value를 검색합니다.
- Credential-handling dependency가 바뀌면 dependency/package check를 실행합니다.
- Missing, malformed, expired, denied credential의 sanitized failure message를 확인합니다.
- Log에는 credential value가 아니라 credential id 또는 operation id만 남는지 확인합니다.
- Production credential 변경은 rotation owner와 rollback path를 기록합니다.
