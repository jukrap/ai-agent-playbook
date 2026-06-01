# AGENTS.md Template Guide

`templates/agents` contains `AGENTS.md` examples that can be copied into project roots. A project usually keeps one root `AGENTS.md` and merges in the nearest matching profile.

## Choosing a profile

- `global/AGENTS.md`: default for unknown stacks, documentation-first projects, and general repositories.
- `profiles/react-vite-fsd/AGENTS.md`: React, Vite, TypeScript, pnpm, and pragmatic FSD or a similar layered frontend.
- `profiles/react-native-expo/AGENTS.md`: Expo Router, React Native, and native/device verification.
- `profiles/legacy-jquery-web/AGENTS.md`: jQuery, plugins, direct DOM manipulation, and script-order dependent pages.
- `profiles/legacy-server-rendered-web/AGENTS.md`: JSP, Thymeleaf, Razor, PHP templates, or server-rendered form flows.
- `profiles/legacy-android-webview-hybrid/AGENTS.md`: Android native shell, WebView, local assets, and JavaScript bridges.

## How to apply

1. Inspect the project's real config, README, build files, and existing docs first.
2. Pick the closest profile and remove stack rules that do not apply.
3. If the project needs local-only docs such as `PROJECT_SPEC.md`, `PLANS.md`, `FSD.md`, `docs/plans/**`, or `docs/worklog/**`, adapt `templates/local-ai/docs-system.md`.
4. If the project needs strict commit, push, PR, and worklog rules, adapt `templates/local-ai/commit-push-worklog.md`.
5. Keep project-specific product rules in separate docs. Use `AGENTS.md` for how the agent should work.
