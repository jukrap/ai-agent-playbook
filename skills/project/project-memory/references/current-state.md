# Current state

Use one current entrypoint, not a synchronized set of summaries.

## Locate and read

Start with the existing project entrypoint. In a workspace, common records apply only to explicitly registered members; an ancestor folder, a sibling repository, or a symlink/junction is not proof of membership. Keep record selection separate from code selection. Before code or Git operations, confirm the selected member, its instructions and root, and its branch and dirty state when Git exists. At an ambiguous workspace root, resolve the code target first.

Read the current entrypoint and task-relevant links. Narrow further with available repository, topic, month, kind, or path filters and bounded pages; retrieve missing portions of truncated results and expand only when evidence is insufficient. A reference link does not require reading the entire history. State the scope and omissions of a search before making a negative claim.

Existing member-local records remain separate sources. In AAPB, an explicit `recordSource='repo:<id>'` selects a registered member's existing records; it does not move those files or select a code target. Respect existing layouts and local-only rules, including projects without Git.

## Required content

- Active objective and concrete next action.
- User constraints that can change implementation or delivery.
- Verified state with a source path, command result, or explicit decision.
- Links to the relevant spec, decision, contract, or unresolved issue.

## Record roles

| Record | Purpose and update rule |
| --- | --- |
| CURRENT.md | Active objective, important constraints, current progress, next action, and links. Replace stale state; keep the entrypoint short. |
| Topic knowledge | Current reusable rules, terms, and contracts. Include applicable repositories, source locators, confirmation date, and confirmed, assumed, or unknown status. Recheck stale claims before relying on them. |
| Dated worklog | Detailed milestone history: background, reasoning, changes, affected repositories, decisions, assumptions, actual checks, unverified scope, and remaining work. Preserve reproducible evidence instead of reducing it to a commit subject. |

For new AAPB records, topic documents live under `knowledge/` and dated logs under `worklogs/YYYY-MM/`, relative to the record root. Create a month or topic when first needed; monthly folders do not require monthly summaries. Preserve older `workflows/worklogs/` and other established layouts unless migration is authorized. Link verified current knowledge to the historical worklog explaining it, without copying the same timeline into CURRENT.md.

Add per-repository current notes only when independent progress needs them. Link them from the common entrypoint rather than repeating every member's state there. Assign one owner to each shared current-state document; parallel contributors use separate drafts or uniquely named logs.

## Update example

Before: "Feature implementation in progress."
After: "The parser accepts the new field; compatibility tests remain. Keep the existing public response shape. Next: run the parser contract suite."

Replace stale facts rather than appending another timeline. Keep long output and private paths in local evidence, not public documents. Read a linked record only when its detail is needed. Code establishes observed implementation; an accepted contract establishes intended behavior. Report a conflict instead of treating either a historical plan as a new instruction or a differing implementation as permission to discard the accepted requirement.
