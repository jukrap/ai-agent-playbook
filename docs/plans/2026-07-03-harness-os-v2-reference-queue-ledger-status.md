# AI Agent Playbook v2 Reference Queue Ledger Status Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let `reference adoption-queue` distinguish new reference candidates from entries already reviewed, adopted, deferred, or rejected in a reference adoption ledger.

**Architecture:** Extend the existing ledger parser to expose compact row details keyed by reference id. Add an optional ledger path to the adoption queue builder, CLI, and MCP tool. When present, queue items receive `ledgerStatus`, `ledgerCapability`, and `ledgerDecisionDate`, while summaries include status counts. Keep default queue behavior unchanged when no ledger is supplied.

**Tech Stack:** Dependency-free Node ESM catalog helper, existing CLI/MCP registration, Node tests, Markdown docs with Korean translations.

---

## Scope

This slice adds:

- Optional `--ledger <ledger.md>` support for `reference adoption-queue`.
- Optional `ledgerPath` argument for the `reference_adoption_queue` MCP tool.
- Queue item annotations from the adoption ledger.
- Summary counts for queued items by ledger status.
- Tests, command docs, and Korean translations.

It does not write ledgers, filter queue items by default, copy reference contents, change scoring weights, or require a ledger for basic queue use.

## Tasks

### Task 1: Ledger Detail Model

- [x] Extend ledger row parsing to return reference id, status, capability, and decision date.
- [x] Build a compact ledger index keyed by normalized reference id.
- [x] Preserve existing `reference ledger-check` behavior and output shape.

### Task 2: Queue Annotation

- [x] Add optional ledger support to `buildReferenceAdoptionQueue`.
- [x] Annotate queue items when a matching ledger entry exists.
- [x] Return ledger status counts in queue summary.
- [x] Keep no-ledger output compatible.

### Task 3: CLI And MCP

- [x] Add `--ledger <ledger.md>` to the CLI command.
- [x] Add optional `ledgerPath` to the MCP tool schema.
- [x] Keep all paths read-only and local.

### Task 4: Tests And Docs

- [x] Extend CLI tests for annotated queue output.
- [x] Extend MCP tests for optional ledger annotation.
- [x] Update `docs/commands.md` and Korean translations.

### Task 5: Validate And Commit

- [x] Run syntax checks.
- [x] Run targeted CLI/MCP tests.
- [x] Run full validation before commit.
- [x] Stage explicit files, inspect staged diff, commit, and push.
