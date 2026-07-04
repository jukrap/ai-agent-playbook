---
name: visual-regression-qa
description: Use when checking screenshots, responsive breakpoints, layout overflow, clipping, visual diffs, font/text fit, canvas/media rendering, or browser-rendered UI regressions.
---

# Visual Regression QA

Use this as the primary frontend skill for rendered UI regression checks and visual verification.

## Workflow

1. Identify the changed surfaces, stable viewports, dynamic states, baseline artifacts, and acceptable visual tolerance.
2. Capture or inspect rendered UI instead of relying only on static code review when visual behavior changed.
3. Separate intentional design change from regression, data-dependent variation, animation, and environment noise.
4. Verify desktop/mobile widths, text fit, overflow, clipping, loading/empty/error states, and any image/canvas/media rendering touched by the change.

## Reference

Read `references/visual-snapshot-checks.md` for screenshot, diff, baseline, and artifact review.

Read `references/responsive-overflow-checks.md` for breakpoint, text fit, clipping, and dynamic content checks.

Read `references/interaction-responsive-production.md` for production interaction states, touch/pointer behavior, motion, and data-density checks.
