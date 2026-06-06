# Templates

Templates are copyable project files, not installable skills.

Use them when starting a new repository, cleaning up project agent docs, or making agent behavior portable across computers.

## What is here

- `agents/`: root instruction templates and stack profiles.
- `agents/global/`: small root-level templates such as `AGENTS.md`, `SKILLS.md`, and `GIT.md`.
- `project-playbook/`: the canonical folder to copy into a target project as `ai-playbook/`.
- `local-ai/`: compatibility pointer for older projects; new work should use `project-playbook/`.

## How agents discover templates

Agents do not automatically load templates just because this repository is installed as skills. A template affects a project only when one of these is true:

- It is copied into the target project.
- The project `AGENTS.md` links to it or names it.
- The user explicitly asks the agent to read or apply it.
- A skill reference points the agent to it during project bootstrap or documentation setup.

For reusable cross-project behavior, install skills from `skills/`. For project-specific standing instructions and durable memory, adapt files from `templates/`.

## Recommended starting points

- Unknown or mixed project: copy `agents/global/AGENTS.md`, then add `agents/global/SKILLS.md` or `agents/global/GIT.md` only if the project needs those standing rules.
- Any project that needs durable agent memory: copy `project-playbook/` as `ai-playbook/`.
- React/Vite/FSD project: start with `agents/global/AGENTS.md` plus `agents/profiles/react-vite-fsd/AGENTS.md`.
- Expo/React Native project: start with `agents/global/AGENTS.md` plus `agents/profiles/react-native-expo/AGENTS.md`.
- Legacy project: start with `agents/global/AGENTS.md`, the closest `agents/profiles/legacy-*` file, and `project-playbook/guides/legacy-mode.md`.
- Any project with careful Git or local-only docs: adapt `agents/global/GIT.md` and `project-playbook/guides/commit-push-worklog.md`.
- Any project that needs evidence-backed architecture cleanup: adapt `project-playbook/guides/structural-review.md`.

## Application rule

Always reduce templates to the target repository. Remove stack, command, workflow, or policy rules that the project does not actually use.
