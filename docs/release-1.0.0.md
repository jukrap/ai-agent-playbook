# AI Agent Playbook 1.0.0

1.0 centers AAPB on project records, requested artifact formats, and selected specialist guidance. Coding agents and project tools remain responsible for implementation and execution.

## Main changes

- Use `ai-agent-playbook` as the primary command or `aapb` as its equivalent short alias. Project commands use the current directory when the path is omitted.
- Start new project records with CURRENT.md and two metadata files. Read existing layouts without forcing a migration.
- Select core, development, legacy, or individual skills. The catalog has six skills; the development profile selects five.
- Install into one default skill root, preserve modified or unmanaged content, and use explicit migration previews and recovery journals.
- Optionally connect `aapb_status`, `aapb_search`, `aapb_read`, and `aapb_validate`. Long results support continuation and adjustable content budgets.
- Use optional writing/UI checks and reviewed GitHub/Gitea coordination when relevant.
- Adapt neutral project instructions and fuller personal defaults. Architecture belongs to each project and can evolve through explicit decisions.
- Follow complete English and Korean beginner, command, migration, and maintenance guides.

## Before updating from 0.5

The earlier executor, supervisor, scheduler, automatic delivery, and broad analysis commands are retired. They return a retirement message and a pinned 0.5.11 recovery hint; they do not run the old runtime automatically. Existing schedules and remote records are not rewritten.

Skill installation, CLI installation, project bootstrap, and MCP registration remain separate. Updating the npm package does not replace personal/project AGENTS.md, change model settings, or enable integrations. If old owned skill copies remain in two roots, preview `skills migrate` and preserve its recovery data.

For previous behavior, use `npx ai-agent-playbook@0.5.11 --help`. The old global executable is `aapb`. See [the changes and previous-version guide](redesign.md) and [installation/recovery](lifecycle.md).

## Install the published release

```sh
npm install -g ai-agent-playbook@1.0.0
ai-agent-playbook --version
aapb --version
ai-agent-playbook records status --json
```

Run the last command from a project directory. An absent playbook is a normal first-use result. Follow [First 10 minutes](quick-start.md) to create records and [the command guide](commands.md) for full option combinations.

## Verification scope

Use the exact release archive and its checksum when verifying installation. Record tests, SDK MCP calls, host discovery, and application behavior separately. Document validation does not run application tests. Historical results and bounded model comparisons are preserved in [the verification record](verification.md); they do not establish universal performance gains.

[Publishing checklist](publishing-checklist.md) explains npm/GitHub delivery and registry verification. [Agent use](agent-usage.md) explains how to verify actual skill and tool use in a host.
