# AI Agent Playbook v2 Description Trigger Normalization

**Goal:** Reduce skill lint warning noise while keeping skill discovery precise.

**Why now:** After adding depth metrics, `skills lint` showed no shallow references and no conflicts, but most warnings came from frontmatter descriptions longer than 100 characters. The descriptions are trigger sentences, not reusable procedure, so they should stay concise without losing discovery value.

**Decision:** Raise the description length warning threshold to 180 characters, treat `workflow` as a valid domain term unless it is part of an instruction-like phrase, and shorten only descriptions that still exceed the new threshold.

## Scope

- Add an explicit description warning threshold constant.
- Remove false positives for domain terms such as workflow nodes or workflow questions.
- Shorten descriptions longer than 180 characters.
- Keep skill bodies and references unchanged.
- Update maintenance docs and Korean translation.
- Keep regression coverage for long, workflow-oriented descriptions.

## Non-Goals

- Do not make `SKILL.md` bodies longer to satisfy depth concerns.
- Do not remove useful trigger terms just to make descriptions minimal.
- Do not require every skill to have the same description length.
- Do not change skill names, categories, or compatibility wrappers.

## Implementation Checklist

- [x] Add plan and Korean translation.
- [x] Adjust description length threshold.
- [x] Narrow workflow-oriented description detection.
- [x] Shorten descriptions above 180 characters.
- [x] Update maintenance docs and translations.
- [x] Run validation.
- [x] Commit and push this slice.

## Verification

- `node bin/ai-playbook.mjs skills lint --json`
- `npm run check`
- `node --test test/skills-lifecycle.test.mjs`
- `.\scripts\validate-skills.ps1`
- `.\scripts\validate-translations.ps1`
- `.\scripts\validate-public-docs.ps1`
- `.\scripts\sync-skills.ps1 -WhatIf`
- `.\install.ps1 -SkipValidation -WhatIf`
- `.\update.ps1 -SkipValidation -WhatIf`
- `.\scripts\sync-skills.ps1`
