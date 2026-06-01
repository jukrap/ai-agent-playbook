# Templates

Templates are copyable project files, not installable skills.

Use them when starting a new repository, cleaning up project AI docs, or making agent behavior portable across computers.

## What is here

- `agents/`: `AGENTS.md` examples for project roots and stack profiles.
- `local-ai/`: optional project-local helper docs for onboarding, docs structure, commits, API boundaries, style quality, pragmatic FSD, and SI/legacy mode.

## How agents discover them

Agents do not automatically load templates just because this repository is installed as skills. A template affects a project only when one of these is true:

- It is copied into the target project.
- The project `AGENTS.md` links to it or names it.
- The user explicitly asks the agent to read or apply it.
- A skill reference points the agent to it during a documentation setup task.

For reusable cross-project behavior, install skills from `skills/`. For project-specific standing instructions, adapt files from `templates/`.

## Recommended starting points

- Unknown or mixed project: copy `agents/global/AGENTS.md`.
- React/Vite/FSD project: start with `agents/global/AGENTS.md` plus `agents/profiles/react-vite-fsd/AGENTS.md`.
- Expo/React Native project: start with `agents/global/AGENTS.md` plus `agents/profiles/react-native-expo/AGENTS.md`.
- Legacy project: start with `agents/global/AGENTS.md` plus the closest `agents/profiles/legacy-*` file.
- Any project with careful git or local-only docs: adapt `local-ai/commit-push-worklog.md` and `local-ai/docs-system.md`.

## Application rule

Always reduce templates to the target repository. Remove stack, command, workflow, or policy rules that the project does not actually use.
