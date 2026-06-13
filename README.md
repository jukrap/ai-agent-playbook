<p align="center">
  <img src="docs/assets/logo-wide.png" alt="AI Agent Playbook" width="520">
</p>

<h1 align="center">AI Agent Playbook</h1>

<p align="center">
  A practical, reusable playbook for AI agents that need to work carefully inside real software repositories.
</p>

<p align="center">
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-2f9e44?style=flat-square"></a>
  <a href="https://www.npmjs.com/package/ai-agent-playbook"><img alt="npm package" src="https://img.shields.io/npm/v/ai-agent-playbook?style=flat-square"></a>
  <img alt="Node 18 plus" src="https://img.shields.io/badge/node-18%2B-1c7ed6?style=flat-square">
  <img alt="PowerShell installer" src="https://img.shields.io/badge/installer-PowerShell-f08c00?style=flat-square">
  <img alt="Agent agnostic" src="https://img.shields.io/badge/agents-Codex%20%7C%20Claude%20Code%20%7C%20more-e03131?style=flat-square">
</p>

## Languages

- English (canonical): this file
- Korean (한국어): [README.ko.md](translations/ko/README.ko.md)

## What This Is

AI Agent Playbook is a small shelf of reusable agent skills, project templates, project-memory guides, and a dependency-light runtime CLI.

It helps coding agents stop guessing. The playbook nudges agents to inspect the repository first, respect local rules, keep API boundaries clear, write useful worklogs, and verify changes before calling work done.

The repository is agent-agnostic. Codex, Claude Code, and other coding agents can use the same source material, while `adapters/` keeps agent-specific setup notes separate.

It is not a slash-command pack, a Codex plugin, or an auto-running agent. The default model is operator-in-the-loop: a human or agent explicitly runs the CLI, reviews dry-run output, then chooses whether to write files.

## What You Get

| Piece             | What it does                                                                                        | Where it lives     |
| ----------------- | --------------------------------------------------------------------------------------------------- | ------------------ |
| Reusable skills   | Trigger-focused operating guides for onboarding, docs, quality, Git, meta work, and legacy systems. | `skills/`          |
| Project templates | Copyable root agent rules, stack profiles, and project-memory files.                                | `templates/`       |
| Runtime harness   | A small CLI for bootstrapping `.ai-playbook/`, health checks, hook context, plans, and worklogs.     | `bin/`, `src/`     |
| Human docs        | Installation, classification, maintenance, publishing, and translation notes.                       | `docs/`            |
| Translations      | Korean reading copies that mirror English source files.                                             | `translations/ko/` |
| Agent adapters    | Setup notes for specific agent environments.                                                        | `adapters/`        |

## Quick Start

