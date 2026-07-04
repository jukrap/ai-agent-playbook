# Locator And Evidence Envelope

Knowledge work should follow search, locate, browse, then promote. A search hit is not a fact until the exact evidence can be reopened and checked.

## Locator Types

| Locator | Use for | Required fields |
| --- | --- | --- |
| `path-range` | Repository files, markdown, source docs | path, start line or section, optional end line |
| `url` | Web docs or hosted artifacts | URL, access date, title, optional fragment |
| `primary-key` | Database or structured records | source id, table/object, key fields |
| `row-id` | Query result samples or reports | query id, row id, source grain |
| `thread-id` | Chat, incident, or ticket threads | system, thread id, message range |
| `object-id` | Object stores, files, binaries | bucket/container, object id, version/hash |
| `artifact-path` | Runtime reports, indexes, screenshots | project-relative runtime path, schema kind, generated time |
| `query-id` | Saved query or dashboard panel | query id, parameters, result freshness |

## Evidence Envelope

An evidence note should include:

- `sourceId`: matching registry source id.
- `locator`: exact locator for reopening the evidence.
- `query`: search terms or structured query used.
- `scanRange`: what was searched and what was excluded.
- `freshness`: last checked time, snapshot, commit, or stale caveat.
- `evidenceType`: direct quote, paraphrase, structured field, generated report, metric, screenshot, or manual observation.
- `summary`: short factual summary.
- `caveats`: partial permissions, stale index, missing rows, sampling, or ambiguous ownership.
- `promotionStatus`: runtime-only, candidate, promoted, rejected, or expired.

## Search-Locate-Browse

1. Search the smallest relevant source range first.
2. Reopen exact locators or ranges before using a search hit.
3. Record scan range for absence claims.
4. Keep generated summaries and raw hits provisional.
5. Promote only reviewed facts into `memory/`, `knowledge/references/`, contracts, maps, or decisions.

## Stop Conditions

Stop or downgrade confidence when:

- the source has no owner,
- credential boundary is unclear,
- the source range is unbounded,
- search works but browse/reopen does not,
- freshness cannot be determined,
- locator shape cannot point back to exact evidence,
- private payloads would be committed, or
- generated evidence would be treated as durable memory without review.
