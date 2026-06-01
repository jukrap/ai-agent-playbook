# Superpowers Integration

This playbook is designed to work alongside Superpowers-style process skills.

## Role split

- Superpowers skills decide the process: brainstorming, planning, TDD, debugging, verification, branch finishing, and review discipline.
- This playbook adds repository guardrails: onboarding, documentation structure, API boundaries, style quality, legacy risk control, commit policy, PR body policy, and worklogs.

Use process skills first when they apply, then use the smallest relevant playbook skill or project template.

## Recommended pairings

- New repository or unclear codebase: Superpowers process skill plus `repo-onboarding`.
- Feature planning: Superpowers planning or brainstorming skill plus `project-doc-system` when project docs need structure.
- API integration: Superpowers implementation process plus `api-contract-boundary`.
- UI polishing: Superpowers review or verification process plus `style-quality-review`.
- Explicit style policy work: Superpowers implementation process plus `design-system-first`, `css-class-first`, `utility-class-first`, or `inline-style-first`.
- Legacy change: Superpowers debugging or planning process plus the closest `legacy-*` skill.
- Commit, push, PR, or handoff: Superpowers verification or branch-finishing process plus `commit-worklog-guardrails`.

## Priority

1. Latest user instruction.
2. Actual repository code, configuration, and local project docs.
3. Nearest project `AGENTS.md` or equivalent agent instruction file.
4. Superpowers process skills.
5. This playbook's reusable skills and templates.
6. Older examples, handoffs, and external references.

If a Superpowers process rule and a project-local rule disagree, follow the higher-priority project context and state the conflict.

## What not to do

- Do not vendor Superpowers into this repository.
- Do not assume every user has Superpowers installed.
- Do not load every available skill. Use the minimum set that clearly applies.
- Do not let a generic process skill override confirmed repository constraints.
- Do not copy machine-local custom instructions into public docs without removing paths, identities, and private workflow assumptions.
