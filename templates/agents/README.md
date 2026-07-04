# AGENTS.md Template Guide

`templates/agents` contains `AGENTS.md` examples that can be copied into project roots. A project usually keeps one thin root `AGENTS.md` that points agents to `.ai-agent-playbook/`, then merges in the nearest matching profile only when the stack is confirmed.

The `global/` name means "stack-neutral project-root base template" inside this repository. It is not Codex's personal global file in `~/.codex/AGENTS.md`. For Codex home-level defaults, use `../codex-home/`.

## Choosing a profile

- `global/AGENTS.md`: thin project-root bootstrap for unknown stacks, documentation-first projects, and general repositories.
- `profiles/react-vite-fsd/AGENTS.md`: React, Vite, TypeScript, pnpm, and pragmatic FSD or a similar layered frontend.
- `profiles/react-native-expo/AGENTS.md`: Expo Router, React Native, and native/device verification.
- `profiles/legacy-jquery-web/AGENTS.md`: jQuery, plugins, direct DOM manipulation, and script-order dependent pages.
- `profiles/legacy-server-rendered-web/AGENTS.md`: JSP, Thymeleaf, Razor, PHP templates, or server-rendered form flows.
- `profiles/legacy-android-webview-hybrid/AGENTS.md`: Android native shell, WebView, local assets, and JavaScript bridges.

## How to apply

1. Inspect the project's real config, README, build files, and existing docs first.
2. Start with `global/AGENTS.md` as a short bootstrap; keep skill and Git policy under `.ai-agent-playbook/policy/SKILLS.md` and `.ai-agent-playbook/policy/GIT.md`.
3. Pick the closest stack profile and remove rules that do not apply.
4. If the project needs durable agent memory, copy `templates/project-playbook/` as `.ai-agent-playbook/`.
5. If the project needs detailed commit, push, PR, and worklog guidance, adapt `templates/project-playbook/policy/GIT.md` and `templates/project-playbook/knowledge/references/guides/commit-push-worklog.md`.
6. Keep project-specific product rules in separate docs. Use `AGENTS.md` only for the minimum entrypoint and local override rules.
