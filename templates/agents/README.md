# AGENTS.md Template Guide

`templates/agents` contains `AGENTS.md` examples that can be copied into project roots. A project usually keeps one root `AGENTS.md` and merges in the nearest matching profile.

The `global/` name means "stack-neutral project-root base template" inside this repository. It is not Codex's personal global file in `~/.codex/AGENTS.md`. For Codex home-level defaults, use `../codex-home/`.

## Choosing a profile

- `global/AGENTS.md`: default project-root working agreement for unknown stacks, documentation-first projects, and general repositories.
- `global/SKILLS.md`: optional project-level skill selection policy.
- `global/GIT.md`: optional project-level commit and PR policy.
- `profiles/react-vite-fsd/AGENTS.md`: React, Vite, TypeScript, pnpm, and pragmatic FSD or a similar layered frontend.
- `profiles/react-native-expo/AGENTS.md`: Expo Router, React Native, and native/device verification.
- `profiles/legacy-jquery-web/AGENTS.md`: jQuery, plugins, direct DOM manipulation, and script-order dependent pages.
- `profiles/legacy-server-rendered-web/AGENTS.md`: JSP, Thymeleaf, Razor, PHP templates, or server-rendered form flows.
- `profiles/legacy-android-webview-hybrid/AGENTS.md`: Android native shell, WebView, local assets, and JavaScript bridges.

## How to apply

1. Inspect the project's real config, README, build files, and existing docs first.
2. Start with `global/AGENTS.md`; add `global/SKILLS.md` and `global/GIT.md` only when those standing rules help.
3. Pick the closest stack profile and remove rules that do not apply.
4. If the project needs durable agent memory, copy `templates/project-playbook/` as `ai-playbook/`.
5. If the project needs detailed commit, push, PR, and worklog guidance, adapt `templates/project-playbook/guides/commit-push-worklog.md` in addition to `global/GIT.md`.
6. Keep project-specific product rules in separate docs. Use `AGENTS.md` for how the agent should work.
