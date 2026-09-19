# Skill catalog

Select a skill when it supplies a needed format, product constraint, or domain contract. Skills are guidance, not executable tools or permission grants. The same record files can be used without installing any skill.

## Profiles

| Profile | Included skills |
| --- | --- |
| `light` | `project-notes` only; compact continuity guidance without bundled references |
| `core` (default) | `project-memory`, `spec-artifacts` |
| `development` | Core plus `design-brief-direction`, `ui-polish`, `natural-writing-humanization` |
| `legacy` | `legacy-contracts` only |

## Triggers and examples

| Skill | Use when | Example request |
| --- | --- | --- |
| `project-notes` | Brief project notes need maintaining between sessions | Note the verified result and next action using the existing project format |
| `project-memory` | Current facts, decisions, evidence, or a restart point need maintaining | Update CURRENT.md with the test result and next action |
| `spec-artifacts` | A specific specification, ADR, contract, or handoff format is needed | Write an API contract with examples and compatibility constraints |
| `design-brief-direction` | Product purpose, brand, reference examples, or information density need clarifying | Establish a direction for a dense operations dashboard |
| `ui-polish` | An existing rendered UI needs improvement or review | Improve keyboard flow and spacing while preserving the ticket design |
| `natural-writing-humanization` | Korean or English prose needs editing without changing facts or voice | Clarify this guide while preserving commands, numbers, and polite register |
| `legacy-contracts` | A specific old stack has behavior or compatibility contracts to preserve | Check form submission and print behavior before changing a server-rendered page |

Read the selected SKILL.md first. Its local references provide detail when needed. The writing skill includes contextual Korean examples; they are examples, not automatic replacement rules. Legacy references are chosen by actual stack. Code cleanup remains separate in the optional reference library under `quality/cleanup-ai-slop`.

## Install, inspect, and combine selections

```sh
ai-agent-playbook skills list --json
ai-agent-playbook skills install --profile development --dry-run --json
ai-agent-playbook skills install --skill project-memory --skill legacy-contracts --dry-run --json
```

Explicit `--skill` values replace a profile rather than add to it. To keep the development profile and add legacy, install development first, then install `--skill legacy-contracts`; ordinary installs do not remove unrelated selected copies. Use corresponding selections for update/check/uninstall. See [Lifecycle](lifecycle.md).

The standard destination is `.agents/skills`. The seven source entries, the selected installed count, and the host's discovered or injected catalog are different counts. Installation success does not prove the host loaded the names.

[Agent use](agent-usage.md) explains implicit selection, explicit requests, and how to check actual use of skills, MCP, and writing commands.

## Light mode

Choose `--profile light` when brief continuity notes are enough. It installs one short `project-notes` entrypoint with no reference bundle or required companion skills. Compared with core or development, this reduces the selected discovery text and available instruction bundle. It omits specialist artifact formats, design, UI, and writing guidance. Use core or development when those capabilities are needed.

When selected by the host, the skill asks for focused record reads and result-focused replies without unsolicited workflow branding or skill-name narration. Direct questions, required disclosures, attribution, and host/project instructions still apply. It is not a global response setting and cannot promise that names will never appear. Names, source ownership markers, tool records, and provider or company audit settings are not concealed or changed. Actual context, token use, cost, and host discovery depend on the host and task; no savings percentage is guaranteed.

Ordinary installation is additive. Installing light over development leaves the previous skills available. Use the explicit migration preview to review removal of unchanged known AAPB copies, then apply and retain the backup. Cleanup requires valid selected replacements; a failed or changed replacement blocks remaining removals. Modified or unmanaged copies remain. See [Light installation and switching profiles](lifecycle.md#light-installation-and-switching-profiles).

Bootstrap does not install or activate skills. Its existing `--records minimal` choice creates a current-state entrypoint and setup metadata; there is no separate light bootstrap flag. Standard records and existing histories work with the light skill too. Git exclusion choices do not control model input or service records.

## Where did the earlier skills go?

The [94-row disposition table](skill-decisions.md) identifies each old name, decision, preserved reference location, and recovery route. Generic process and compatibility wrapper names are not reinstalled as duplicate SKILL.md files. Substantive domain examples remain in the [optional reference library](../references/README.md).

Choose guidance by the missing capability, not a target skill count. [Capability selection](capability-taxonomy.md) explains the distinction between guidance, runtime tools, and host integrations.
