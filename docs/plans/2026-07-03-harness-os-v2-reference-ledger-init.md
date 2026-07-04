# AI Agent Playbook v2 Reference Ledger Init Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a preview-first scaffold command that creates a reference adoption ledger from a local reference adoption queue, so external harness and skill references can be tracked without copying raw reference content.

**Architecture:** Reuse `buildReferenceAdoptionQueue` and the existing ledger schema. Generate a Markdown ledger with `new` rows for queued reference candidates, target `.ai-playbook/knowledge/reference-adoption-ledger.md` by default, refuse overwrites, and write only when `--apply` is present.

**Tech Stack:** Dependency-free Node ESM catalog helper, existing CLI routing, Node tests, Markdown docs with Korean translations.

---

## Scope

This slice adds:

- `reference ledger-init <target> --reference-dir <dir>` CLI command.
- Dry-run result with planned ledger path, operation, and generated row count.
- `--apply` support that writes only a missing ledger inside the target repository.
- Tests for no-write preview, apply, overwrite refusal, and ledger-check compatibility.
- Command docs and Korean translations.

It does not update existing ledgers, merge decisions, write source registries, promote reference facts into memory, or add a project-write MCP tool.

## Tasks

### Task 1: Ledger Scaffold Model

- [x] Add a ledger initialization helper in the reference adoption catalog.
- [x] Reuse queue scoring and convert queued projects into compact `new` ledger rows.
- [x] Keep generated content free of absolute paths and raw excerpts.

### Task 2: Safety And Apply Semantics

- [x] Resolve the ledger path with the existing target-contained path rule.
- [x] Refuse to overwrite an existing ledger.
- [x] Keep preview mode read-only and write only on `--apply`.

### Task 3: CLI And Docs

- [x] Add `reference ledger-init <target> --reference-dir <dir> [--apply] [--json]`.
- [x] Update `docs/commands.md` and Korean translations.
- [x] Export the helper through the public harness facade.

### Task 4: Tests

- [x] Add CLI tests for dry-run no-write behavior.
- [x] Add CLI tests for apply, overwrite refusal, and `ledger-check` compatibility.
- [x] Add path safety coverage for custom `--path`.

### Task 5: Validate And Commit

- [x] Run syntax checks.
- [x] Run targeted CLI tests.
- [x] Run full validation before commit.
- [x] Stage explicit files, inspect staged diff, commit, and push.
