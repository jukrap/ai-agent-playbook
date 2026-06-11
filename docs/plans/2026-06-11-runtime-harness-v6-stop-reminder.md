# Runtime Harness V6 Stop Reminder Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a narrow, opt-in `Stop` lifecycle reminder without adding blocking, continuation, automatic doctor execution, or file writes.

**Architecture:** Keep the document and CLI harness as the stable core. Extend the shared adapter hook event allowlist so `Stop` can emit the same hook JSON shape as other reminders only when explicitly enabled. Keep blocking and continuation deferred because the current runtime contract does not need them for this low-noise reminder.

**Tech Stack:** Dependency-free Node ESM, Node test runner, Markdown docs with Korean translations, PowerShell validation scripts.

---

## Boundaries

- `Stop` is disabled by default.
- `Stop` is enabled only through `AI_PLAYBOOK_HOOK_EVENTS`.
- `Stop` emits no output when the target has no `.ai-playbook/` or compatible legacy playbook.
- `Stop` does not run `doctor`, block the hook, request continuation, write files, rewrite tool output, or call the network.
- Public docs must not include private paths, branch names, pull request numbers, credentials, company names, or internal URLs.

## Task 1: Add Failing Stop Reminder Tests

**Files:**

- Modify: `test/adapters.test.mjs`

**Steps:**

1. Add a test that `Stop` is quiet without `AI_PLAYBOOK_HOOK_EVENTS`.
2. Add a test that `Stop` emits valid hook JSON when `AI_PLAYBOOK_HOOK_EVENTS=Stop` and the target has a playbook.
3. Add a test that missing playbook targets stay quiet.
4. Assert no files are written by comparing file lists before and after.

**Run:**

```powershell
npm test
```

**Expected:** The new Stop tests fail because `Stop` is not supported yet.

## Task 2: Implement Minimal Stop Reminder

**Files:**

- Modify: `adapters/shared/context-hook.mjs`

**Steps:**

1. Add `Stop` to optional reminder events.
2. Route `Stop` to a dedicated reminder function.
3. Return a short hook JSON reminder only when `hasPlaybook(target)` is true.
4. Keep the message generic: summarize state only if useful, run `doctor` manually if needed, and record durable handoff facts in worklog/current docs.

**Run:**

```powershell
npm test
```

**Expected:** Stop tests pass and existing hook tests remain green.

## Task 3: Update Docs And Translations

**Files:**

- Modify: `docs/harness-runtime.md`
- Modify: `docs/runtime-roadmap.md`
- Modify: `adapters/codex/README.md`
- Modify: `adapters/claude-code/README.md`
- Modify matching files under `translations/ko/`

**Steps:**

1. Document `Stop` as opt-in only.
2. State that it is a reminder, not blocking or continuation.
3. Keep `UserPromptSubmit` and `PostToolUse` wording intact.
4. Update Korean translations with the English source edits.

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

**Expected:** All checks pass. Stage only the V6 files and commit.
