# Fact Gate Checks

The fact gate is a decision aid, not a default blocker. It forces concrete facts before action so the next step is based on repository evidence instead of confidence.

## Required Envelope

A fact gate note should include:

- `intent`: the latest user instruction or requested action in plain words.
- `actionType`: edit existing, create new, delete, move, migration, config, docs/memory, MCP/tooling, publish/deploy, or investigation-only.
- `targetPaths`: project-relative paths or declared unknown target.
- `scanRange`: files, directories, commands, catalogs, or indexes checked.
- `foundFacts`: concrete facts with source paths, command names, or locators.
- `missingFacts`: facts that are still unknown.
- `stopConditions`: conditions that would pause or narrow the action.
- `nextTools`: suggested read-only tools, previews, or validation commands.

## Checks By Action Type

### Edit Existing Files

- Importers, callers, routes, exports, public classes/functions, and package boundaries.
- Related tests, fixtures, generated types, migrations, schema files, and contracts.
- Nearby naming, formatting, error handling, logging, and validation patterns.
- Runtime or deployment surface touched by the file.

### Create New Files

- Existing owner directory or domain cluster for the concept.
- Naming pattern, lifecycle owner, import path, export path, and deletion path.
- Whether a small edit to an existing owner would fit better than a new surface.
- Test, docs, and template locations that must reference the new file.

### Data, Schema, Or Contract Changes

- Current schema/source-of-truth, consumers, migration ordering, seed/backfill needs, and rollback path.
- Read-before-write evidence such as schema inspection, query examples, fixtures, or contract snapshots.
- Whether generated runtime output is being mistaken for durable memory.

### Docs Or Memory Changes

- Existing durable facts, current worklogs, runtime evidence, and source freshness.
- Public-doc hygiene: no personal paths, credentials, internal URLs, branch names, PR numbers, raw transcripts, or noisy reference excerpts.
- Translation, archive, owner, and maintenance expectations.

### MCP, Tool, Or Harness Changes

- Permission tier, read/write behavior, target path validation, dry-run output, audit trail, and tests proving read-only defaults.
- Schema contracts, prompt/tool names, docs, translation, and command references.

## Evidence Standards

- Absence claims need a stated scan range.
- Structural claims need command, path, or catalog evidence.
- User intent should quote or restate the latest instruction, not an older plan.
- If a fact cannot be checked, record `unknown` instead of inventing confidence.
- Keep generated evidence in `runtime/` until reviewed and promoted.
