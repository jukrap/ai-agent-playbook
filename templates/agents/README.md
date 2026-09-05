# Project instructions without a fixed stack

Start with [AGENTS.md](AGENTS.md), then adapt it to the actual repository. Keep a small set of applicable rules and links to real decisions. AAPB does not require FSD, a package manager, or a particular folder tree.

This directory is for project instructions. Personal Codex defaults are in [codex-home](../codex-home/README.md). AAPB's `core`, `development`, and `legacy` skill profiles choose reusable guidance; they do not choose project architecture.

## Adapt the template

1. Read existing root and directory instructions and relevant configuration.
2. Keep the repository's accepted rules and user edits. If root instructions are absent and useful, adapt the template rather than treating it as an installed managed file.
3. Add actual commands and links that help work in this project. Do not leave example filenames or guessed commands as requirements.
4. Keep detailed architecture in its existing document. Record ownership, dependency direction, exceptions, and when a decision should be revisited.
5. Create project records with bootstrap only when needed. Bootstrap preserves root instructions and does not copy this template automatically.

For new, existing, or changing structures, use [Choose and evolve an architecture](../../docs/project-architecture.md). An accepted architecture can evolve; a template should not freeze an idealized folder tree.

## Earlier template paths

The stack-specific root files have been removed. Their useful domain contracts remain as selected references; generic start, Git, and worklog procedures are covered by the neutral template and project rules.

| Removed path in this directory | Current destination |
| --- | --- |
| `global/AGENTS.md` | [Neutral project instructions](AGENTS.md); the old name did not mean a personal global file |
| `profiles/react-vite-fsd/AGENTS.md` | [Architecture choices](../../docs/project-architecture.md), [feature boundaries](../../references/architecture/feature-slice-boundary/feature-slice-layering.md), and the UI/data references below |
| `profiles/react-native-expo/AGENTS.md` | [Native UI and data boundaries](../../references/mobile/native-release-readiness/native-ui-and-data.md) |
| `profiles/legacy-jquery-web/AGENTS.md` | [jQuery contracts](../../references/legacy/legacy-jquery-web/jquery-browser.md) |
| `profiles/legacy-server-rendered-web/AGENTS.md` | [Server-rendered forms](../../references/legacy/legacy-server-rendered-web/server-rendered-legacy-flow.md) |
| `profiles/legacy-android-webview-hybrid/AGENTS.md` | [WebView and bridge contracts](../../references/legacy/legacy-android-webview-hybrid/android-webview-hybrid.md) |

Frontend styling, state, and response-contract detail remain in [style policy](../../references/frontend/style-policy-selection/style-policy-selection.md), [state ownership](../../references/frontend/frontend-state-data-flow/state-ownership.md), and [API boundary checks](../../references/backend/api-contract-boundary/api-boundary-checklist.md). Read only the relevant material. Legacy contracts are also available through the optional [legacy skill](../../skills/legacy/legacy-contracts/SKILL.md).

Existing copies in projects are not deleted or replaced. Keep project-specific modifications when adapting them. The 0.5.11 package and repository history retain the older templates; current bootstrap instructions are in [Existing repositories](../../docs/existing-repository-bootstrap.md).
