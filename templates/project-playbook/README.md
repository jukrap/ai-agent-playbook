# Project Playbook Template

Copy this folder into a target repository as `.ai-agent-playbook/`.

The folder is project memory for agents and maintainers. It keeps policy, durable memory, workflows, knowledge sources, runtime output, integrations, and archived notes separate so a future session can resume without rereading the whole repository.

Preferred setup from this repository:

```powershell
node .\bin\aapb.mjs bootstrap <target-repo> --dry-run
node .\bin\aapb.mjs bootstrap <target-repo> --local-only
node .\bin\aapb.mjs guides sync <target-repo> --dry-run
node .\bin\aapb.mjs guides sync <target-repo> --check --diff --json
node .\bin\aapb.mjs migrate path <target-repo> --json
node .\bin\aapb.mjs doctor <target-repo>
```

For legacy `ai-playbook/` projects, keep `migrate path` in preview mode until the planned folder move, reference updates, and `.gitignore` change have been reviewed.

## Reading order

1. `START_HERE.md`: shortest resume guide for the next agent.
2. `CURRENT.md`: current baseline, active risks, and recent decisions.
3. `questions.md`: unresolved questions that can change implementation.
4. `policy/SKILLS.md`: project-level skill selection policy.
5. `policy/GIT.md`: Git, PR, push, and worklog policy.
6. `memory/context/`: path-scoped facts, reading hints, and assumptions to avoid.
7. `memory/maps/doc-map.md`: the guide to public docs and project-memory locations.
8. `memory/maps/`: repository, runtime, route, API, data, or risk maps.
9. `workflows/runbooks/`: commands and operational procedures.
10. `memory/contracts/`: active or pending business rules and invariants.
11. `workflows/plans/`: active implementation plans only.
12. `workflows/runs/`: in-progress evidence ledger for one task.
13. `workflows/worklogs/`: detailed history and monthly summaries.
14. `integrations/`: reviewed forge, MCP, adapter, hook, and scheduler configuration. Start from `forge.example.json` only when the project opts into automation.
15. `knowledge/references/guides/`: reusable support guides, including `harness-migration.md` for projects that already have agent docs or another harness and `runtime-roadmap.md` for optional hook-layer decisions.

When the relevant context is unclear, do not read the whole playbook. Start with `operator context --path <file> --json`, then use `operator search` or `index search` to locate only the map, runbook, contract, guide, or worklog that applies.

## Source of truth

When docs disagree, prefer:

1. Latest user instruction.
2. Actual code, configuration, and command output.
3. Root `AGENTS.md`, `.ai-agent-playbook/policy/SKILLS.md`, and `.ai-agent-playbook/policy/GIT.md`.
4. `.ai-agent-playbook/CURRENT.md`, memory context, maps, runbooks, contracts, and decisions.
5. Workflow runs, worklogs, and archived notes.

Runs are in-progress evidence. Worklogs are history. Promote facts that remain current into `CURRENT.md`, `memory/context/`, `memory/maps/`, `workflows/runbooks/`, `memory/contracts/`, or `memory/decisions/`.

For long work, use `workflows/runs/` while executing and `workflows/worklogs/` when a milestone completes, a blocker is resolved, direction changes, or another agent needs a handoff. Keep generated runtime reports in `runtime/` until a person or agent explicitly reviews and promotes concise facts.

## Maintenance rule

Keep the top-level files stable:

- `START_HERE.md`: current resume pointer only.
- `CURRENT.md`: durable current facts only.
- `questions.md`: unresolved decision-changing questions only.

Put larger material in the matching subfolder. Use `memory/context/` for path-scoped reading hints, `memory/maps/` for structure, `workflows/runbooks/` for commands, `memory/contracts/` for business rules and invariants, `memory/decisions/` for durable choices, `workflows/plans/` for active execution, `workflows/runs/` for evidence during the work, and `workflows/worklogs/` for detailed history.

Do not turn `START_HERE.md` or `CURRENT.md` into long reports. If a fact needs scan range, freshness, confidence, or supporting evidence, put the detail in a map, contract, decision, runbook, worklog, or runtime report and link it from the short file.

`doctor` warns while core files still contain template prompts. After first repo inspection, replace the placeholder bullets in `START_HERE.md`, `CURRENT.md`, and `questions.md` with project-specific current facts or state clearly that no active task or open question exists.

Do not add runtime hooks before this document harness works on its own. If the project later chooses hooks, document the decision and keep the hook layer optional.

## Commit policy

Decide per project whether `.ai-agent-playbook/` is committed or local-only. If local-only, add it to `.gitignore` before writing project-specific notes.

Do not store credentials, private URLs, customer data, personal paths, raw logs with sensitive values, or machine-specific secrets here.
