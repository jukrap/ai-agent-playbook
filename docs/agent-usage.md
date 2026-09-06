# How agents use skills, MCP, and writing checks

Installing a capability makes it available; it does not guarantee that an agent will choose it for every suitable task. Keep availability, selection, and successful execution separate when checking an integration.

## Three different mechanisms

| Mechanism | How it becomes available | How it is used |
| --- | --- | --- |
| Skills | Install a selected profile and reload the host's catalog | The host may select a matching description, or the user invokes the skill explicitly |
| MCP | Register and enable the server, then reload its connection; Codex can use one common entry | The host may call an advertised tool that fits the request |
| Writing/UI CLI | Install the npm package and provide an allowed shell/Node execution tool | The agent or user runs an advisory command when useful |

The [official skills guide](https://learn.chatgpt.com/docs/build-skills) describes both explicit and description-based implicit invocation. Exact host behavior and available catalogs still need checking in the actual session. A file on disk, a listed skill, a read SKILL.md, and a useful result are different observations.

## Ask in task terms

- For continuity: “Read the current project state and identify the next action with its evidence.”
- For documents: “Make this Korean guide easier to follow; preserve commands, numbers, URLs, and polite tone.”
- For UI: “Review the rendered screen's keyboard flow while preserving its brand and density.”

These requests can match `project-memory`, `natural-writing-humanization`, or `ui-polish`. Explicitly invoke the desired skill if the host misses it. Do not make all skills mandatory for every task to compensate for one missed match.

## MCP availability and verification

The default MCP surface contains `aapb_status`, `aapb_search`, `aapb_read`, and `aapb_validate`. It must be connected before the agent can call it. A disabled common server is not automatically activated by npm installation, skill selection, or a successful SDK test.

In Codex, the common server can use each task's working directory without a per-project path setting. Open a task in the intended project; [MCP setup](mcp-permission-model.md) explains the default and optional fixed targets. Check the advertised names, then exercise status/read/search/validation and verify the result and unchanged files. Those checks prove server behavior. To assess automatic selection, separately give an ordinary task without naming a tool and inspect what the agent actually chose. Direct file reading may also be a valid choice.

## Korean writing tools

The writing skill preserves meaning and register and offers relevant examples. Normal editing does not require running a checker. For a material before/after comparison, the optional CLI can inspect protected information:

```sh
ai-agent-playbook writing fidelity-check --before docs/before.md --after docs/after.md --lang ko --json
ai-agent-playbook writing naturalness-check --path docs/after.md --lang ko --engine js --json
```

Run from the intended project or supply a path. These commands are not MCP tools: writing checks are not exposed by either MCP mode. Optional `--with-ast` adds only the `aapb_ast_search` source-search tool; see [AST search](ast-search.md). A writing CLI call uses the host's ordinary execution capability and still returns advisory signals, not a guarantee of good Korean.

## Check the right layer when something is missing

| Observation | What it establishes | Next check |
| --- | --- | --- |
| `skills check` succeeds | Selected installed files match the package | Reload and inspect the host catalog |
| A skill appears in the catalog | Its description is available | Inspect selection and SKILL.md reading on a relevant task |
| An MCP process starts | The executable can launch | List tools and make a real call |
| An SDK tool call succeeds | Server/transport behavior works | Test the selected host separately |
| A natural-language request uses a tool | One selection succeeded | Evaluate result quality and repeat on representative tasks before generalizing |

Do not claim broad autonomous reliability from a single successful call. Preserve disabled integrations and user-selected settings unless changing them is part of the request.
