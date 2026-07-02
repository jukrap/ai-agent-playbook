# Runtime Artifact Contracts

Use this when adding or reviewing generated reports, indexes, graphs, cache files, or runtime evidence artifacts.

## Artifact Envelope

- Include schema version, kind, target, generated timestamp, mode, summary, warnings, and conflicts.
- Use portable relative paths for evidence where possible.
- Keep secrets, direct personal paths, internal URLs, tokens, branch names, and PR numbers out of artifacts intended for review or sharing.
- Distinguish preview-only reports from applied artifacts.

## Storage Boundaries

- Runtime output belongs under `runtime/` or equivalent generated-output directories.
- Durable human knowledge belongs under memory, contracts, decisions, maps, runbooks, or worklogs only after review.
- Temporary files belong under temp directories and should not become project policy.
- Generated artifacts should not be imported by production source code.

## Contract Checks

- Validate malformed JSON and missing required fields gracefully.
- Include a stable kind string so tools can route and validate artifacts.
- Record whether writes happened and which files were touched.
- Keep artifact schemas small enough for agents to inspect without reading unrelated payloads.

## Stop Conditions

- Runtime output is written into durable memory without review.
- The artifact has no schema version, kind, target, or generated timestamp.
- The artifact stores non-portable paths or sensitive values.
- A generated report becomes a hidden source of truth for future edits.
