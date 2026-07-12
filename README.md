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

It is not a slash-command pack, a Codex plugin, or an always-on hosted agent service. Local operation remains available without a forge. Automation starts only from an approved plan or an explicitly applied schedule, and preview-first commands keep remote and operating-system changes reviewable. MCP remains an optional local tool surface whose default tools are read-only.

## What You Get

| Piece             | What it does                                                                                        | Where it lives     |
| ----------------- | --------------------------------------------------------------------------------------------------- | ------------------ |
| Reusable skills   | Trigger-focused operating guides for project, delivery, architecture, frontend, backend, data, database, DevOps, design, mobile, security, harness, quality, and legacy work. | `skills/`          |
| Project templates | Copyable root agent rules, stack profiles, and project-memory files for current facts, vocabulary, maps, decisions, and evidence. | `templates/`       |
| Runtime harness   | A CLI for bootstrapping `.ai-agent-playbook/`, health checks, context, runs, contracts, plans, worklogs, forge coordination, and resumable automation ticks. | `bin/`, `src/`     |
| MCP tools         | Default read-only tools, resources, and prompts for AI apps, plus separately gated forge coordination writes. Push, task execution, merge, and release are not exposed through MCP. | `src/`             |
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

If you want the shorter `aapb` command from any directory, install the package globally:

```powershell
npm install -g ai-agent-playbook
aapb --help
```

`aapb` is short for AI Agent Playbook. It is the global command name provided by the `ai-agent-playbook` npm package.

Python is optional but recommended for deeper local language checks. Node remains the stable CLI and MCP facade; when Python 3.11+ is available, commands such as `writing naturalness-check --engine auto` and `writing naturalness-report --engine auto` merge Python-backed Korean/English prose analysis with the built-in JavaScript fallback.

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\python -m pip install -U pip kss kiwipiepy
$env:AI_AGENT_PLAYBOOK_PYTHON = ".\.venv\Scripts\python.exe"
npx ai-agent-playbook runtime python-status --json
npx ai-agent-playbook writing naturalness-check <target-project> --path README.md --lang auto --engine auto --json
npx ai-agent-playbook writing naturalness-report <target-project> --root docs --lang ko --engine auto --json
```

From a source checkout, `.\scripts\bootstrap-python.ps1` creates a local `.venv` and installs the optional Python extras for development. Without Python, the CLI and MCP server still work and return JavaScript fallback results with an `engines.unavailable` warning for Python-backed checks.

The npm package installs the CLI. It does not automatically copy skills, create `.ai-agent-playbook/`, enable hooks, or register slash commands. Keep those actions explicit:

- `skills install`, `skills update`, and `skills uninstall` manage reusable user-level skills.
- `bootstrap`, `guides sync`, `managed *`, `contracts *`, `operator *`, and `qa *` manage or inspect one target project.
- `mcp` starts a local stdio MCP server for AI apps. It does not write files by itself.
- Runtime hooks and adapter settings are optional and are never installed by default.

For command-by-command usage, see [Command guide](docs/commands.md). For update, uninstall, local checkout, PowerShell compatibility, ownership markers, and cleanup details, see [Lifecycle guide](docs/lifecycle.md).

## Forge Automation Compatibility

Version 0.5.5 keeps the resumable local execution loop and makes Forge coordination human-facing by default. Fine-grained tasks stay in the local ledger, while roadmap and delivery-group issues, Projects, Views, milestones, and reviewable PRs present the shared work. The adapter selects features from detected API and authorization capabilities rather than assuming that every server supports the same surface.

| Component | Supported version or integration target | Status |
| --- | --- | --- |
| Git | `2.39+` | Minimum supported Git version |
| Node.js | `18+` | Runtime floor enforced by package metadata |
| GitHub CLI (`gh`) | `2.80+` | Verified with `2.96.0` |
| GitHub REST API | `2026-03-10` | API version target for adapter requests |
| Gitea | `1.26.4` | Provider compatibility target |
| Gitea CLI (`tea`) | `0.14.2` | Optional CLI reference; the stable API is the primary integration surface |
| Gitea Actions runner | `2.0.0` | Workflow runner compatibility target |

Only the row that explicitly says “verified” identifies a tool version exercised as a verification reference. API and provider target rows define the compatibility contract; they do not claim that a live remote write smoke test ran.

- Without a usable remote—or when `--no-remote` or `--offline` narrows the request—the same run continues against the local ledger without calling the forge transport. Missing authentication or write permission disables mutations but can still allow anonymous capability probes or permitted remote reads.
- `forge status` separates configured `policyWrites` from permission-checked `verifiedWrites` and reports server/API version, authentication without token material, repository permission, and probe evidence. Effective `writes` remains false until authentication and repository write permission are verified.
- GitHub Projects and Views require the corresponding project scopes. Preferred Project coordination pauses before every remote write when either capability is missing. The preview reports planned artifacts and the browser-auth remediation, and an explicit `projects,views` fallback is required to use milestone coordination instead. The harness never expands authentication scopes automatically.
- Managed Projects create `AAPB Status` with Planned, Ready, In Progress, In Review, Blocked, and Done options, plus priority, risk, phase, progress, area, and task identifier fields. Presentation reconciliation transfers managed classification labels before removing them from issues and stops later mutations if a Project transfer fails.
- Gitea uses Issues, Labels, Milestones, pull requests, and Actions only where the server OpenAPI advertises the required methods. Draft review uses the public pull-request API with Gitea's documented `WIP:` title convention. A self-hosted hostname hint remains non-writable until `forge.provider: "gitea"` or a credential-free `forge.apiBaseUrl` ending in `/api/v1` is configured. Version and OpenAPI probes run without a token before authenticated permission checks. Project/View state falls back to labels and milestone filters, and a decision issue can replace Discussions.
- `gh agent-task` is an explicit preview adapter, not an automatic executor choice. Forge bootstrap and scheduler installation are also preview-first and require an explicit apply step.

See the [0.5.5 human-centered Forge coordination change note](docs/changes/forge-human-coordination-0.5.5.md) for presentation migration, capability gates, rollback, and remote-verification boundaries. The [0.5.4 automation note](docs/changes/forge-automation-0.5.4.md) remains the execution-loop migration reference.

## Everyday Flow

```text
npx or global install
  -> skills install or update
  -> restart the agent
  -> inspect the target project
  -> bootstrap .ai-agent-playbook/ only when the project needs local playbook files
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

