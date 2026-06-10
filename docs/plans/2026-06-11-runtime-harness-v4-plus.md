# Runtime Harness V4+ Implementation Plan

> Recommended execution: use a fresh implementation branch and follow the repository verification checklist after each phase.

**Goal:** Extend the runtime harness beyond read-only adapter reminders without losing the current document-first, opt-in, no-network, no-hidden-policy boundary.

**Architecture:** Keep the CLI and `ai-playbook/` document harness as the stable core. Add runtime automation in layers: diagnostics first, local configuration helpers second, and only then carefully controlled blocking or continuation experiments. Every runtime behavior must be disabled by default unless the plan explicitly says otherwise.

**Tech Stack:** Dependency-free Node ESM, Node test runner, PowerShell validation scripts, Markdown source docs with Korean translations.

---

## Current Baseline

The repository already has:

- a deterministic CLI for `bootstrap`, `doctor`, `guides sync`, `context`, `adapter check`, plans, and worklogs;
- JSON schema version `1` for doctor, guide check, context, and adapter readiness;
- Codex and Claude Code read-only hook wrappers over a shared context runner;
- default hook events `SessionStart` and `PostCompact`;
- opt-in `UserPromptSubmit` and `PostToolUse` lifecycle reminders via `AI_PLAYBOOK_HOOK_EVENTS`;
- fixture coverage for supported hook output, quiet paths, spaces, non-ASCII paths, and no-write behavior.

The next work should not replace that baseline with a full runtime-first harness. It should make the document and CLI harness more observable, then make optional runtime use easier to verify.

## Non-Negotiable Boundaries

- Do not make hooks part of the default installer.
- Do not auto-edit project files from hooks.
- Do not rewrite tool output.
- Do not call the network from hooks or doctor checks.
- Do not re-inject root `AGENTS.md` by default.
- Do not put external harness names, personal paths, branch names, pull request numbers, credentials, company names, or internal URLs in public docs.
- Keep all new public English markdown paired with Korean translation files.
- Keep all CLI output schemas stable and versioned.
- Prefer warning/reminder behavior before blocking behavior.

## V4: Diagnostics And Freshness Layer

V4 should strengthen the core CLI before adding stronger hook behavior.

### V4 Goals

- Make stale project playbook material visible without overwriting local edits.
- Let hooks and setup scripts ask for a small, stable "should I remind the user?" signal.
- Add non-blocking freshness checks for worklogs and guide templates.
- Keep all new behavior read-only.

### V4 Scope

1. Guide manifest and stale guide reporting.
2. Worklog summary freshness checks.
3. Doctor reminder signal.
4. Documentation and project guide updates.

### V4 Task 1: Add Guide Manifest Support

**Files:**

- Create: `templates/project-playbook/guides/manifest.json`
- Modify: `src/harness.mjs`
- Modify: `test/cli.test.mjs`
- Modify: `docs/harness-runtime.md`
- Modify: `templates/project-playbook/guides/runtime-roadmap.md`
- Modify translations under `translations/ko/**`

**Design:**

- Add a manifest for guide template files with `schemaVersion`, guide `path`, and a stable content hash for the source template.
- Keep the manifest inside the source template guide folder so `guides sync --check` can compare source and target without writing.
- Extend `guides sync --check --json` guide entries from `{ path, status }` to include optional `sourceHash`, `targetHash`, and `status`.
- Keep existing `missing` and `present` status values.
- Add `stale` status when the target guide exists but differs from the source guide hash.
- Do not make stale guides fail by default until a clear migration policy exists. V4 can report `summary.stale` while `ok` only depends on missing guides, or add a `--strict` flag if stricter behavior is needed. Pick one behavior and test it.

**Tests:**

- Fresh bootstrap reports all guides `present` and `stale: 0`.
- Removing a guide reports `missing` and non-zero.
- Editing an existing guide reports `stale` without writing.
- `guides sync --check` does not overwrite local guide edits.
- Paths with spaces and non-ASCII characters still pass.

### V4 Task 2: Add Worklog Summary Freshness Checks

**Files:**

- Modify: `src/harness.mjs`
- Modify: `test/cli.test.mjs`
- Modify: `docs/harness-runtime.md`
- Modify translations under `translations/ko/**`

**Design:**

- Add doctor checks under category `freshness`.
- Detect months that have files under `ai-playbook/worklogs/YYYY-MM/*.md` but no corresponding `ai-playbook/worklogs/summaries/YYYY-MM.md`.
- Detect a summary file older than one or more worklog entries in the same month.
- Warn, not fail, in default doctor mode.
- Fail only in `doctor --strict` if the repository already treats all warnings as strict failures.
- Do not parse worklog content in V4; use filesystem shape and timestamps only.

