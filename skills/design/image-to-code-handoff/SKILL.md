---
name: image-to-code-handoff
description: Use when turning generated images, screenshots, mockups, reference boards, or Figma frames into implementation-ready UI specs and verification criteria.
---

# Image To Code Handoff

Use this when a visual artifact should guide implementation, but the coding work still needs explicit tokens, components, states, responsive rules, and verification evidence.

## Workflow

1. Identify the source artifact, authority level, viewport, state, and allowed degree of visual match.
2. Extract design intent, structure, tokens, component roles, content hierarchy, and interaction states.
3. Convert image-only decisions into repository-native implementation contracts.
4. Mark uncertain details instead of guessing hidden behavior, data contracts, or inaccessible states.
5. Hand off to frontend, design-system, accessibility, or visual regression skills with acceptance criteria.

## Reference

Read `references/image-to-code-contract.md` for extracting implementable contracts from images and mockups.

Read `references/figma-handoff-contract.md` when the source is Figma, design tokens, variables, variants, or component-library guidance.
