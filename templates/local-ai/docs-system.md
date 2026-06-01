# Project Docs System

Use this guide when organizing project-specific AI docs.

## Document roles

- `AGENTS.md`: agent workflow, verification, commit, and collaboration rules.
- `README.md`: public setup and run guide for new developers.
- `PROJECT_SPEC.md`: product goals, feature/screen scope, API/data policy.
- `PLANS.md`: milestone order, completion criteria, verification commands.
- `FSD.md`: FSD or architecture boundary rules when relevant.
- `docs/plans/README.md`: local planning docs index and reading order.
- `docs/plans/CONVENTIONS.md`: coding conventions.
- `docs/plans/AGENT_SKILL_USAGE.md`: when to use which skill.
- `docs/plans/TEMPLATES.md`: repeatable slice or task templates.
- `docs/worklog/**`: milestone completion, blockers, and major direction changes.
- `design-docs/**`, `_reference/**`: secondary references.

## Source of truth

1. Latest user instruction.
2. Actual code and config.
3. Project-specific specification and planning docs.
4. Nearest lower-level `AGENTS.md`.
5. Global working rules.
6. Old references.

If docs and code disagree, inspect the code and state when docs need updates.

## Local-only policy

AI working notes, worklogs, internal planning, design sources, and experiments can be local-only. If the project marks files as local-only, do not commit them.

Recommended guard:

```bash
git diff --cached --name-only
git ls-files '*.md' 'docs/*' 'design-docs/*' '_reference/*'
```

Do not bypass hooks that block local-only files.

## Cleanup rules

- Keep `AGENTS.md` focused on how to work.
- Put product requirements in `PROJECT_SPEC.md`.
- Put milestones and verification criteria in `PLANS.md`.
- Keep dated handoffs and prompts as references, not active policy.
- Link from an index document instead of repeating the same rule in many files.
