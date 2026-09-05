<p align="center">
  <img src="docs/assets/logo-wide.png" alt="AI Agent Playbook" width="520">
</p>

<h1 align="center">AI Agent Playbook</h1>

<p align="center">
  Reusable skills, project records, and optional tools for careful software work with coding agents.
</p>

<p align="center">
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-2f9e44?style=flat-square"></a>
  <a href="https://www.npmjs.com/package/ai-agent-playbook"><img alt="npm package" src="https://img.shields.io/npm/v/ai-agent-playbook?style=flat-square"></a>
  <img alt="Node 18 plus" src="https://img.shields.io/badge/node-18%2B-1c7ed6?style=flat-square">
  <img alt="Python 3.11 plus optional" src="https://img.shields.io/badge/python-3.11%2B%20optional-3776ab?style=flat-square">
  <img alt="npm installation" src="https://img.shields.io/badge/install-npm-cb3837?style=flat-square">
  <img alt="Agent agnostic" src="https://img.shields.io/badge/agents-Codex%20%7C%20Claude%20Code%20%7C%20more-e03131?style=flat-square">
</p>

## Languages

- English (canonical): this file
- Korean (한국어): [README.ko.md](translations/ko/README.ko.md)

## What This Is

AI Agent Playbook (AAPB) helps coding agents keep useful project records and produce consistent specifications, handoffs, designs, and documents. It combines selected reusable skills, copyable templates, a local command-line tool, and an optional read-only MCP server.

A project's current goal, constraints, verified facts, and next action belong in `CURRENT.md`. Detailed decisions and evidence can live in linked documents when they are needed. The files remain ordinary Markdown and JSON that you and your agent can edit with existing tools.

The source is agent-agnostic. Codex, Claude Code, and other coding agents can use the same records and reference material; host-specific setup belongs in `adapters/`.

In 1.0, AAPB concentrates on records, artifact formats, and selected specialist guidance. The agent host and project tools handle execution and scheduling. See [the 1.0 changes and migration choices](docs/redesign.md) if you used the broader 0.5 runtime.

## What You Get

| Piece | What it does | Where it lives |
| --- | --- | --- |
| Reusable skills | Project memory, requested artifact formats, design direction, UI polish, document editing, and optional legacy contracts | `skills/` |
| Reference library | Domain contracts, examples, and exceptions retained from earlier skills, read only when relevant | `references/` |
| Project templates | Root instruction examples and a current-state document; additional records are created as needed | `templates/` |
| Runtime CLI | Explicit installation, bootstrap, record inspection, migration/recovery, advisory checks, and Forge coordination | `bin/`, `src/` |
| MCP tools | Four project-bound tools for status, search, reading, and document validation | `src/` |
| Human docs | Beginner instructions, worked commands, troubleshooting, architecture, and release guidance | `docs/` |
| Translations | Korean reading copies with localized explanations and navigation | `translations/ko/` |
| Agent adapters | Setup notes for specific agent environments | `adapters/` |

The optional MCP tools are `aapb_status`, `aapb_search`, `aapb_read`, and `aapb_validate`. [MCP setup](docs/mcp-permission-model.md) explains how to connect and check them.

## Quick Start

Install the npm package with Node.js 18 or later:

```sh
npm install -g ai-agent-playbook
ai-agent-playbook --help
```

The package and primary command are both `ai-agent-playbook`. `aapb` is a short alias with the same options and behavior. For occasional use without a global installation, run `npx ai-agent-playbook --help`. A source checkout or PowerShell installation script is not required for normal operation.

Choose reusable skills separately. Preview the development profile, inspect the result, then install:

```sh
ai-agent-playbook skills install --profile development --dry-run --json
ai-agent-playbook skills install --profile development --json
ai-agent-playbook skills check --profile development --json
```

Reload the agent's skills or start a fresh session. File installation and actual host loading are separate checks.

Run these commands from the project folder. Omitting the project path uses the terminal's current directory:

```sh
ai-agent-playbook records status --json
ai-agent-playbook bootstrap --dry-run
ai-agent-playbook bootstrap
ai-agent-playbook records read --path CURRENT.md
```

Bootstrap preserves existing `AGENTS.md` and records. For a new playbook it creates `CURRENT.md` and two metadata files. Add `--local-only` to both bootstrap commands when this is a Git repository and records should remain local.

To work on another folder, add a quoted path, for example `ai-agent-playbook bootstrap "<project>" --dry-run`, or use `--project "<project>"`. [The command guide](docs/commands.md) explains complete command combinations and their options.

[First 10 minutes](docs/quick-start.md) provides a practice project, glossary, expected results, and troubleshooting. [Lifecycle](docs/lifecycle.md) covers updates, removal, version selection, and recovery.

Package installation, skill installation, project bootstrap, and MCP registration are separate actions. Python is optional for selected writing checks; see [Runtime engines](docs/runtime-engines.md). Developers can use [Maintenance](docs/maintenance.md) and [Local package testing](docs/demo.md).

## Forge Coordination and Compatibility

AAPB can preview and explicitly apply GitHub/Gitea coordination plans, reuse existing managed identifiers, and report stale remote state or partial failures. It does not execute project tasks or schedule background work.

| Component | When it is needed | What the requirement means |
| --- | --- | --- |
| Node.js `18+` | CLI and MCP | Package runtime minimum; actual tested versions are listed in the verification report |
| Git | Clone/update, `--local-only`, and Forge remote discovery | Ordinary record reads do not require a remote repository |
| Python `3.11+` | Optional writing engine | Basic record operations and JavaScript writing checks work without it |
| GitHub / Gitea access | Explicitly applied coordination changes | A local preview does not prove remote credentials or permissions |
| An MCP-capable agent host | Optional tool connection | Plain file editing and CLI use remain available independently |

