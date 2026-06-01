# Classification

This repository separates installable skills from project templates.

## Why not keep everything under Codex

The content is not Codex-specific. Codex is one installation target. The source should stay agent-agnostic, with agent-specific setup in `adapters/`.

## Skill categories

- `skills/engineering`: repeatable engineering workflows for most repositories.
- `skills/legacy`: legacy and SI maintenance workflows where runtime coupling and compatibility dominate.

This mirrors the useful part of skill-first repositories: broad categories first, small composable skills second. We do not put `AGENTS.md` templates inside `skills` because those are copied into projects, not invoked as one-off skills.

Add a new category only when the first real skill in that category exists. When a new category or skill changes this map, update `README.md`, this file, Korean translations, and installed skill copies through `docs/maintenance.md`.

## Template categories

- `templates/agents`: root `AGENTS.md` examples by project profile.
- `templates/local-ai`: optional project-local docs for planning, worklogs, API boundaries, style rules, and FSD guidance.

## Process skill compatibility

This repository does not replace process skill packs such as Superpowers. Use `docs/superpowers-integration.md` to decide how process skills and playbook skills should be combined.

## Style policy map

- `style-quality-review`: general UI quality review while preserving product intent.
- `design-system-first`: shared components, tokens, variants, and design-system primitives own styling first.
- `css-class-first`: stylesheets, CSS modules, scoped CSS, or semantic classes are the project convention.
- `utility-class-first`: Tailwind-style utilities or atomic class composition are the project convention.
- `inline-style-first`: component-local inline style objects are explicitly preferred.

## Legacy expansion map

- `legacy-general`: default legacy maintenance discipline.
- `legacy-risk-check`: hidden blast-radius check before risky edits.
- `legacy-feature-addition`: adding behavior without rewriting the host system.
- `legacy-jquery-web`: jQuery/plugin/direct DOM browser pages.
- `legacy-server-rendered-web`: server templates, forms, sessions, validation.
- `legacy-android-webview-hybrid`: native shell plus WebView and bridge.
- `legacy-database-heavy-system`: stored procedures, triggers, direct SQL, DB-shaped business rules.
- `legacy-java-spring-mvc`: Spring MVC/JSP/MyBatis/Servlet/WAR systems.
- `legacy-dotnet-webforms`: ASP.NET Web Forms, ViewState, code-behind, IIS.
- `legacy-php-lamp`: PHP include/session/direct SQL pages.
- `legacy-ie-activex-compat`: IE mode, ActiveX, intranet browser/device constraints.
- `legacy-reporting-printing`: report, export, print, label, barcode, invoice flows.
- `legacy-batch-file-transfer`: scheduled batch, CSV/Excel/SFTP/file-drop integrations.
