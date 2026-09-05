# Bootstrap and project instructions

Use this reference when adding project records or adapting root instructions. Check existing instructions, relevant configuration, dirty changes, and the current record location first.

## Separate the choices

- Record creation: run `ai-agent-playbook bootstrap --dry-run` from the project, inspect the result, then omit `--dry-run` to create records when absent.
- Git-local records: add `--local-only` to both commands only in a Git repository. It uses Git's local exclude file and does not untrack existing committed records.
- Root instructions: adapt [the project template](../../../templates/agents/AGENTS.md) only when useful; preserve existing user instructions.
- Architecture: follow accepted project decisions or choose a proportionate structure within the request. [Architecture guidance](../../../docs/project-architecture.md) explains recording and revisiting boundaries.
- Skills: choose relevant guidance separately. A skill profile is not a project folder layout.

## What gets created

New bootstrap creates CURRENT.md, manifest.json, and .ai-agent-playbook-install.json in .ai-agent-playbook. It does not create source folders, root AGENTS.md, empty policy documents, or a workflow tree. Existing records are preserved. See [the record layout](../../../docs/structured-playbook-layout.md).

Write actual goals and evidence in CURRENT.md and link existing detail only when useful. If no detailed decision is needed, do not create one to complete a checklist. Keep private execution output in an approved local-only location.

## When a decision changes

Update its project-owned document and the relevant code or checks together. Preserve earlier rationale and note temporary exceptions. An old template or record does not override a newer accepted decision. See [existing repository adoption](../../../docs/existing-repository-bootstrap.md) before changing an established layout.
