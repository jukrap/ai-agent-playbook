# Secrets And Credential Boundary

Use this reference when a change touches API keys, tokens, OAuth apps, service accounts, environment variables, CI secrets, local config, or provider credentials.

## Inventory

- Secret type: API key, token, OAuth client secret, JWT signing key, webhook secret, database password, SSH key, certificate, cookie secret, or encryption key.
- Storage: secret manager, environment, CI variable, local `.env`, config file, keychain, database, generated artifact, browser bundle, or test fixture.
- Access path: app runtime, worker, CI job, deploy script, MCP server, local tool, browser, SDK, or third-party provider.
- Rotation path: owner, expiry, revocation, dual-key period, rollout order, and rollback behavior.

## Rules

- Secrets must not appear in source, logs, traces, screenshots, generated docs, browser bundles, cache artifacts, or committed fixtures.
- Use indirection in docs: variable names, secret manager paths, or setup flow names; never real values.
- Keep public identifiers separate from secret values. OAuth client ids may be public; client secrets are not.
- Scope credentials to the least privilege and shortest practical lifetime.
- Treat tool and MCP credentials as production-impacting unless the provider and permissions are clearly bounded.
- Add rotation or revocation notes when changing credential names, scopes, providers, or storage location.

## CI And Local Tooling

- Check install scripts, package scripts, hooks, and generated config for unexpected secret reads.
- Confirm CI secrets are available only to trusted branches/jobs and not to pull requests from untrusted origins.
- Avoid echoing env vars in debug output, command traces, failed tests, or artifact names.
- Prefer encrypted or platform-managed key setup flows over pasting values into instructions.

## Verification

- Search diff and generated artifacts for token-like strings and known secret variable values.
- Run dependency or package checks when credential-handling dependencies change.
- Test missing, malformed, expired, and denied credentials with sanitized failure messages.
- Confirm logs contain credential ids or operation ids, not credential values.
- Record rotation owner and rollback path for production credential changes.
