# Runtime Harness Guide

Use this guide after copying `templates/project-playbook/` into a target project as `ai-playbook/`.

The runtime harness is the combination of root agent files, `ai-playbook/` project memory, installable skills, and the small CLI in this repository. It is meant to make agent setup repeatable without pretending every project needs the same workflow.

## Normal setup flow

From this repository:

```powershell
node .\bin\ai-playbook.mjs bootstrap <target-repo> --dry-run
node .\bin\ai-playbook.mjs bootstrap <target-repo> --local-only
node .\bin\ai-playbook.mjs guides sync <target-repo> --dry-run
node .\bin\ai-playbook.mjs doctor <target-repo>
```

Use `--dry-run` first when the target already has agent docs. Use `--force` only after inspecting conflicts and deciding the generated file should replace the existing one.

Use `guides sync` after the target already has `ai-playbook/` and you only want missing guide files from a newer playbook checkout. By default it keeps existing guides, root policies, current project notes, plans, and worklogs.

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

## File placement rules

- Keep root `AGENTS.md` as a thin bootstrap. Keep skill and Git policy in `ai-playbook/SKILLS.md` and `ai-playbook/GIT.md`.
- Keep current facts in `CURRENT.md`.
- Keep active execution plans in `plans/`.
- Keep detailed reasoning and recovery history in `worklogs/YYYY-MM/`.
- Keep durable structure facts in `maps/`.
- Keep repeatable commands and operational procedures in `runbooks/`.
- Keep accepted choices in `decisions/`.
- Archive stale plans, old prompts, and superseded notes under `archive/`.

Do not create loose markdown files at the project root unless the repository already has a clear public-doc convention for them.

## Local-only policy

Decide whether `ai-playbook/` is committed or local-only before writing project-specific details.

Use local-only mode when the notes may include private context, unfinished analysis, raw logs, sensitive URLs, or customer-specific details. If the project commits `ai-playbook/`, scrub it like public documentation.

## Maintenance cadence

- At the start of a session, read `START_HERE.md`, `CURRENT.md`, and the relevant plan or runbook.
- During large work, write a worklog when a milestone completes, a blocker is resolved, or the direction changes.
- Before a handoff, update `START_HERE.md` and promote durable facts from worklogs into `CURRENT.md`, maps, runbooks, or decisions.
- Before commit or PR, run `doctor` and project-specific verification.
- Treat `doctor` warnings as adaptation prompts. A fresh bootstrap is allowed to warn until core playbook files are filled with project-specific facts.
