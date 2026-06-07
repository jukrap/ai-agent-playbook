# Project Documentation Roles

## Recommended files

- `AGENTS.md`: agent working agreements, verification, git, and collaboration rules.
- `README.md`: public setup and run guide.
- `PROJECT_SPEC.md`: product goal, screens, feature scope, API/data policies when the project uses this file.
- `PLANS.md`: milestones, completion criteria, and verification commands when the project uses this file.
- `FSD.md`: architecture boundary rules only when the repo actually uses FSD.
- `ai-playbook/README.md`: agent-facing project memory index and source-of-truth rules.
- `ai-playbook/START_HERE.md`: shortest resume guide for the next agent.
- `ai-playbook/CURRENT.md`: current baseline, active risks, and decisions that still matter.
- `ai-playbook/SKILLS.md`: project-level skill selection policy.
- `ai-playbook/GIT.md`: short Git, commit, PR, and push policy.
- `ai-playbook/maps/**`: repository, runtime, API, route, data, and risk maps.
- `ai-playbook/runbooks/**`: repeatable commands and operational procedures.
- `ai-playbook/decisions/**`: durable decisions with rationale and evidence.
- `ai-playbook/plans/**`: active execution plans only.
- `ai-playbook/worklogs/**`: detailed milestone, blocker, direction-change, and debugging records.
- `ai-playbook/archive/**`: stale plans, old handoffs, and retired notes.
- `design-docs/**`, `_reference/**`: secondary references.

## Source-of-truth priority

1. Latest user instruction.
2. Actual code, config, and command output.
3. Root and nearest agent instruction files.
4. Current project memory in `ai-playbook/CURRENT.md`, maps, runbooks, and decisions.
5. Project-specific planning/spec docs.
6. Worklogs, old plans, examples, handoffs, and archived notes.

## Cleanup rules

- Keep root agent instructions focused on how to work.
- Keep current project truth in `ai-playbook/CURRENT.md`.
- Keep structural facts in `ai-playbook/maps/`.
- Keep repeated commands in `ai-playbook/runbooks/`.
- Keep live plans in `ai-playbook/plans/`.
- Keep detailed history in `ai-playbook/worklogs/`.
- Archive stale plans, prompts, and handoffs.
- Promote current facts from worklogs into `CURRENT.md`, maps, runbooks, or decisions.
- Prefer one index document over scattered repeated instructions.
