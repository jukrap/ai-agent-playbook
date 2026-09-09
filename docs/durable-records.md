# Keep records that survive the next session

Use ordinary files for the current objective, reusable knowledge, and detailed milestone evidence. Records work without Git, an MCP connection, or a model runner. Keep existing project locations and local-only rules rather than rebuilding useful history.

## Give each record a purpose

| Record | Keep here | Update when |
| --- | --- | --- |
| CURRENT.md | Active objective, important constraints, verified progress, next action, links | The current state or next action changes |
| Topic knowledge | Current rules, terms, contracts, applicable repositories, sources, confirmation date, confirmed/assumed/unknown status | A durable fact is established or superseded |
| Worklog | Background, problem, reasoning, changed behavior, affected repositories, decisions, assumptions, exact checks/results, unverified scope, remaining work | A stage completes, a consequential finding or decision is made, or work is blocked, interrupted, or handed off |

Keep CURRENT.md short enough to resume from. Do not shorten a worklog to a commit subject: preserve the commands, source locations, values, and limitations that explain the result. Link knowledge to the worklog that established it. Monthly folders organize history without requiring monthly summaries or a record after every response.

## Prepare the record location

```sh
ai-agent-playbook bootstrap --records standard --exclude none --agents preserve --lang en --dry-run --json
ai-agent-playbook bootstrap --records standard --exclude none --agents preserve --lang en --json
```

Standard setup adds worklog and knowledge guides when absent. Minimal setup remains supported; the authoring commands create the needed directories on first use. Existing CURRENT.md, knowledge, worklogs, and metadata are preserved. For a registered workspace, [select the common or member-local source](workspaces.md) before authoring.

Bootstrap creates the missing record folder in the selected project or shared workspace root when applied. In the interactive guide, a new setup shows this location during folder preparation and waits for your choices and final review. Prepare any child repositories yourself; AAPB does not move or clone them. Existing workspace membership and member-local records remain intact.

## Create a worklog

```sh
ai-agent-playbook worklog new --title "CSV export verification" --topic csv-export --lang en --dry-run --json
ai-agent-playbook worklog new --title "CSV export verification" --topic csv-export --lang en --json
```

The result includes `path`, `content`, `metadata`, `lang`, and whether it wrote. Open the returned path relative to the selected playbook and replace the template prompts with actual evidence. The command creates a document shell; it does not collect conversation history, run tests, or infer facts.

New logs use `worklogs/YYYY-MM/` and filenames containing date, time, a unique ID, and title. A configured worklog location or an existing legacy `workflows/worklogs/` takes precedence. Creation is exclusive so concurrent writers do not overwrite one another. A preview's proposed ID and filename are not reserved for the later apply call; use the path returned by the actual creation.

`--date YYYY-MM-DD` chooses a log's filing date; without it the command uses the current UTC date. `createdAt` still records the actual creation time. `--lang en|ko` selects the template language; omission uses the selected record manifest's language, then English. `--repo <id>` tags a registered workspace member; inspect the returned `repos` metadata. These flags do not change the code or Git target.

## Create and maintain knowledge

```sh
ai-agent-playbook knowledge new --title "CSV export contract" --topic csv-export --lang en --dry-run --json
ai-agent-playbook knowledge new --title "CSV export contract" --topic csv-export --lang en --json
```

Knowledge uses a topic-based filename under `knowledge/`. An existing topic is preserved and creation refuses a duplicate; edit that document deliberately instead. Record the current rule, its scope and source, when it was confirmed, and what remains assumed or unknown. Current code is evidence of implementation, while an accepted contract describes intended behavior. Document consequential differences rather than automatically replacing either with an old summary.

Authoring retains a compact `aapb-record` metadata comment for filtering. Preserve its identifiers and repository/topic fields when editing. Older documents remain readable without adding metadata to every historical record.

## Find only the evidence you need

```sh
ai-agent-playbook worklog list --topic csv-export --month 2026-09 --page-size 5 --json
ai-agent-playbook records search --query "CSV" --path knowledge --kind knowledge --json
ai-agent-playbook records search --query "CSV" --kind worklog --month 2026-09 --json
```

Within a workspace, add `--repo web` to filter records for a member or `--record-source repo:web` to read an existing member-local source. These are different selections. Repeat the source, filters, query/view, and returned cursor for continuation; inspect totals and incomplete-scan warnings. `worklog list` also supports `--max-chars` and `--cursor`.

Worklog listing and record search share the same `--month` rule. For each inspected record, a valid date at the start of its filename takes precedence, followed by the nearest enclosing `YYYY-MM` folder, then metadata `createdAt`. A log filed as `2026-08-31-review.md` belongs to August even if it was created in September; `createdAt` still records the actual creation time. An undated legacy file without a month folder can match September through its `createdAt` metadata. Monthly folders and flat legacy files such as `workflows/worklogs/2026-09-01-review.md` remain supported without relocation.

Other-month dated filenames and month folders are pruned before reading, so keep filing dates and month folders consistent. Metadata fallback does not expand the scan to all history: existing traversal, depth, byte, and result limits still apply. Record search also excludes unrelated `repos/<id>/` directories before reading text. Search accepts `current`, `knowledge`, `worklog`, or `other` for `--kind`; authoring titles and topics are not full-text search expressions.

Start with CURRENT.md, then follow relevant knowledge and worklog links. Expand a search only when evidence is insufficient. A global reference does not require reading all history. Absence under a metadata filter does not establish absence from untagged legacy records. [Response limits](record-responses.md) explains bounded pages and changed-source cursors.

## Collaborate without losing evidence

Assign one owner to shared CURRENT.md and accepted knowledge. Parallel contributors can create independent logs or separate DRAFT files, then have the parent review and incorporate them. The main task normally writes its own records; a long independent draft can be delegated with bounded facts and short relevant history when the host supports it.

Before adopting a draft, check paths, source ranges, numbers, commands, URLs, decisions, and unknown or unverified states against the original evidence. Role instructions do not enforce file permissions. Preserve the user's model and reasoning choices; [Codex model use](../adapters/codex/model-use.md) covers Astra and Sol, including `xhigh` and `max`, without an automatic scheduler or fixed wait preset.

Run required project gates and verification for the changed contract. Reuse passing evidence only when relevant inputs and execution conditions remain unchanged and the project permits it. Distinguish configured, loaded, invoked, and behaviorally verified states. Keep raw private evidence in approved local records and do not publish it merely because a worklog was created.
