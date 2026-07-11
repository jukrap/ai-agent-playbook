# Templates

Templates are copyable project files, not installable skills. The normal target-project folder is `.ai-agent-playbook/`.

Use them when starting a new repository, cleaning up project agent docs, or making agent behavior portable across computers.

## What is here

- `agents/`: root instruction templates and stack profiles.
- `agents/global/`: thin project-root `AGENTS.md` bootstrap. Despite the folder name, this is copied into target repositories; it is not Codex home-global guidance.
- `codex-home/`: optional personal `~/.codex/AGENTS.md` starting point for Codex users.
- `project-playbook/`: the canonical project-memory bundle, including opt-in forge configuration, Actions examples, and an automation runbook, to copy into a target project as `.ai-agent-playbook/`.
- Runtime CLI files live at the repository root under `bin/`, `src/`, and `test/`.

## How agents discover templates

Agents do not automatically load templates just because this repository is installed as skills. A template affects a project only when one of these is true:

- It is copied into the target project.
- The project `AGENTS.md` links to it or names it.
- The user explicitly asks the agent to read or apply it.
- A skill reference points the agent to it during project bootstrap or documentation setup.

For reusable cross-project behavior, install skills from `skills/`. For project-specific standing instructions and durable memory, adapt files from `templates/`. For the most repeatable path, use the runtime CLI from the repository root:

```powershell
node .\bin\aapb.mjs bootstrap <target-repo> --dry-run
node .\bin\aapb.mjs bootstrap <target-repo> --local-only
node .\bin\aapb.mjs guides sync <target-repo> --dry-run
node .\bin\aapb.mjs doctor <target-repo>
```

## Recommended starting points

- Unknown or mixed project: copy `agents/global/AGENTS.md` as the root bootstrap; keep skill and Git policy inside `project-playbook/` as `.ai-agent-playbook/policy/SKILLS.md` and `.ai-agent-playbook/policy/GIT.md`.
- Personal Codex defaults: adapt `codex-home/AGENTS.md` into your Codex home directory, then keep repository rules in project `AGENTS.md` files.
- Any project that needs durable agent memory: bootstrap or copy `project-playbook/` as `.ai-agent-playbook/`.
- React/Vite/FSD project: start with `agents/global/AGENTS.md` plus `agents/profiles/react-vite-fsd/AGENTS.md`.
- Expo/React Native project: start with `agents/global/AGENTS.md` plus `agents/profiles/react-native-expo/AGENTS.md`.
- Legacy project: start with `agents/global/AGENTS.md`, the closest `agents/profiles/legacy-*` file, and `project-playbook/knowledge/references/guides/legacy-mode.md`.
- Any project with careful Git or local-only docs: adapt `project-playbook/policy/GIT.md` and `project-playbook/knowledge/references/guides/commit-push-worklog.md`.
- Any project that needs evidence-backed architecture cleanup: adapt `project-playbook/knowledge/references/guides/structural-review.md`.
- Any project that already has another agent-doc system or harness: start with `project-playbook/knowledge/references/guides/harness-migration.md`.
- Any project opting into resumable GitHub/Gitea automation: review `project-playbook/integrations/forge.example.json`, `project-playbook/workflows/recipes/forge-automation.md`, and `project-playbook/workflows/runbooks/forge-automation.md` before enabling a schedule or remote write.

## Application rule

Always reduce templates to the target repository. Remove stack, command, workflow, or policy rules that the project does not actually use.

Do not hand-create random markdown files at the repository root when the content belongs in `.ai-agent-playbook/memory/maps/`, `.ai-agent-playbook/workflows/runbooks/`, `.ai-agent-playbook/memory/decisions/`, `.ai-agent-playbook/workflows/plans/`, or `.ai-agent-playbook/workflows/worklogs/`.
