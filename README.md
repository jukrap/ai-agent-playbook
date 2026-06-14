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

AI Agent Playbook is a small shelf of reusable agent skills, project templates, project-memory guides, a dependency-light runtime CLI, and a local MCP tool server for read-only analysis.

It helps coding agents stop guessing. The playbook nudges agents to inspect the repository first, respect local rules, keep API boundaries clear, write useful worklogs, and verify changes before calling work done.

The repository is agent-agnostic. Codex, Claude Code, and other coding agents can use the same source material, while `adapters/` keeps agent-specific setup notes separate.

It is not a slash-command pack, a Codex plugin, or an auto-running agent. The default model is operator-in-the-loop: a human or agent explicitly runs the CLI, reviews dry-run output, then chooses whether to write files. MCP is an optional local tool surface so an AI app can call read-only diagnostics by name when you ask in natural language.

## What You Get

| Piece             | What it does                                                                                        | Where it lives     |
| ----------------- | --------------------------------------------------------------------------------------------------- | ------------------ |
| Reusable skills   | Trigger-focused operating guides for onboarding, docs, quality, Git, meta work, and legacy systems. | `skills/`          |
| Project templates | Copyable root agent rules, stack profiles, and project-memory files for current facts, vocabulary, maps, decisions, and evidence. | `templates/`       |
| Runtime harness   | A small CLI for bootstrapping `.ai-playbook/`, health checks, context, runs, contracts, plans, and worklogs. | `bin/`, `src/`     |
| MCP tools         | Local read-only tools for AI apps: context, operator checks, search, research, contracts, managed state, image diff, AST search, exact function-body clone cues, and TypeScript/JavaScript analysis. | `src/`             |
| Human docs        | Installation, classification, maintenance, publishing, and translation notes.                       | `docs/`            |
| Translations      | Korean reading copies that mirror English source files.                                             | `translations/ko/` |
| Agent adapters    | Setup notes for specific agent environments.                                                        | `adapters/`        |

## Quick Start