**Tests:**

- No worklogs produces a pass or no-op check.
- Worklog without summary produces a warning.
- Summary newer than worklogs passes.
- Summary older than a worklog warns.
- `doctor --json` includes stable check ids and paths.

### V4 Task 3: Add A Doctor Reminder Signal

**Files:**

- Modify: `src/harness.mjs`
- Modify: `src/cli.mjs`
- Modify: `adapters/shared/context-hook.mjs`
- Modify: `test/cli.test.mjs`
- Modify: `test/adapters.test.mjs`
- Modify docs and translations.

**Design:**

- Prefer a CLI signal over automatic doctor execution from hooks.
- Add one of these, choosing the smaller implementation after inspecting current code:
  - `doctor <target> --reminder --json`, or
  - `harness reminder <target> --json`.
- The JSON should be small: `{ schemaVersion, ok, target, reminders[] }`.
- Reminder entries should include `{ id, level, message, paths }`.
- Use existing lightweight facts where possible: missing playbook, stale guides if V4 Task 1 exists, worklog freshness if V4 Task 2 exists, and public-safety failures if available without re-running expensive scans.
- Hooks may call this only when explicitly opted in and only if it stays fast. If it becomes expensive, keep it as a manual CLI command only.

**Tests:**

- Reminder JSON is stable.
- Missing playbook produces a setup reminder.
- Fresh playbook produces no reminder or a low-noise success object.
- Hook path remains quiet unless opted in.
- No files are written.

### V4 Task 4: Optional Stop Reminder Prototype

Only do this after Tasks 1-3 are reviewed.

**Files:**

- Modify: `adapters/shared/context-hook.mjs`
- Modify: `test/adapters.test.mjs`
- Modify adapter docs and translations.

**Design:**

- Add `Stop` as an opt-in event through `AI_PLAYBOOK_HOOK_EVENTS`.
- Keep it non-blocking.
- Do not request continuation.
- Do not execute doctor automatically.
- Output only a short reminder when the target has `ai-playbook/`.
- Use a cooldown or deterministic quiet path if the event would fire too often. If no reliable cooldown can be implemented without state files, do not add `Stop` yet.

**Tests:**

- `Stop` is quiet by default.
- `Stop` emits only when explicitly opted in.
- Missing playbook is quiet.
- Output is valid hook JSON.
- No files are written.

## V5: Local Adapter Configuration Layer

V5 is worthwhile only if users are actually enabling hooks manually and repeating setup mistakes.

### V5 Goals

- Make manual adapter setup easier without changing user configuration automatically.
- Keep generated configuration visible and reviewable.
- Support Codex and Claude Code without moving core policy into either adapter.

### V5 Scope

1. Add a read-only config rendering command.
2. Validate user-provided local settings paths when explicitly requested.
3. Improve adapter docs with copy-paste-safe setup flows.

### Suggested CLI

```powershell
node .\bin\ai-playbook.mjs adapter config <target> --adapter codex --json
node .\bin\ai-playbook.mjs adapter config <target> --adapter claude-code --json
node .\bin\ai-playbook.mjs adapter check <target> --adapter codex --settings <local-settings-path> --json
```

### V5 Boundaries

- Default command prints config; it does not write config.
- Any write mode must require an explicit flag, support dry-run, and confine writes to a user-provided local settings path.
- Do not guess global settings paths.
- Do not add global command requirements.
- Do not install plugins automatically.

### V5 Tests

- Config JSON renders with placeholder-free local paths when target and repo root are known.
- Settings validation handles missing files, malformed JSON, and matching hook commands.
- Windows, spaces, and non-ASCII paths are covered.
- No write happens unless a future explicit write flag is added.

## V6: Controlled Blocking And Continuation Experiment

V6 should be attempted only after V4 and V5 prove that reminders are useful and not noisy.

### V6 Goals

- Explore whether a hook can prevent common unsafe handoffs without trapping the user in loops.
- Keep blocking behavior opt-in, rare, explainable, and easy to disable.

### V6 Scope

1. Add an experimental blocking mode for high-confidence safety failures only.
2. Add strict cooldown and loop prevention.
3. Keep continuation out unless the target runtime has a clear, tested contract.

### Candidate Blocking Cases

- Public-safety failure: a staged or edited public doc contains a local absolute path.
- Missing required project playbook files when a hook is explicitly configured for a project.
- Commit or PR intent with unrun required verification, only if the signal is explicit and reliable.

