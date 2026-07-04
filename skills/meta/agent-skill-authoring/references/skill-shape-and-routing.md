# Skill Shape and Routing

Use this when designing or reviewing an installable skill.

## Recommended structure

```text
skills/<category>/<skill-name>/
  SKILL.md
  references/<detail>.md
  scripts/<tool>
  agents/openai.yaml
```

Only `SKILL.md` is required. Add other files when they have a clear runtime or authoring purpose.

## Skill body

- Frontmatter contains only `name` and `description`.
- `description` starts with `Use when...`.
- The description names trigger conditions, not the internal workflow.
- The body contains the core workflow and reference routing.
- Long checklists, examples, stack details, and provider-specific rules live in references.

## Routing decisions

- Capability-first skills own primary behavior.
- Stack names, old names, and product-specific names should be wrappers or references unless they define a distinct capability.
- A compatibility wrapper should route to the primary skill and preserve the old trigger name.
- A new skill is justified when a user request should reliably load different guidance than existing skills.

## Collision checks

- Search existing skill names and descriptions before adding another skill.
- Test the trigger against likely requests and near misses.
- Check whether the rule belongs in a project template, local playbook, reference, or workflow recipe instead.
- Avoid multiple skills that all claim the same trigger words without a clear precedence story.

## Review output

For a non-trivial skill addition, record:

- Capability category.
- Primary trigger.
- References added.
- Compatibility names affected.
- Validation and translation status.
