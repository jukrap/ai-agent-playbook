# Harness OS v2 Reference Source Registry Preview Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bridge the local reference adoption queue into a safe, no-write `knowledge/sources.json` candidate so external harness material can be tracked as source metadata without copying upstream prose or leaking local paths.

**Architecture:** Reuse `reference adoption-queue` scoring. Transform selected queue items into compact source registry entries with relative locators, privacy boundary, freshness, promotion policy, caveats, and representative candidate files. Expose the preview through CLI and MCP as read-only evidence.

**Tech Stack:** Dependency-free Node ESM catalog helper, existing CLI/MCP registration, runtime source registry schema, Node tests, Markdown docs with Korean translations.

---

## Scope

This slice adds:

- `reference source-registry-preview <reference-dir>` CLI command.
- `reference_source_registry_preview` MCP read-only tool.
- Source registry candidate output compatible with the existing `runtime.source-registry` validator.
- A fix for `reference inventory` default scanning so local reference collections over 20 projects are not silently truncated.
- Command/MCP docs and Korean translations.

It does not write `.ai-playbook/knowledge/sources.json`, promote references into memory, copy raw upstream text, read network sources, or generate embeddings.

## Tasks

### Task 1: Inventory Default Guard

- [x] Keep `reference inventory` default scan aligned with the catalog default project cap.
- [x] Add regression coverage for more than 20 top-level reference projects.

### Task 2: Source Registry Preview Model

- [x] Build source registry candidate entries from adoption queue items.
- [x] Keep entry locators relative to the scanned reference root.
- [x] Include privacy, credential boundary, freshness, promotion policy, caveats, capability hints, and representative files.
- [x] Validate generated registry shape against the existing source registry schema.

### Task 3: CLI And MCP

- [x] Add `reference source-registry-preview <reference-dir> [--max-results N] [--json]`.
- [x] Add default read-only MCP tool `reference_source_registry_preview`.
- [x] Keep the command and tool local-only, network-free, and no-write.

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
