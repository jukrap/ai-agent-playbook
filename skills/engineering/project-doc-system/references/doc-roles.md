# Project Documentation Roles

## Recommended files

- `AGENTS.md`: AI working agreements, verification, git/worklog rules.
- `README.md`: public setup and run guide.
- `PROJECT_SPEC.md`: product goal, screens, feature scope, API/data policies.
- `PLANS.md`: milestone order, completion criteria, verification commands.
- `FSD.md`: architecture boundary rules when relevant.
- `docs/plans/README.md`: local docs index and reading order.
- `docs/plans/CONVENTIONS.md`: code conventions proven by the repo.
- `docs/plans/AGENT_SKILL_USAGE.md`: skill selection policy.
- `docs/worklog/**`: milestone/blocker/direction-change records.
- `design-docs/**`, `_reference/**`: secondary references.

## Source-of-truth priority

1. Latest user instruction.
2. Actual code and config.
3. Project-specific planning/spec docs.
4. Nearest `AGENTS.md`.
5. Global working guide.
6. Old references.

## Cleanup rules

- Extract reusable process from old handoffs; do not make dated status active policy.
- Keep stack-specific guidance inside profiles or architecture docs.
- Keep local-only docs out of commits when the project requires it.
- Prefer one index document over scattered repeated instructions.
