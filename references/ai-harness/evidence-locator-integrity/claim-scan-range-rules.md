# Claim Scan Range Rules

The stronger the claim, the more explicit the scan range must be. Prefer a narrower, proven statement over a broad claim backed by a vague search.

## Claim Types

| Claim | Required evidence |
| --- | --- |
| Code behavior | Exact source locator plus related tests, routes, callers, or contracts when relevant |
| Structure or architecture | File inventory, package/workspace evidence, import/export search, and relevant architecture docs |
| Absence or "no usages found" | Search terms, tools, included roots, excluded roots, generated folders skipped, and timestamp |
| Risk or blast radius | Callers/importers, public APIs, config, schemas, data paths, deployment or package surfaces |
| Runtime report result | Runtime artifact path, `kind`, scan range, source indexes, truncation status, and schema validation status |
| Source registry fact | Source id, owner/status/freshness, locator type, credential boundary, and promotion policy |
| Command result | Command, exit code, environment/cwd label, timestamp, and relevant output summary or transcript path |
| Data result | Source id, query id, table/dataset grain, sample or aggregate boundary, freshness, and caveats |
| Manual QA observation | Environment, steps, screen/device/browser, timestamp, captured artifact, and known non-replayed paths |

## Absence Claims

For claims such as "no references", "not used", "no route", "no migration", or "no tests", include:

- Tools used: `rg`, language server, AST search, package graph, runtime index, database metadata, or other source.
- Search terms and patterns.
- Included roots and excluded paths.
- File types or languages scanned.
- Generated, vendored, archived, or runtime folders intentionally skipped.
- Timestamp or source revision.
- Residual risk when dynamic dispatch, reflection, config-driven loading, database triggers, or external systems may exist.

If the scan range is incomplete, state a bounded claim such as "no direct text matches in `src/` and `test/`" instead of "unused".

## Unsafe Evidence Anti-Patterns

- Claiming project-wide absence from a single text search.
- Citing a generated summary without a source path, source id, or scan range.
- Copying local absolute paths, private endpoints, branch names, PR numbers, or credentials into reusable docs.
- Treating stale runtime indexes, old worklogs, or cached analysis as current fact.
- Promoting generated graph/index/report output into memory without a reviewed promotion step.
- Quoting more source text than needed to identify the evidence.

## Promotion Rule

Runtime evidence can support a memory or documentation update, but it is not itself durable memory. Before promotion, verify the locator, scan range, freshness, caveats, and conflict with existing canon or project memory.
