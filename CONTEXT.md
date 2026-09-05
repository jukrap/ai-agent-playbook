# Repository context

AAPB keeps project continuity in portable files and supplies selected guidance for useful artifacts. Its host performs execution and scheduling. [README](README.md) introduces the product; the [documentation map](docs/README.md) provides reading routes.

## Terms

| Term | Meaning |
| --- | --- |
| Skill | A short task-triggered instruction entrypoint with optional local references |
| Reference | Domain detail or an example to consult when relevant |
| Project record | Current facts, decisions, and evidence stored with one project |
| CURRENT.md | The current-state entrypoint, not a transcript of every past action |
| Managed file | Content whose ownership and expected hash are recorded by the tool |
| Host | The agent application supplying execution, editing, and optional integrations |
| Forge | A service such as GitHub/Gitea used for reviewed coordination |

## Design intent

Preserve useful contracts and examples while removing duplicated mandatory procedures. Keep execution with the host and project tools. Use explicit previews and recovery for changes, and distinguish configured, loaded, and exercised behavior.

Short skill entrypoints and minimal new record scaffolds do not imply minimal human explanations. README branding, localized navigation, beginner guidance, worked commands, and architecture detail serve readers and should remain useful. See [1.0 design](docs/redesign.md) for the rationale and [Maintenance](docs/maintenance.md) for editing rules.
