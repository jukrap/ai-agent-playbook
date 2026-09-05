# Legacy Compatibility Map

Use this to map hidden coupling before changing legacy systems.

## Map dimensions

- Runtime: entrypoints, active routes, scheduled jobs, browser modes, device plugins, and server modules.
- Data: tables, views, stored procedures, triggers, files, exports, imports, and report queries.
- UI: templates, partials, shared selectors, global scripts, inline handlers, and layout includes.
- Build: generated assets, copied static files, bundling steps, packaging rules, and deployment descriptors.
- Operations: cron schedules, Windows tasks, manual runs, rollback scripts, backups, and support procedures.
- External contracts: partner files, API consumers, downstream reports, printer paths, browser policies, and SSO/session assumptions.

## Map questions

- Which artifact is edited, and which artifact actually runs?
- Which code path writes the value, and which code path reads it later?
- Which consumer depends on the exact name, order, format, encoding, or timing?
- Which environment-specific rule decides whether the path is active?
- Which manual process would fail if the shape or timing changes?

## Search cues

- Field names and labels.
- CSS selectors and data attributes.
- Route names, action names, command names, and scheduler names.
- File extensions, folder names, and filename patterns.
- Stored procedure names, trigger names, table names, and export column names.
- Config keys, environment variables, registry keys, and group policy names.

## Output

Write a compact compatibility note when risk is non-trivial:

- Changed contract.
- Known consumers.
- Unknown consumers.
- Verification evidence.
- Rollback or containment plan.

Do not promote generated maps into durable memory until a person or reviewer has confirmed they match the real operating system.
