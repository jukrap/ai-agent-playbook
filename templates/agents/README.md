# Project AGENTS.md templates

These are examples to adapt into a project's root instructions. Read any existing AGENTS.md first and merge only relevant rules. AAPB 1.0 bootstrap preserves that file automatically.

`global/` here means a stack-neutral project template. It is not a personal global instruction file; those examples are in [codex-home](../codex-home/README.md).

## Choose a matching profile

| Template | Matching project |
| --- | --- |
| [global](global/AGENTS.md) | General repositories and documentation work |
| [react-vite-fsd](profiles/react-vite-fsd/AGENTS.md) | React/Vite/TypeScript with existing layered boundaries |
| [react-native-expo](profiles/react-native-expo/AGENTS.md) | Expo/React Native and device verification |
| [legacy-jquery-web](profiles/legacy-jquery-web/AGENTS.md) | jQuery, direct DOM manipulation, and script ordering |
| [legacy-server-rendered-web](profiles/legacy-server-rendered-web/AGENTS.md) | Server templates, forms, and server-side contracts |
| [legacy-android-webview-hybrid](profiles/legacy-android-webview-hybrid/AGENTS.md) | Native shell, WebView, local assets, and bridges |

## Apply to the actual repository

1. Inspect configuration, build scripts, existing instructions, and dirty changes.
2. Keep the root policy focused on applicable rules and the current-state entrypoint.
3. Choose a profile only if its stack matches; remove inapplicable assumptions and commands.
4. Create records with bootstrap if needed, then write actual current facts in CURRENT.md.
5. Keep detailed product, Git, and verification rules in the project's established documents and link them where useful.

The old template paths `policy/SKILLS.md`, `policy/GIT.md`, and the generated guide tree are not part of the minimal template. Do not copy or require those nonexistent files. Existing project copies remain valid historical/project material. See [Record layout](../../docs/structured-playbook-layout.md).