The package is published as [`ai-agent-playbook`](https://www.npmjs.com/package/ai-agent-playbook). The simplest path is to run it through npm with `npx`:

```powershell
npx ai-agent-playbook --help
npx ai-agent-playbook skills install --dry-run
npx ai-agent-playbook skills install
npx ai-agent-playbook bootstrap <target-project> --dry-run
npx ai-agent-playbook bootstrap <target-project>
npx ai-agent-playbook operator check <target-project> --json
```

New to this playbook? Start with [First 10 minutes](docs/quick-start.md). It explains what `npx`, global install, skills, and project bootstrap do before you write files.

In examples, names inside angle brackets are placeholders. Replace `<target-project>` with the project folder you want to inspect, or use `.` when your terminal is already inside that project. Quote paths that contain spaces, and keep private local paths out of shared issues, docs, and PRs.

If your AI app supports MCP, register a local server command such as `npx ai-agent-playbook mcp`. Then you can ask the AI to inspect playbook context, run operator search, or do deep local analysis without remembering every CLI command. MCP tools are read-only in this version.

If you want the shorter `ai-playbook` command from any directory, install the package globally:

```powershell
npm install -g ai-agent-playbook
ai-playbook --help
```

The npm package installs the CLI. It does not automatically copy skills, create `.ai-playbook/`, enable hooks, or register slash commands. Keep those actions explicit:

- `skills install`, `skills update`, and `skills uninstall` manage reusable user-level skills.
- `bootstrap`, `guides sync`, `managed *`, `contracts *`, `operator *`, and `qa *` manage or inspect one target project.
- `mcp` starts a local stdio MCP server for AI apps. It does not write files by itself.
- Runtime hooks and adapter settings are optional and are never installed by default.

For command-by-command usage, see [Command guide](docs/commands.md). For update, uninstall, local checkout, PowerShell compatibility, ownership markers, and cleanup details, see [Install, update, and uninstall](docs/installation.md).

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
npx ai-agent-playbook bootstrap <target-project> --local-only
npx ai-agent-playbook operator check <target-project> --json
npx ai-agent-playbook operator preflight <target-project> --intent "planned change" --json
npx ai-agent-playbook operator research <target-project> --query "project risks" --json
```

See [Command guide](docs/commands.md) for search, managed cleanup, adapter setup, plan, and worklog commands.

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

### Project

- `project-bootstrap`: start a new project, inherit a repository, or set up project memory and root agent guidance.
- `repo-onboarding`: inspect an unfamiliar repository before planning architecture, tooling, edits, or workflow answers.
- `project-doc-system`: create, reorganize, or review project AI docs, maps, runbooks, decisions, plans, and worklogs.

### Quality

- `api-contract-boundary`: implement, debug, or review frontend/backend contracts, DTOs, mocks, payloads, and adapters.
- `ui-style-policy`: select, document, or enforce a repository UI styling policy.
- `style-quality-review`: review or improve UI styling, responsive behavior, layout overflow, and visual regressions.
- `frontend-ui-polish`: implement or refine visible frontend UI surfaces while preserving product intent and existing design conventions.
- `cleanup-ai-slop`: clean low-trust, overcomplicated, duplicated, or mechanically generated code while preserving behavior.
- `review-work-light`: review recent implementation work before handoff without starting a blocking review process.

### Git and Meta

- `commit-worklog-guardrails`: stage, commit, push, open PRs, prepare release notes, or record worklogs.
- `agent-skill-authoring`: create, review, or reorganize reusable agent skills and references.

### Legacy

General legacy work:

- `legacy-general`: maintain or extend legacy code with unclear flow, hidden coupling, weak tests, or mixed documentation.
- `legacy-risk-check`: check hidden blast radius before changes that may affect shared state, CSS/JS, selectors, templates, forms, APIs, builds, or deploys.
- `legacy-feature-addition`: add behavior, screens, fields, business rules, or integrations without rewriting the host system.

Web, mobile, and compatibility surfaces:

- `legacy-jquery-web`: maintain jQuery, plugins, direct DOM manipulation, global scripts, AJAX callbacks, or script-order coupling.
- `legacy-server-rendered-web`: maintain templates, controllers, form posts, server validation, sessions, layouts, and partials.
- `legacy-php-lamp`: maintain PHP/LAMP pages with includes, sessions, mixed HTML/PHP, direct SQL, globals, or shared hosting limits.
- `legacy-android-webview-hybrid`: maintain Android WebView apps with web assets, JavaScript bridges, permissions, or device APIs.
- `legacy-ie-activex-compat`: maintain intranet systems that depend on IE mode, ActiveX, old browser APIs, or compatibility constraints.

Enterprise stacks and data-heavy flows:

- `legacy-java-spring-mvc`: maintain Spring MVC, JSP, Servlet, MyBatis, WAR deployment, XML config, or server-rendered Java apps.
- `legacy-dotnet-webforms`: maintain ASP.NET Web Forms, .NET Framework, code-behind, ViewState, Web.config, IIS, or old enterprise .NET apps.
- `legacy-database-heavy-system`: maintain stored procedures, triggers, views, direct SQL, scheduled jobs, or database-shaped business rules.
- `legacy-reporting-printing`: maintain reports, print preview, PDF/Excel export, labels, barcodes, invoices, or printer-specific flows.
- `legacy-batch-file-transfer`: maintain scheduled batches, cron jobs, Windows Task Scheduler, CSV/Excel import/export, SFTP, or file drops.

## Documentation

- [Repository working rules](AGENTS.md): maintenance rules for agents editing this repository.
- [Repository context](CONTEXT.md): core terms and design intent for the playbook.
- [First 10 minutes](docs/quick-start.md): beginner-friendly first run, glossary, and safe command order.
- [Command guide](docs/commands.md): what each CLI command does, when to use it, and whether it writes files.
- [Install, update, and uninstall](docs/installation.md): npm/npx usage, global CLI setup, skill lifecycle, project bootstrap, cleanup, and legacy PowerShell paths.
- [Runtime harness](docs/harness-runtime.md): runtime principles, JSON contract notes, overwrite policy, and target-project flow.
- [Runtime roadmap](docs/runtime-roadmap.md): staged hardening plan and optional hook-layer boundaries.
- [Codex adapter](adapters/codex/README.md): Codex-specific local sync behavior and Codex App on Windows workflow.
- [Claude Code adapter](adapters/claude-code/README.md): Claude Code setup notes and optional read-only context hook example.
- [Templates](templates/README.md): what to copy into project repositories and what to leave as installable skills.
- [Classification](docs/classification.md): why skills, templates, examples, docs, and adapters are separated.
- [Superpowers integration](docs/superpowers-integration.md): how to use this playbook alongside external process skills.
- [Maintenance workflow](docs/maintenance.md): what to update together when adding or changing content.
- [Translation policy](docs/translation-policy.md): English source and Korean translation rules.
- [Publishing checklist](docs/publishing-checklist.md): pre-publish hygiene checks.

## For Maintainers

This README is the public entry point for users. If you are editing this source repository, read [Repository working rules](AGENTS.md) and [Maintenance workflow](docs/maintenance.md) first. Release hygiene lives in [Publishing checklist](docs/publishing-checklist.md).

Keep English source files canonical, update Korean translations with English source edits, and do not commit personal paths, credentials, internal URLs, branch names, PR numbers, or installed local skill copies.

## License

Licensed under [MIT](LICENSE).
