# Superpowers Integration

This playbook is designed to work alongside external process skills such as Superpowers.

## Role split

- Process skills decide how to work: brainstorming, planning, TDD, debugging, verification, branch finishing, and review discipline.
- This playbook adds repository guardrails: project bootstrap, onboarding, project memory, API boundaries, UI style policy, legacy risk control, commit policy, PR body policy, and worklogs.

Use process skills first when they apply, then use the smallest relevant playbook skill or project template.

## Recommended pairings

- New repository or unclear codebase: process planning plus `project-bootstrap` or `repo-onboarding`.
- Feature planning: process planning plus `project-doc-system` when project docs or `ai-playbook/` need structure.
- API integration: implementation process plus `api-contract-boundary`.
- UI styling policy: implementation or review process plus `ui-style-policy`.
- UI polishing: review or verification process plus `style-quality-review`.
- Legacy change: debugging or planning process plus the closest `legacy-*` skill.
- Commit, push, PR, or handoff: verification or branch-finishing process plus `commit-worklog-guardrails`.
- Creating or revising reusable skills: planning or review process plus `agent-skill-authoring`.
- Repository-wide structural cleanup: process planning plus `templates/project-playbook/guides/structural-review.md` or an installed evidence tool when the project has one.

## Priority

1. Latest user instruction.
2. Actual repository code, configuration, and local project docs.
3. Nearest project `AGENTS.md` or equivalent agent instruction file.
4. External process skills.
5. This playbook's reusable skills and templates.
6. Older examples, handoffs, and external references.

If a process rule and a project-local rule disagree, follow the higher-priority project context and state the conflict.

## What not to do

- Do not vendor external process skill packs into this repository.
- Do not assume every user has any specific external process pack installed.
- Do not load every available skill. Use the minimum set that clearly applies.
- Do not let a generic process skill override confirmed repository constraints.
- Do not copy machine-local custom instructions into public docs without removing paths, identities, and private workflow assumptions.
- Do not assume another agent runtime's hooks, slash commands, or plugin environment variables are available.
