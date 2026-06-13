# Runtime Harness Guide

Use this guide after copying `templates/project-playbook/` into a target project as `.ai-playbook/`.

The runtime harness is the combination of root agent files, `.ai-playbook/` project memory, installable skills, and the small CLI in this repository. It is meant to make agent setup repeatable without pretending every project needs the same workflow.

## Normal setup flow

From this repository:

```powershell
node .\bin\ai-playbook.mjs bootstrap <target-repo> --dry-run
node .\bin\ai-playbook.mjs bootstrap <target-repo> --local-only
node .\bin\ai-playbook.mjs guides sync <target-repo> --dry-run
node .\bin\ai-playbook.mjs guides sync <target-repo> --check --diff --json
node .\bin\ai-playbook.mjs migrate path <target-repo> --json
node .\bin\ai-playbook.mjs managed check <target-repo> --json
node .\bin\ai-playbook.mjs managed catalog <target-repo> --json
node .\bin\ai-playbook.mjs managed prune <target-repo> --path .ai-playbook/guides/runtime-harness.md --json
node .\bin\ai-playbook.mjs managed uninstall <target-repo> --json
node .\bin\ai-playbook.mjs doctor <target-repo>
node .\bin\ai-playbook.mjs operator check <target-repo> --path src/example.ts --json
node .\bin\ai-playbook.mjs operator search <target-repo> --query "auth flow" --path src/example.ts --json
node .\bin\ai-playbook.mjs operator context <target-repo> --path src/example.ts --json
node .\bin\ai-playbook.mjs operator analyze <target-repo> --path src/example.ts --json
node .\bin\ai-playbook.mjs operator map <target-repo> --json
node .\bin\ai-playbook.mjs operator audit <target-repo> --json
node .\bin\ai-playbook.mjs operator gc <target-repo> --json
node .\bin\ai-playbook.mjs rules check <target-repo> --path src/example.ts --json
node .\bin\ai-playbook.mjs diagnostics check <target-repo> --json
node .\bin\ai-playbook.mjs qa tui-check .\capture.txt --cols 100 --json
```

Use `--dry-run` first when the target already has agent docs. Bootstrap preflights writes before creating files, but conflicts still need review. Use `--force` only after inspecting conflicts and deciding the generated file should replace the existing one.

Use `guides sync` after the target already has `.ai-playbook/` and you only want missing guide files from a newer playbook checkout. By default it keeps existing guides, root policies, current project notes, plans, and worklogs. Use `guides sync --check --diff --json` when reviewing stale guides before replacing local edits.

If the project still has a legacy `ai-playbook/` folder, use `migrate path --json` to preview the move to `.ai-playbook/`, reference updates, and `.gitignore` change. Add `--apply` only after reviewing the preview. If both paths exist, stop and merge manually.

Use `managed check` to inspect the project-level install marker and `managed catalog` to see owned files by kind and status. Use `managed adopt --apply` only when older copied files match current templates, `managed prune --apply --path <managed-path>` only after previewing a selected unmodified file, and `managed uninstall --apply` only after previewing which unmodified files would be removed. Locally edited files are preserved.

## Active project flow

Use the CLI for repeatable file placement:

```powershell
node .\bin\ai-playbook.mjs plan new <target-repo> --title "short-plan-title"
node .\bin\ai-playbook.mjs worklog new <target-repo> --title "short-worklog-title"
node .\bin\ai-playbook.mjs worklog summarize <target-repo> --month YYYY-MM
node .\bin\ai-playbook.mjs doctor <target-repo> --strict
```

Use skills for behavior during the session:

- `project-bootstrap`: decide what to install after inspecting the repository.
- `repo-onboarding`: understand an unfamiliar repository before changing it.
- `project-doc-system`: clean up scattered project memory.
- `commit-worklog-guardrails`: keep commits, PR text, and detailed worklogs aligned.

## Operator diagnostics

Use operator-triggered diagnostics when an agent needs stronger evidence but a hook would be too much:

- `operator check` combines doctor, guide freshness, diagnostics, and rule matching into one read-only human checkpoint.
- `operator search` finds related local source, playbook, rule, plan, and worklog text without writing files.
- `operator context` previews which path-scoped context files, rules, maps, runbooks, decisions, or guides are relevant before loading them into a session.
- `operator analyze` combines diagnostics, map, rules, context, and optional AST/LSP/comment-quality setup signals without running optional tools.
- `operator map` summarizes stack, architecture, quality, and concern signals without creating or updating map files.
- `operator audit` checks playbook links, context globs, duplicate notes, legacy path drift, and managed manifest drift without writing files.
- `operator gc` previews obsolete unmodified managed playbook files and removes them only when `--apply` is used.
- `rules check` shows which project rule files apply to a path. Keep root `AGENTS.md` as the normal entrypoint; do not duplicate it as injected context.
- `diagnostics check` lists likely local verification commands from project metadata without running them, using the package manager detected from lockfiles when it renders package scripts.
- `qa tui-check` checks terminal captures for width overflow, simple border misalignment, ANSI presence, and CJK wide-character columns.

## File placement rules

- Keep root `AGENTS.md` as a thin bootstrap. Keep skill and Git policy in `.ai-playbook/SKILLS.md` and `.ai-playbook/GIT.md`.
- Keep current facts in `CURRENT.md`.
- Keep active execution plans in `plans/`.
- Keep detailed reasoning and recovery history in `worklogs/YYYY-MM/`.
- Keep durable structure facts in `maps/`.
- Keep repeatable commands and operational procedures in `runbooks/`.
- Keep accepted choices in `decisions/`.
- Archive stale plans, old prompts, and superseded notes under `archive/`.

Do not create loose markdown files at the project root unless the repository already has a clear public-doc convention for them.

## Local-only policy

Decide whether `.ai-playbook/` is committed or local-only before writing project-specific details.

Use local-only mode when the notes may include private context, unfinished analysis, raw logs, sensitive URLs, or customer-specific details. If the project commits `.ai-playbook/`, scrub it like public documentation.

## Maintenance cadence

- At the start of a session, read `START_HERE.md`, `CURRENT.md`, and the relevant plan or runbook.
- During large work, write a worklog when a milestone completes, a blocker is resolved, or the direction changes.
- Before a handoff, update `START_HERE.md` and promote durable facts from worklogs into `CURRENT.md`, maps, runbooks, or decisions.
- Before commit or PR, run `doctor` and project-specific verification.
- Treat `doctor` warnings as adaptation prompts. A fresh bootstrap is allowed to warn until core playbook files are filled with project-specific facts.
