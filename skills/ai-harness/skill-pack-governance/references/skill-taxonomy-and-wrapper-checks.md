# Skill Taxonomy And Wrapper Checks

Use this when adding, moving, renaming, wrapping, or reviewing reusable skills.

## Classification

- Start with the problem capability, not the technology stack.
- Use stack profiles or references for Java, PHP, React, Postgres, cloud provider, framework, or vendor specifics.
- Create a new category only when multiple durable skills need it and existing categories do not fit.
- Keep legacy skills focused on compatibility and hidden coupling, not on every old stack detail.

## Skill Body Checks

- Frontmatter contains only `name` and `description`.
- Description starts with `Use when...` and describes trigger conditions.
- `SKILL.md` stays concise: trigger, workflow, reference routing, and stop conditions if needed.
- References contain long checklists, examples, provider details, and stack specifics.

## Wrapper Checks

- Compatibility wrappers point to a primary skill and keep stack details in references.
- Wrapper names remain only when existing trigger names are useful.
- Wrappers should not duplicate the full workflow of the primary skill.
- Catalog validation should catch duplicate names, missing primary routes, missing references, and category drift.

## Stop Conditions

- A proposed skill is just a vendor or stack name without a distinct work capability.
- A skill body becomes a long manual instead of routing to references.
- A wrapper breaks existing trigger names without a staged compatibility plan.
- Docs, translations, tests, and installed-copy expectations are not updated together.
