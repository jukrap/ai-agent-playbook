# Feature Slice In Legacy Systems

Use this when adding behavior to a legacy system without changing the surrounding architecture.

## Slice shape

Define the feature through the existing flow:

- User entrypoint or scheduled trigger.
- Input fields, validation, and error display.
- Server action, service function, stored procedure, or file processor.
- Persistence, export, print, queue, or downstream output.
- Permissions, session, audit, and operational recovery.

## Contract expansion

- Add fields explicitly and trace every binding site.
- Preserve old field names and formats unless the change is a deliberate contract version.
- Keep nullable/default behavior compatible with existing rows, files, and consumers.
- Update reports, exports, imports, and batch jobs that depend on the same data.
- Document unimplemented backend or product decisions as blockers.

## Implementation guardrails

- Reuse the nearest existing pattern for the same type of feature.
- Keep new code scoped to the new behavior until shared behavior is proven.
- Do not introduce a new state model, framework, or service boundary for one feature.
- Do not add mock data that can mask missing server behavior.
- Put compatibility checks next to the changed boundary.

## Verification

- Existing adjacent path still works.
- New happy path works.
- Validation failure or business-rule failure is visible to the user or operator.
- Auth/session/permission behavior is unchanged or intentionally changed.
- Persistence, export, print, queue, or downstream output is checked when touched.

## Handoff

For non-trivial changes, record:

- Existing pattern used.
- Contracts extended.
- Consumers checked.
- Verification evidence.
- Remaining risks and rollback notes.
