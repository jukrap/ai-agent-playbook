# Playbook 1.0 design

## Decision

Focus the package on portable project records, selected document formats, and task-specific expertise. Keep the Node ESM implementation, package name, and `aapb` executable. Replace broad process routing with a small catalog and optional references. This is a major-version migration, not a claim that every external skill harms every model.

The source baseline is 0.5.11. Environment-specific executable versions, settings, installed paths, hashes, worktrees, and recovery archives belong in local evidence, never in this document.

## Evidence and limits

- The [Astra model guide](https://developers.openai.com/api/docs/guides/latest-model) recommends auditing instructions and scoping testing to the task. This supports removing redundant requirements, not removing useful domain contracts.
- [Evaluating AGENTS.md](https://arxiv.org/abs/2602.11988) studied earlier models and repository-context configurations. Its reported extra exploration and cost are not a measured Astra regression.
- [SkillsBench](https://arxiv.org/abs/2602.12670) separates curated and self-generated skills; gains vary across tasks. Its small task-local skill bundles do not prescribe a global installation count.
- [SWE-Skills-Bench](https://arxiv.org/abs/2603.15401) is another software-task comparison, not a measurement of this installation.
- [ARC Prize's Astra analysis](https://arcprize.org/blog/astra) distinguishes standard and provider-adapter harnesses and reasoning levels. It shows why preserving execution state matters; it does not compare AAPB or Superpowers on coding tasks.
- [Superpowers](https://github.com/obra/superpowers) describes mandatory planning, worktree, test-first, and review workflows. These overlap with the host and this user's existing instructions. It stays disabled; no Superpowers workflow is adopted.
- Community reports are leads, not controlled measurements. Direct X and DCInside retrieval failed during this investigation; Threads searches did not establish a matching model/task/settings comparison. Search excerpts and reposts are not original-source verification.

Sources were inspected during the design investigation. Public code was compared with the installed Codex 0.153.4 family, rather than assuming that current main equals account rollout.

## Native context and costs

The [versioned model override code](https://github.com/openai/codex/blob/rust-v0.153.4/codex-rs/models-manager/src/model_info.rs) caps context overrides at the advertised maximum. The [model protocol](https://github.com/openai/codex/blob/rust-v0.153.4/codex-rs/protocol/src/openai_models.rs) separates configured, usable, and auto-compaction context limits.

The [history/notes extension](https://github.com/openai/codex/blob/rust-v0.153.4/codex-rs/ext/history-notes/src/extension.rs) checks configuration, provider, and backend authentication. Its thread hint is bounded to 4,000 bytes. Source availability and model-driven defaults do not prove that a session exposes these tools. File records remain sufficient when native retrieval is unavailable; no experimental setting is required.

The [skill renderer](https://github.com/openai/codex/blob/rust-v0.153.4/codex-rs/ext/skills/src/render.rs) can shorten descriptions and omit catalog entries under a budget. Count installed directories, discovered skills, rendered entries, and actual invocations separately.

[API prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching), [subscription limits](https://learn.chatgpt.com/docs/pricing), [personal purchased credits](https://help.openai.com/en/articles/12642688), and [Enterprise token pricing](https://help.openai.com/en/articles/20001415-chatgpt-rate-card-enterprise-token-based-pricing) are distinct. The Enterprise Astra/Codex long-context exception does not establish personal subscription accounting. Report observed tokens and cached inputs without converting a quota percentage into task cost.

## Skill and reference boundaries

See [the complete disposition table](skill-decisions.md) and its machine-readable companion. Core installation contains project-memory and spec-artifacts. Development adds design-brief-direction, ui-polish, and natural-writing-humanization. Legacy contracts are selected separately.

Keep design direction, rendered UI review, tool integration, prose editing, and code-structure cleanup distinct. Preserve brand expression, density, accessibility, terminology, register, and before/after examples. No universal ban on gradients, cards, or normal Korean constructions is introduced. General prose editing must not flatten accepted fiction voice.

Retired entrypoints are not installed as compatibility wrappers. Their substantive reference material remains an explicitly selected reference library, with source-to-destination mappings. A reference library is not a startup reading list.

## Runtime decisions

- A minimal bootstrap creates CURRENT.md and ownership/layout metadata; it does not generate a tree of empty policies.
- Existing structured and legacy records remain readable. Migration changes managed files only, reports modified/unmanaged conflicts, and preserves record content.
- MCP exposes only playbook_status, playbook_search, playbook_read, and playbook_validate, bound to one project. It has no write tools or required startup hook.
- GitHub/Gitea retain reviewed coordination plans, stable identifiers, concurrency checks, partial-failure reporting, and explicit apply. There is no automatic publication.
- Retire task execution, supervisors, schedules, automatic Git delivery, and duplicate analysis commands. Explain the replacement and pinned 0.5.11 recovery instead of executing an old runtime behind the user's back.
- Keep optional writing checks as advisory tools. They do not run for every edit or decide authorship.

## Installation and recovery

Use one implementation for CLI and PowerShell wrappers. Default to .agents/skills. A migration inventories old managed copies, validates hashes and real paths, previews all operations, creates a recovery journal, and then applies independent safe items. Never remove a changed or unmanaged directory merely because its name matches. Do not traverse junctions when removing installations.

Back up affected content before mutation. Recheck hashes immediately before each operation. Record partial completion so retries and rollback cannot overwrite later user edits. Preserve plugin caches and unrelated project profiles. A settings edit is not proof of successful host reload.

## Delivery and acceptance

Commit the design before implementation. Then commit runtime/skills, installation/recovery, and final verification as separate milestones. Use 1.0.0-next.1 for validation and prepare a 1.0.0 transition; registry publication is a separate action.

The baseline suite had 458 passes, one skip, and no failures. Baseline syntax, type, skill, translation, public-document, Python, and installation-preview checks passed. These results do not validate the new implementation.

Verify ownership conflicts, links/junctions, bounded record access, legacy reading, read-only MCP, migration replay/rollback, mocked forge conflict handling, and packaged installation. Use two UI cases, two Korean-document cases, and one code-cleanup case for a bounded before/after comparison. Record fidelity, product fit, over-correction, calls, rereads, duration, and available usage. Do not claim population-level performance gains from five cases.
