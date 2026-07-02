# Dataset Contract Checks

Use this when a table, event, file, API payload, BI dataset, mart, export, or workflow payload becomes a shared data contract.

## Contract Shape

- Name the owner, source of truth, dataset grain, primary identifiers, time window, partitioning, retention, and freshness target.
- Define field meanings, units, nullability, enum/range expectations, timezone, currency, denominator, and known exclusions.
- Distinguish raw source fields from derived fields and generated evidence.
- Record compatibility expectations for added, renamed, removed, retyped, and backfilled fields.

## Review Checks

- Identify all known producers, transformations, consumers, dashboards, exports, jobs, and APIs.
- Check whether consumers rely on undocumented fields, implicit filters, load order, or old naming.
- Confirm how late-arriving, duplicated, deleted, or corrected records are represented.
- Keep credentials, private URLs, raw query output, and direct personal paths out of reusable contract docs.

## Stop Conditions

- Dataset grain, owner, source of truth, or freshness target is unknown.
- A field meaning changes without consumer impact review.
- Contract evidence is only generated output or a sample without source ownership.
- Private connection details or raw source dumps would enter public docs.
