# Runtime Harness V20-V22 Memory Structure

## Goal

Improve project memory so future agents can resume, inspect evidence, and understand durable constraints without increasing automation strength.

The default path remains CLI-first, explicit, local-only, preview-first where writes are possible, and no-network. This plan does not add blocking hooks, automatic doctor execution, continuation, LLM judging, or slash commands.

## Scope

### V20: path-scoped context and documentation map

- Promote `.ai-agent-playbook/context/` as a path-scoped project-memory area.
- Support context markdown frontmatter: `id`, `globs`, `alwaysApply`, `freshness`, and `priority`.
- Add `context list`, `context status`, and preview-first `context init`.
- Add `.ai-agent-playbook/maps/doc-map.md` as the durable documentation map.
- Include doc-map and context metadata in `operator context`.

### V21: runs evidence ledger

- Add `.ai-agent-playbook/runs/<run-id>/` for in-progress task state.
- Add `run start`, `run status`, `run record`, and `run summarize`.
- Keep `ledger.jsonl` append-only.
- Reject local absolute paths and credential-looking messages in run records.
- Keep worklogs as durable history; runs are active-task evidence.

### V22: contracts read-only layer

- Add `.ai-agent-playbook/contracts/` for active and pending business rules or invariants.
- Support contract frontmatter: `id`, `status`, `appliesTo`, `risk`, `approvedAt`, and `freshness`.
- Add `contracts list`, `contracts check`, and preview-first `contracts init`.
- Keep checks read-only: report stale, pending, missing-path, and missing-evidence signals without judging or blocking.

## Test Plan

- Add CLI fixture tests for context frontmatter matching, dry-run/no-write behavior, Windows-style path input, spaces, and non-ASCII paths.
- Add run ledger tests for dry-run, structure creation, append-only event recording, unsafe text rejection, status summary, and summarize preview.
- Add contract tests for active/pending listing, path matching, stale freshness, missing appliesTo paths, missing evidence, and no-write checks.
- Run the full repository test and validation suite before merge.

## Non-goals

- No hook installation.
- No blocking hook behavior.
- No automatic doctor execution.
- No continuation.
- No LLM judge.
- No network research.
- No replacement for worklogs.
