---
name: legacy-general
description: Use when maintaining or extending a legacy codebase with unclear runtime flow, old conventions, hidden coupling, weak tests, or mixed documentation.
---

# Legacy General

Treat the running system as the source of truth and change less than feels tempting.

## Workflow

1. Identify actual entrypoints, build/deploy flow, runtime files, and active docs.
2. Trace the current behavior before proposing architecture changes.
3. Search for shared selectors, globals, templates, DTOs, config keys, and side effects.
4. Make the smallest scoped change that solves the request.
5. Verify through project commands or explicit manual scenarios.
6. Record blockers, hidden coupling, and residual risk in worklog/PR when useful.

## Guardrails

- Do not rewrite because the code looks old.
- Do not delete "unused" code without proving it is outside runtime flow.
- Do not infer backend contracts or deployment paths from names alone.
- Preserve unrelated user changes.
- Prefer compatibility with current operations over architectural purity.
