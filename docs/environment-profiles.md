# Development, design and document environment

AAPB does not own the host's entire plugin installation. Its installer manages only marked AAPB skill directories. Plugin caches, account connections and other projects' profiles are separate resources.

## Selection policy

| Capability | Default treatment | Value and cost to inspect |
| --- | --- | --- |
| AAPB project-memory and spec-artifacts | Core | Portable state and requested output formats; avoid mandatory document bundles. |
| AAPB design direction and UI polish | Development | Product/brand constraints, density and rendered evidence; references only for an actual decision. |
| AAPB natural document editing | Development | Facts, register, intentional emphasis and examples; optional advisory checks. |
| AAPB legacy contracts | Select explicitly | Stack-specific preservation contracts; load only the applicable stack. |
| Code cleanup | Optional reference | Observable behavior and unnecessary abstraction; no independent default workflow. |
| Web frontend, React and shadcn | Keep available for web work | Framework/component contracts and browser verification; generic coding advice alone does not justify repeated reading. |
| Stripe and Supabase | Trigger only for their integrations | Payment/data contracts; they are not prerequisites for a static page. |
| Figma | Keep connection and applicable skills | Design documents, Code Connect, diagrams, motion and export formats; inspect the actual connected tools separately. |
| Product design | Keep applicable entrypoints | Product context, visual generation and rendered review; internal helper entries need not become startup instructions. |
| Word/documents | Keep | File creation, tracked changes and rendering; rendering cost is justified for deliverable layout. |
| Spreadsheets and live Excel | Keep | Workbook formulas, data formats and live application control; distinguish file generation from a connected Excel session. |
| Presentations | Keep | Editable slides and rendering; do not invoke it for an ordinary Markdown note. |
| PDF | Keep one applicable implementation | PDF extraction, creation and layout inspection; suppress redundant standalone entrypoints while preserving their files. |
| Template creator | Keep | Generates or adapts document templates; individual domain templates remain selectable. |
| Domain template collections | Optional | Financial, legal, analytics and project templates are useful when requested; do not expose every format for all work. |
| Browser, computer control, sites and visualization | Preserve host capabilities | They provide execution, preview or hosting surfaces. Configuration presence is not a successful end-to-end test. |
| Plugin management | Preserve capability | Dependency and permission metadata; no automatic installation of optional dependencies. |
| GitHub and Linear connections | Preserve independently | Development collaboration tools; another plugin listing them as dependencies does not transfer ownership. |
| Expo | Optional | Mobile routing, native modules and build contracts; no general-web dependency. |
| Android testing | Optional | Emulator/performance execution; fixture checks do not prove device behavior. |
| iOS and macOS builders | Optional | Platform-specific build and UI tools; distinguish old cache contents from current availability. |
| Data analytics | Optional | Metric/context methods and specialized output widgets; preserve access to shared document tools independently. |
| Creative production | Optional | Creative production intake and execution; general design work can use its existing design tools. |
| Deep research | Optional | Multi-source investigation workflow; ordinary native search remains available. |
| OpenAI developer integration pack | Optional | API/application-specific guides and confirmation tools; the host's documentation capability is separate. |
| Vercel | Optional | Platform services and deployment; preserve for a deployment task rather than all local editing. |
| Obsidian, canvas and extraction helpers | Project-specific/optional | Vault formats and extraction; leave unmanaged files untouched. |
| Discovery helpers and novelty skills | Optional | Install discovery or non-development use; no baseline task requirement. |
| Superpowers | Disabled | Generic mandatory workflow overlaps with the host and project instructions; preserve an explicit reactivation path. |
| Writer product skills/MCP | Dedicated product profile | Accepted voice, candidate approval, snapshots and operation log are product contracts. |
| Game product skills/MCP | Dedicated product profile | Engine execution permissions and evidence are distinct from a generic skill installation. |
| AAPB MCP | Disabled by default | Four read-only record tools, bound to the server's startup directory; Codex can supply each task's directory through one common registration. |
| Another project's MCP | Project-specific | Remove common activation without editing that project's configuration in an unrelated migration. |

A private audit should record owner/version, configured state, observed discovery and injection, distinctive capability, bytes and execution requirements, decision, preserved location and recovery for every item/version. Include platform-provided entries and cache-only entries explicitly. Text size is an instruction-size proxy, not a measured token price or proof of model harm. The five-case comparison in [verification](verification.md) does not measure every third-party skill.

## Remote plugins and loading

The inspected [versioned host loader](https://github.com/openai/codex/blob/rust-v0.153.4/codex-rs/core-plugins/src/loader.rs) merges remote account enablement over a local plugin enabled flag while preserving per-server overlays. Therefore a local enabled=false edit alone may not deactivate an installed remote plugin.

To preserve account installation and cached recovery material, scope common exposure through supported path/name skill selectors and named plugin MCP enabled=false overlays. Re-read installed state, reload the skill inventory after remote plugins have loaded, and inspect a fresh turn's actual catalog and MCP runtime status. Keep these distinct:

- Remote account installed/enabled state.
- Local skill and tool exposure.
- Cached files and versions.
- Discovery results, automatic prompt injection and actual tool invocation.

Path selectors protect known installed versions; name selectors cover stable entrypoint names. A future plugin may introduce new names or servers and needs a new audit. Do not disable a shared connector merely because an optional plugin declares it as a dependency. Do not uninstall a remote plugin as a substitute for local scoping without the corresponding authorization and recovery plan.

## Recovery

Restore only the changed plugin/skill/MCP settings from a pre-application backup. If the current configuration has changed since migration, merge the relevant entries and preserve newer model, budget, desktop and project settings. Never import private settings into this repository.

Skill transactions are independent of plugin configuration. Roll back the newest skill transaction first, then the earlier migration, using preview before --apply. Keep the saved previous CLI package available; a source tag and an installed executable can have different versions. Existing remote records, schedules and product profiles remain unchanged.
