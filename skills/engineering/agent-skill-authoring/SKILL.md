---
name: agent-skill-authoring
description: Use when creating, reviewing, or reorganizing reusable agent skills, skill references, trigger descriptions, or skill/template boundaries.
---

# Agent Skill Authoring

Create small reusable skills that are easy for agents to discover and hard to misuse.

## Workflow

1. Confirm the behavior is reusable across projects. If it is project-specific standing policy, put it in a template or project doc instead.
2. Write the trigger first: `description` starts with `Use when...` and describes when to load the skill, not the workflow.
3. Keep `SKILL.md` concise: trigger, core workflow, and when to read references.
4. Move long rules, examples, API details, and checklists into one-level `references/*.md` files.
5. Add scripts only for deterministic repeated work such as validation, formatting, or artifact generation.
6. Test the trigger with two or three realistic requests and near misses; tighten wording if the skill would load too often.
7. Check for conflict with existing skills and project instructions before adding another skill.
8. Update indexes, translations, validation metadata, and installed copies through the repository maintenance workflow.

## Boundaries

- Do not turn every good rule into a skill.
- Do not put product scope, milestone status, branch policy, personal paths, or machine-specific setup into installable skills.
- Do not write a long skill that duplicates project `AGENTS.md`, local docs, or an existing process skill pack.
- Do not vendor an external skill pack wholesale when a short local rule or renamed focused skill would be clearer.
- Do not rely on Claude Code-only hooks, slash commands, or environment variables in agent-agnostic skill source.

## Quick Structure

```text
skills/<category>/<skill-name>/
  SKILL.md
  references/<detail>.md   # only when detail is too long or rarely needed
  scripts/<tool>           # only for deterministic reusable operations
  agents/openai.yaml       # only when UI metadata is useful
```

## Quality Checklist

- Skill name is lowercase hyphenated.
- Frontmatter contains only `name` and `description`.
- Description starts with `Use when...`.
- The skill body is short enough to scan.
- The trigger is narrow enough to avoid colliding with broader process skills.
- References are one level deep.
- English source and Korean translation are updated together.
- Validation commands pass before syncing installed copies.