See [Forge coordination](docs/forge-automation.md) for examples and authentication boundaries, and [verification](docs/verification.md) for the distinction between mocked transport tests, local demonstrations, and live platform evidence.

## Everyday Flow

```text
Choose a verified CLI version
  -> select skills and reload the agent
  -> inspect an existing project, or preview a new playbook
  -> read CURRENT.md and relevant linked records
  -> implement and test with the project's own tools
  -> update current facts, evidence, and the next action
```

For example, ask your agent: “Read CURRENT.md, follow the linked API decision, implement the requested change, run the repository's checks, and update the current state with the results.” AAPB supplies the record structure; your existing project instructions still determine how the work is done.

Use record commands to locate evidence and check document consistency:

```sh
ai-agent-playbook records search "<project>" --query "API decision" --json
ai-agent-playbook records validate "<project>" --json
```

Validation checks records, links, and managed-file integrity. It does not run the application's tests or verify that an old statement is still true. Longer results provide continuation information; [response limits and continuation](docs/record-responses.md) shows how to read the rest.

## Repository Map

```text
bin/                  Shared ai-agent-playbook / aapb command entrypoint
src/                  Record, installation, MCP, writing, and Forge implementation
skills/
  project/            Project memory, artifact formats, and document editing
  design/             Product-specific design direction
  frontend/           Rendered UI polish
  legacy/             Optional stack preservation contracts
references/           Optional domain detail from the earlier catalog
templates/
  agents/             Copyable root policies and selected stack profiles
  codex-home/         Optional personal instruction template
  project-playbook/   Minimal current-state template and layout metadata
examples/             Worklog, prompt, and handoff examples
translations/ko/      Korean reading copies; not a second installed skill catalog
adapters/             Host-specific setup notes
docs/                 User guides, design decisions, and verification reports
docs/assets/          README and documentation images
scripts/              Validation, packaging-related checks, and local sync helpers
test/                 Runtime and adapter tests
.github/              CI and contribution templates
CONTEXT.md            Terms and design intent
CHANGELOG.md          Versioned changes
```

## Skill Catalog

| Profile | Included skills | Use it for |
| --- | --- | --- |
| `core` (default) | `project-memory`, `spec-artifacts` | Project continuity and requested specifications, decisions, or handoffs |
| `development` | Core plus `design-brief-direction`, `ui-polish`, `natural-writing-humanization` | Development with design, UI, and document editing |
| `legacy` | `legacy-contracts` | Explicitly selected legacy-system preservation work |

Individual `--skill` selections replace the profile selection. Profiles select guidance, not permissions. See [Skill catalog](docs/skill-catalog.md) for triggers, examples, and combined selections.

The old 94 entrypoints were consolidated or retired. Useful domain references remain in the [reference library](references/README.md), with an [item-by-item migration table](docs/skill-decisions.md). Short skill entrypoints do not require short human documentation or loss of product-specific detail.

## Documentation

Choose a route in the [documentation map](docs/README.md), or open a guide directly:

- [Repository context](CONTEXT.md): terms and design intent.
- [First 10 minutes](docs/quick-start.md): a beginner's practice run, glossary, expected results, and troubleshooting.
- [Command guide](docs/commands.md): commands, options, examples, write behavior, and exit codes.
- [Lifecycle guide](docs/lifecycle.md): package and skill installation, updates, removal, migration, and recovery.
- [Existing repositories](docs/existing-repository-bootstrap.md): inspect existing records and preserve project instructions.
- [Project record layout](docs/structured-playbook-layout.md): what belongs in CURRENT.md and when to add detail.
- [Runtime architecture](docs/harness-runtime.md): data flow, ownership, and validation boundaries.
- [MCP setup and permissions](docs/mcp-permission-model.md): connect the four optional read-only tools.
- [Agent use](docs/agent-usage.md): distinguish available skills and tools from actual selection and successful execution.
- [Response limits and continuation](docs/record-responses.md): choose a content size and continue long results.
- [Forge coordination](docs/forge-automation.md): reviewed plans, remote writes, conflicts, and retry behavior.
- [UI and writing review](docs/quality-review.md): preserve product intent, facts, and voice during review.
- [Runtime engines](docs/runtime-engines.md): Node/Python setup and troubleshooting.
- [Local package demonstration](docs/demo.md): test an unpublished archive against project records.
- [Skill catalog](docs/skill-catalog.md), [capability selection](docs/capability-taxonomy.md), and [reference adoption](docs/reference-adoption.md): choose the right guidance.
- [Codex adapter](adapters/codex/README.md), [Claude Code adapter](adapters/claude-code/README.md), and [templates](templates/README.md): adapt the files to your environment.
- [1.0 changes and previous versions](docs/redesign.md), [verification](docs/verification.md), and [release readiness](docs/runtime-roadmap.md): rationale, evidence, and remaining conditions.
- [Maintenance](docs/maintenance.md), [content classification](docs/classification.md), [translation policy](docs/translation-policy.md), and [publishing checklist](docs/publishing-checklist.md): contribute and prepare a release.
- [Environment profiles](docs/environment-profiles.md) and [external process frameworks](docs/superpowers-integration.md): scope optional integrations.
- [Changelog](CHANGELOG.md): versioned user-visible changes.

## License

Licensed under [MIT](LICENSE).