After bootstrapping `.ai-agent-playbook/`, agents should start from `START_HERE.md`, then read `CURRENT.md`, `questions.md`, relevant memory/maps/contracts, and the matching workflow recipe. Generated files under `runtime/` are evidence candidates, not trusted memory, until reviewed and promoted.

## Repository Map

```text
bin/                  aapb CLI entrypoint
src/                  CLI runtime implementation
skills/
  ai-harness/        MCP, forge automation, agent, context, fact gate, witness, cache, and index design skills
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
  project-playbook/   Copyable AI Agent Playbook project-memory template
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
- AI harness: MCP surface design, context and memory design, agent handoff, forge automation control, skill-pack governance, runtime indexes/caches, capability witnesses, and fact gates.
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
- [Structured playbook layout](docs/structured-playbook-layout.md): `.ai-agent-playbook` directory roles and migration commands.
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
- [0.5.4 forge automation change note](docs/changes/forge-automation-0.5.4.md): resumable execution, provider fallback, migration, and disable guidance.
- [0.5.5 human-centered Forge coordination change note](docs/changes/forge-human-coordination-0.5.5.md): roadmap and delivery-group presentation, Projects capability gates, and reviewed reconcile migration.

## For Maintainers

This README is the public entry point for users. If you are editing this source repository, read [Repository working rules](AGENTS.md) and [Maintenance workflow](docs/maintenance.md) first. Release hygiene lives in [Publishing checklist](docs/publishing-checklist.md).

Keep English source files canonical, update Korean translations with English source edits, and do not commit personal paths, credentials, internal URLs, branch names, PR numbers, or installed local skill copies.

## License

Licensed under [MIT](LICENSE).
