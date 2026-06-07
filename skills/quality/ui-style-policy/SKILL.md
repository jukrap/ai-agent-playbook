---
name: ui-style-policy
description: Use when selecting, documenting, or enforcing a repository UI styling policy across design systems, CSS classes, utility classes, or inline styles.
---

# UI Style Policy

Choose one project styling policy from evidence before changing visible UI.

## Workflow

1. Inspect project docs, shared UI primitives, tokens, existing components, stylesheets, utilities, and inline style usage.
2. Prefer the existing design system first when shared components, variants, slots, or tokens own the UI surface.
3. Choose the custom styling layer that the project already uses: CSS/classes, utility classes, or inline style objects.
4. Avoid introducing a parallel styling method for one task.
5. Document durable policy decisions in root instructions or `ai-playbook/` when the project lacks clear guidance.
6. Use `style-quality-review` for visual, responsive, overflow, and state review after selecting the policy.

## Reference

Read `references/style-policy.md` when the policy is ambiguous or when consolidating conflicting style guidance.

