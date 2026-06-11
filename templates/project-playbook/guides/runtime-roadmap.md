# Runtime Roadmap Guide

Use this guide when a project already has `.ai-playbook/` and you are deciding whether to keep the document harness only or add optional runtime hooks.

The default answer should be document harness first. Runtime hooks are useful only when the project benefits from automatic reminders or context injection and the agent environment supports those hooks reliably.

## Start With the Document Harness

Before considering hooks:

- Run `doctor` and record remaining warnings.
- Adapt `START_HERE.md`, `CURRENT.md`, and `questions.md` so they no longer contain template prompts.
- Decide whether `.ai-playbook/` is committed or local-only.
- Move durable current facts into `CURRENT.md`, maps, runbooks, or decisions.
- Keep detailed history in `worklogs/` and summarize it when it contains durable facts.
- Use `guides sync --dry-run` from the source playbook checkout to add missing support guides without overwriting local edits.
- Use `guides sync --check --json`, `doctor --json`, `doctor --reminder --json`, and `adapter check --json` when an adapter or automation needs a read-only health signal.

## Runtime Readiness Checklist

Consider optional hooks only when all of these are true:

- The project has a clear root agent entrypoint and current `.ai-playbook/` files.
- The team understands which docs are public and which are local-only.
- The target agent supports lifecycle hooks in the current environment.
- Hook output can be tested with local fixtures before enabling it in daily work.
- The source adapter passes `adapter check` for this target project.
- Optional reminder events are enabled explicitly with a local setting such as `AI_PLAYBOOK_HOOK_EVENTS`, not by default.
- The hook can be disabled through configuration.
- Native project instructions and injected context will not duplicate each other.
- The hook does not write project files automatically.
- The hook can use `context --json` instead of inventing its own project-memory loader.

## Useful Hook Responsibilities

Good first hook responsibilities are small:

- inject compact project-memory context from `START_HERE.md`, `CURRENT.md`, `SKILLS.md`, and `GIT.md` when native context is insufficient;
- match edited file paths to relevant project guides or rule files;
- remind on commit, push, PR, merge, worklog, or doctor-like prompts only when the lifecycle event is explicitly enabled;
- remind the agent to run `doctor` before handoff, or use `doctor --reminder --json` for a small local signal;
- provide a short opt-in `Stop` handoff reminder without blocking or continuation;
- clear deduplication state after context compaction.

Avoid hooks that:

- overwrite files;
- run expensive audits on every prompt;
- depend on global shell commands;
- hide project policy outside the repository;
- replace planning, testing, debugging, review, or verification discipline.

## Suggested Migration Order

1. Stabilize `.ai-playbook/` and run `doctor`.
2. Add any missing guides with `guides sync --dry-run`, then a reviewed `guides sync`; use `guides sync --check --json` to review stale guides before overwriting local edits.
3. Document hook intent in a decision note before enabling it.
4. Run the source playbook's `adapter check` command for the selected adapter.
5. Create fixture tests for hook inputs and outputs when local customization is needed.
6. Enable only reminder or context-injection behavior first.
7. Keep an opt-out path and record any remaining risk in a worklog.

## Adapter Notes

For Codex App and Claude Code, prefer Node-based hooks with short timeouts. Hook programs should write supported JSON to stdout, write debug logs to stderr, handle Windows paths safely, and avoid network calls by default.

Do not require a global `ai-playbook` command. The stable invocation remains:

```powershell
node .\bin\ai-playbook.mjs <command>
```

The source playbook repository includes read-only adapter examples. Treat them as local starting points, not project requirements.

Before enabling one of those examples, run the corresponding read-only check from the source checkout:

```powershell
node .\bin\ai-playbook.mjs adapter check <target-repo> --adapter codex --json
node .\bin\ai-playbook.mjs adapter check <target-repo> --adapter claude-code --json
```

Enable extra reminder events only in a local hook setting:

```powershell
$env:AI_PLAYBOOK_HOOK_EVENTS = 'UserPromptSubmit,PostToolUse,Stop'
```

These events should stay quiet for unrelated prompts, missing playbooks, unsupported payloads, and non-edit tools. `Stop` is only a handoff reminder; it should not block, request continuation, run doctor, write files, or call the network.

## Done Criteria

- The project works without hooks.
- Hooks add reminders or context, not hidden policy.
- The selected adapter passes a read-only self-check before local activation.
- Guide checks have no unexplained missing guides, and stale guides have been reviewed.
- `doctor` has no unexplained failures.
- Remaining warnings are documented.
- A human can disable the hook layer without losing project memory.
