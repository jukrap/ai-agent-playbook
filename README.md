<p align="center">
  <img src="docs/assets/logo-wide.png" alt="AI Agent Playbook" width="520">
</p>

<h1 align="center">AI Agent Playbook</h1>

<p align="center">
  A repository-scale harness for AI coding agents: reusable skills, project memory, runtime checks, and MCP tools for careful software work.
</p>

<p align="center">
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-2f9e44?style=flat-square"></a>
  <a href="https://www.npmjs.com/package/ai-agent-playbook"><img alt="npm package" src="https://img.shields.io/npm/v/ai-agent-playbook?style=flat-square"></a>
  <img alt="Node 18 plus" src="https://img.shields.io/badge/node-18%2B-1c7ed6?style=flat-square">
  <img alt="Python 3.11 plus optional" src="https://img.shields.io/badge/python-3.11%2B%20optional-3776ab?style=flat-square">
  <img alt="PowerShell installer" src="https://img.shields.io/badge/installer-PowerShell-f08c00?style=flat-square">
  <img alt="Agent agnostic" src="https://img.shields.io/badge/agents-Codex%20%7C%20Claude%20Code%20%7C%20more-e03131?style=flat-square">
</p>

## Languages

- English (canonical): this file
- Korean (한국어): [README.ko.md](translations/ko/README.ko.md)

## What This Is

AI Agent Playbook is a local-first AI harness for real software repositories. It combines capability-focused skills, copyable project memory, a dependency-light runtime CLI, and an optional local MCP server so agents can inspect, plan, verify, and hand off work without guessing.

It helps coding agents stop guessing. The playbook nudges agents to inspect the repository first, respect local rules, keep API boundaries clear, write useful worklogs, and verify changes before calling work done.

The repository is agent-agnostic. Codex, Claude Code, and other coding agents can use the same source material, while `adapters/` keeps agent-specific setup notes separate.

It is not a slash-command pack, a Codex plugin, or an auto-running agent. The default model is operator-in-the-loop: a human or agent explicitly runs the CLI, reviews dry-run output, then chooses whether to write files. MCP is an optional local tool surface so an AI app can call read-only diagnostics by name when you ask in natural language.

## What You Get

| Piece             | What it does                                                                                        | Where it lives     |
| ----------------- | --------------------------------------------------------------------------------------------------- | ------------------ |
| Reusable skills   | Trigger-focused operating guides for project, delivery, architecture, frontend, backend, data, database, DevOps, design, mobile, security, harness, quality, and legacy work. | `skills/`          |
| Project templates | Copyable root agent rules, stack profiles, and project-memory files for current facts, vocabulary, maps, decisions, and evidence. | `templates/`       |
| Runtime harness   | A small CLI for bootstrapping `.ai-playbook/`, health checks, context, runs, contracts, plans, and worklogs. | `bin/`, `src/`     |
| MCP tools         | Local read-only tools, resources, and prompts for AI apps: catalogs, adapter support/readiness, usage guide, reference adoption, playbook layout, permission model, natural writing review, index search, write-gate preview, context, operator checks, research, contracts, image diff, AST search, clone cues, and TypeScript/JavaScript analysis. | `src/`             |
| Human docs        | Lifecycle, command, classification, maintenance, publishing, and translation notes.                  | `docs/`            |
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

If your AI app supports MCP, register a local server command such as `npx ai-agent-playbook mcp`. Then you can ask the AI to inspect playbook context, read the capability/skill/workflow/adapter/usage/reference-adoption resources, run writing or operator checks, or do deep local analysis without remembering every CLI command. MCP tools are read-only by default.

If you want the shorter `ai-playbook` command from any directory, install the package globally:

```powershell
npm install -g ai-agent-playbook
ai-playbook --help
```

