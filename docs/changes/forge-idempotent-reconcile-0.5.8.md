# Forge Idempotent Reconcile 0.5.8

AI Agent Playbook 0.5.8 makes presentation reconciliation report and write only meaningful remote changes.

## Provider-confirmed preview

- `forge reconcile` now runs the planned operations through the real provider adapter behind a read-only transport.
- Operations proven to be reusable are removed from the executable preview and reported as `noOps`; any operation that reaches a write boundary remains planned.
- Artifact counts follow the filtered operation set, while `plannedOperations` retains the original intent count for auditability.

## Project convergence

- A missing GitHub Project text field and an explicitly empty desired value are treated as equivalent, matching GitHub's omission of empty text values from item responses.
- A Project's system-created `View 1` can satisfy the managed `all` role, preventing an additional duplicate table view. GitHub's stable public View API creates views but does not rename or delete the system view, so the harness does not claim that the visible name was changed.
- Existing user views and Project items are never deleted by this convergence pass.

## Legacy managed-body migration

- Reviewed presentation reconcile can replace an old generated objective and acceptance preamble that sits immediately before the managed block.
- Migration is limited to the strict legacy marker shape and CAS-protected issue snapshot. User text outside that shape and text after the managed block remain preserved.
