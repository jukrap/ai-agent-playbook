# Changelog Risk And Rollback

Use this when release documentation must carry risk, mitigation, and rollback context.

## Risk Notes

- Compatibility: API, schema, file format, browser/device, dependency, runtime, or integration changes.
- Data: migration, backfill, reconciliation, retention, reporting, freshness, or metric definition changes.
- Security/privacy: auth, authorization, secrets, sensitive data, logging, audit, consent, license.
- Operations: deploy order, feature flag, monitor, alert, queue, batch, cache, rollback window.
- UX/support: changed workflow, confusing state, known issue, accessibility, localization, support script.

## Rollback And Mitigation

- Name the rollback lever: revert, feature flag, config switch, data repair, migration rollback, package downgrade, or manual mitigation.
- State what rollback does not undo, especially data migrations, external side effects, user notifications, or published packages.
- Include post-rollback verification and support communication when relevant.
- Do not promise rollback when the project has not defined one.

## Verification Evidence

- Include only commands, manual checks, environments, screenshots, queries, logs, or monitors that were actually reviewed.
- Mark skipped checks and remaining risk rather than inventing confidence.
- Keep generated reports as evidence references until promoted into durable docs.

## Changelog Hygiene

- Keep dates and versions consistent with the repository release process.
- Avoid copying private branch names, PR numbers, internal ticket IDs, or raw reference excerpts into public changelogs.
- Separate public user notes from internal maintainer notes when the audience differs.
