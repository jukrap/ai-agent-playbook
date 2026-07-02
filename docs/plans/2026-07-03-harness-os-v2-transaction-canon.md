# Harness OS V2 Transaction And Canon Implementation Plan

> **For implementers:** Execute this plan task by task. Keep each task separately reviewable and commit after a verified logical slice.

**Goal:** Turn the current Harness OS v2 preview surface into an evidence lifecycle with transaction handoffs, reference adoption validation, and explicit runtime-to-memory promotion.

**Architecture:** Keep the default harness read-only and local-first. Generated evidence stays under `.ai-playbook/runtime/`; trusted long-term facts move into `.ai-playbook/memory/` only through an explicit promotion command with reviewable source, scan range, confidence, and drift checks. MCP remains a discovery and read-only analysis surface until write tiers are explicitly enabled.

**Tech Stack:** Dependency-light Node ESM CLI, Node test runner, stdio MCP tools/resources/prompts, Markdown docs with Korean translations, PowerShell validation scripts.

---

## Current Baseline

- `reference inventory` summarizes local reference collections without copying large source contents.
- `reference ledger-check` validates adoption statuses and local-only leak patterns in `.ai-playbook/knowledge/reference-adoption-ledger.md`.
- `write-gate preview` returns a transaction id and planned runtime advisory path while staying read-only.
- MCP exposes read-only reference inventory, ledger validation, and reference adoption review prompt surfaces.
- Runtime output remains separated from human-trusted memory.

## Boundaries

- Do not add default network indexing.
- Do not expose project source rewriting through MCP.
- Do not make embeddings required.
- Do not copy raw upstream excerpts into public docs.
- Do not promote generated runtime reports into memory without an explicit command.
- Do not put local absolute paths, internal URLs, credentials, company names, branch names, or PR numbers in public docs.

## Task 1: Harden Reference Ledger Validation

**Files:**

- Modify: `src/catalog/reference-adoption.mjs`
- Modify: `src/cli.mjs`
- Modify: `src/mcp-tools.mjs`
- Modify: `docs/commands.md`
- Modify: `translations/ko/docs/commands.ko.md`
- Test: `test/cli.test.mjs`
- Test: `test/mcp.test.mjs`

**Steps:**

1. Add failing CLI tests for `reference ledger-check --strict`, custom `--path`, and capability-grouped summary.
2. Add MCP tests that `reference_ledger_check` returns the same grouped summary and still writes no files.
3. Run targeted tests:

   ```powershell
   node --test test/cli.test.mjs test/mcp.test.mjs
   ```

   Expected: new tests fail because strict mode and capability summary are not implemented yet.

4. Implement strict mode so oversized excerpts become conflicts instead of warnings only when `--strict` is present.
5. Parse capability/domain columns into a stable summary shape, keeping unknown columns tolerant.
6. Document the stricter behavior and custom ledger path option in English and Korean.
7. Re-run targeted tests.

   Expected: targeted tests pass and no files are written in read-only test cases.

8. Commit:

   ```powershell
   git add src/catalog/reference-adoption.mjs src/cli.mjs src/mcp-tools.mjs test/cli.test.mjs test/mcp.test.mjs docs/commands.md translations/ko/docs/commands.ko.md
   git commit
   ```

## Task 2: Add Write-Gate Advisory Save

**Files:**

- Modify: `src/operator/write-gate.mjs`
- Modify: `src/cli.mjs`
- Modify: `src/mcp-tools.mjs`
- Modify: `docs/commands.md`
- Modify: `translations/ko/docs/commands.ko.md`
- Test: `test/cli.test.mjs`
- Test: `test/mcp.test.mjs`

**Steps:**

1. Add failing tests for a new `write-gate advisory <target>` command that previews by default and writes only with `--apply`.
2. Assert advisory writes are rejected unless the target path resolves inside `.ai-playbook/runtime/reports/write-gate/`.
3. Assert MCP does not expose the apply-capable command by default.
4. Run targeted tests:

   ```powershell
   node --test test/cli.test.mjs test/mcp.test.mjs
   ```

   Expected: tests fail because advisory save does not exist yet.

5. Implement the command by reusing the existing preview engine and transaction id shape.
6. In dry-run mode, return the planned advisory JSON without writing.
7. In `--apply` mode, write the advisory only under playbook runtime and include an audit-friendly manifest section with schema version, target, intent, scan range, warnings, blockers, and generated timestamp.
8. Update docs and translations.
9. Re-run targeted tests, then `npm run check`.

   Expected: targeted tests and syntax checks pass.

10. Commit the write-gate advisory slice.

## Task 3: Add Post-Write Check

**Files:**

