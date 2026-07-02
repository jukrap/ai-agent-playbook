---
name: frontend-accessibility-review
description: Use when reviewing or changing keyboard access, focus management, semantics, forms, dialogs, menus, announcements, contrast, reduced motion, or accessible interaction states.
---

# Frontend Accessibility Review

Use this as the primary frontend skill for accessibility behavior and semantic interaction review.

## Workflow

1. Identify the interactive pattern, expected keyboard path, focus lifecycle, semantic role, labels, announcements, and error states.
2. Test with the rendered UI or closest available DOM output instead of reviewing markup in isolation.
3. Preserve existing design-system accessibility primitives unless they are the source of the issue.
4. Verify keyboard-only operation, focus visibility, screen-reader-relevant labels/state, and disabled/loading/error behavior.

## Reference

Read `references/keyboard-focus-review.md` for keyboard navigation, focus order, focus traps, and focus restoration.

Read `references/semantic-interaction-review.md` for roles, names, states, forms, announcements, contrast, and reduced motion.
