# Capability Ledger Schema

A capability witness is a small, append-only runtime fact. It records what the harness actually checked, what happened, and whether the result is comparable with previous runs.

## Entry Shape

Each entry should include:

- `schemaVersion`: artifact schema version.
- `kind`: `runtime.capability-witness`.
- `capabilityId`: stable lowercase hyphenated capability id.
- `checkId`: command, recipe, MCP prompt, schema check, browser check, or manual witness id.
- `timestamp`: ISO timestamp when the check completed.
- `targetVersion`: commit, package version, skill version, prompt hash, or command version.
- `environment`: OS, shell, Node/Python/runtime version, package manager, and important feature flags.
- `status`: `pass`, `fail`, `degraded`, `skipped`, or `unknown`.
- `durationMs`: elapsed check time when measured.
- `summary`: one short factual result.
- `artifacts`: portable paths to logs, reports, screenshots, JSON, or command output summaries.
- `baseline`: baseline id or previous comparable witness entry.
- `caveats`: missing dependency, partial coverage, network dependency, manual step, or non-comparable environment.

## Status Semantics

- `pass`: the check ran and met the stated expectation.
- `fail`: the check ran and did not meet the stated expectation.
- `degraded`: the core capability works, but latency, coverage, warnings, fallback mode, or partial behavior regressed.
- `skipped`: the check did not run because a declared prerequisite was missing.
- `unknown`: the check output is insufficient to classify the capability.

Never collapse `skipped`, `degraded`, or `unknown` into `pass`.

## Ledger Rules

- Append new entries; do not rewrite history except to remove accidentally committed sensitive data.
- Keep generated ledgers in `.ai-playbook/runtime/reports/capabilities/` or `.ai-playbook/runtime/indexes/`.
- Promote only reviewed summaries or durable decisions into `.ai-playbook/memory/`.
- Use portable project-relative artifact paths.
- Do not store credentials, tokens, personal absolute paths, internal URLs, branch names, PR numbers, or raw private logs in public documentation.
- Record read-only witnesses separately from write-capability witnesses so default harness behavior remains safe.

## Minimal Report

A reader-facing capability status report should show:

- current status per capability,
- last comparable pass,
- first failing or degraded version when known,
- skipped or unknown reasons,
- affected OS/runtime scope,
- artifact links, and
- suggested next check.