### V6 Boundaries

- Disabled by default.
- Separate environment variable, for example `AI_PLAYBOOK_HOOK_BLOCKING=1`.
- Never block on subjective style preferences.
- Never block because warnings exist.
- Always include a clear bypass instruction.
- Never run network checks.
- Never edit files.

### V6 Tests

- Blocking off by default.
- Blocking emits only for high-confidence fixture cases.
- Cooldown prevents repeated identical blocking output.
- Missing or malformed payloads are quiet.
- No continuation happens unless explicitly added and fixture-tested.

## V7: Plugin Or Package Shell

V7 is optional. Do it only if local adapter setup becomes common enough that a package shell reduces real friction.

### V7 Goals

- Package the same core commands behind a thin runtime-specific shell.
- Keep project rules in `AGENTS.md` and `ai-playbook/`, not in plugin-only files.
- Keep adapter-specific files under `adapters/` or a clearly experimental package.

### V7 Scope

- Codex plugin proof of concept.
- Claude Code command or skill wrapper proof of concept.
- Smoke tests for packaged commands.
- Documentation that the package is optional.

### V7 Boundaries

- Do not include the plugin in default install scripts.
- Do not mutate user configuration without explicit consent.
- Do not make public docs depend on one agent runtime.
- Do not duplicate source policy into generated plugin files unless it is clearly derived from project docs.

## Not Recommended Yet

Avoid these until real usage shows the need:

- automatic doctor execution on every session start;
- automatic file rewrites from hooks;
- networked telemetry;
- central service dependency;
- runtime-only project policy;
- broad prompt rewriting;
- default blocking hooks.

## Verification For Every Phase

Run the repository checks after each phase:

```powershell
npm run check
npm test
.\scripts\validate-skills.ps1
.\scripts\validate-translations.ps1
.\scripts\sync-skills.ps1 -WhatIf
.\install.ps1 -SkipValidation -WhatIf
.\update.ps1 -SkipValidation -WhatIf
```

Also verify public-document hygiene:

```powershell
rg -n "<external-harness-denylist-pattern>" README.md docs templates skills translations\ko adapters -g "*.md" -g "*.json"
rg -n '[A-Za-z]:\\' README.md docs templates skills translations\ko adapters -g "*.md" -g "*.json"
```

Both searches should return no public default references.

## Recommended Next Chat Prompt

```text
Please continue the Runtime Harness V4 work in the ai-agent-playbook repository.

Start by checking branch/status/remotes and reading:
- AGENTS.md
- docs/maintenance.md
- docs/harness-runtime.md
- docs/runtime-roadmap.md
- docs/plans/2026-06-11-runtime-harness-v4-plus.md
- adapters/codex/README.md
- adapters/claude-code/README.md
- adapters/shared/context-hook.mjs
- src/harness.mjs
- src/cli.mjs
- src/adapter-readiness.mjs
- test/cli.test.mjs
- test/adapters.test.mjs

Goal:
- Implement V4 diagnostics and freshness first.
- Do not jump directly to blocking hooks or automatic doctor execution.
- Keep the document and CLI harness as the default path.
- Keep runtime hooks opt-in, read-only by default, no-network, and quiet unless the relevant signal is strong.

Recommended V4 order:
1. Create a fresh implementation branch.
2. Add guide manifest and stale guide reporting to `guides sync --check --json`.
3. Add worklog summary freshness warnings to `doctor --json`.
4. Add a small doctor reminder signal only if it can stay cheap and read-only.
5. Consider `Stop` reminder only after the first three tasks pass and remain low-noise.

Required tests:
- Existing tests must still pass.
- Add fixture tests for missing/present/stale guides.
- Add fixture tests for worklog summary freshness.
- Add JSON schema assertions for any new output fields.
- Confirm all check commands remain no-write.
- Cover Windows path, spaces, and non-ASCII path cases where relevant.

Required validation:
- `npm run check`
- `npm test`
- `.\scripts\validate-skills.ps1`
- `.\scripts\validate-translations.ps1`
- `.\scripts\sync-skills.ps1 -WhatIf`
- `.\install.ps1 -SkipValidation -WhatIf`
- `.\update.ps1 -SkipValidation -WhatIf`
- public docs external harness denylist and local path searches from the plan

Boundaries:
- Do not put external harness names, personal paths, branch names, PR numbers, credentials, company names, or internal URLs in public docs.
- Update Korean translations with English source edits.
- Do not edit installed local skill copies.
- Use explicit staging and do not revert unrelated changes.
```
