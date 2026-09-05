# AI Agent Playbook

Portable project records, selected artifact skills, and optional project tools.

Korean (한국어): [README.ko.md](translations/ko/README.ko.md)

## What changes in 1.0

Start from one CURRENT.md, select only the skills a task needs, and use ordinary files for durable state. The package does not impose a planning, testing, approval, or worklog ceremony on every edit.

- Core: project-memory and spec-artifacts.
- Development: core plus design-brief-direction, ui-polish, and natural-writing-humanization.
- Optional: legacy-contracts with selected stack references.
- Project MCP: four read-only record tools, enabled only when configured for a project.
- Forge: explicit GitHub/Gitea coordination; execution and scheduling belong to the host.

The package name remains `ai-agent-playbook` and the executable remains `aapb`. The source version is a prerelease; changing package metadata does not publish it to npm.

## From a source checkout

Requires Node.js 18 or newer. Development checks use the repository toolchain; Python 3.11+ is optional for writing analysis.

```sh
npm install --no-package-lock
node bin/aapb.mjs --help
node bin/aapb.mjs skills install --profile development --dry-run
node bin/aapb.mjs skills install --profile development
node bin/aapb.mjs bootstrap <project> --local-only --dry-run
node bin/aapb.mjs bootstrap <project> --local-only
node bin/aapb.mjs records status <project> --json
```

Replace angle-bracket placeholders with your target. Installing the npm package alone does not install skills, register MCP, or edit a project. To exercise a local prerelease package, run `npm pack` and install the resulting archive into an isolated prefix before replacing an existing installation.

## Upgrade from 0.5

The default skill destination is now .agents/skills. Existing duplicates are not silently deleted by an ordinary update.

```sh
aapb skills migrate --profile development --dry-run --json
aapb skills migrate --profile development --apply --json
aapb skills rollback --backup <transaction-directory> --json
aapb skills rollback --backup <transaction-directory> --apply --json
```

Migration preserves changed and unmanaged files and reports conflicts. A successful settings change still needs a fresh host load to verify actual exposure. See [migration and recovery](docs/lifecycle.md).

## Guides

- [Commands](docs/commands.md)
- [Project records and compatibility](docs/structured-playbook-layout.md)
- [MCP boundary](docs/mcp-permission-model.md)
- [AAPB response budgets and continuation](docs/record-responses.md)
- [Demonstrate an unpublished package](docs/demo.md)
- [Skill catalog](docs/skill-catalog.md) and [complete legacy disposition](docs/skill-decisions.md)
- [Design, UI and writing](docs/quality-review.md)
- [Forge coordination](docs/forge-automation.md)
- [Design evidence](docs/redesign.md)
- [Optional reference library](references/README.md)
- [Maintenance](docs/maintenance.md)

Licensed under [MIT](LICENSE).

Verification and local capability policy: [prerelease evidence](docs/verification.md), [environment profiles](docs/environment-profiles.md).
