---
name: cleanup-ai-slop
description: Use when cleaning AI-looking, low-trust, overcomplicated, duplicated, or mechanically generated code while preserving behavior and avoiding broad rewrites.
---

# Cleanup AI Slop

Clean code that looks low-trust without changing what it does.

## Workflow

1. Define the cleanup scope by file, function, component, or recently changed diff.
2. Lock expected behavior with existing tests, a focused regression test, or concrete manual evidence before changing logic.
3. Remove noise in small steps: dead code, redundant branches, vague names, needless abstraction, duplicated constants, and misleading comments.
4. Preserve public contracts, data shapes, UI behavior, error handling, and side effects unless the user explicitly requests behavior change.
5. Re-run the narrowest useful verification and summarize residual risk.

## Reference

Read `references/cleanup-ai-slop-checklist.md` for cleanup targets, boundaries, and verification guidance.
