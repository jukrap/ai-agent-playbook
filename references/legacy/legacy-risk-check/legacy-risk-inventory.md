# Legacy Risk Inventory

Use this before editing shared legacy behavior or declaring a risky legacy change complete.

## Inventory checklist

- Entry: route, command, scheduled job, manual operation, browser screen, or partner file.
- State: session, cookie, hidden input, global variable, local storage, database row, temporary file, or cache.
- Contract: request fields, response fields, export columns, file layout, procedure parameters, or template variables.
- Shared assets: CSS, JavaScript, includes, layout templates, utilities, tags, and generated output.
- Runtime selection: feature flags, server config, browser mode, deployment folder, classpath, include path, or environment switch.
- Operations: rollback, backup, manual correction, queue replay, batch rerun, support script, and release packaging.

## High-risk patterns

- A shared selector or class controls unrelated screens.
- A form field is bound by name on the server.
- A stored procedure returns a shape consumed by reports, exports, and application code.
- A generated file is committed or manually copied during deployment.
- A schedule or manual support process is the only way to repair failed state.
- A browser or device integration cannot be tested in the current environment.

## Risk decision

Classify the change:

- Low: one active path, one clear owner, local verification available, rollback is simple.
- Medium: shared assets or contracts are touched, but consumers are known and verifiable.
- High: active runtime path is unclear, consumers are unknown, data migration is involved, or verification requires unavailable infrastructure.

## Required handoff for medium/high risk

- What was changed.
- What consumers were checked.
- What could not be verified.
- What command, scenario, sample file, query, or environment was used.
- How to roll back or contain the change.