Python is optional but recommended for deeper local language checks. Node remains the stable CLI and MCP facade; when Python 3.11+ is available, commands such as `writing naturalness-check --engine auto` merge Python-backed Korean/English prose analysis with the built-in JavaScript fallback.

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\python -m pip install -U pip kss kiwipiepy
$env:AI_PLAYBOOK_PYTHON = ".\.venv\Scripts\python.exe"
npx ai-agent-playbook runtime python-status --json
npx ai-agent-playbook writing naturalness-check <target-project> --path README.md --lang auto --engine auto --json
```

From a source checkout, `.\scripts\bootstrap-python.ps1` creates a local `.venv` and installs the optional Python extras for development. Without Python, the CLI and MCP server still work and return JavaScript fallback results with an `engines.unavailable` warning for Python-backed checks.

The npm package installs the CLI. It does not automatically copy skills, create `.ai-playbook/`, enable hooks, or register slash commands. Keep those actions explicit:

- `skills install`, `skills update`, and `skills uninstall` manage reusable user-level skills.
- `bootstrap`, `guides sync`, `managed *`, `contracts *`, `operator *`, and `qa *` manage or inspect one target project.
- `mcp` starts a local stdio MCP server for AI apps. It does not write files by itself.
- Runtime hooks and adapter settings are optional and are never installed by default.

For command-by-command usage, see [Command guide](docs/commands.md). For update, uninstall, local checkout, PowerShell compatibility, ownership markers, and cleanup details, see [Lifecycle guide](docs/lifecycle.md).

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

After bootstrapping `.ai-playbook/`, agents should start from `START_HERE.md`, then read `CURRENT.md`, `questions.md`, relevant memory/maps/contracts, and the matching workflow recipe. Generated files under `runtime/` are evidence candidates, not trusted memory, until reviewed and promoted.

## Repository Map

```text
bin/                  ai-playbook CLI entrypoint
src/                  CLI runtime implementation
skills/
  ai-harness/        MCP, skill, agent, context, fact gate, witness, cache, and index design skills
  architecture/      Boundary, feature slice, domain model, and monorepo/package architecture skills
  backend/           API, backend change safety, request/error contract, job/worker, connector, and server-rendered flow skills
  data/              Data pipeline, analytics, source registry, reporting, and migration integrity skills
  database/          Schema, migration, SQL, and data integrity skills
  delivery/          Planning, eval, verification, testing, Git, PR, and worklog skills
  devops/            CI/CD, container, package release, deployment, and operations triage skills
  design/            Design direction, brand identity, reference analysis, and image/Figma handoff skills
  frontend/          UI, browser, state/data, accessibility, visual QA, design-system, and interactive media skills
  mobile/            Native release, permission, offline sync, hybrid, WebView, and device QA skills
  security/          Auth, dependency supply chain, license/notice, security review, compliance gate, and risk skills
  project/            Bootstrap, onboarding, project planning, documentation, natural writing, and project-memory skills
  quality/            UI quality review, cleanup, compatibility routes, and lightweight review skills
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
docs/                 Lifecycle, classification, publishing, and maintenance notes
docs/assets/          README and documentation images
scripts/              Validation and local sync helpers
test/                 Node CLI and adapter tests
.github/              GitHub Actions validation workflow
```

## Skill Catalog

Detailed triggers live in [Skill catalog](docs/skill-catalog.md). The README keeps the public map short so the English and Korean versions stay aligned.

- Project and docs: bootstrap, repository onboarding, project memory, ADR/spec handoff, requirements, issue planning, release notes, natural writing review, and documentation packages.
- Delivery and verification: Git/worklogs, verification strategy, CI gates, flaky test triage, test fixtures, and eval harnesses.
- AI harness: MCP surface design, context and memory design, agent handoff, skill-pack governance, runtime indexes/caches, capability witnesses, and fact gates.
- Architecture and backend: boundaries, feature slices, domain modeling, monorepos, API contracts, backend change safety, request/error contracts, job/worker reliability, connectors, and server-rendered flows.
- Data and database: analytics, lineage, migrations, retrieval knowledge bases, source registries, schema changes, query performance, and data integrity.
- DevOps and release: containers, deployment, package publishing, release readiness, and incident/observability triage.
- Design and frontend: design direction, brand identity, visual references, image/Figma handoff, style policy, UI polish, accessibility, state/data flow, visual regression, and 3D interaction.
- Mobile: native release, device permissions, offline sync, and WebView bridges.
- Security and compliance: security review, authentication/authorization, dependency supply chain, license/notice evidence, and release gates.
- Legacy: hidden coupling, old web stacks, server-rendered systems, WebView hybrids, IE/ActiveX compatibility, reporting/printing, batch/file transfer, and database-heavy systems.

## Documentation

- [Repository working rules](AGENTS.md): maintenance rules for agents editing this repository.
- [Repository context](CONTEXT.md): core terms and design intent for the playbook.
- [First 10 minutes](docs/quick-start.md): beginner-friendly first run, glossary, and safe command order.
- [Command guide](docs/commands.md): what each CLI command does, when to use it, and whether it writes files.
- [Lifecycle guide](docs/lifecycle.md): npm/npx usage, global CLI setup, skill lifecycle, project bootstrap/removal, cleanup, and legacy PowerShell paths.
- [Runtime harness](docs/harness-runtime.md): runtime principles, JSON contract notes, overwrite policy, and target-project flow.
- [Structured playbook layout](docs/structured-playbook-layout.md): `.ai-playbook` directory roles and migration commands.
- [Capability taxonomy](docs/capability-taxonomy.md): capability-first categories and compatibility wrapper policy.
- [Skill catalog](docs/skill-catalog.md): long-form skill list and trigger summary.
- [MCP permission model](docs/mcp-permission-model.md): read, scaffold, managed-write, and project-write tiers.
- [Reference adoption](docs/reference-adoption.md): how to distill external references into local capabilities without prompt noise.
- [Runtime roadmap](docs/runtime-roadmap.md): staged hardening plan and optional hook-layer boundaries.
- [Codex adapter](adapters/codex/README.md): Codex-specific local sync behavior and Codex App on Windows workflow.
- [Claude Code adapter](adapters/claude-code/README.md): Claude Code setup notes and optional read-only context hook example.
- [Templates](templates/README.md): what to copy into project repositories and what to leave as installable skills.
- [Classification](docs/classification.md): why skills, templates, examples, docs, and adapters are separated.
- [Superpowers integration](docs/superpowers-integration.md): how to use this playbook alongside external process skills.
- [Maintenance workflow](docs/maintenance.md): what to update together when adding or changing content.
- [Translation policy](docs/translation-policy.md): English source and Korean translation rules.
- [Publishing checklist](docs/publishing-checklist.md): pre-publish hygiene checks.
- [Structured playbook cutover notes](docs/changes/structured-playbook-cutover.md): historical notes for the layout and runtime reorganization.

## For Maintainers

This README is the public entry point for users. If you are editing this source repository, read [Repository working rules](AGENTS.md) and [Maintenance workflow](docs/maintenance.md) first. Release hygiene lives in [Publishing checklist](docs/publishing-checklist.md).

Keep English source files canonical, update Korean translations with English source edits, and do not commit personal paths, credentials, internal URLs, branch names, PR numbers, or installed local skill copies.

## License

Licensed under [MIT](LICENSE).
