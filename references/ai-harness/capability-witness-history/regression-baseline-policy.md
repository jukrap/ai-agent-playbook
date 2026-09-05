# Regression Baseline Policy

Capability history is useful only when runs are comparable. Baselines should explain what changed, what stayed stable, and which evidence is too noisy to trust.

## Comparable Baselines

Compare entries only when these fields are compatible:

- capability id and check id,
- OS family and important shell behavior,
- runtime version range,
- dependency install mode,
- feature flags and permission tier,
- fixture or target project shape,
- network or external-service availability, and
- command arguments or MCP prompt inputs.

When those fields differ materially, record a new baseline instead of calling the result a regression.

## Rolling History

- Keep recent witness entries append-only.
- Summarize current capability status from the latest comparable entries.
- Keep a stable baseline pointer for release-critical checks.
- Allow non-release exploratory checks to remain advisory.
- Record the reason when an old baseline is retired.

## Regression Signals

Treat these as regression candidates:

- `pass` becomes `fail`, `degraded`, `skipped`, or `unknown`.
- Duration, cost, or token usage exceeds the declared threshold.
- Coverage drops below the minimum fixture or workflow count.
- A write tool becomes visible by default.
- A read-only check writes files.
- A generated runtime artifact moves into durable memory without promotion review.

## Noise Handling

- Re-run flaky checks only when the policy says pass@k or pass^k is allowed.
- Report every failed attempt when using repeat attempts.
- Prefer `degraded` for partial capability loss and `unknown` for insufficient evidence.
- Do not erase a failure by replacing it with a later pass; append both and summarize the recovery.

## Stop Conditions

Stop before publishing a capability report when:

- The check did not run and the report would imply a pass.
- The baseline is non-comparable but the report calls it a regression.
- The result depends on an undeclared external service or credential.
- The artifact path exposes personal or private data.
- The status is based on a narrative claim rather than command, schema, or reviewed evidence.
