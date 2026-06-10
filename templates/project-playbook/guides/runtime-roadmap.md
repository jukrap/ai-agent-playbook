# Runtime Roadmap Guide

Use this guide when a project already has `ai-playbook/` and you are deciding whether to keep the document harness only or add optional runtime hooks.

The default answer should be document harness first. Runtime hooks are useful only when the project benefits from automatic reminders or context injection and the agent environment supports those hooks reliably.

## Start With the Document Harness

Before considering hooks:

- Run `doctor` and record remaining warnings.
- Adapt `START_HERE.md`, `CURRENT.md`, and `questions.md` so they no longer contain template prompts.
- Decide whether `ai-playbook/` is committed or local-only.
- Move durable current facts into `CURRENT.md`, maps, runbooks, or decisions.
- Keep detailed history in `worklogs/` and summarize it when it contains durable facts.
- Use `guides sync --dry-run` from the source playbook checkout to add missing support guides without overwriting local edits.

## Runtime Readiness Checklist

Consider optional hooks only when all of these are true:

- The project has a clear root agent entrypoint and current `ai-playbook/` files.
- The team understands which docs are public and which are local-only.
- The target agent supports lifecycle hooks in the current environment.
- Hook output can be tested with local fixtures before enabling it in daily work.
- The hook can be disabled through configuration.
- Native project instructions and injected context will not duplicate each other.
- The hook does not write project files automatically.

## Useful Hook Responsibilities

Good first hook responsibilities are small:

- remind the agent to read `START_HERE.md` and `CURRENT.md`;
- inject compact project-memory context when native context is insufficient;
- match edited file paths to relevant project guides or rule files;
- remind the agent to run `doctor` before handoff;
- clear deduplication state after context compaction.

Avoid hooks that:

- overwrite files;
- run expensive audits on every prompt;
- depend on global shell commands;
- hide project policy outside the repository;
- replace planning, testing, debugging, review, or verification discipline.

## Suggested Migration Order

1. Stabilize `ai-playbook/` and run `doctor`.
2. Add any missing guides with `guides sync --dry-run`, then a reviewed `guides sync`.
3. Document hook intent in a decision note before enabling it.
4. Create fixture tests for hook inputs and outputs.
5. Enable only reminder or context-injection behavior first.
6. Keep an opt-out path and record any remaining risk in a worklog.

## Codex App Notes

For Codex App, prefer Node-based hooks with short timeouts. Hook programs should write supported JSON to stdout, write debug logs to stderr, handle Windows paths safely, and avoid network calls by default.

Do not require a global `ai-playbook` command. The stable invocation remains:

```powershell
node .\bin\ai-playbook.mjs <command>
```

## Done Criteria

- The project works without hooks.
- Hooks add reminders or context, not hidden policy.
- `doctor` has no unexplained failures.
- Remaining warnings are documented.
- A human can disable the hook layer without losing project memory.
