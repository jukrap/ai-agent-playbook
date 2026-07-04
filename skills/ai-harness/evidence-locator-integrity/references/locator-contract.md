# Evidence Locator Contract

Evidence is useful only when another agent or reviewer can reopen the source without relying on a generated summary. Use the smallest locator that proves the claim and keep machine-local details out of reusable docs.

## Required Fields

Every durable evidence note should carry these fields, either explicitly or through a known runtime schema:

- `locatorType`: one of `path-range`, `symbol`, `runtime-artifact`, `source-registry`, `command-output`, `url`, `issue`, `database-query`, or `manual-observation`.
- `locator`: a target-relative path, source id, command id, query id, URL, issue id, or observation id that can be reopened.
- `scanRange`: what was searched or inspected, including important exclusions.
- `freshness`: timestamp, commit, run id, source version, or "unknown" when freshness cannot be proven.
- `sourceBoundary`: local file, runtime report, registry source, external source, data source, or manual observation boundary.
- `confidence`: `high`, `medium`, or `low`, based on directness and completeness.
- `caveats`: known gaps, truncation, stale caches, generated summaries, missing permissions, or unavailable sources.

## Locator Shapes

| Locator type | Use for | Minimum locator |
| --- | --- | --- |
| `path-range` | Source, docs, templates, config, tests | target-relative path plus line or section range |
| `symbol` | Function, class, component, route handler, exported binding | target-relative path, symbol name, and line when available |
| `runtime-artifact` | Generated reports, indexes, graphs, evals, witness records | target-relative runtime path and artifact `kind` |
| `source-registry` | Declared knowledge source or external boundary | source registry id plus locator inside that source |
| `command-output` | Test, lint, build, query, or dry-run evidence | command summary, cwd label, exit code, timestamp, and stored transcript path when retained |
| `url` | Public docs or web references | URL, access date, excerpt boundary, and source owner when relevant |
| `issue` | Ticket, incident, PR, or review thread | source id, issue id, status, and access boundary |
| `database-query` | Sampled rows, reconciliation, report checks | source id, query id, schema/table scope, sample or aggregate boundary |
| `manual-observation` | Browser/device/manual QA | observation id, environment, timestamp, steps, and captured artifact path when available |

## Safety Rules

- Use target-relative paths such as `src/auth/session.ts`, not local absolute paths.
- Store bulky evidence as runtime artifacts; keep inline excerpts capped and relevant.
- Store credential references or source ids, never token values, cookie values, private keys, passwords, or bearer headers.
- Treat generated reports as evidence candidates. Do not cite them as durable truth unless the source range is reopenable.
- For external sources, cite the source boundary and freshness. Do not copy upstream branding, private paths, internal URLs, or long excerpts into reusable docs.

## Confidence

- `high`: direct locator to the exact source or artifact, bounded scan range, fresh enough for the decision.
- `medium`: direct evidence exists but scan range, freshness, or source boundary has caveats.
- `low`: generated summary, partial search, stale source, inaccessible source, or manual observation without replayable artifact.
