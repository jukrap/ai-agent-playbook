# Security Compliance Gate Severity Model

## Decision States

- `pass`: required evidence is current, scoped to the named artifact, and no blocking finding remains.
- `block`: the change must not merge, release, publish, or hand off until the finding is resolved or formally accepted by the owner.
- `warn`: the finding is relevant but does not block the current gate; record the caveat and follow-up owner.
- `document`: no action is required for the gate, but the decision should be visible in release notes, handoff notes, policy evidence, or worklog.
- `accepted-risk`: a blocking finding remains and the accountable owner accepts it with expiry, compensating control, and review evidence.

## Block

Use `block` when any of these are true:

- Secret-like values, credentials, tokens, private keys, session material, or private endpoints appear in committed files, public docs, logs, screenshots, runtime reports, or generated artifacts.
- Authentication, authorization, tenant isolation, object-level access, or sensitive data exposure cannot be verified for the release path.
- Dependency, container, package, or generated artifact provenance is unknown for a released or redistributed artifact.
- Required license, notice, attribution, policy exception, or redistribution evidence is missing.
- Runtime evidence contains personal absolute paths, private URLs, credential-shaped strings, or uncapped sensitive excerpts.
- A required security scanner, repository-defined check, public-doc hygiene check, translation coverage check, or runtime schema/locator check failed.

## Warn

Use `warn` when risk is real but does not stop the named gate:

- The affected code is unreachable, disabled, or outside the released artifact, and that scope is evidenced.
- A finding affects internal-only documentation or generated runtime output that is not published, and cleanup is tracked.
- Optional scanner output is unavailable, but repository-required checks and source evidence are current.
- A dependency or license issue is advisory-only for the current distribution mode.

## Document

Use `document` for non-blocking compliance context:

- Policy exceptions already approved by the project owner.
- Residual risk that should appear in handoff, release notes, runbooks, or worklogs.
- External system checks that require a source registry boundary instead of copying private URLs or long logs.
- Manual review decisions where no automated check exists.

## Accepted Risk Requirements

Accepted risk requires all of the following:

- Named owner and decision date.
- Affected artifact, version, environment, or audience.
- Expiry or re-review condition.
- Compensating control or rollback path.
- Evidence locator that can be reopened without credentials in public docs.
- Follow-up issue, worklog, or handoff note when the risk persists beyond the current gate.
