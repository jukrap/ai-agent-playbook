# Evidence and handoff

For a meaningful decision, record the chosen behavior, reason, affected contract, evidence locator, remaining uncertainty, and next action. Keep alternatives only when they explain a real tradeoff.

A useful handoff says what is complete, what remains, which constraints must survive, and which files or commands reopen the evidence. Do not duplicate the full conversation.

## Milestone worklogs

Write when a stage completes, a consequential decision or cause is established, or a blocker, interruption, or handoff needs to survive the session. Include enough background, reasoning, affected repositories, changed behavior, decisions and assumptions, exact checks and results, unverified scope, and next actions to resume without reconstructing the conversation. Preserve paths, source ranges, numbers, commands, and URLs exactly where they are relevant and permitted.

Use the project's existing worklog location and naming. For new AAPB logs, use `worklogs/YYYY-MM/` with a date, time, unique ID, and topic in each filename. Prefer the supported authoring tool's exclusive creation when available; otherwise choose a unique name and do not overwrite another contributor's log. Keep raw output and private locators in the approved local evidence location. A record task does not authorize changing Git exclusions, moving older records, or publishing them.

## Evidence distinctions

- Configured: a setting or tool registration exists.
- Loaded: the host actually exposes the configured capability.
- Exercised: a named task ran in a named environment.
- Verified: its acceptance criteria were observed.

For a negative claim, state the searched scope and any excluded files. Generated reports and old summaries are evidence candidates, not new policy. Record an unknown state instead of inventing a passing result. No record is required for a routine reversible edit without a durable decision.

Record the inputs and execution conditions that make verification reusable. A passing result may be reused when those remain unchanged and project gates permit it; label it as existing evidence. New inputs, failures, unresolved concerns, and mandatory fresh checks require appropriate verification. A drafted description of a command is not evidence that it ran.

## Optional independent draft

The main task normally updates records directly. Delegate only a long, independent drafting task whose benefit exceeds coordination and review. Use a supported host capability; preserve the user's model and reasoning choices and explicit role settings. If the capability is absent, finish the record in the main task.

Supply a bounded fact packet and a short relevant history, not a full conversation dump:

- Requested artifact, audience, destination, and applicable repository IDs.
- Current objective, authorization, local-only constraints, accepted decisions, and relevant recent context.
- Exact source paths and ranges, values and units, commands and observed results, URLs, and evidence dates.
- Assumptions, contradictions, unknowns, skipped checks, remaining work, and the allowed read/write scope.

Request a clearly labeled DRAFT in the response or a separately owned file. Keep shared CURRENT.md and accepted knowledge under one owner; the drafter does not publish or promote its own claims. Role instructions define the assignment; actual host permissions determine access and isolation.

Before incorporation, the parent checks source paths and ranges, numbers and units, commands, URLs, decisions, and unknown or unverified states against the original evidence. Resolve discrepancies or leave them explicitly unresolved. Then update the appropriate worklog, knowledge, or current-state record without duplicating the entire draft across them. An unreviewed draft remains DRAFT, even if the drafting agent reports success.
