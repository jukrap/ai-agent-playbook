# AI Agent Playbook v2 Reference Source Registry Update

**Goal:** Add a preview-first update command that appends missing local reference source entries to an existing `.ai-agent-playbook/knowledge/sources.json` registry.

**Why now:** `reference source-registry-preview` can generate candidate registry entries, but bootstrapped projects need a safe apply path that preserves existing source decisions and only adds new reference collections discovered from `_reference`.

**Architecture:** Reuse the reference adoption queue and source registry entry shape. Read the existing registry, validate it, append only candidate source ids not already present, validate the merged registry, and write only when `--apply` is present. Keep MCP write access behind `--enable-write-tools` and `apply: true`.

## Scope

- `reference source-registry-update <target> --reference-dir <dir>` CLI command.
- `updateReferenceSourceRegistry` helper exported through the public harness facade.
- Read-only MCP preview tool plus opt-in write MCP tool.
- Tests for preview, apply, idempotent second run, path safety, malformed referenceDir handling, and MCP permission behavior.
- English and Korean command documentation.
- Source registry schema duplicate-id guard so update cannot write a registry that later fails operational source checks.

## Non-Goals

- Do not overwrite or reorder existing source entries.
- Do not fetch or inspect network sources.
- Do not promote source registry entries into memory automatically.
- Do not copy raw reference content into `sources.json`.

## Implementation Checklist

- [x] Review current source registry preview/check behavior.
- [x] Add append-only source registry update helper with structured conflicts.
- [x] Add CLI routing, help text, and JSON/non-JSON output.
- [x] Add MCP read-only preview and opt-in write tool registration.
- [x] Add CLI and MCP tests for no-write preview, apply, idempotency, and permission gating.
- [x] Add schema-level duplicate source id validation and runtime documentation.
- [x] Update command docs and Korean translation.
- [x] Run full validation.
- [x] Commit and push this slice.

## Verification

- `npm run check`
- `npm test`
- `.\scripts\validate-skills.ps1`
- `.\scripts\validate-translations.ps1`
- `.\scripts\validate-public-docs.ps1`
- `.\scripts\sync-skills.ps1 -WhatIf`
- `.\install.ps1 -SkipValidation -WhatIf`
- `.\update.ps1 -SkipValidation -WhatIf`
- `git diff --cached --check`
