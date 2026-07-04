# Artifact Package Manifest

Use a manifest so a documentation package is bounded and reviewable.

## Manifest Fields

- Title and package type.
- Audience and intended use.
- Owner and reviewer.
- Date, freshness window, and next review trigger.
- Included artifacts: docs, runbooks, diagrams, screenshots, reports, decisions, contracts, maps, or examples.
- Source evidence: reviewed files, commands, reports, logs, screenshots, queries, or external references.
- Excluded sources: raw transcripts, unreviewed generated summaries, private notes, local-only evidence, noisy references.
- Caveats and open questions.
- Verification performed and verification skipped.
- Maintenance path, archive path, and promotion rules.

## Boundary Rules

- A package is not automatically source of truth. State which included docs are durable policy and which are evidence.
- Generated runtime reports remain under runtime until reviewed and promoted.
- Raw notes can justify decisions, but should not become published documentation by default.
- Keep public packages free of private paths, credentials, internal URLs, branch names, PR numbers, personal names, and raw reference excerpts.

## Evidence Quality

- Prefer links or portable paths to reviewed artifacts over pasted output.
- Include enough context for a reader to judge freshness and completeness.
- Mark partial evidence explicitly.
- Keep large tables, screenshots, exports, or raw reports outside the main doc when they would drown the reader.

## Stop Conditions

- The target audience is unclear.
- The package mixes active policy, stale history, and generated evidence without labels.
- No owner exists for maintenance or archival.
- Sensitive source material cannot be safely summarized.
