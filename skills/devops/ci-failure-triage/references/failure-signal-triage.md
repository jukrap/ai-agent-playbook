# Failure Signal Triage

Use this when a CI job, build pipeline, deployment check, or release automation fails.

## Read order

1. Job name and triggering event.
2. Exact failing command.
3. First meaningful error above repeated stack noise.
4. Environment: OS, runtime, package manager, cache key, secret availability, and service dependencies.
5. Recent diff touching code, tests, lockfiles, config, workflow files, or deployment manifests.

## Classification

- Code: compilation, type errors, lint, runtime exceptions, or changed behavior.
- Test: assertion mismatch, fixture drift, flaky ordering, timeout, or environment assumption.
- Dependency: lockfile drift, registry outage, transitive version, native build, or missing binary.
- Environment: OS image, runtime version, path, permissions, locale, timezone, or browser/device availability.
- Cache: stale artifact, wrong key, partial restore, generated output, or build cache poisoning.
- Secret: missing token, permission scope, expired credential, masked value, or environment mismatch.
- External: third-party outage, rate limit, network failure, or deployment platform incident.

## Fix strategy

- Reproduce locally when the command and environment are available.
- Prefer the narrowest fix that addresses the first real failure.
- Avoid rerunning repeatedly without changing evidence or hypothesis.
- Avoid changing workflow config to hide a code or test failure.
- Avoid deleting caches unless cache is the current leading hypothesis.

## Verification

- Rerun the failing command or nearest reliable equivalent.
- If local reproduction is impossible, document the missing environment and verify the closest deterministic part.
- For flaky tests, collect enough repeated evidence before changing timing or quarantine policy.
- For dependency failures, confirm lockfile and package-manager behavior.
- For secret or external failures, do not expose secret values in logs or docs.
