# Acceptance Criteria And Open Questions

Use acceptance criteria to make scope checkable and open questions to avoid filling gaps with guesses.

## Acceptance Criteria Shape

Each criterion should state:

- Actor or system involved.
- Starting condition.
- Action or trigger.
- Expected observable result.
- Error, empty, loading, permission, rollback, or degraded state when relevant.
- Verification method: automated test, manual QA, data query, log/metric check, design review, or stakeholder review.

## Criteria To Avoid

- "Implement the API" without naming observable behavior or contract source.
- "Make it better" without a measurable target or reviewer.
- "Use framework X" unless the repository already chose that architecture.
- "Update the database" without ownership, migration order, compatibility window, and rollback expectation.
- "Match the reference" without extracting the portable behavior to adopt.

## Open Question Buckets

- Product: user, workflow, priority, success measure, non-goal, release scope.
- Design: layout, copy, empty/error state, accessibility, responsive behavior, visual evidence.
- API/backend: endpoint, payload, DTO, auth, rate limit, error shape, idempotency.
- Data: source of truth, grain, schema, retention, quality, lineage, migration/backfill.
- Security/compliance: secret handling, privacy, authorization, audit, license, legal review.
- Operations: deploy gate, rollback, monitoring, support path, migration timing, owner.

## Promotion Rule

Promote only reviewed criteria and answered questions into durable project memory. Keep unresolved questions in the active plan, issue, or `.ai-playbook/questions.md` until the owner resolves them.
