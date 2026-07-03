# Config Cache Runtime Contracts

Use this reference when changing environment variables, feature flags, runtime defaults, cache behavior, process startup, or operational toggles.

## Inventory

- Config sources: environment, config file, secret store, database setting, feature flag, CLI flag, build-time constant, or default value.
- Runtime scope: process startup, request time, job worker, scheduler, browser bundle, test fixture, container, or serverless invocation.
- Cache scope: memory, distributed cache, browser cache, CDN, ORM/query cache, computed materialization, search index, or generated artifact.
- Operators: local developer, CI, staging, production, support, migration job, or rollback owner.

## Contract Rules

- Name, type, default, required/optional status, and failure mode are part of the config contract.
- Do not silently change a default that affects production behavior without rollout and rollback notes.
- Keep build-time and runtime values separate; do not put secrets or environment-specific values into browser-visible bundles.
- Feature flags need owner, default state, targeted scope, cleanup expectation, and observability signal.
- Cache keys must include every input that changes the value and every compatibility dimension that can coexist.
- Cache invalidation must state trigger, propagation delay, stale-read tolerance, and manual repair path.

## Failure Modes

- Worker and web process read different config values.
- Tests pass because defaults hide a missing production setting.
- Cache survives a schema or permission change and leaks stale data.
- Feature flag rollback does not revert database or external side effects.
- Config parsing failure crashes only one runtime mode, such as jobs or CLI.

## Verification

- Config validation test or startup check for missing, malformed, and deprecated settings.
- Cache hit/miss or invalidation test for changed inputs and permissions.
- Flag on/off test for behavior, observability, and cleanup path.
- Deployment note listing new settings, default values, secret requirements, and rollback behavior.
- Post-deploy checks for error rate, cache miss storm, queue lag, and unexpected flag exposure.
