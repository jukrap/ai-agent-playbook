# Index Cache Invalidation

Use this when an index, graph, cache, or generated report may become stale.

## Freshness Signals

- Source file hashes, modified timestamps, manifest hashes, lockfile hashes, config versions, tool versions, and target paths.
- Generated timestamp and scan range.
- Preview-only versus applied status.
- Known exclusions such as generated output directories, vendor folders, and local-only archives.

## Invalidation Rules

- Rebuild when source files, manifests, lockfiles, config files, or scan parameters change.
- Mark stale when source evidence is missing, changed, or older than the current contract.
- Avoid silent fallback to stale data for high-risk analysis.
- Keep optional embedding/vector indexes disabled by default unless provider, privacy, cost, and invalidation rules are explicit.

## Promotion Rules

- Promote concise reviewed facts, not full cache payloads.
- Link promoted facts back to source reports when useful.
- Re-check promoted facts when source files or contracts change.
- Record confidence and freshness instead of treating cached inference as proof.

## Stop Conditions

- A cache has no invalidation trigger.
- A stale generated report is used as current evidence without warning.
- Optional network or embedding providers are enabled by default.
- Runtime cache payloads are copied into public docs or trusted memory wholesale.
