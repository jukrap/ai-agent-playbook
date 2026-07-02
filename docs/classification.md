# Classification

This repository separates runtime CLI code, installable skills, copyable templates, examples, docs, and adapters.

## Why not keep everything under one agent

The content is not agent-specific. Codex is one installation target. The source should stay agent-agnostic, with agent-specific setup in `adapters/`.

## Skill categories

- `skills/project`: project bootstrap, onboarding, and project-memory maintenance.
- `skills/backend`: API contract, backend change safety, server-rendered flow, worker, and integration workflows.
- `skills/security`: authentication, authorization, dependency supply chain, security review, and risk workflows.
- `skills/quality`: UI style policy, visual quality, cleanup, and lightweight review workflows.
- `skills/git`: commit, PR, push, and worklog guardrails.
- `skills/meta`: skill-authoring and repository-maintenance skills.
- `skills/legacy`: maintenance workflows where runtime coupling and compatibility dominate.

Add a new category only when the first real skill in that category exists. When a new category or skill changes this map, update `README.md`, this file, Korean translations, and installed skill copies through `docs/maintenance.md`.

## Runtime category

- `bin/ai-playbook.mjs`: CLI entrypoint.
- `src/`: dependency-free Node runtime implementation.
- `test/`: Node test coverage for bootstrap, doctor, context, guide checks, path migration, adapter hooks, adapter readiness, lifecycle reminders, plan, and worklog commands.

The runtime applies templates and creates scaffold files. It must not encode private project facts or replace the installable skills.

Optional hook or plugin experiments belong in a clearly separated adapter or experimental package until they have a stable contract. They may call the core CLI contracts, but they must not become required for the default document and CLI harness or the only place where project policy exists.

## Template categories

- `templates/agents`: thin root `AGENTS.md` bootstrap files and stack-specific profiles.
- `templates/codex-home`: optional personal Codex home guidance for `~/.codex/AGENTS.md`; it is not copied into target repositories by the runtime.
- `templates/project-playbook`: copyable project-memory template that becomes `.ai-playbook/` in target repositories, including internal `SKILLS.md` and `GIT.md` policy files.

Keep the target project root small. The runtime writes only a thin root `AGENTS.md` bootstrap by default; skill and Git policy belong under `.ai-playbook/`.

## Process skill compatibility

This repository does not replace external process skill packs. Use `docs/superpowers-integration.md` to decide how process skills and playbook skills should be combined.

Use `docs/runtime-roadmap.md` when deciding whether a runtime hook layer should remain a local experiment, become an adapter, or be promoted into documented CLI behavior.

## Project-memory map

- `project-bootstrap`: sets up root policies and an `.ai-playbook/` layout after inspecting the repository.
- `repo-onboarding`: reads repo state and existing `.ai-playbook/` context before planning or editing.
- `project-doc-system`: organizes `.ai-playbook/`, maps, runbooks, decisions, plans, worklogs, and archived notes.

## Quality map

- `ui-style-policy`: selects or documents the repository styling method across design system, CSS/classes, utility classes, or inline styles.
- `style-quality-review`: reviews visible UI quality while preserving product intent.
- `frontend-ui-polish`: implements or refines visible UI surfaces while preserving product intent and existing design conventions.
- `cleanup-ai-slop`: removes low-trust code noise in a behavior-preserving, bounded cleanup.
- `review-work-light`: reviews recent implementation work without turning review into an automatic blocking gate.

## Skill authoring map

- `agent-skill-authoring`: reusable skill structure, trigger descriptions, references, and skill/template boundaries.

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
