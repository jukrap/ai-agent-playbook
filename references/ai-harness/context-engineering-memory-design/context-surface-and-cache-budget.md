# Context Surface And Cache Budget

Use this when deciding where guidance, facts, references, reports, or generated output should live in an AI harness.

## Surface Placement

- Always-on rules: small, stable, behavior-shaping instructions that apply to most work.
- Project-local context: current facts, policies, maps, contracts, glossary, decisions, and active work state.
- Skill references: task-specific details that should be read only when the trigger applies.
- Runtime evidence: generated reports, indexes, graphs, dry-run output, diagnostics, and search results.
- Archive: historical notes that should not steer current behavior without explicit retrieval.

## Budget Rules

- Avoid adding large reference inventories, source lists, raw excerpts, or generated reports to default prompt context.
- Prefer a routing rule plus reference file over copying long guidance into a skill body.
- Avoid mutable context that changes every turn inside always-on instructions.
- Treat tool lists and prompt surfaces as budgeted API surface. Add them only when they remove repeated work or enable structured evidence.

## Cache-Safe Changes

- Stable rules belong in source docs and templates, not in ad hoc chat memory.
- New capabilities should be discoverable through catalogs, recipes, prompts, or skills instead of hidden in one long instruction block.
- When a context surface is large, add selection criteria so agents know when to read it.
- If a change makes default context bigger, record why the benefit is broad enough.

## Stop Conditions

- The proposal puts raw reference dumps or generated evidence into always-on context.
- The same fact would exist in multiple trusted locations without an owner.
- A context change contains secrets, personal paths, internal URLs, branch names, or PR numbers.
- The agent would need to read a long file every turn to use a rare capability.
