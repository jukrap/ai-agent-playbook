# Maps

Maps help agents navigate a project without scanning the whole repository every session.

Create only the maps the project needs:

- `repo-map.md`: major folders, entrypoints, and ownership.
- `runtime-map.md`: how the app starts, builds, deploys, or runs jobs.
- `route-map.md`: screens, routes, controllers, or navigation surfaces.
- `api-map.md`: API clients, DTO boundaries, endpoints, and mock/remote switches.
- `data-map.md`: storage, database tables, migrations, files, or external data flows.
- `risk-map.md`: shared modules, generated files, compatibility constraints, and high-blast-radius areas.

## Rules

- State scan range and freshness for structural claims.
- State confidence limits when evidence comes from partial scans, text search, or static-analysis cues.
- Prefer facts with file paths, command output, or code references.
- Treat duplicate or clone signals as review cues until a human verifies behavior, callers, and tests.
- Put high-blast-radius areas in `risk-map.md` instead of burying them in long narrative notes.
- Keep maps current enough to route work, not exhaustive enough to replace the code.
