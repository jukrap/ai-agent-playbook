# Project record layout

`CURRENT.md` is the place to find the current objective, constraints, verified state, and next action. It should link to detail when that detail matters. A minimal layout reduces duplicate record keeping; it does not require discarding useful history.

## Files created for a new project

```text
.ai-agent-playbook/
  CURRENT.md                        User-editable current state
  manifest.json                     Managed layout metadata
  .ai-agent-playbook-install.json    Managed ownership information
```

Bootstrap does not create a root policy, empty contract collection, or workflow folder tree. `CURRENT.md` is explicitly user-editable in the new marker; editing it is normal. The manifest and marker let installation/migration identify managed content without treating all nearby files as owned.

## What to write in CURRENT.md

| Section | Useful content | Example |
| --- | --- | --- |
| Objective | The active outcome and next concrete step | Add CSV export; next, check the date-column format |
| Constraints | Decisions that affect this work | Preserve existing column names and row order |
| Verified state | A fact plus evidence and scope | Export unit tests pass; browser download remains untested |
| Supporting records | Links to necessary details | The CSV contract and the relevant test report |

A next action may be in the objective or its own section. Heading wording can follow the project's language. File paths and actual evidence matter more than a mandatory heading sequence.

For example, create `decisions/csv-export.md` only when the export decision needs detail. Link it from CURRENT.md as `[CSV export decision](decisions/csv-export.md)`. That path is illustrative: create the real document before adding the link. Keep requirements, rejected options, and detailed test output there instead of repeating them in every record.

## Supporting records and handoff

Use the project's established locations for specifications, ADRs (architecture decision records), contracts, plans, verification notes, and handoffs. The [spec-artifacts skill](skill-catalog.md) offers formats; it does not require all of them.

A useful handoff records what changed, the evidence checked, uncertainty, and the next action. Preserve exact commands and source links when they let someone verify a fact. Label generated reports as evidence to review. A historical note is not automatically a current truth, and a successful configuration check is not runtime proof.

## Existing layouts

For legacy compatibility, the reader recognizes `.ai-agent-playbook/`, `.ai-playbook/`, and `ai-playbook/`. More than one existing root is ambiguous. It will not silently merge or choose between them.

Old `START_HERE.md`, `memory/`, `maps/`, `contracts/`, `workflows/`, and `runtime/` records remain readable when present. Status prefers CURRENT.md and can identify START_HERE.md when CURRENT.md is absent. The old full reading sequence is not required for every new task; follow existing project instructions and relevant links.

Read paths are relative to the selected playbook. Supported text extensions are Markdown, plain text, JSON/JSONL, YAML, and TOML. Linked paths, binary files, oversized files, and excluded directories are bounded or skipped with visible warnings. See [Response limits](record-responses.md).

## Validation and migration

`ai-agent-playbook records validate "<project>" --json` checks document structure, links, and managed-file hashes. A modified managed document in an older layout may be valuable customization. Inspect it; do not overwrite it to obtain a clean result.

Layout migration changes owned metadata and preserves old documents and evidence links. It requires a readable CURRENT.md and unchanged managed metadata; the tool cannot decide whether the prose is up to date. Preview, explicit apply, and guarded rollback are described in [Lifecycle](lifecycle.md). No automatic path relocation or historical summary is performed.
