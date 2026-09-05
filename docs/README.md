# Documentation map

Choose a route for the task at hand. These human guides are not an agent startup reading list. The [main README](../README.md) introduces the product.

## Start here

| Your situation | Read in this order |
| --- | --- |
| First use | [First 10 minutes](quick-start.md) → [Commands](commands.md) |
| Existing 0.5 installation | [Lifecycle and recovery](lifecycle.md) → [Existing repositories](existing-repository-bootstrap.md) → [Skill disposition](skill-decisions.md) |
| Project continuity or handoff | [Record layout](structured-playbook-layout.md) → [Templates](../templates/README.md) |
| Agent app connection | [MCP setup](mcp-permission-model.md) → [Response limits](record-responses.md) → the host adapter |
| Testing before publication | [Local demonstration](demo.md) → [Verification report](verification.md) → [Publishing checklist](publishing-checklist.md) |

## Use and integration

- [Commands](commands.md): syntax, writes, results, errors, and old command replacements.
- [Lifecycle](lifecycle.md): package and skill installation, updates, removal, migration, and recovery.
- [Existing repositories](existing-repository-bootstrap.md): inspect records and preserve project instructions.
- [Project architecture](project-architecture.md): architecture decisions, FSD as an option, evolving boundaries, and bootstrap scope.
- [Record layout](structured-playbook-layout.md): current facts, supporting documents, ownership, and examples.
- [MCP setup](mcp-permission-model.md): connect four project-bound read-only tools.
- [Agent use](agent-usage.md): how skills, MCP, and advisory commands become available and how to verify actual use.
- [Response limits](record-responses.md): CLI/MCP examples for long text and lists.
- [Forge coordination](forge-automation.md): GitHub/Gitea plans, application, conflicts, and retry.
- [Runtime engines](runtime-engines.md): Node and optional Python setup.
- [UI and writing review](quality-review.md): review methods and advisory-check limitations.
- [Codex](../adapters/codex/README.md) and [Claude Code](../adapters/claude-code/README.md): host setup.
- [Local package demonstration](demo.md): test an unpublished archive while preserving original projects.

## Choose and maintain guidance

- [Skill catalog](skill-catalog.md): profiles, triggers, and individual selection.
- [Capability selection](capability-taxonomy.md): choose guidance that fills an information gap.
- [Skill disposition](skill-decisions.md): where the 94 entrypoints went; [JSON mapping](skill-decisions.json) for tools.
- [Reference adoption](reference-adoption.md) and [reference library](../references/README.md): select useful examples and exceptions.
- [Templates](../templates/README.md) and [classification](classification.md): what to copy, install, or read.
- [Environment profiles](environment-profiles.md): distinguish AAPB ownership from other installed tools.
- [External process frameworks](superpowers-integration.md): optional integration and instruction conflicts.

## Understand, contribute, and release

- [Repository context](../CONTEXT.md) and [runtime architecture](harness-runtime.md): terms, data flow, and boundaries.
- [1.0 changes and previous versions](redesign.md): decisions and evidence limits.
- [Verification](verification.md): actual tests, bounded comparisons, and untested scope.
- [Release readiness](runtime-roadmap.md) and [publishing checklist](publishing-checklist.md): release preparation and follow-up.
- [Maintenance](maintenance.md) and [translation policy](translation-policy.md): editing, preservation, and checks.
- [1.0.0 release notes](release-1.0.0.md): supported behavior and the previous-version migration path.
- [Changelog](../CHANGELOG.md): versioned changes.

Old filenames such as `forge-automation.md` remain stable links. Their current content explains supported coordination and retired automation. Historical references may still mention old commands; check the current command guide before using them.
