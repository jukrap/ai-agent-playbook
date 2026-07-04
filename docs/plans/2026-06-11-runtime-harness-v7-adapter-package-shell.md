# Runtime Harness V7 Adapter Package Shell Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add optional adapter-local package shell entrypoints that expose hook, config, and check commands without installing plugins or mutating user settings.

**Architecture:** Keep the core CLI and document harness as the default path. Add a shared adapter shell runner under `adapters/shared/`, then tiny Codex and Claude Code entrypoints that bind the adapter name and hook runner. The shell calls existing core helpers and remains no-write except for whatever the invoked hook already avoids.

**Tech Stack:** Dependency-free Node ESM, Node test runner, Markdown docs with Korean translations, PowerShell validation scripts.

---

## Boundaries

- Do not add the shell to `install.ps1`, `update.ps1`, or `scripts/sync-skills.ps1`.
- Do not write local settings files or guess global settings paths.
- Do not create a real plugin package in V7.
- Do not add dependencies or global command requirements.
- Do not move project policy into adapter-only files.
- Keep public docs scrubbed of private paths, branch names, pull request numbers, credentials, company names, and internal URLs.

## Task 1: Add Failing Adapter Shell Tests

**Files:**

- Create: `test/adapter-shell.test.mjs`

**Steps:**

1. Test that the Codex shell `config` command renders placeholder-free config without writing files.
2. Test that the Claude Code shell `check` command passes on a bootstrapped target.
3. Test that the Codex shell `hook` command reads a fixture payload and emits valid hook JSON.
4. Test that unknown shell commands fail with a helpful message.

**Run:**

```powershell
npm test
```

**Expected:** Tests fail because the shell modules do not exist.

## Task 2: Implement Shared Shell Runner And Entrypoints

**Files:**

- Create: `adapters/shared/package-shell.mjs`
- Create: `adapters/codex/package.mjs`
- Create: `adapters/claude-code/package.mjs`
- Modify: `package.json`

**Steps:**

1. Implement a dependency-free argument parser for `hook`, `config`, and `check`.
2. For `hook`, read stdin JSON and call the adapter runner.
3. For `config`, call `renderAdapterConfig` with the fixed adapter name.
4. For `check`, call `checkAdapterReadiness` with the fixed adapter name.
5. Add the new shell modules to `npm run check`.

**Run:**

```powershell
npm run check
npm test
```

**Expected:** Shell tests pass and existing tests remain green.

## Task 3: Update Docs And Translations

**Files:**

- Modify: `docs/harness-runtime.md`
- Modify: `docs/runtime-roadmap.md`
- Modify: `adapters/codex/README.md`
- Modify: `adapters/claude-code/README.md`
- Modify matching files under `translations/ko/`

**Steps:**

1. Document the shell as optional and local.
2. Keep the stable default invocation as `node .\bin\aapb.mjs ...`.
3. State that package shell entrypoints are not installed automatically.
4. Update Korean translations with English edits.

**Run:**

```powershell
.\scripts\validate-translations.ps1
```

**Expected:** Translation validation passes.

## Task 4: Verify And Finish

**Run:**

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

Also run the public docs denylist and local absolute path searches from `docs/plans/2026-06-11-runtime-harness-v4-plus.md`.

**Expected:** All checks pass. Stage only V7 files and commit.
