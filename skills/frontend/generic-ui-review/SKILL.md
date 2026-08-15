---
name: generic-ui-review
description: Use when a frontend looks AI-made, template-like, vibe-coded, overly card-heavy, pill-heavy, gradient-heavy, glowy, or visually generic and needs an evidence-led review before redesign.
---

# Generic UI Review

Review generic visual treatment as a product-fit problem, not as a universal style ban.

## Workflow

1. Identify the product type, primary user task, target viewports, and existing design-system or brand constraints.
2. Inspect the rendered interface before treating static code signals as defects. Use `aapb qa ui-genericity-scan <target> --json` only to locate review candidates.
3. Check whether repeated cards, pills, gradients, glass, glow, large radii, stat blocks, hover transforms, kickers, or marketing claims support the task hierarchy.
4. Preserve deliberate brand expression and established components. Recommend the smallest coherent change that improves task focus, hierarchy, density, or trust.
5. Verify changed screens at named viewport sizes and retain image or video evidence. A clean static scan is not completion evidence.

## Boundaries

- Use `cleanup-ai-slop` for low-trust code structure; it is not a visual design review.
- Use `ui-polish` after the direction is clear and visible implementation needs refinement.
- Use `design-brief-direction` when the product lacks a visual direction.
- Use `design-reference-analysis` when screenshots or reference products must be compared.
- Use `natural-writing-humanization` for prose tone; review UI copy here only when it affects hierarchy or product specificity.

## Reference

Read `references/review-candidates-and-evidence.md` for rule meanings, false-positive controls, suppression, and visual evidence expectations.