The package is published as [`ai-agent-playbook`](https://www.npmjs.com/package/ai-agent-playbook). Use `npx` for one-off commands, or install it globally when you want the shorter `ai-playbook` command.

For the full setup, update, and cleanup guide, see [Install, update, and uninstall](docs/installation.md).

### 1. Choose How to Run the CLI

Most users should start with `npx` because it does not add this package to the current project or to the global npm prefix.

`npm i` is the short alias for `npm install`; the important difference is whether you add `-g`, `-D`, or neither.

| Use case                                 | Command                                  | What it means                                                                 |
| ---------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------- |
| Try or run one command                   | `npx ai-agent-playbook --help`           | Downloads/runs the package through npm for that command.                      |
| Use `ai-playbook` from any directory     | `npm install -g ai-agent-playbook`       | Installs the CLI globally; then run `ai-playbook --help`.                     |
| Pin the tool inside one project          | `npm install -D ai-agent-playbook`       | Adds it to that project's `node_modules`; then run `npx ai-playbook ...`.     |
| Work from this repository's source clone | `node .\bin\ai-playbook.mjs --help`      | Runs the checked-out source directly.                                         |
| Just `npm install ai-agent-playbook`     | Usually not the recommended first choice | Installs the package into the current project, but does not install skills or bootstrap `.ai-playbook/`. |

Installing the npm package and installing playbook content are separate steps. `npm install` gives you the tool. `skills install` copies reusable skills into user skill roots. `bootstrap` writes a playbook into a target project.

### 2. Install Reusable Skills

Use this when you want the reusable agent skills available locally, without applying a project harness to any target repository.

```powershell
npx ai-agent-playbook skills install --dry-run
npx ai-agent-playbook skills install
```

The installer copies every `skills/<category>/<skill>/SKILL.md` folder from the package into common local skill directories:

- `%USERPROFILE%\.codex\skills\<skill>`
- `%USERPROFILE%\.agents\skills\<skill>`
- `%USERPROFILE%\.agents\skills\legacys\<legacy-skill>` for legacy skills

Restart Codex, or start a new agent session, after installation so new skill metadata is picked up.

If you are working from a local checkout instead of npm, use `node .\bin\ai-playbook.mjs skills install` or the compatible `.\install.ps1` script.

### 3. Update or Remove Reusable Skills

```powershell
npx ai-agent-playbook skills update --dry-run
npx ai-agent-playbook skills update
```

`skills update` is idempotent. It refreshes managed skills, adopts matching older copies, and refuses locally modified managed skills unless `--force-managed` is provided.

To remove managed skills that were installed by this playbook:

```powershell
npx ai-agent-playbook skills uninstall --dry-run
npx ai-agent-playbook skills uninstall
```

For a persistent global command:

```powershell
npm install -g ai-agent-playbook
ai-playbook --help
ai-playbook skills update
```

Update or remove the global CLI with npm:

```powershell
npm install -g ai-agent-playbook@latest
npm uninstall -g ai-agent-playbook
```

`npm uninstall -g ai-agent-playbook` removes only the global CLI package. It does not delete skills already copied into `%USERPROFILE%\.codex\skills` or `%USERPROFILE%\.agents\skills`. Use `skills uninstall` for that.

### 4. Apply the Project Harness When Needed

Use the runtime CLI only when a target project should receive a root `AGENTS.md` bootstrap and an `.ai-playbook/` project-memory folder.

```powershell
npx ai-agent-playbook bootstrap <target-project> --dry-run
npx ai-agent-playbook bootstrap <target-project>
npx ai-agent-playbook doctor <target-project>
npx ai-agent-playbook operator check <target-project> --path src/example.ts --json
npx ai-agent-playbook operator search <target-project> --query "auth flow" --path src/example.ts --json
npx ai-agent-playbook operator analyze <target-project> --path src/example.ts --json
npx ai-agent-playbook managed catalog <target-project> --json
npx ai-agent-playbook adapter config <target-project> --adapter codex --json
```

After a global install, replace `npx ai-agent-playbook` with `ai-playbook`. From a local checkout, replace it with `node .\bin\ai-playbook.mjs`.

Use `--local-only` when the target project's `.ai-playbook/` folder should be ignored by Git. Use `--profile <name>` only after the target stack is known.

Existing projects that already have `ai-playbook/` continue to work as a legacy layout when `.ai-playbook/` is absent, but new bootstrap output uses `.ai-playbook/`. Use `migrate path --json` to preview the legacy-to-dot path move before applying it.

Runtime hooks and plugins are not part of the default install path. Treat them as optional extensions after the document and CLI harness are stable. The Codex and Claude Code adapters include read-only context hook examples, a read-only `adapter config` renderer, and a read-only `adapter check` self-check, but they are not installed automatically. See [Runtime roadmap](docs/runtime-roadmap.md).

Managed project harness commands use `.ai-playbook/.ai-agent-playbook-install.json` to track files copied by this playbook. Use `managed check` before cleanup, `managed catalog` to review owned files by kind and status, `managed adopt` to add a marker to older matching installs, `managed prune` to preview removing one selected unmodified managed file, and `managed uninstall` to preview removal of all unmodified managed files. `managed adopt`, `managed prune`, and `managed uninstall` write only when `--apply` is provided.

Operator diagnostics such as `operator check`, `operator search`, `operator context`, `operator analyze`, `operator map`, `operator audit`, `operator gc`, `rules check`, `diagnostics check`, and `qa tui-check` are operator-triggered. Use `operator check` as the combined human checkpoint for doctor, guide freshness, local verification command candidates, and rule matching before adding stronger runtime automation. Use `operator search` as a local project explorer for related source, playbook, rules, plans, and worklog matches. Use `operator context` to preview path-scoped playbook context and rule matches. Use `operator analyze` to combine diagnostics, map, rules, context, and optional AST/LSP/comment-quality setup signals without running those optional tools. Use `operator map` to summarize stack, architecture, quality, and concern signals without writing an analysis file. Use `operator audit` to find broken playbook links, orphan context globs, duplicate playbook notes, legacy path drift, and managed manifest drift without writing files. Use `operator gc` as a preview-first cleanup for obsolete unmodified managed playbook files; it writes only with `--apply`. `diagnostics check` formats package scripts with the detected lockfile package manager.

## Everyday Flow

```text
npx or global install
  -> skills install or update
  -> restart the agent
  -> inspect the target project
  -> bootstrap .ai-playbook/ only when the project needs local playbook files
  -> use operator checks/search and managed cleanup as explicit commands
```

For existing projects, start with a dry run and inspect conflicts before writing files:

```powershell
npx ai-agent-playbook bootstrap <target-project> --local-only --dry-run
npx ai-agent-playbook guides sync <target-project> --dry-run
npx ai-agent-playbook guides sync <target-project> --check --diff --json
npx ai-agent-playbook migrate path <target-project> --json
npx ai-agent-playbook managed check <target-project> --json
npx ai-agent-playbook managed catalog <target-project> --json
npx ai-agent-playbook operator search <target-project> --query "auth flow" --json
npx ai-agent-playbook operator context <target-project> --path src/example.ts --json
npx ai-agent-playbook operator analyze <target-project> --path src/example.ts --json
npx ai-agent-playbook operator map <target-project> --json
npx ai-agent-playbook operator audit <target-project> --json
npx ai-agent-playbook operator gc <target-project> --json
```

## Repository Map

```text
bin/                  ai-playbook CLI entrypoint
src/                  CLI runtime implementation
skills/
  project/            Bootstrap, onboarding, and project-memory skills
  quality/            API boundary, UI quality, cleanup, and review skills
  git/                Commit, PR, push, and worklog skills
  meta/               Skill-authoring skills
  legacy/             Legacy-system maintenance skills
templates/
  agents/             Root agent instruction templates and project profiles
  codex-home/         Optional personal Codex home AGENTS.md template
  project-playbook/   Copyable ai-playbook project-memory template
examples/             Worklog, prompt, and handoff examples
translations/         Human translations; never install these as skills
adapters/             Agent-specific install notes and optional hook PoCs
docs/                 Classification, installation, publishing, and maintenance notes
docs/assets/          README and documentation images
scripts/              Validation and local sync helpers
test/                 Node CLI and adapter tests
.github/              GitHub Actions validation workflow
```

## Skill Catalog

Each `SKILL.md` is short and trigger-focused. Longer reusable detail belongs in `references/`.

| Category | Skill | Use when |
| -------- | ----- | -------- |
| Project | `project-bootstrap` | Starting a new project, inheriting a repository, or setting up project memory and root agent guidance. |
| Project | `repo-onboarding` | Opening an unfamiliar repository before planning architecture, tooling, edits, or workflow answers. |
| Project | `project-doc-system` | Creating, reorganizing, or reviewing project AI docs, maps, runbooks, decisions, plans, and worklogs. |
| Quality | `api-contract-boundary` | Implementing, debugging, or reviewing frontend/backend contracts, DTOs, mocks, payloads, and adapters. |
| Quality | `ui-style-policy` | Selecting, documenting, or enforcing a repository UI styling policy. |
| Quality | `style-quality-review` | Reviewing or improving UI styling, responsive behavior, layout overflow, and visual regressions. |
| Quality | `frontend-ui-polish` | Implementing or refining visible frontend UI surfaces while preserving product intent and existing design conventions. |
| Quality | `cleanup-ai-slop` | Cleaning low-trust, overcomplicated, duplicated, or mechanically generated code while preserving behavior. |
| Quality | `review-work-light` | Reviewing recent implementation work before handoff without starting a blocking review process. |
| Git | `commit-worklog-guardrails` | Staging, committing, pushing, opening PRs, preparing release notes, or recording worklogs. |
| Meta | `agent-skill-authoring` | Creating, reviewing, or reorganizing reusable agent skills and references. |
| Legacy | `legacy-general` | Maintaining or extending legacy code with unclear flow, hidden coupling, weak tests, or mixed documentation. |
| Legacy | `legacy-risk-check` | Changing legacy code that may affect shared state, CSS/JS, selectors, templates, forms, APIs, builds, or deploys. |
| Legacy | `legacy-feature-addition` | Adding behavior, screens, fields, business rules, or integrations without rewriting the host system. |
| Legacy | `legacy-jquery-web` | Maintaining jQuery, plugins, direct DOM manipulation, global scripts, AJAX callbacks, or script-order coupling. |
| Legacy | `legacy-server-rendered-web` | Maintaining templates, controllers, form posts, server validation, sessions, layouts, and partials. |
| Legacy | `legacy-php-lamp` | Maintaining PHP/LAMP pages with includes, sessions, mixed HTML/PHP, direct SQL, globals, or shared hosting limits. |
| Legacy | `legacy-java-spring-mvc` | Maintaining Spring MVC, JSP, Servlet, MyBatis, WAR deployment, XML config, or server-rendered Java apps. |
| Legacy | `legacy-dotnet-webforms` | Maintaining ASP.NET Web Forms, .NET Framework, code-behind, ViewState, Web.config, IIS, or old enterprise .NET apps. |
| Legacy | `legacy-android-webview-hybrid` | Maintaining Android WebView apps with web assets, JavaScript bridges, permissions, or device APIs. |
| Legacy | `legacy-ie-activex-compat` | Maintaining intranet systems that depend on IE mode, ActiveX, old browser APIs, or compatibility constraints. |
| Legacy | `legacy-database-heavy-system` | Maintaining stored procedures, triggers, views, direct SQL, scheduled jobs, or database-shaped business rules. |
| Legacy | `legacy-reporting-printing` | Maintaining reports, print preview, PDF/Excel export, labels, barcodes, invoices, or printer-specific flows. |
| Legacy | `legacy-batch-file-transfer` | Maintaining scheduled batches, cron jobs, Windows Task Scheduler, CSV/Excel import/export, SFTP, or file drops. |

## Documentation

- [Repository working rules](AGENTS.md): maintenance rules for agents editing this repository.
- [Repository context](CONTEXT.md): core terms and design intent for the playbook.
- [Install, update, and uninstall](docs/installation.md): npm/npx usage, global CLI setup, skill lifecycle, project bootstrap, cleanup, and legacy PowerShell paths.
- [Runtime harness](docs/harness-runtime.md): CLI commands, JSON contracts, overwrite policy, and target-project flow.
- [Runtime roadmap](docs/runtime-roadmap.md): staged hardening plan and optional hook-layer boundaries.
- [Codex adapter](adapters/codex/README.md): Codex-specific local sync behavior and Codex App on Windows workflow.
- [Claude Code adapter](adapters/claude-code/README.md): Claude Code setup notes and optional read-only context hook example.
- [Templates](templates/README.md): what to copy into project repositories and what to leave as installable skills.
- [Classification](docs/classification.md): why skills, templates, examples, docs, and adapters are separated.
- [Superpowers integration](docs/superpowers-integration.md): how to use this playbook alongside external process skills.
- [Maintenance workflow](docs/maintenance.md): what to update together when adding or changing content.
- [Translation policy](docs/translation-policy.md): English source and Korean translation rules.
- [Publishing checklist](docs/publishing-checklist.md): pre-publish hygiene checks.

## Maintenance Checks

Run the project-defined checks before claiming repository edits are complete:

```powershell
npm run check
npm test
.\scripts\validate-skills.ps1
.\scripts\validate-translations.ps1
.\scripts\sync-skills.ps1 -WhatIf
```

If installed local copies need to be updated after source edits, run:

```powershell
.\scripts\sync-skills.ps1
```

## Publishing Notes

- Keep English source files canonical.
- Update Korean translations in the same change as English source edits.
- Do not commit personal absolute paths, company names, credentials, internal URLs, branch names, or PR numbers.
- Do not edit installed skill copies as the source of truth. Edit this repository, validate, then sync.
- Confirm templates do not claim a stack, package manager, or workflow unless the profile explicitly says so.

## License

Licensed under [MIT](LICENSE).
