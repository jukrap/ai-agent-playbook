# Harness OS v2 Skill Depth Lint

**Goal:** Make skill depth visible without abandoning the short trigger-focused `SKILL.md` model.

**Why now:** A local audit showed the repository's `SKILL.md` files are intentionally concise, while many external reference skill packs embed much longer procedures directly in their skill files. The local model is still preferable for discoverability, but the reusable depth must be present in `references/`, workflow recipes, prompts, and validators. Some local references are still too thin to carry that weight.

**Decision:** Keep `SKILL.md` short. Add depth metrics to `skills lint` and warn on shallow reference files so future pack expansion can target reference substance instead of making trigger files noisy.

## Scope

- Add per-skill depth data to `skills lint --json`.
- Add summary metrics for skill line counts, reference file count, average reference lines, skills with references, and shallow reference count.
- Warn when a reference file is below the shallow-reference threshold.
- Expand the currently shallow legacy stack/profile references enough to carry practical stack-specific checks.
- Update command/runtime/maintenance docs and Korean translations.
- Add regression coverage for depth summary and shallow-reference warning behavior.

## Non-Goals

- Do not fail lint on shallow references yet; warn first so existing skill packs can be improved incrementally.
- Do not require every skill to have references.
- Do not copy external skill bodies or long upstream prose into local public docs.
- Do not make installable `SKILL.md` files long by default.

## Implementation Checklist

- [x] Add plan and Korean translation.
- [x] Add lint depth summary and per-skill depth fields.
- [x] Add shallow reference warning.
- [x] Expand shallow legacy stack/profile references.
- [x] Update docs and translations.
- [x] Add tests.
- [x] Run validation.
- [x] Commit and push this slice.

## Verification

- `npm run check`
- `npm test`
- `node --test test/skills-lifecycle.test.mjs`
- `.\scripts\validate-skills.ps1`
- `.\scripts\validate-translations.ps1`
- `.\scripts\validate-public-docs.ps1`
- `.\scripts\sync-skills.ps1 -WhatIf`
- `.\install.ps1 -SkipValidation -WhatIf`
- `.\update.ps1 -SkipValidation -WhatIf`
- `git diff --cached --check`
