---
name: skill-pack-governance
description: Use when adding, reorganizing, reviewing, or adopting skill packs, taxonomy categories, compatibility wrappers, reference routing, translations, install/sync behavior, or reusable skill governance.
---

# Skill Pack Governance

Use this as the primary AI harness skill for growing skill packs without taxonomy drift or prompt noise.

## Workflow

1. Classify the proposed guidance by capability, workflow, stack profile, reference, template, adapter, runtime command, or MCP surface.
2. Keep primary skills capability-first; use wrappers or references for compatibility names and stack-specific details.
3. Put trigger-focused guidance in `SKILL.md` and move long rules, examples, provider details, and pitfalls into references.
4. Update docs, translations, catalog tests, validation scripts, and install/sync expectations in the same change.

## Reference

Read `references/skill-taxonomy-and-wrapper-checks.md` for category, naming, wrapper, and catalog validation checks.

Read `references/reference-adoption-noise-control.md` for adopting external references without leaking noise into reusable docs.
