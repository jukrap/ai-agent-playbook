# Runtime Harness V16-V18 Quality and Analysis Track

**Goal:** Adapt useful quality and analysis ideas into this playbook without changing the default operator-controlled document and CLI harness.

**Architecture:** Keep skills as reusable guidance, CLI commands as explicit operator actions, and hooks as optional read-only reminders. Do not vendor external process packs or assume slash commands, plugin hooks, language servers, AST tools, network services, or automatic continuation.

## Summary

- V16 adds focused quality skills that can be installed through the existing skills lifecycle.
- V17 adds an explicit analysis layer only after its read-only behavior and tool availability story are clear.
- V18 considers optional hook reminders only after V16 and V17 prove useful with low noise in real projects.
- The combined track stays portable: no automatic doctor execution, no blocking hooks, no continuation, no hidden writes, and no network calls by default.

## Principles

- Prefer project instructions, actual code, and existing style before applying any quality checklist.
- Keep reusable skills short and trigger-focused; put checklists in one-level `references/`.
- Treat analysis tools as optional accelerators. Missing AST or LSP tooling must not make the playbook unusable.
- Use explicit CLI commands before hook promotion. A human should be able to inspect output before any file changes.
- Preserve behavior during cleanup work; require tests or concrete evidence when code is refactored.

## V16: Quality Skills

Add three installable skills under `skills/quality`:

- `frontend-ui-polish`: use when implementing or refining visible UI surfaces. It should adapt the current repository's design language, cover responsive and state behavior, and avoid generic decorative redesign.
- `cleanup-ai-slop`: use when cleaning AI-looking or low-trust code while preserving behavior. It should require a bounded scope, behavior lock, small diffs, and verification.
- `review-work-light`: use when reviewing recent implementation work without turning review into an automatic blocking gate. It should focus on regressions, missing tests, API/style drift, docs impact, and follow-up risk.

Update:

- `README.md`
- `docs/classification.md`
- Korean translations under `translations/ko`

Tests:

- `validate-skills.ps1`
- `validate-translations.ps1`
- existing Node checks and tests

## V17: Operator Analysis

Add explicit read-only analysis before any hook-driven diagnostic promotion.

Candidate shape:

- `operator analyze <target> [--path <file>] [--json]`
- optional future `operator structural-search <target> --pattern <pattern> [--lang <lang>] [--json]`
- optional future `operator lsp <target> --path <file> [--json]`

Rules:

- No language server or AST tool is installed automatically.
- Tool detection is read-only and local.
- If a tool is missing, return actionable setup guidance rather than failing the entire harness.
- Structural replacement stays out of scope until a preview-only contract exists.
- Rename or workspace-edit operations stay out of scope for the default CLI.

Initial useful outputs:

- detected languages and likely config files;
- local verification command candidates;
- relevant playbook context, rules, maps, and runbooks for a path;
- optional external-tool availability, version, and suggested next command;
- no writes and no project command execution unless the operator explicitly runs a separate command.

Tests:

- no-write fixtures with spaces, Windows-style paths, and non-ASCII paths;
- missing optional tool reports a warning, not a crash;
- path-scoped analysis includes matching rules and context when present;
- JSON schema assertions for every new output field.

## V18: Optional Hook Checks

Only consider hook integration after explicit commands prove useful and low-noise.

Candidate shape:

- opt-in `PostToolUse` reminder for edited files;
- opt-in comment-quality reminder;
- opt-in language diagnostic reminder that points to explicit CLI commands;
- no blocking feedback by default;
- no automatic doctor execution;
- no file writes;
- no network calls;
- quiet behavior for unsupported payloads, missing playbooks, unrelated tools, or missing optional analyzers.

Promotion criteria:

- explicit CLI checks have clear output and low false-positive rates;
- real-project smoke tests show the reminders reduce misses;
- hook output is short enough not to crowd native agent context;
- the same policy remains documented in `.ai-playbook/` or public docs, not only in runtime state.

## Additional Improvements

- Improve README skill catalog clarity whenever new quality skills are added.
- Keep installation docs clear about the difference between the npm package, installed skills, and target-project bootstrap.
- Keep Korean translations readable rather than literal when English source changes.
- Keep public docs free of private paths, branch names, PR numbers, credentials, company names, internal URLs, and external harness-specific assumptions.

## Out of Scope

- Slash commands.
- Packaging this repository as an agent plugin.
- Vendoring external process skill packs.
- Blocking hooks.
- Automatic continuation.
- Automatic doctor execution.
- AST rewrite or LSP rename operations.
- Network-backed code search.

## Verification

Run before merge:

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

Also run public documentation searches for private paths, branch names, PR numbers, credentials, company names, internal URLs, and external harness names before publishing or merging public docs.
