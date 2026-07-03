# Harness OS v2 Reference Source Registry Module Split Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split source registry preview/check behavior out of the growing reference adoption module so reference inventory, adoption queue, ledger validation, and source registry operations have clearer boundaries.

**Architecture:** Keep `src/catalog/reference-adoption.mjs` focused on local reference inventory, adoption queue scoring, and adoption ledger checks. Move `buildReferenceSourceRegistryPreview` and `checkReferenceSourceRegistry` into a new `src/catalog/reference-source-registry.mjs` module that imports the queue builder and runtime schema validator. Preserve public facade exports and CLI/MCP behavior.

**Tech Stack:** Dependency-free Node ESM modules, existing CLI/MCP registration, Node tests, package syntax check, Markdown docs with Korean translations.

---

## Scope

This slice changes structure only:

- Add `src/catalog/reference-source-registry.mjs`.
- Move source registry preview/check helpers from `reference-adoption.mjs`.
- Keep CLI and MCP command/tool names unchanged.
- Update `package.json` check coverage for the new module.
- Add this plan and Korean translation.

It does not change command output shape, adoption queue scoring, source registry schema, MCP permission tiers, or reference content scanning behavior.

## Tasks

### Task 1: Plan And Review

- [x] Confirm recent reference/source-registry tests pass before changing structure.
- [x] Identify the functions and helpers to move without changing behavior.

### Task 2: Module Split

- [x] Create `src/catalog/reference-source-registry.mjs`.
- [x] Move `buildReferenceSourceRegistryPreview`, `checkReferenceSourceRegistry`, and source registry helper functions.
- [x] Remove source-registry-only imports and constants from `reference-adoption.mjs`.
- [x] Preserve facade exports from `src/harness.mjs`.

### Task 3: Tooling And Tests

- [x] Add the new module to `npm run check`.
- [x] Run targeted syntax checks for changed modules.
- [x] Run targeted CLI/MCP/module-boundary tests.
- [x] Run full validation before commit.

### Task 4: Commit

- [x] Stage explicit files only.
- [x] Inspect staged diff and whitespace.
- [x] Commit and push to the existing feature branch.
