# Release Note Audience Checks

Choose structure and detail based on who needs the artifact.

## Reader Shapes

- End user: what changed, why it matters, how to use it, limitations, and support path.
- Support or operations: symptoms, rollout window, alerts, known issues, mitigations, escalation path.
- Developer: API/schema/config changes, migration steps, compatibility, deprecations, test evidence.
- Stakeholder: outcome, scope, risk, readiness, unresolved decisions, rollout or follow-up.
- Maintainer: changed surfaces, operational caveats, cleanup needs, rollback and archive path.

## Content Rules

- Lead with observable impact, not internal implementation order.
- Group related changes; avoid a raw commit list unless the project specifically wants one.
- State known issues and limitations plainly.
- Name migration or upgrade action only when the source evidence is reviewed.
- Include verification results only when actually run.
- Point to durable docs or worklogs when needed, but do not paste noisy output.

## Artifact Types

- Release notes: user-facing or stakeholder-facing change summary.
- Changelog: durable internal history, usually grouped by added/changed/fixed/removed/security.
- Migration notes: steps, compatibility window, ordering, rollback, and validation.
- Upgrade notes: version constraints, config changes, deprecations, support path.
- Known issues: active caveats, impact, mitigation, owner, and review date.

## Stop Conditions

- The artifact claims a release happened without source evidence.
- It includes tests, environments, devices, or rollout status that were not verified.
- It exposes private project values, branch names, PR numbers, credentials, or internal URLs.
