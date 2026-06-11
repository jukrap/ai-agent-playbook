# Runtime Roadmap

This roadmap describes how to strengthen the current document and CLI harness while adding optional runtime hook layers as thin adapters.

The default path stays simple: install skills, bootstrap `.ai-playbook/` when a target project needs it, run `doctor`, create plans and worklogs in predictable locations, and keep project rules explicit in files. Runtime hooks are an optional extension for environments that support them.

## Goals

- Make the document harness safer before adding runtime automation.
- Keep the CLI deterministic, dependency-light, and file-system focused.
- Preserve portability across agents by keeping runtime-specific behavior outside default templates.
- Let future hook-based integrations inject context or reminders without rewriting tool output or changing project files automatically.

## Current Strengths

- `bootstrap` creates a thin root `AGENTS.md` and a project-memory `.ai-playbook/` folder without assuming a stack.
- `doctor` already checks minimum layout, root policy placement, local-only policy, template adaptation, worklog summary freshness, obsolete skill references, and fixed local paths.
- `guides sync` adds missing guide templates without replacing local edits by default, and `guides sync --check --json` reports stale guides with source and target hashes.
- `plan`, `worklog`, and `worklog summarize` keep active plans, detailed history, and monthly summaries in predictable paths.
- The installer and updater use managed markers and hashes so local skill edits and unmanaged same-name skills are not overwritten silently.
- `doctor --json`, `doctor --reminder --json`, `guides sync --check --json`, `context --json`, `adapter config --json`, and `adapter check --json` provide a small machine-readable core for future adapters.

## Document Harness Hardening

Keep improving these areas before making hooks part of any default install path:

- Keep `doctor` check ids, severity, actionable messages, and strict/non-strict exit behavior stable.
- Keep `doctor` warning categories separated into setup health, adaptation reminders, local-only policy, and public-safety findings.
- Keep `bootstrap` dry-run first for existing projects and make conflict output easy to copy into a migration note.
- Keep `--force` scoped to reviewed overwrites; do not use broad force as a migration strategy.
- Maintain the guide manifest so `guides sync --check --json` can report stale guides without overwriting project-specific edits.
- Make migration from existing agent docs preserve history, classify current rules, and record remaining uncertainty in `.ai-playbook/questions.md`.
- Treat `worklog summarize` as a promotion checkpoint: durable facts belong in `CURRENT.md`, maps, runbooks, or decisions, not only in history.

## Optional Runtime Layers

Runtime hooks should be designed as thin adapters over the document harness:

- **Plugin shell:** an opt-in package or adapter folder, never part of the default installer until the project has a stable contract.
- **Session hooks:** `SessionStart` may load compact project reminders from `.ai-playbook/` when native agent context is not enough. `UserPromptSubmit` stays opt-in and emits only short guardrail reminders for handoff-like prompts.
- **Post-edit hooks:** `PostToolUse` stays opt-in and may inject file-specific reminders after successful edit-like operations when changed paths can be read. It should not rewrite tool output or edit files.
- **Compaction hooks:** `PostCompact` may reintroduce compact playbook context after context compaction.
- **Rules loader:** load portable rule sources from project playbook files and optional rule folders. Do not re-inject `AGENTS.md` by default when the agent already loads it natively.
- **Context injector:** emit additional context through the runtime's supported hook JSON contract and keep debug logs on stderr.
- **Doctor reminder:** prefer the small `doctor --reminder --json` signal or a short reminder to run `doctor`; avoid automatic full checks on every session until cost and noise are proven acceptable.
- **Command layer:** keep `node .\bin\ai-playbook.mjs ...` as the stable invocation. Global commands and plugin commands are conveniences only.

## Risks of Going Runtime-First

- Hook APIs and plugin installation behavior vary by agent and app version.
- Native project instructions and hook-injected context can duplicate or contradict each other.
- Automatic checks can be noisy, slow, or run from the wrong working directory.
- Plugin installers may change user configuration, which is a higher-risk operation than copying project templates.
- Public docs can accidentally hard-code one external harness model instead of preserving portable playbook principles.
- Runtime state can hide decisions that should remain visible in `.ai-playbook/`.

## Boundary

- The document harness owns project memory, source-of-truth rules, migrations, worklogs, and explicit verification commands.
- The CLI owns deterministic scaffolding, health checks, guide synchronization, and predictable file creation.
- Optional runtime hooks may remind, inject context, deduplicate repeated guidance, or report diagnostics.
- Optional runtime hooks must not become the only place where project policy exists.
- Skills remain reusable working guides; templates remain project-copyable standing instructions.

## Codex App Constraints

For Codex App compatibility, any future plugin or hook proof of concept should:

- run with Node and avoid shell-specific features where possible;
- keep hook commands short-lived with conservative timeouts;
- write hook JSON only to stdout and debug information only to stderr;
- handle Windows paths, spaces, and non-ASCII project paths;
- avoid global command requirements;
- avoid network calls by default;
- use environment variables for opt-in behavior;
- degrade silently or with a small reminder when plugin hooks are unavailable.

## Adapter PoC

The first adapter proof of concept is intentionally read-only:

- `adapters/codex/hook.mjs` emits `hookSpecificOutput.additionalContext` for `SessionStart` and `PostCompact`.
- `adapters/claude-code/hook.mjs` uses the same core context builder for Claude Code's hook JSON contract.
- Both wrappers call the shared `context` core, never edit project files, never call the network, and stay silent when `.ai-playbook/` is missing.
- Example hook settings live beside each adapter and are not installed automatically.
- `adapter config` renders reviewable local settings with this checkout's hook path, without writing files or requiring `.ai-playbook/` to exist first.
- `adapter check` verifies the read-only wrapper, example settings, supported hook events, and quiet unsupported paths before a user enables an adapter manually.
- `adapter check --settings <path>` validates a manually edited local settings file without writing files.
- `AI_PLAYBOOK_HOOK_EVENTS` can opt in `UserPromptSubmit`, `PostToolUse`, and `Stop` reminders. They stay quiet for unrelated prompts, missing playbooks, unsupported payloads, and non-edit tools.
- `Stop` is a non-blocking handoff reminder only; it does not request continuation or run doctor.

## Next Intermediate Steps

These can be implemented before a full plugin exists:

- For a concrete V4+ execution plan and next-session handoff, see `docs/plans/2026-06-11-runtime-harness-v4-plus.md`.
- Better bootstrap conflict reports for existing projects.
- Verify in real projects whether rendered adapter settings reduce setup mistakes without adding noise.
- Candidates still requiring caution: continuation, blocking feedback, and any automatic doctor execution after cost and noise are proven acceptable.

## Process Skill Compatibility

External process skills can decide how an agent plans, tests, debugs, reviews, and finishes branches. This playbook should provide repository guardrails: project memory, bootstrap, doctor checks, skill policy, Git/worklog policy, and migration guidance.

Runtime hooks must follow the same split. They may reinforce repository guardrails, but they should not replace a process skill's planning, TDD, debugging, or review workflow.

## Verification Strategy

For roadmap and document changes:

```powershell
npm run check
npm test
.\scripts\validate-skills.ps1
.\scripts\validate-translations.ps1
.\scripts\sync-skills.ps1 -WhatIf
```

For future CLI changes, add Node tests for every new option, output shape, overwrite rule, or path convention.

For future runtime hook proof of concepts, add fixture-based smoke tests for each hook payload and verify that hooks emit only supported JSON, do not edit files, and respect opt-out configuration.