- Modify: `src/operator/write-gate.mjs`
- Modify: `src/operator/preflight-delta.mjs` if reusable diff logic is needed
- Modify: `src/cli.mjs`
- Modify: `docs/commands.md`
- Modify: `translations/ko/docs/commands.ko.md`
- Test: `test/cli.test.mjs`

**Steps:**

1. Add failing tests for `write-gate post-check <target> --advisory <path>`.
2. Assert missing or mismatched advisory paths produce `unknown` instead of false certainty.
3. Assert the command reports changed, added, deleted, and out-of-scope paths when advisory file snapshots exist.
4. Run targeted CLI tests.

   Expected: tests fail because post-check does not exist yet.

5. Implement read-only post-check from the saved advisory file.
6. Preserve scan range and confidence wording from the advisory rather than inferring total project coverage.
7. Update docs and translations.
8. Re-run targeted tests, `npm run check`, and `npm test`.
9. Commit the post-check slice.

## Task 4: Introduce Canon Draft And Check

**Files:**

- Create: `src/memory/canon.mjs`
- Modify: `src/harness.mjs`
- Modify: `src/cli.mjs`
- Modify: `src/mcp-tools.mjs`
- Modify: `docs/playbook-layout-v2.md`
- Modify: `docs/commands.md`
- Modify matching Korean translations
- Test: `test/cli.test.mjs`
- Test: `test/mcp.test.mjs`
- Test: `test/module-boundaries.test.mjs`

**Steps:**

1. Add failing tests for `canon draft <target>` using existing runtime reports and file inventory.
2. Add failing tests for `canon check <target>` against promoted facts with missing, stale, changed, and unverified states.
3. Keep `canon draft` read-only and return proposed facts only.
4. Implement a minimal fact schema:

   ```json
   {
     "id": "route.auth.login",
     "kind": "route-api-hint",
     "sourceReport": ".ai-playbook/runtime/reports/example.json",
     "scanRange": ["src/**"],
     "confidence": "medium",
     "observedAt": "YYYY-MM-DD"
   }
   ```

5. Implement read-only drift checks against the current target files and available runtime reports.
6. Expose `canon_check` in MCP as read-only; keep promotion write tools out of MCP for this task.
7. Update docs and translations.
8. Run:

   ```powershell
   npm run check
   npm test
   .\scripts\validate-translations.ps1
   ```

   Expected: all pass.

9. Commit the canon read-only slice.

## Task 5: Add Canon Promotion Preview

**Files:**

- Modify: `src/memory/canon.mjs`
- Modify: `src/cli.mjs`
- Modify: `docs/commands.md`
- Modify matching Korean translations
- Test: `test/cli.test.mjs`

**Steps:**

1. Add failing tests for `canon promote <target> --source <runtime-report> --to <memory-path>` preview mode.
2. Assert default mode does not write files and rejects promotion destinations outside `.ai-playbook/memory/` or `.ai-playbook/knowledge/references/`.
3. Add `--apply` tests only after preview behavior is stable.
4. Implement preview output with proposed file path, source report, fact ids, warnings, and conflicts.
5. Implement `--apply` only for reviewed facts and only inside allowed memory/knowledge paths.
6. Add a compact audit note in the promoted file frontmatter or metadata block.
7. Run targeted tests and full checks.
8. Commit the promotion slice.

## Task 6: Add Backend And Security Capability Pack

**Files:**

- Create or modify primary skills under `skills/backend/`, `skills/security/`, and `references/stacks/`
- Modify compatibility wrappers only when existing skill names require routing
- Modify `docs/skill-taxonomy-v2.md`
- Modify `README.md` if public category counts or examples change
- Modify matching Korean translations
- Test: skill validation scripts

**Steps:**

1. Inventory existing backend/security skills and wrappers with `catalog check`.
2. Add primary skills for API contract review, auth/authz review, dependency and SBOM/license review, backend change safety, and server-rendered flow safety.
3. Move stack-specific details to references for Java, Kotlin, Go, Python, Node, .NET, and PHP.
4. Keep `SKILL.md` trigger-focused and route deeper procedures to one-level references.
5. Update Korean skill translations and reference translations.
6. Run:

   ```powershell
   .\scripts\validate-skills.ps1
   .\scripts\validate-translations.ps1
   .\scripts\sync-skills.ps1 -WhatIf
   ```

   Expected: skill and translation validation pass.

7. Commit the capability pack slice.

## Final Verification For This Plan

Run after all completed slices:

```powershell
npm run check
npm test
.\scripts\validate-skills.ps1
.\scripts\validate-translations.ps1
.\scripts\sync-skills.ps1 -WhatIf
.\install.ps1 -SkipValidation -WhatIf
.\update.ps1 -SkipValidation -WhatIf
git diff --check
```

Expected: all checks pass, staged files contain only the intended Harness OS transaction, canon, skill, MCP, docs, and translation changes.
