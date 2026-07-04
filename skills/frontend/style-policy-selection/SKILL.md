---
name: style-policy-selection
description: Use when selecting or reconciling a repository UI styling method before editing visible UI or documenting durable style rules.
---

# Style Policy Selection

Choose the repository's styling method from evidence before changing visible UI.

## Workflow

1. Inspect project docs, shared UI primitives, tokens, existing components, stylesheets, utility classes, and inline style usage.
2. Prefer the existing design system when shared components, variants, slots, or tokens own the UI surface.
3. Select the custom styling layer the repository already uses: CSS/classes, utility classes, or inline style objects.
4. Avoid introducing a parallel styling method for one task.
5. Record durable policy decisions in root instructions or `.ai-agent-playbook/` only when the project lacks clear guidance.
6. Use `style-quality-review`, `ui-polish`, or `visual-regression-qa` after policy selection for rendered quality checks.

## Reference

Read `references/style-policy-selection.md` when the styling convention is ambiguous, conflicting, or worth documenting.
