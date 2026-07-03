# Harness OS v2 Design Capability Pack

**Goal:** Add a capability-first design pack that captures design direction, brand identity, visual reference analysis, image-to-code handoff, Figma handoff, and visual evidence contracts without uploading or copying local reference source material.

**Why now:** The existing frontend pack covers UI polish, state/data behavior, accessibility, visual regression, interactive media, and design-system implementation handoff. Local reference review shows stronger design workflows around brief inference, style dials, brand systems, reference boards, Figma/image handoff, and visual evidence. Those concerns should not stay buried inside frontend implementation skills.

**Architecture:** Create a separate `design` capability category. Keep design skills focused on deciding and documenting the visual contract. Keep `frontend` responsible for implementation, browser behavior, state/data, accessibility, and rendered verification. Reference material remains local-only evidence; public docs contain only generalized patterns and no raw reference prose, personal paths, private URLs, secrets, branch names, PR numbers, or source branding noise.

## Scope

- Add `design/design-brief-direction` for product-fit, visual language, style dials, constraints, and design briefs.
- Add `design/brand-identity-system` for typography, color, logo usage, identity applications, and brand review gates.
- Add `design/design-reference-analysis` for screenshots, competitor/reference apps, design boards, source boundaries, and visual evidence packages.
- Add `design/image-to-code-handoff` for generated images, mockups, screenshots, reference boards, Figma frames, UI contracts, and verification criteria.
- Add `design-reference-handoff` workflow recipe.
- Add `design_reference_handoff_review` MCP prompt.
- Teach reference adoption to surface `design` as its own capability.
- Update README, classification, taxonomy, command docs, translations, and tests.

## Non-Goals

- Do not copy local reference folders into the repository.
- Do not add design-generation runtime dependencies.
- Do not make frontend implementation skills responsible for brand or reference-source authority decisions.
- Do not treat generated images, screenshots, or Figma frames as durable project truth until reviewed.
- Do not expose project-write MCP tools.

## Output Contract

- Skill catalog lists the new design category and four design skills.
- Workflow catalog lists `design-reference-handoff`.
- MCP prompt list includes `design_reference_handoff_review`.
- `reference capability-matrix --capability design` and `reference adoption-plan --capability design` return design-specific surfaces and guidance.
- Public docs and Korean translations are synchronized.

## Implementation Checklist

- [x] Add plan and Korean translation.
- [x] Add design skills and references.
- [x] Add workflow recipe and taxonomy category.
- [x] Add reference adoption design capability routing.
- [x] Add MCP design prompt and docs.
- [x] Add catalog, workflow, MCP, and reference adoption tests.
- [x] Run validation.
- [x] Commit and push this slice.

## Verification

- `npm run check`
- `npm test`
- `.\scripts\validate-skills.ps1`
- `.\scripts\validate-translations.ps1`
- `.\scripts\validate-public-docs.ps1`
- `.\scripts\sync-skills.ps1 -WhatIf`
- `.\install.ps1 -SkipValidation -WhatIf`
- `.\update.ps1 -SkipValidation -WhatIf`
- `git diff --cached --check`
