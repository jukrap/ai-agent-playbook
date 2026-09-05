# Legacy Change Control

Use this when a legacy change must preserve current behavior, operations, and downstream contracts.

## Change sequence

1. Capture the current behavior before editing.
2. Identify the smallest user-visible behavior that must change.
3. Trace the runtime path that produces that behavior.
4. Search adjacent routes, templates, scripts, jobs, database artifacts, generated output, and deployment files.
5. Make the smallest scoped change that satisfies the request.
6. Verify unchanged behavior and changed behavior separately.
7. Record the rollback path, residual risk, and any unverified dependency.

## Evidence to collect

- The active entrypoint, route, command, scheduler, or manual operation.
- The source file and runtime artifact when build output exists.
- The data shape before and after the change.
- The caller or consumer list for changed fields, selectors, routes, files, and procedure signatures.
- The command, screen flow, sample file, or query used for verification.

## Change boundaries

- Prefer adding a narrow adapter or branch over changing a shared global path.
- Prefer preserving names and formats over cleaning them up during feature work.
- Prefer a characterization test, captured fixture, or manual scenario over a broad rewrite.
- Prefer an explicit blocker over silently assuming a missing backend, database, browser, or device contract.

## Verification matrix

- Old path: prove the previous behavior still works for at least one representative scenario.
- New path: prove the requested behavior works for the changed scenario.
- Failure path: prove validation, error display, retry, or rollback still behaves predictably.
- Operational path: prove build, package, batch, printer, deployment, or manual runbook behavior when touched.

## Red flags

- A file looks unused but appears in deployment output, script includes, runtime config, scheduled tasks, or generated manifests.
- The same field name appears in UI, server binding, SQL, export, import, and report code.
- A manual operation is the only recovery path.
- The test environment cannot exercise the browser, database, printer, scheduler, or partner integration that owns the risk.
