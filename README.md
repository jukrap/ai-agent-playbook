<p align="center">
  <img src="docs/assets/logo-wide.png" alt="AI Agent Playbook" width="520">
</p>

<h1 align="center">AI Agent Playbook</h1>

<p align="center">
  A bright, reusable playbook for AI agents that need to work carefully inside real software repositories.
</p>

<p align="center">
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-2f9e44?style=flat-square"></a>
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

### 1. Install Skills

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

### 2. Update an Existing Install

```powershell
npx ai-agent-playbook skills update --dry-run
npx ai-agent-playbook skills update
```

`skills update` is idempotent. It refreshes managed skills, adopts matching older copies, and refuses locally modified managed skills unless `--force-managed` is provided.

### 3. Apply the Project Harness When Needed

Use the runtime CLI only when a target project should receive a root `AGENTS.md` bootstrap and an `.ai-playbook/` project-memory folder.

```powershell
npx ai-agent-playbook bootstrap <target-project> --dry-run
npx ai-agent-playbook bootstrap <target-project>
npx ai-agent-playbook doctor <target-project>
npx ai-agent-playbook operator check <target-project> --path src/example.ts --json
npx ai-agent-playbook operator search <target-project> --query "auth flow" --path src/example.ts --json
npx ai-agent-playbook managed catalog <target-project> --json
npx ai-agent-playbook adapter config <target-project> --adapter codex --json
```

After a global install, replace `npx ai-agent-playbook` with `ai-playbook`. From a local checkout, replace it with `node .\bin\ai-playbook.mjs`.

Use `--local-only` when the target project's `.ai-playbook/` folder should be ignored by Git. Use `--profile <name>` only after the target stack is known.

Existing projects that already have `ai-playbook/` continue to work as a legacy layout when `.ai-playbook/` is absent, but new bootstrap output uses `.ai-playbook/`. Use `migrate path --json` to preview the legacy-to-dot path move before applying it.

Runtime hooks and plugins are not part of the default install path. Treat them as optional extensions after the document and CLI harness are stable. The Codex and Claude Code adapters include read-only context hook examples, a read-only `adapter config` renderer, and a read-only `adapter check` self-check, but they are not installed automatically. See [Runtime roadmap](docs/runtime-roadmap.md).

Managed project harness commands use `.ai-playbook/.ai-agent-playbook-install.json` to track files copied by this playbook. Use `managed check` before cleanup, `managed catalog` to review owned files by kind and status, `managed adopt` to add a marker to older matching installs, `managed prune` to preview removing one selected unmodified managed file, and `managed uninstall` to preview removal of all unmodified managed files. `managed adopt`, `managed prune`, and `managed uninstall` write only when `--apply` is provided.

Operator diagnostics such as `operator check`, `operator search`, `operator context`, `operator map`, `operator audit`, `operator gc`, `rules check`, `diagnostics check`, and `qa tui-check` are operator-triggered. Use `operator check` as the combined human checkpoint for doctor, guide freshness, local verification command candidates, and rule matching before adding stronger runtime automation. Use `operator search` as a local project explorer for related source, playbook, rules, plans, and worklog matches. Use `operator context` to preview path-scoped playbook context and rule matches, and `operator map` to summarize stack, architecture, quality, and concern signals without writing an analysis file. Use `operator audit` to find broken playbook links, orphan context globs, duplicate playbook notes, legacy path drift, and managed manifest drift without writing files. Use `operator gc` as a preview-first cleanup for obsolete unmodified managed playbook files; it writes only with `--apply`. `diagnostics check` formats package scripts with the detected lockfile package manager.

## Everyday Flow

```text
Install or run with npx
  -> install skills with ai-playbook skills install
  -> restart the agent
  -> inspect a target project
  -> optionally bootstrap .ai-playbook/
  -> plan, worklog, verify, and hand off with consistent paths
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
  quality/            API boundary and UI quality skills
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

## Skill Shelf

| Category | Skills                                                                                                                                                                                                                                                                                                                                             |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Project  | `project-bootstrap`, `repo-onboarding`, `project-doc-system`                                                                                                                                                                                                                                                                                       |
| Quality  | `api-contract-boundary`, `ui-style-policy`, `style-quality-review`                                                                                                                                                                                                                                                                                 |
| Git      | `commit-worklog-guardrails`                                                                                                                                                                                                                                                                                                                        |
| Meta     | `agent-skill-authoring`                                                                                                                                                                                                                                                                                                                            |
| Legacy   | `legacy-general`, `legacy-feature-addition`, `legacy-risk-check`, `legacy-jquery-web`, `legacy-server-rendered-web`, `legacy-php-lamp`, `legacy-java-spring-mvc`, `legacy-dotnet-webforms`, `legacy-android-webview-hybrid`, `legacy-ie-activex-compat`, `legacy-database-heavy-system`, `legacy-reporting-printing`, `legacy-batch-file-transfer` |

Each `SKILL.md` stays short and trigger-focused. Longer reusable detail belongs in `references/`.

## Documentation

- [Repository working rules](AGENTS.md): maintenance rules for agents editing this repository.
- [Repository context](CONTEXT.md): core terms and design intent for the playbook.
- [Installation](docs/installation.md): first install, existing-clone update, custom skill paths, and Codex restart notes.
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
