# Harness Migration

Use this when a project already has agent docs, local skill instructions, another harness, or scattered AI planning files.

The goal is not to erase the old system. The goal is to preserve useful evidence, move durable project memory into predictable places, and avoid mixing obsolete instructions with current working rules.

## Safety rules

- Do not delete existing agent docs, prompts, worklogs, or plans during the first pass.
- Do not overwrite `AGENTS.md`, `CLAUDE.md`, `.ai-playbook/SKILLS.md`, `.ai-playbook/GIT.md`, or project docs without explicit approval.
- Do not run a broad `--force` migration just to clear conflicts.
- Keep private context local-only unless the repository has explicitly chosen to commit it.
- Preserve historical worklogs even when their current instructions are stale.

## First pass

1. Inspect current root files: `AGENTS.md`, `CLAUDE.md`, `README.md`, and `.gitignore`; also inspect `.ai-playbook/SKILLS.md` and `.ai-playbook/GIT.md` when they exist.
2. Find existing AI docs: `docs/**`, `docs/agents/**`, `docs/plans/**`, `docs/worklog/**`, `.cursor/**`, `.windsurf/**`, `.github/copilot-instructions.md`, and similarly named local folders.
3. Identify what is committed, ignored, generated, or private.
4. Record conflicts and uncertainty in `.ai-playbook/questions.md`.
5. Run `doctor` after the first copy to see missing layout pieces and stale references.

## Classification

Move or copy content by role:

- Root entrypoint: keep only the minimal agent bootstrap in `AGENTS.md`; put current behavior, verification policy, and source-of-truth detail in `.ai-playbook/`.
- Skill selection rules: reusable skill loading policy goes in `.ai-playbook/SKILLS.md`.
- Git and PR policy: commit, PR, push, and worklog expectations go in `.ai-playbook/GIT.md` or `.ai-playbook/guides/commit-push-worklog.md`.
- Current project truth: active architecture, product constraints, and known commands go in `.ai-playbook/CURRENT.md`.
- Repository maps: where important code lives goes in `.ai-playbook/maps/`.
- Repeatable procedures: setup, release, data import, deployment, debugging, and manual verification flows go in `.ai-playbook/runbooks/`.
- Decisions: durable architecture or process decisions go in `.ai-playbook/decisions/`.
- Active plans: unfinished implementation plans go in `.ai-playbook/plans/`.
- Work history: dated reasoning, blockers, verification, and handoffs go in `.ai-playbook/worklogs/YYYY-MM/`.
- Old or uncertain material: keep it in `.ai-playbook/archive/` or leave it in place with a note pointing to the current source of truth.

## Migration workflow

1. Bootstrap with `--dry-run` first.
2. If root files conflict, do not force overwrite. Generate the missing `.ai-playbook/` files, then manually merge root policies.
3. Add or refresh guides with `guides sync`; this should not rewrite project-specific memory.
4. Create a short migration note in `.ai-playbook/worklogs/YYYY-MM/` describing what moved, what stayed, and what still needs review.
5. Promote only still-current facts from old plans and worklogs into `CURRENT.md`, maps, runbooks, or decisions.
6. Archive stale instructions after the new source of truth is clear.

## Commands

From this playbook repository:

```powershell
node .\bin\ai-playbook.mjs bootstrap <target-project> --local-only --dry-run
node .\bin\ai-playbook.mjs guides sync <target-project> --dry-run
node .\bin\ai-playbook.mjs doctor <target-project>
```

When the dry run is acceptable:

```powershell
node .\bin\ai-playbook.mjs bootstrap <target-project> --local-only
node .\bin\ai-playbook.mjs guides sync <target-project>
node .\bin\ai-playbook.mjs worklog new <target-project> --title "Harness migration"
```

Use `--force` only for a specific reviewed overwrite. If a project already has valuable root instructions, merge them by hand.

## Handoff prompt

Use this prompt for another agent after the guide is present in the target project:

```text
Read AGENTS.md, .ai-playbook/SKILLS.md, .ai-playbook/GIT.md, .ai-playbook/README.md, .ai-playbook/START_HERE.md,
.ai-playbook/CURRENT.md, .ai-playbook/questions.md, and .ai-playbook/guides/harness-migration.md.

Inspect existing agent docs and markdown planning files. Do not delete or overwrite existing
material on the first pass. Classify each document as current root rule, current project fact,
map, runbook, decision, active plan, worklog, archive, or external reference.

Propose a migration plan first. After approval, move or copy only the reviewed files, preserve
history, and record the migration in a dated worklog.
```

## Done criteria

- `AGENTS.md` points to `.ai-playbook/`, and `.ai-playbook/SKILLS.md` plus `.ai-playbook/GIT.md` either exist or have an explicit reason not to exist.
- `.ai-playbook/START_HERE.md`, `CURRENT.md`, and `questions.md` reflect the current project.
- Old instructions have either been merged, archived, or marked as historical.
- Active plans and worklogs live under predictable `.ai-playbook/` paths.
- `doctor` has been run and remaining warnings are documented.
