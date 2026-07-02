# Source Registry Contract

A source registry explains which knowledge sources exist, how they can be searched or browsed, and which evidence is safe to promote. It should describe access and locator shape without embedding credentials or private payloads.

## Registry Location

Use `.ai-playbook/knowledge/sources.json` for project-local source metadata. Keep source summaries in `knowledge/references/`, exploratory notes in `knowledge/research/`, and generated reports in `runtime/`.

## Source Entry

Each source entry should include:

- `id`: stable lowercase hyphenated source id.
- `type`: file, docs, issue-tracker, chat, database, object-store, web, runtime-index, report, or other.
- `title`: reader-facing source name.
- `owner`: person, team, repository, or declared unknown owner.
- `status`: available, building, partial, unavailable, failed, stale, or unknown.
- `privacyTier`: public, internal, confidential, restricted, or unknown.
- `credentialBoundary`: none, environment variable name, local file reference, managed connector, or manual-only. Do not store secret values.
- `updateCadence`: manual, on-change, scheduled, external, deprecated, or unknown.
- `freshness`: last checked time, source version, commit, snapshot id, or stale reason.
- `locatorTypes`: supported locator shapes such as path-range, URL, primary-key, row-id, thread-id, object-id, artifact-path, or query-id.
- `searchModes`: keyword, structured query, semantic, hybrid, browse-only, or manual.
- `browse`: command, URL pattern, CLI, MCP resource, or manual step to reopen exact evidence.
- `promotionPolicy`: whether facts can become references, maps, contracts, decisions, worklogs, or runtime-only evidence.
- `caveats`: access limits, partial coverage, stale index risk, legal/privacy limits, or missing owner.

## Status Semantics

- `available`: search and browse are currently usable.
- `building`: source is being indexed or configured.
- `partial`: some ranges, permissions, or fields are unavailable.
- `unavailable`: source is known but cannot be accessed now.
- `failed`: a recent check failed and needs diagnosis.
- `stale`: source is accessible but known to be outdated.
- `unknown`: no current check proves status.

## Privacy Rules

- Store credential references, never credential values.
- Avoid personal absolute paths in public docs; use project-relative or source-relative locators.
- Do not commit raw private chat transcripts, ticket payloads, database rows, object contents, or long external excerpts.
- Put generated source indexes under `runtime/`, not `memory/`.
- Promote only reviewed facts with locator and freshness evidence.
