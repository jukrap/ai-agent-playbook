# Harness OS v2 Source Registry Check Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only check for `.ai-playbook/knowledge/sources.json` so reference source metadata can be validated after preview or manual adoption.

**Architecture:** Reuse the existing runtime source registry schema validator, then add source-specific operational checks: duplicate ids, stale freshness values, optional local reference path existence, and representative file drift. Keep the check local-only and no-write.

**Tech Stack:** Dependency-free Node ESM catalog helper, existing CLI/MCP registration, runtime source registry schema, Node tests, Markdown docs with Korean translations.

---

## Scope

This slice adds:

- `reference source-registry-check <target>` CLI command.
- `reference_source_registry_check` MCP read-only tool.
- Validation of schema shape, duplicate source ids, status/privacy/type summaries, stale freshness, and optional reference directory drift.
- Command/MCP docs and Korean translations.

It does not write `sources.json`, apply preview output, promote sources into memory, read network sources, or inspect raw upstream content beyond existence checks for registered relative paths.

## Tasks

### Task 1: Check Model

- [x] Resolve the source registry from `.ai-playbook/knowledge/sources.json` by default.
- [x] Accept an optional source registry path inside the target project.
- [x] Reuse the existing `runtime.source-registry` validator.
- [x] Count source status, privacy tier, and type.
- [x] Report duplicate ids and stale or malformed freshness values.
- [x] When `--reference-dir` is provided, check registered `referencePath` and representative files without reading their contents.

### Task 2: CLI And MCP

- [x] Add `reference source-registry-check <target> [--path <sources.json>] [--reference-dir <dir>] [--json]`.
- [x] Add default read-only MCP tool `reference_source_registry_check`.
- [x] Keep the command and tool local-only, network-free, and no-write.

### Task 3: Tests

- [x] Extend CLI tests for valid registry checks and reference path drift.
- [x] Extend MCP tests for tool exposure and read-only source registry checks.

### Task 4: Docs

- [x] Update `docs/commands.md`.
- [x] Update `docs/mcp-permission-model.md`.
- [x] Update Korean translations.

### Task 5: Validate And Commit

- [x] Run syntax checks.
- [x] Run targeted CLI/MCP/runtime schema tests.
- [x] Run translation and public-doc validation.
- [x] Run full test suite if targeted checks pass.
- [x] Stage explicit files, inspect staged diff, commit, and push.
