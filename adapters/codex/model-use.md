# Codex model use and record drafting

This is an optional reference for adapting AAPB instructions to a supported Codex host. AAPB leaves the user's model, reasoning effort, numeric settings, permissions, and service configuration intact. The [personal template](../../templates/codex-home/README.md) and [project instructions](../../templates/agents/README.md) provide common working rules; they do not select a model.

## Main task

Use the user's chosen Astra or Sol for investigation, design, implementation, verification, and review. Sol is also a main model; preserve a user's Sol `xhigh` or `max` selection without lowering it for presumed savings or switching back to Astra. Selecting an optional drafting agent is a separate decision from changing the main task's model.

Complete authorized work, preserve explicit approvals, distinguish current code from intended contracts, explore narrowly before expanding, and verify changed behavior and required gates. Read relevant instructions and evidence rather than imposing a fixed skill count or full-history reading chain. These are AAPB working policies; the [official model guide](https://developers.openai.com/api/docs/guides/latest-model) is the model-specific reference, not a mandate to rewrite project rules or settings.

## Optional Sol draft

The main task normally writes its own records. Sol can draft a long, independent worklog, knowledge document, or handoff when that would help and the host supports it. A main task already using Sol does not need to delegate the same work again. If the requested role or model is unavailable, the main task continues; AAPB supplies no model runner or automatic scheduler.

Give the drafter a bounded fact packet and short relevant history: the artifact and audience, destination, registered repository IDs, authorization and local-only constraints, accepted decisions, exact source paths and ranges, numbers and units, commands and observed results, URLs, dates, assumptions, unknowns, skipped checks, and remaining work. Include only the source files needed for that assignment.

Request a clearly labeled DRAFT in the response or a separately owned file. Keep one owner for shared CURRENT.md and accepted knowledge. Before incorporation, the parent checks source paths and ranges, numbers, commands, URLs, decisions, and unknown or unverified states against the original evidence. Retain unresolved discrepancies explicitly. Use the detailed [evidence and handoff reference](../../skills/project/project-memory/references/evidence-and-handoff.md) when needed; a draft's completion does not establish its factual accuracy.

## Host capability and role settings

Preserve explicit role model and reasoning settings; without a role-specific choice, retain the current task's reasoning effort where supported. Do not lower effort merely because an assignment is called recording. Use the live tool schema and available models to determine the exact call. Codex version and model capabilities can change which spawn fields are exposed: `agent_type`, `model`, and `reasoning_effort` are not universal arguments. Do not invent an agent type or force an unsupported field. See the [versioned tool definitions](https://github.com/openai/codex/blob/rust-v0.153.4/codex-rs/core/src/tools/handlers/multi_agents_spec.rs).

A role prompt defines the work assignment, not a security sandbox. Check actual host permissions and workspace access when isolation matters. AAPB does not change those permissions through a document. The [official subagent guide](https://learn.chatgpt.com/docs/agent-configuration/subagents) describes host configuration separately.

## Supported-host waits

The following comparison describes the approved research baseline, Codex `rust-v0.153.4`. It is source evidence, not proof of availability or successful invocation in every installed host. Discover the active tool schema before using either form.

| Surface | Wait contract | Timeout behavior |
| --- | --- | --- |
| v1 `multi_agent_v1.wait_agent` | Takes agent `targets` and optional `timeout_ms`; returns final statuses or an empty status on timeout. | Uses the implementation's default and bounds; positive requests are clamped to its range. See the [v1 handler](https://github.com/openai/codex/blob/rust-v0.153.4/codex-rs/core/src/tools/handlers/multi_agents/wait.rs). |
| v2 `wait_agent` | Takes optional `timeout_ms`, without a target list; waits for mailbox activity, including final-status notifications, or steered user input. A wakeup is not a claim that every agent finished. | Reads `multi_agent_v2.min_wait_timeout_ms`, `multi_agent_v2.max_wait_timeout_ms`, and `multi_agent_v2.default_wait_timeout_ms`; raises a too-small request to the minimum and rejects one above the maximum. See the [v2 handler](https://github.com/openai/codex/blob/rust-v0.153.4/codex-rs/core/src/tools/handlers/multi_agents_v2/wait.rs#L53). |

These v2 settings affect that wait operation, not v1, shell waits, other tools, or the agent's total runtime. A wait can return early on the activity its contract supports. AAPB does not install a 25-minute preset or rewrite the user's existing values. Continue useful independent work; when waiting is necessary, use bounded waits that fit the host's communication requirements and avoid repeatedly polling unchanged state. A timeout alone is not task failure or permission to abandon a running contributor.

## API features and verification claims

Prompt caching, asynchronous API calls, and `configuration_update` require support in the API client or host; they are not AAPB settings. The [official reasoning guide](https://developers.openai.com/api/docs/guides/reasoning#change-reasoning-mid-conversation) limits configuration updates to supported Astra single-agent requests and excludes combining them with automatic compaction or truncation. Do not translate an API example into a Codex configuration knob or change the user's reasoning choice through it.

Report configured, loaded, invoked, and behaviorally verified states separately. For a drafting comparison, use the same fact packets and acceptance criteria, and record the actual model/effort, omissions, distortions, review corrections, calls, elapsed time, and available usage data. Mark missing usage as unknown; do not infer subscription savings from API prices. Reuse results only when relevant inputs and conditions are unchanged and required gates permit it.
