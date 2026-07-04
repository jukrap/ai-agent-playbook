---
name: natural-writing-humanization
description: Use when editing Korean or English prose so it reads naturally while preserving facts, meaning, technical terms, and author intent.
---

# Natural Writing Humanization

Improve prose quality without changing what the document means.

## Workflow

1. Identify language, audience, source type, and whether this is a light edit, translation cleanup, or full rewrite.
2. Preserve facts, numbers, names, dates, warnings, release scope, legal meaning, and technical contracts before changing style.
3. Run `aapb writing naturalness-check <target> --path <file> --lang auto --engine auto --json` when a local file is available.
4. Remove machine-like phrasing, translationese, forced symmetry, inflated claims, and repetitive rhythm.
5. Keep the writer's voice, domain vocabulary, and useful bluntness; do not over-polish into generic marketing copy.
6. Refuse requests framed as detector bypass, evaluation evasion, fake authorship, or policy avoidance.

## Reference

Read `references/korean-naturalness-patterns.md` for Korean translationese, English-term density, and natural Korean rewrite checks.

Read `references/english-naturalness-patterns.md` for common AI-writing phrases, padded rhythm, and plain English rewrite checks.

Read `references/voice-fidelity-and-boundaries.md` for meaning preservation, safety boundaries, and over-edit prevention.

Read `references/review-rubric.md` before finalizing docs, README text, PR bodies, release notes, or translations.
