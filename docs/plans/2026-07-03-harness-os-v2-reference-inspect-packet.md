# AI Agent Playbook v2 Reference Inspect Packet

**Goal:** Add a read-only `reference inspect` surface that turns one local reference collection into a compact review packet for adoption work.

**Why now:** Inventory, queue, ledger, and source registry commands can identify useful references, but an operator still needs a safe way to open one candidate without copying raw upstream content or manually rediscovering which files matter.

**Architecture:** Reuse the existing reference project analyzer and queue scoring. Resolve a single top-level project under the reference root, reject unsafe paths, return signal highlights, recommended capability areas, next adoption actions, and a small read order from representative file paths. Keep the output local-only, no-network, no-write, and source-backed by relative paths.

## Scope

- `reference inspect <reference-dir> --project <name>` CLI command.
- `inspectReferenceProject` helper exported through the public harness facade.
- Default read-only MCP tool `reference_inspect`.
- Compact review packet with project summary, signal highlights, recommended capabilities, read order, adoption questions, and next actions.
- English and Korean command/MCP documentation.
- CLI/MCP tests for success, path traversal rejection, missing project handling, and no-write behavior.

## Non-Goals

- Do not read or emit raw source file contents.
- Do not write adoption ledger rows or source registry entries.
- Do not inspect nested arbitrary paths outside one top-level reference collection.
- Do not decide that a reference is trustworthy; the packet is only triage evidence.

## Implementation Checklist

- [x] Add safe single-project resolver under a reference root.
- [x] Reuse analyzer scoring to build a compact inspect packet.
- [x] Add CLI routing, help text, and JSON/non-JSON output.
- [x] Add MCP read-only tool registration.
- [x] Update command docs, MCP permission docs, and Korean translations.
- [x] Add CLI/MCP/module-boundary tests.
- [x] Run validation.
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
