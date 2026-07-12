# Forge Permission Guidance 0.5.6

AI Agent Playbook 0.5.6 tightens the Projects permission boundary and removes tool branding from newly created GitHub Project fields.

## Permission recovery

- Human-readable `forge status` output now prints the browser-auth and status recheck commands from structured remediation data.
- Preferred GitHub Projects bootstrap fails closed when Project or View capabilities are unavailable. It returns zero executable operations before any mutation.
- Blocked previews preserve the requested label, milestone, Project, and View counts so the operator can review the intended coordination surface before granting a scope.
- Authentication scope expansion remains interactive. The harness never runs `gh auth refresh` automatically.

## Neutral Project fields

- New managed Projects use `Delivery Status`, `Task ID`, `Phase`, `Priority`, `Risk`, `Progress`, and `Area`.
- Views filter the neutral delivery-status field while keeping localized view names.
- Existing `AAPB Status`, `AAPB Task ID`, `AAPB Phase`, `AAPB Priority`, `AAPB Risk`, `AAPB Progress`, and `AAPB Area` fields remain compatibility aliases.
- Legacy fields are reused without duplicate creation, destructive renaming, or deletion. When both forms exist, the neutral field wins; existing view filters are adapted to the field that was actually reused.
- A resumed legacy field operation can also reuse its neutral counterpart. If an existing neutral or legacy field has an incompatible type or is missing required single-select options, bootstrap fails before creating any missing field and reports the schema conflict for operator review.

## User-owned Project views

- User-owned Project field and View REST requests use the owner's login in the documented `/users/{user_id}/projectsV2/{project_number}/...` path. Earlier builds incorrectly substituted the GraphQL numeric `databaseId` for View creation, which produced a 404 after Project fields had already been created.
- The adapter no longer queries the deprecated GraphQL user `databaseId`. Organization-owned Project paths continue to use the organization login.
- A failed 0.5.5 run can safely resume against the titled Project it already created. Existing fields and Views are discovered and reused; the adapter does not delete the default View, legacy fields, or unrelated empty Projects.
